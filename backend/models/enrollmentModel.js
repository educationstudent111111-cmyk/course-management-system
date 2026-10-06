const db = require("../config/db");

const Enrollment = {

  // ======================================================
  // CREATE ENROLLMENT WITH CAPACITY PROTECTION
  // CR-007
  // ======================================================

  async create(studentId, courseId) {

    // Get a dedicated database connection
    const connection = await db.getConnection();

    try {

      // Start transaction
      await connection.beginTransaction();


      // --------------------------------------------------
      // LOCK COURSE ROW
      //
      // FOR UPDATE prevents two students from checking
      // the same last seat at the same time.
      // --------------------------------------------------

      const [courseRows] = await connection.execute(
        `SELECT
            id,
            title,
            max_students
         FROM courses
         WHERE id = ?
         FOR UPDATE`,
        [courseId]
      );


      // Course not found
      if (courseRows.length === 0) {

        const error = new Error(
          "Course not found"
        );

        error.code = "COURSE_NOT_FOUND";

        throw error;
      }


      const course = courseRows[0];


      // --------------------------------------------------
      // CHECK EXISTING ENROLLMENT
      // --------------------------------------------------

      const [existingRows] = await connection.execute(
        `SELECT id
         FROM enrollments
         WHERE student_id = ?
         AND course_id = ?
         LIMIT 1`,
        [
          studentId,
          courseId
        ]
      );


      if (existingRows.length > 0) {

        const error = new Error(
          "You are already enrolled in this course"
        );

        error.code = "ALREADY_ENROLLED";

        throw error;
      }


      // --------------------------------------------------
      // COUNT CURRENT ENROLLMENTS
      //
      // Your current system does not have a status column.
      // Therefore every existing enrollment row counts.
      // --------------------------------------------------

      const [countRows] = await connection.execute(
        `SELECT COUNT(*) AS enrolled_count
         FROM enrollments
         WHERE course_id = ?`,
        [courseId]
      );


      const enrolledCount =
        Number(countRows[0]?.enrolled_count || 0);


      // --------------------------------------------------
      // CHECK CAPACITY
      //
      // NULL = Unlimited
      // --------------------------------------------------

      if (
        course.max_students !== null &&
        enrolledCount >= Number(course.max_students)
      ) {

        const error = new Error(
          "Course is full. No seats are available."
        );

        error.code = "COURSE_FULL";

        error.enrolledCount = enrolledCount;
        error.maxStudents = Number(
          course.max_students
        );

        throw error;
      }


      // --------------------------------------------------
      // CREATE ENROLLMENT
      // --------------------------------------------------

      const [result] = await connection.execute(
        `INSERT INTO enrollments
         (student_id, course_id)
         VALUES (?, ?)`,
        [
          studentId,
          courseId
        ]
      );


      // --------------------------------------------------
      // COMMIT TRANSACTION
      // --------------------------------------------------

      await connection.commit();


      return {
        enrollmentId: result.insertId,
        enrolledCount: enrolledCount + 1,
        maxStudents: course.max_students
      };


    } catch (error) {

      // Rollback if anything failed
      await connection.rollback();

      throw error;

    } finally {

      // Always release connection
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

  async getAll() {

    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,

          u.id AS student_id,
          u.username,
          u.full_name,

          c.id AS course_id,
          c.title,
          c.category,
          c.level

       FROM enrollments e

       JOIN users u
         ON e.student_id = u.id

       JOIN courses c
         ON e.course_id = c.id

       ORDER BY e.enrolled_at DESC`
    );


    return rows;
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
       AND student_id = ?`,
      [
        enrollmentId,
        studentId
      ]
    );

    return result;
  }

};


module.exports = Enrollment;