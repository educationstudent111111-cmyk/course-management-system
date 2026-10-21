const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");


// ======================================================
// ENROLL IN COURSE
// ======================================================

const enrollInCourse = async (req, res) => {
  try {

    const { courseId } = req.body;

    // Logged-in student's ID comes from authentication
    const studentId = req.user.id;


    // Validate course ID
    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }


    // Check whether course exists
    const course = await Course.getById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }


    // Check whether student is already enrolled
    const existingEnrollment =
      await Enrollment.findByStudentAndCourse(
        studentId,
        courseId
      );


    if (existingEnrollment) {
      return res.status(409).json({
        message: "You are already enrolled in this course",
      });
    }


    // Create enrollment
    const enrollmentId = await Enrollment.create(
      studentId,
      courseId
    );


    return res.status(201).json({
      message: "Course enrollment successful",
      enrollmentId,
    });

  } catch (error) {

    console.error(
      "Error enrolling in course:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



// ======================================================
// GET MY ENROLLMENTS
// ======================================================

const getMyEnrollments = async (req, res) => {
  try {

    // Student ID comes from JWT
    const studentId = req.user.id;


    const enrollments =
      await Enrollment.getByStudent(studentId);


    return res.status(200).json({
      message: "Enrollments retrieved successfully",
      enrollments,
    });

  } catch (error) {

    console.error(
      "Error getting student enrollments:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



// ======================================================
// GET COURSE ENROLLMENTS - ADMIN
// ======================================================

const getCourseEnrollments = async (req, res) => {
  try {

    const { courseId } = req.params;


    // Check whether course exists
    const course = await Course.getById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }


    const enrollments =
      await Enrollment.getByCourse(courseId);


    return res.status(200).json({
      message: "Course enrollments retrieved successfully",
      course,
      enrollments,
    });

  } catch (error) {

    console.error(
      "Error getting course enrollments:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// CR-008: Validate positive integer query parameters.
const isPositiveInteger = (value) =>
  typeof value === "string" &&
  /^\d+$/.test(value) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) > 0;


// CR-008: Validate a real YYYY-MM-DD calendar date.
const isValidDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

// ======================================================
// GET ALL ENROLLMENTS - ADMIN
// ======================================================

// const getAllEnrollments = async (req, res) => {
//   try {

//     const enrollments =
//       await Enrollment.getAll();


//     return res.status(200).json({
//       message: "All enrollments retrieved successfully",
//       enrollments,
//     });

//   } catch (error) {

//     console.error(
//       "Error getting all enrollments:",
//       error.message
//     );

//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };


const getAllEnrollments = async (req, res) => {
  try {
    const {
      q = "",
      courseId = "",
      from = "",
      to = "",
      sort = "enrolled_at",
      order = "desc",
      page = "1",
      limit = "20",
    } = req.query;

    // Validate query parameter types.
    if (
      typeof q !== "string" ||
      typeof courseId !== "string" ||
      typeof from !== "string" ||
      typeof to !== "string" ||
      typeof sort !== "string" ||
      typeof order !== "string" ||
      typeof page !== "string" ||
      typeof limit !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid query parameter format",
      });
    }

    // Validate page and limit.
    if (!isPositiveInteger(page)) {
      return res.status(400).json({
        message: "Page must be a positive integer",
      });
    }

    if (!isPositiveInteger(limit) || Number(limit) > 100) {
      return res.status(400).json({
        message: "Limit must be between 1 and 100",
      });
    }

    // Validate course ID when supplied.
    if (courseId !== "" && !isPositiveInteger(courseId)) {
      return res.status(400).json({
        message: "Invalid course ID",
      });
    }

    // Validate dates when supplied.
    if (from !== "" && !isValidDate(from)) {
      return res.status(400).json({
        message: "Invalid from date. Use YYYY-MM-DD",
      });
    }

    if (to !== "" && !isValidDate(to)) {
      return res.status(400).json({
        message: "Invalid to date. Use YYYY-MM-DD",
      });
    }

    if (from !== "" && to !== "" && from > to) {
      return res.status(400).json({
        message: "From date cannot be after to date",
      });
    }

    // Validate sort and order against allowlists.
    const allowedSorts = [
      "enrolled_at",
      "student",
      "course",
    ];

    if (!allowedSorts.includes(sort)) {
      return res.status(400).json({
        message: "Invalid sort field",
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        message: "Order must be asc or desc",
      });
    }

    const currentPage = Number(page);
    const pageLimit = Number(limit);

    const result = await Enrollment.getAll({
      q,
      courseId,
      from,
      to,
      sort,
      order,
      page: currentPage,
      limit: pageLimit,
    });

    return res.status(200).json({
      message: "Enrollments retrieved successfully",
      enrollments: result.enrollments,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total: result.total,
        totalPages: Math.ceil(result.total / pageLimit),
      },
    });
  } catch (error) {
    console.error(
      "Error getting all enrollments:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};




// ======================================================
// DELETE ENROLLMENT - ADMIN
// ======================================================

const deleteEnrollment = async (req, res) => {
  try {

    const { id } = req.params;


    // Existing admin delete functionality
    const result =
      await Enrollment.delete(id);


    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }


    return res.status(200).json({
      message: "Enrollment deleted successfully",
    });

  } catch (error) {

    console.error(
      "Error deleting enrollment:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



// ======================================================
// CR-006
// DELETE MY OWN ENROLLMENT - STUDENT
// ======================================================

const deleteMyEnrollment = async (req, res) => {
  try {

    const { id } = req.params;


    // --------------------------------------------------
    // Validate enrollment ID
    // --------------------------------------------------

    const enrollmentId = Number(id);


    if (
      !Number.isInteger(enrollmentId) ||
      enrollmentId <= 0
    ) {

      return res.status(400).json({
        message: "Invalid enrollment ID",
      });

    }


    // --------------------------------------------------
    // Get logged-in student's ID
    //
    // IMPORTANT:
    // Never use student ID from frontend.
    // --------------------------------------------------

    const studentId = req.user.id;


    // --------------------------------------------------
    // Delete ONLY if:
    //
    // enrollment ID matches
    // AND
    // student ID matches logged-in student
    // --------------------------------------------------

    const result =
      await Enrollment.deleteMyEnrollment(
        enrollmentId,
        studentId
      );


    // --------------------------------------------------
    // 404:
    // - Enrollment doesn't exist
    // - Enrollment belongs to another student
    // --------------------------------------------------

    if (result.affectedRows === 0) {

      return res.status(404).json({
        message: "Enrollment not found",
      });

    }


    // --------------------------------------------------
    // Successful cancellation
    // --------------------------------------------------

    return res.status(200).json({
      message: "Enrollment cancelled successfully",
    });

  } catch (error) {

    console.error(
      "Error cancelling enrollment:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



// ======================================================
// EXPORT
// ======================================================

module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  deleteEnrollment,
  deleteMyEnrollment,
};