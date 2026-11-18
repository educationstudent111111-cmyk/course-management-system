const db = require("../config/db");

const Report = {
  // CR-009: Admin reporting using SQL aggregation
  async getOverview() {
    const [summaryRows] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM courses) AS totalCourses,

        (SELECT COUNT(*)
         FROM users
         WHERE role = 'student') AS totalStudents,

        (SELECT COUNT(*)
         FROM enrollments
         WHERE status = 'approved') AS totalEnrollments,

        (SELECT COUNT(*)
         FROM enrollments
         WHERE status = 'pending') AS pendingEnrollments,

        (SELECT COUNT(DISTINCT student_id)
         FROM enrollments
         WHERE status = 'approved') AS studentsWithEnrollments,

        (SELECT COUNT(*)
         FROM enrollments
         WHERE status = 'approved'
           AND enrolled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           AND enrolled_at <= NOW()) AS enrollmentsLast30Days,

        (SELECT COUNT(*)
         FROM courses c
         WHERE NOT EXISTS (
           SELECT 1
           FROM enrollments e
           WHERE e.course_id = c.id
             AND e.status = 'approved'
         )) AS coursesWithoutEnrollments
    `);

    const [categoryRows] = await db.execute(`
      SELECT
        COALESCE(c.category, 'Uncategorized') AS category,
        COUNT(e.id) AS enrollmentCount
      FROM courses c
      LEFT JOIN enrollments e
        ON e.course_id = c.id
       AND e.status = 'approved'
      GROUP BY c.category
      ORDER BY enrollmentCount DESC, category ASC
    `);

    const [topCourseRows] = await db.execute(`
      SELECT
        c.id AS courseId,
        c.title,
        COALESCE(c.category, 'Uncategorized') AS category,
        COUNT(e.id) AS enrollmentCount
      FROM courses c
      INNER JOIN enrollments e
        ON e.course_id = c.id
       AND e.status = 'approved'
      GROUP BY c.id, c.title, c.category
      ORDER BY enrollmentCount DESC, c.title ASC, c.id ASC
      LIMIT 5
    `);

    const summary = summaryRows[0];

    // Convert MySQL COUNT results into safe JavaScript numbers.
    return {
      totalCourses: Number(summary.totalCourses || 0),
      totalStudents: Number(summary.totalStudents || 0),
      totalEnrollments: Number(summary.totalEnrollments || 0),
      pendingEnrollments: Number(summary.pendingEnrollments || 0),
      studentsWithEnrollments: Number(
        summary.studentsWithEnrollments || 0
      ),
      enrollmentsLast30Days: Number(
        summary.enrollmentsLast30Days || 0
      ),
      coursesWithoutEnrollments: Number(
        summary.coursesWithoutEnrollments || 0
      ),

      enrollmentsByCategory: categoryRows.map((row) => ({
        category: row.category,
        enrollmentCount: Number(row.enrollmentCount || 0),
      })),

      topCourses: topCourseRows.map((row) => ({
        courseId: row.courseId,
        title: row.title,
        category: row.category,
        enrollmentCount: Number(row.enrollmentCount || 0),
      })),
    };
  },

  // CR-009: Report for one authenticated student only
  async getMyReport(studentId) {
    const [summaryRows] = await db.execute(
      `
        SELECT
          SUM(CASE WHEN e.status = 'approved' THEN 1 ELSE 0 END)
            AS enrolledCourses,
          COUNT(DISTINCT CASE
            WHEN e.status = 'approved' THEN c.category
          END) AS distinctCategories,
          COALESCE(SUM(CASE
            WHEN e.status = 'approved' THEN c.price
            ELSE 0
          END), 0) AS totalEnrollmentValue,
          MIN(CASE WHEN e.status = 'approved' THEN e.enrolled_at END)
            AS earliestEnrollment,
          MAX(CASE WHEN e.status = 'approved' THEN e.enrolled_at END)
            AS latestEnrollment,
          SUM(CASE WHEN e.status = 'pending' THEN 1 ELSE 0 END)
            AS pendingRequests,
          SUM(CASE WHEN e.status = 'rejected' THEN 1 ELSE 0 END)
            AS rejectedRequests
        FROM enrollments e
        INNER JOIN courses c ON c.id = e.course_id
        WHERE e.student_id = ?
      `,
      [studentId]
    );

    const [recentRows] = await db.execute(
      `
        SELECT
          e.id AS enrollmentId,
          e.enrolled_at AS enrolledAt,
          c.id AS courseId,
          c.title,
          COALESCE(c.category, 'Uncategorized') AS category,
          c.level,
          c.price,
          e.status,
          e.decision_note AS decisionNote,
          e.reviewed_at AS reviewedAt
        FROM enrollments e
        INNER JOIN courses c ON c.id = e.course_id
        WHERE e.student_id = ?
        ORDER BY e.enrolled_at DESC, e.id DESC
        LIMIT 5
      `,
      [studentId]
    );

    const summary = summaryRows[0];

    return {
      enrolledCourses: Number(summary.enrolledCourses || 0),
      distinctCategories: Number(summary.distinctCategories || 0),
      totalEnrollmentValue: Number(summary.totalEnrollmentValue || 0),
      pendingRequests: Number(summary.pendingRequests || 0),
      rejectedRequests: Number(summary.rejectedRequests || 0),
      earliestEnrollment: summary.earliestEnrollment,
      latestEnrollment: summary.latestEnrollment,
      recentEnrollments: recentRows.map((row) => ({
        ...row,
        price: Number(row.price || 0),
      })),
    };
  },
};

module.exports = Report;