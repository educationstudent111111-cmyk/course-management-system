const ALLOWED_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];


const validateCourse = (req, res, next) => {

  const {
    title,
    category,
    level,
    duration,
    price,
    max_students,
  } = req.body || {};


  const errors = {};


  // =====================================================
  // TITLE
  // =====================================================

  if (!title || !String(title).trim()) {

    errors.title =
      "Title is required.";

  }


  // =====================================================
  // CATEGORY
  // =====================================================

  if (!category || !String(category).trim()) {

    errors.category =
      "Category is required.";

  }


  // =====================================================
  // LEVEL
  // =====================================================

  if (!level || !String(level).trim()) {

    errors.level =
      "Level is required.";

  } else if (
    !ALLOWED_LEVELS.includes(
      String(level).trim()
    )
  ) {

    errors.level =
      "Level must be Beginner, Intermediate, or Advanced.";

  }


  // =====================================================
  // DURATION
  // =====================================================

  if (
    !duration ||
    !String(duration).trim()
  ) {

    errors.duration =
      "Duration is required (for example: 8 Weeks).";

  }


  // =====================================================
  // PRICE
  // =====================================================

  if (
    price === "" ||
    price === null ||
    price === undefined
  ) {

    errors.price =
      "Price is required.";

  } else {

    const numericPrice =
      Number(price);


    if (
      !Number.isFinite(
        numericPrice
      )
    ) {

      errors.price =
        "Please enter a valid price.";

    } else if (
      numericPrice < 0
    ) {

      errors.price =
        "Price must be greater than or equal to 0.";

    }

  }


  // =====================================================
  // MAXIMUM STUDENTS
  // CR-007
  //
  // Blank / null = Unlimited
  // Must be a positive integer when provided.
  // =====================================================

  let normalizedMaxStudents = null;


  // Blank value = Unlimited
  if (
    max_students === "" ||
    max_students === null ||
    max_students === undefined
  ) {

    normalizedMaxStudents = null;

  } else {

    const maxStudentsString =
      String(max_students).trim();


    // -----------------------------------------------
    // Check positive integer
    //
    // Accept:
    // 1
    // 5
    // 30
    //
    // Reject:
    // 0
    // -1
    // 2.5
    // abc
    // 10.5
    // -----------------------------------------------

    if (
      !/^[1-9]\d*$/.test(
        maxStudentsString
      )
    ) {

      errors.max_students =
        "Maximum students must be a positive integer.";

    } else {

      const numericMaxStudents =
        Number(maxStudentsString);


      // Safety check for very large values
      if (
        !Number.isSafeInteger(
          numericMaxStudents
        ) ||
        numericMaxStudents <= 0
      ) {

        errors.max_students =
          "Maximum students must be a positive integer.";

      } else {

        normalizedMaxStudents =
          numericMaxStudents;

      }

    }

  }


  // =====================================================
  // STOP REQUEST IF VALIDATION FAILED
  // =====================================================

  if (
    Object.keys(errors).length > 0
  ) {

    return res.status(400).json({

      message:
        "Please correct the highlighted fields.",

      errors,

    });

  }


  // =====================================================
  // CLEAN / NORMALIZED DATA
  // =====================================================

  req.validatedCourse = {

    title:
      String(title).trim(),

    category:
      String(category).trim(),

    level:
      String(level).trim(),

    duration:
      String(duration).trim(),

    price:
      Number(price),

    image:
      req.body.image
        ? String(req.body.image).trim()
        : "",

    description:
      req.body.description
        ? String(req.body.description).trim()
        : "",

    // CR-007
    // null = Unlimited
    max_students:
      normalizedMaxStudents,

  };


  next();
};


module.exports = {
  validateCourse,
  ALLOWED_LEVELS,
};