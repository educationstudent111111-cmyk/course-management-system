const Course = require("../models/courseModel");
const User = require("../models/userModel");
const validateCourse = require("../helpers/validateCourse");


// =====================================================
// Validate Maximum Students
// =====================================================
const validateMaxStudents = (value) => {

  // Blank / null = Unlimited
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return {
      valid: true,
      value: null
    };
  }


  // Reject non-number values
  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return {
      valid: false,
      message: "Maximum students must be a positive integer."
    };
  }


  // Convert to string for strict integer validation
  const stringValue = String(value).trim();


  // Reject empty value
  if (stringValue === "") {
    return {
      valid: true,
      value: null
    };
  }


  // Only whole numbers are allowed
  // Reject decimals, letters, negative values, etc.
  if (!/^[1-9]\d*$/.test(stringValue)) {
    return {
      valid: false,
      message: "Maximum students must be a positive integer."
    };
  }


  const maxStudents = Number(stringValue);


  // Safety check
  if (!Number.isSafeInteger(maxStudents) || maxStudents <= 0) {
    return {
      valid: false,
      message: "Maximum students must be a positive integer."
    };
  }


  return {
    valid: true,
    value: maxStudents
  };
};



// =====================================================
// Get all courses
// =====================================================
const getAllCourses = async (req, res) => {

  try {

    const courses = await Course.getAll();

    res.status(200).json({
      message: "Courses retrieved successfully",
      courses,
    });

  } catch (error) {

    console.error(
      "Error getting courses:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



// =====================================================
// Get one course
// =====================================================
const getCourseById = async (req, res) => {

  try {

    const { id } = req.params;

    const course = await Course.getById(id);


    if (!course) {

      return res.status(404).json({
        message: "Course not found",
      });
    }


    res.status(200).json({
      message: "Course retrieved successfully",
      course,
    });

  } catch (error) {

    console.error(
      "Error getting course:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



// =====================================================
// Create course
// =====================================================
const createCourse = async (req, res) => {

  try {

    const course = {
      ...req.validatedCourse
    };


    // -------------------------------------------------
    // Validate Maximum Students
    // -------------------------------------------------
    const capacity = validateMaxStudents(
      course.max_students
    );


    if (!capacity.valid) {

      return res.status(400).json({
        message: capacity.message,
        errors: {
          max_students: capacity.message
        }
      });
    }


    // Blank = NULL = Unlimited
    course.max_students = capacity.value;


    // -------------------------------------------------
    // Check duplicate title
    // -------------------------------------------------
    const existingCourse =
      await Course.findByTitle(
        course.title
      );


    if (existingCourse) {

      return res.status(409).json({
        message: "Course title already exists.",
        errors: {
          title:
            "A course with this title already exists.",
        },
      });
    }


    // -------------------------------------------------
    // Create course
    // -------------------------------------------------
    const courseId =
      await Course.create(course);


    return res.status(201).json({
      message: "Course created successfully",
      courseId,
    });

  } catch (error) {

    console.error(
      "Error creating course:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



// =====================================================
// Update course
// =====================================================
const updateCourse = async (req, res) => {

  try {

    const { id } = req.params;

    const course = {
      ...req.validatedCourse
    };


    // -------------------------------------------------
    // Check whether course exists
    // -------------------------------------------------
    const existingCourse =
      await Course.getById(id);


    if (!existingCourse) {

      return res.status(404).json({
        message: "Course not found",
      });
    }


    // -------------------------------------------------
    // Validate Maximum Students
    // -------------------------------------------------
    const capacity = validateMaxStudents(
      course.max_students
    );


    if (!capacity.valid) {

      return res.status(400).json({
        message: capacity.message,
        errors: {
          max_students: capacity.message
        }
      });
    }


    // Blank = NULL = Unlimited
    course.max_students = capacity.value;


    // -------------------------------------------------
    // Check current approved enrollments
    // -------------------------------------------------
    const enrolledCount =
      await Course.getApprovedEnrollmentCount(id);


    // -------------------------------------------------
    // Prevent capacity below approved enrollment count
    //
    // Example:
    // Approved students = 10
    // New capacity = 5
    //
    // Reject
    // -------------------------------------------------
    if (
      course.max_students !== null &&
      course.max_students < enrolledCount
    ) {

      return res.status(400).json({
        message:
          `Maximum students cannot be less than the current approved enrollment count (${enrolledCount}).`,
        errors: {
          max_students:
            `Capacity must be at least ${enrolledCount} students.`
        }
      });
    }


    // -------------------------------------------------
    // Check duplicate title
    // -------------------------------------------------
    const duplicateCourse =
      await Course.findByTitle(
        course.title,
        id
      );


    if (duplicateCourse) {

      return res.status(409).json({
        message: "Course title already exists.",
        errors: {
          title:
            "A course with this title already exists.",
        },
      });
    }


    // -------------------------------------------------
    // Update course
    // -------------------------------------------------
    await Course.update(
      id,
      course
    );


    // Get updated course
    const updatedCourse =
      await Course.getById(id);


    return res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse,
    });

  } catch (error) {

    console.error(
      "Error updating course:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



// =====================================================
// Delete course
// =====================================================
const deleteCourse = async (req, res) => {

  try {

    const { id } = req.params;


    // Check if course exists
    const existingCourse =
      await Course.getById(id);


    if (!existingCourse) {

      return res.status(404).json({
        message: "Course not found",
      });
    }


    await Course.delete(id);


    res.status(200).json({
      message: "Course deleted successfully",
    });

  } catch (error) {

    console.error(
      "Error deleting course:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



// =====================================================
// Get statistics (PUBLIC)
// =====================================================
const getStats = async (req, res) => {

  try {

    const courses =
      await Course.getAll();

    const studentCount =
      await User.countByRole("student");


    res.status(200).json({
      message:
        "Statistics retrieved successfully",

      courseCount:
        courses.length,

      studentCount:
        studentCount,
    });

  } catch (error) {

    console.error(
      "Error getting statistics:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};



module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getStats,
};