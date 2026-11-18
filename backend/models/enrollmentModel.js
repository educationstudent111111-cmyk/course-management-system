const db = require("../config/db");
// CR-008: Escape SQL LIKE wildcard characters.
// "!" is used as the LIKE escape character.
function escapeLikeValue(value) {
  return value
    .replace(/!/g, "!!")
    .replace(/%/g, "!%")
    .replace(/_/g, "!_");
}

const Enrollment = {

  // ======================================================
  // Create or resubmit an enrollment request. Rejected requests reuse their
  // existing unique student/course row; pending and approved rows cannot repeat.
  // ======================================================

  async create(studentId, courseId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [courseRows] = await connection.execute(
        `SELECT id
         FROM courses
         WHERE id = ?
         FOR UPDATE`,
        [courseId]
      );

      if (courseRows.length === 0) {
        const error = new Error("Course not found");
        error.code = "COURSE_NOT_FOUND";
        throw error;
      }

      const [existingRows] = await connection.execute(
        `SELECT id, status
         FROM enrollments
         WHERE student_id = ?
           AND course_id = ?
         FOR UPDATE`,
        [studentId, courseId]
      );

      const existing = existingRows[0];
      if (existing && existing.status !== "rejected") {
        const error = new Error(
          existing.status === "pending"
            ? "An enrollment request is already pending."
            : "You are already enrolled in this course."
        );
        error.code = "ALREADY_ENROLLED";
        throw error;
      }

      let enrollmentId;
      let resubmitted = false;

      if (existing) {
        await connection.execute(
          `UPDATE enrollments
           SET status = 'pending',
               enrolled_at = CURRENT_TIMESTAMP,
               reviewed_by = NULL,
               reviewed_at = NULL,
               decision_note = NULL
           WHERE id = ? AND status = 'rejected'`,
          [existing.id]
        );
        enrollmentId = existing.id;
        resubmitted = true;
      } else {
        const [result] = await connection.execute(
          `INSERT INTO enrollments (student_id, course_id, status)
           VALUES (?, ?, 'pending')`,
          [studentId, courseId]
        );
        enrollmentId = result.insertId;
      }

      await connection.commit();

      return { enrollmentId, status: "pending", resubmitted };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateStatus(enrollmentId, status, reviewerId, decisionNote = null) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [requestRows] = await connection.execute(
        `SELECT id, course_id, status
         FROM enrollments
         WHERE id = ?
         LIMIT 1`,
        [enrollmentId]
      );

      const request = requestRows[0];
      if (!request) {
        const error = new Error("Enrollment request not found.");
        error.code = "ENROLLMENT_NOT_FOUND";
        throw error;
      }

      const [courseRows] = await connection.execute(
        `SELECT id, max_students
         FROM courses
         WHERE id = ?
         FOR UPDATE`,
        [request.course_id]
      );

      if (courseRows.length === 0) {
        const error = new Error("Course not found.");
        error.code = "COURSE_NOT_FOUND";
        throw error;
      }

      const [lockedRows] = await connection.execute(
        `SELECT id, student_id, course_id, status
         FROM enrollments
         WHERE id = ?
         FOR UPDATE`,
        [enrollmentId]
      );
      const lockedRequest = lockedRows[0];

      if (!lockedRequest) {
        const error = new Error("Enrollment request not found.");
        error.code = "ENROLLMENT_NOT_FOUND";
        throw error;
      }

      if (lockedRequest.status !== "pending") {
        const error = new Error(
          "Only pending enrollment requests can be reviewed."
        );
        error.code = "INVALID_ENROLLMENT_STATUS";
        throw error;
      }

      if (status === "approved") {
        const [duplicateRows] = await connection.execute(
          `SELECT id
           FROM enrollments
           WHERE student_id = ?
             AND course_id = ?
             AND status = 'approved'
             AND id <> ?
           LIMIT 1`,
          [lockedRequest.student_id, lockedRequest.course_id, enrollmentId]
        );

        if (duplicateRows.length > 0) {
          const error = new Error(
            "The student already has an approved enrollment in this course."
          );
          error.code = "ALREADY_ENROLLED";
          throw error;
        }

        const course = courseRows[0];
        if (course.max_students !== null) {
          const [countRows] = await connection.execute(
            `SELECT COUNT(*) AS approved_count
             FROM enrollments
             WHERE course_id = ?
               AND status = 'approved'`,
            [lockedRequest.course_id]
          );
          const approvedCount = Number(countRows[0]?.approved_count || 0);

          if (approvedCount >= Number(course.max_students)) {
            const error = new Error(
              "Course is full. The request cannot be approved."
            );
            error.code = "COURSE_FULL";
            error.enrolledCount = approvedCount;
            error.maxStudents = Number(course.max_students);
            throw error;
          }
        }
      }

      const [result] = await connection.execute(
        `UPDATE enrollments
         SET status = ?,
             reviewed_by = ?,
             reviewed_at = CURRENT_TIMESTAMP,
             decision_note = ?
         WHERE id = ? AND status = 'pending'`,
        [status, reviewerId, decisionNote, enrollmentId]
      );

      if (result.affectedRows !== 1) {
        const error = new Error(
          "Only pending enrollment requests can be reviewed."
        );
        error.code = "INVALID_ENROLLMENT_STATUS";
        throw error;
      }

      await connection.commit();
      return { enrollmentId, status };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },


  // ======================================================
  // CHECK EXISTING ENROLLMENT
  // ======================================================

  async findByStudentAndCourse(studentId, courseId) {

    const [rows] = await db.execute(
      `SELECT *
       FROM enrollments
       WHERE student_id = ?
       AND course_id = ?`,
      [
        studentId,
        courseId
      ]
    );

    return rows[0];
  },


  // ======================================================
  // GET MY ENROLLMENTS
  // ======================================================

  async getByStudent(studentId) {

    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,
         e.status,
         e.reviewed_at,
         e.decision_note,

         c.id AS course_id,
          c.title,
          c.category,
          c.level,
          c.duration,
          c.price,
          c.image,
          c.description,

          c.max_students,

          (
            SELECT COUNT(*)
            FROM enrollments e2
            WHERE e2.course_id = c.id
              AND e2.status = 'approved'
          ) AS enrolled_count

       FROM enrollments e

       JOIN courses c
         ON e.course_id = c.id

       WHERE e.student_id = ?

       ORDER BY e.enrolled_at DESC`,
      [studentId]
    );


    return rows.map(enrollment => {

      const enrolledCount =
        Number(enrollment.enrolled_count || 0);

      const seatsRemaining =
        enrollment.max_students === null
          ? null
          : Math.max(
              Number(enrollment.max_students) -
              enrolledCount,
              0
            );

      const isFull =
        enrollment.max_students !== null &&
        enrolledCount >=
        Number(enrollment.max_students);


      return {
        ...enrollment,
        enrolled_count: enrolledCount,
        seats_remaining: seatsRemaining,
        is_full: isFull
      };
    });
  },


  // ======================================================
  // GET COURSE ENROLLMENTS - ADMIN
  // ======================================================

  async getByCourse(courseId) {

    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,
          e.status,
          e.reviewed_at,
          e.decision_note,

          u.id AS student_id,
          u.username,
          u.full_name

       FROM enrollments e

       JOIN users u
         ON e.student_id = u.id

       WHERE e.course_id = ?

       ORDER BY e.enrolled_at DESC`,
      [courseId]
    );


    return rows;
  },


  // ======================================================
  // GET ALL ENROLLMENTS - ADMIN
  // ======================================================

  // async getAll() {

  //   const [rows] = await db.execute(
  //     `SELECT
  //         e.id,
  //         e.enrolled_at,

  //         u.id AS student_id,
  //         u.username,
  //         u.full_name,

  //         c.id AS course_id,
  //         c.title,
  //         c.category,
  //         c.level

  //      FROM enrollments e

  //      JOIN users u
  //        ON e.student_id = u.id

  //      JOIN courses c
  //        ON e.course_id = c.id

  //      ORDER BY e.enrolled_at DESC`
  //   );


  //   return rows;
  // },


  // ======================================================
  // GET ALL ENROLLMENTS - ADMIN
  // CR-008: Search, Filter, Sort and Pagination
  // ======================================================

  async getAll(filters = {}) {
    const {
      q = "",
      courseId = "",
      status = "",
      from = "",
      to = "",
      sort = "enrolled_at",
      order = "desc",
      page = 1,
      limit = 20,
    } = filters;

    const conditions = [];
    const params = [];

    // Search student name and username.
    if (q.trim() !== "") {
      const searchValue = `%${escapeLikeValue(q.trim())}%`;

      conditions.push(`
        (
          u.full_name LIKE ? ESCAPE '!'
          OR u.username LIKE ? ESCAPE '!'
        )
      `);

      params.push(searchValue, searchValue);
    }

    // Filter by course.
    if (courseId !== "") {
      conditions.push("e.course_id = ?");
      params.push(Number(courseId));
    }

    if (status !== "") {
      conditions.push("e.status = ?");
      params.push(status);
    }

    // Inclusive enrollment date filters.
    if (from !== "") {
      conditions.push("e.enrolled_at >= ?");
      params.push(`${from} 00:00:00`);
    }

    if (to !== "") {
      conditions.push("e.enrolled_at < DATE_ADD(?, INTERVAL 1 DAY)");
      params.push(to);
    }

    const whereSQL =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    // Only these predefined columns can be used for sorting.
    const sortColumns = {
      enrolled_at: "e.enrolled_at",
      student: "u.full_name",
      course: "c.title",
    };

    const sortColumn =
      sortColumns[sort] || sortColumns.enrolled_at;

    const sortDirection =
      order === "asc" ? "ASC" : "DESC";

    const offset = (Number(page) - 1) * Number(limit);

    const fromSQL = `
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users reviewer ON e.reviewed_by = reviewer.id
      ${whereSQL}
    `;

    // Count must use the same filters as the data query.
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total ${fromSQL}`,
      params
    );

    const total = Number(countRows[0]?.total || 0);

    const [rows] = await db.execute(
      `
        SELECT
          e.id,
          e.enrolled_at,
          e.status,
          e.reviewed_at,
          e.decision_note,
          reviewer.full_name AS reviewer_name,
          u.id AS student_id,
          u.username,
          u.full_name,
          c.id AS course_id,
          c.title,
          c.category,
          c.level
        ${fromSQL}
        ORDER BY ${sortColumn} ${sortDirection}, e.id ${sortDirection}
        LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), offset]
    );

    return {
      enrollments: rows,
      total,
    };
  },


  // ======================================================
  // DELETE ENROLLMENT - ADMIN
  // ======================================================

  async delete(id) {

    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?`,
      [id]
    );

    return result;
  },


  // ======================================================
  // CR-006
  // DELETE STUDENT'S OWN ENROLLMENT
  // ======================================================

  async deleteMyEnrollment(
    enrollmentId,
    studentId
  ) {

    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?
       AND student_id = ?
       AND status = 'pending'`,
      [
        enrollmentId,
        studentId
      ]
    );

    return result;
  }

};


module.exports = Enrollment;