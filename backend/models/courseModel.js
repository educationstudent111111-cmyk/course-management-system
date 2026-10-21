const db = require("../config/db");

const Course = {

  // =====================================================
  // GET ALL COURSES
  // =====================================================
  async getAll() {

    const [rows] = await db.execute(`
      SELECT
        c.*,

        (
          SELECT COUNT(*)
          FROM enrollments e
          WHERE e.course_id = c.id
          AND e.status = 'approved'
        ) AS enrolled_count

      FROM courses c
      ORDER BY c.id DESC
    `);

    return rows.map(course => {

      const enrolledCount = Number(course.enrolled_count || 0);

      const seatsRemaining =
        course.max_students === null
          ? null
          : Math.max(
              Number(course.max_students) - enrolledCount,
              0
            );

      const isFull =
        course.max_students !== null &&
        enrolledCount >= Number(course.max_students);

      return {
        ...course,
        enrolled_count: enrolledCount,
        seats_remaining: seatsRemaining,
        is_full: isFull
      };

    });
  },


  // =====================================================
  // GET ONE COURSE
  // =====================================================
  async getById(id) {

    const [rows] = await db.execute(`
      SELECT
        c.*,

        (
          SELECT COUNT(*)
          FROM enrollments e
          WHERE e.course_id = c.id
          AND e.status = 'approved'
        ) AS enrolled_count

      FROM courses c
      WHERE c.id = ?
      LIMIT 1
    `, [id]);

    if (!rows[0]) {
      return null;
    }

    const course = rows[0];

    const enrolledCount = Number(
      course.enrolled_count || 0
    );

    const seatsRemaining =
      course.max_students === null
        ? null
        : Math.max(
            Number(course.max_students) - enrolledCount,
            0
          );

    const isFull =
      course.max_students !== null &&
      enrolledCount >= Number(course.max_students);

    return {
      ...course,
      enrolled_count: enrolledCount,
      seats_remaining: seatsRemaining,
      is_full: isFull
    };
  },


  // =====================================================
  // CREATE COURSE
  // =====================================================
  async create(course) {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students
    } = course;


    const [result] = await db.execute(
      `INSERT INTO courses
       (
         title,
         category,
         level,
         duration,
         price,
         image,
         description,
         max_students
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        max_students
      ]
    );

    return result.insertId;
  },


  // =====================================================
  // FIND COURSE BY TITLE
  // =====================================================
  async findByTitle(title, excludeId = null) {

    let sql = `
      SELECT id, title
      FROM courses
      WHERE LOWER(TRIM(title)) =
            LOWER(TRIM(?))
    `;

    const params = [title];


    // During update, exclude current course
    if (excludeId !== null) {
      sql += " AND id <> ?";
      params.push(excludeId);
    }


    sql += " LIMIT 1";


    const [rows] = await db.execute(
      sql,
      params
    );

    return rows[0];
  },


  // =====================================================
  // UPDATE COURSE
  // =====================================================
  async update(id, course) {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students
    } = course;


    const [result] = await db.execute(
      `UPDATE courses
       SET
         title = ?,
         category = ?,
         level = ?,
         duration = ?,
         price = ?,
         image = ?,
         description = ?,
         max_students = ?
       WHERE id = ?`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        max_students,
        id
      ]
    );


    return result;
  },


  // =====================================================
  // DELETE COURSE
  // =====================================================
  async delete(id) {

    const [result] = await db.execute(
      "DELETE FROM courses WHERE id = ?",
      [id]
    );

    return result;
  },


  // =====================================================
  // GET APPROVED ENROLLMENT COUNT
  // =====================================================
  async getApprovedEnrollmentCount(courseId) {

    const [rows] = await db.execute(
      `SELECT COUNT(*) AS enrolled_count
       FROM enrollments
       WHERE course_id = ?
       AND status = 'approved'`,
      [courseId]
    );

    return Number(
      rows[0]?.enrolled_count || 0
    );
  },


  // =====================================================
  // GET COURSE FOR CAPACITY UPDATE
  // =====================================================
  async getCourseForUpdate(connection, id) {

    const [rows] = await connection.execute(
      `SELECT
         id,
         max_students
       FROM courses
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );

    return rows[0];
  },


  // =====================================================
  // UPDATE ONLY CAPACITY
  // Used when administrator changes capacity
  // =====================================================
  async updateCapacity(connection, id, maxStudents) {

    const [result] = await connection.execute(
      `UPDATE courses
       SET max_students = ?
       WHERE id = ?`,
      [
        maxStudents,
        id
      ]
    );

    return result;
  }

};


module.exports = Course;