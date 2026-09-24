import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaEdit,
  FaEye,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
  FaSearch,
  FaUndo,
} from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


const EMPTY_COURSE = {
  title: "",
  category: "",
  level: "Beginner",
  duration: "",
  price: "",
  image: "",
  description: "",
};


const LEVEL_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];


// Load the course list.
async function fetchAllCourses() {
  const response = await api.get("/courses");

  return response.data.courses;
}


function ManageCourses() {

  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form visibility + which course is being edited
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(EMPTY_COURSE);

  // General form error
  const [formError, setFormError] = useState("");

  // Field-level server validation errors
  const [fieldErrors, setFieldErrors] = useState({});

  const [saving, setSaving] = useState(false);


  // =========================================================
  // CR-003 SEARCH / FILTER / SORT STATE
  // =========================================================

  // Search text
  const [searchText, setSearchText] = useState("");

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Level filter
  const [selectedLevel, setSelectedLevel] = useState("All");

  // Sorting
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");


  // =========================================================
  // LOAD COURSES
  // =========================================================

  useEffect(() => {

    const loadCourses = async () => {

      try {

        setCourses(await fetchAllCourses());

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load courses"
        );

      } finally {

        setLoading(false);

      }
    };

    loadCourses();

  }, []);


  // =========================================================
  // RELOAD COURSES AFTER CREATE / UPDATE / DELETE
  // =========================================================

  const refreshCourses = async () => {

    const updatedCourses = await fetchAllCourses();

    setCourses(updatedCourses);
  };


  // =========================================================
  // CR-003 - GET UNIQUE CATEGORIES
  // =========================================================

  const categoryOptions = [
    "All",
    ...Array.from(
      new Set(
        courses
          .map((course) =>
            String(course.category || "").trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b, undefined, {
        sensitivity: "base",
      })
    ),
  ];


  // =========================================================
  // CR-003 - SEARCH + FILTER + SORT
  // =========================================================

  const displayedCourses = [...courses]

    // ---------- SEARCH ----------
    .filter((course) => {

      const search = searchText
        .trim()
        .toLowerCase();

      if (!search) {
        return true;
      }

      const title = String(
        course.title || ""
      ).toLowerCase();

      const category = String(
        course.category || ""
      ).toLowerCase();

      const id = String(
        course.id || ""
      ).toLowerCase();

      return (
        title.includes(search) ||
        category.includes(search) ||
        id.includes(search)
      );
    })

    // ---------- CATEGORY FILTER ----------
    .filter((course) => {

      if (selectedCategory === "All") {
        return true;
      }

      return (
        String(course.category || "")
          .toLowerCase() ===
        selectedCategory.toLowerCase()
      );
    })

    // ---------- LEVEL FILTER ----------
    .filter((course) => {

      if (selectedLevel === "All") {
        return true;
      }

      return (
        String(course.level || "")
          .toLowerCase() ===
        selectedLevel.toLowerCase()
      );
    })

    // ---------- SORT ----------
    .sort((a, b) => {

      if (!sortColumn) {
        return 0;
      }

      let valueA;
      let valueB;


      // Course ID
      if (sortColumn === "id") {

        valueA = String(a.id || "");
        valueB = String(b.id || "");

      }


      // Title
      else if (sortColumn === "title") {

        valueA = String(a.title || "");
        valueB = String(b.title || "");

      }


      // Category
      else if (sortColumn === "category") {

        valueA = String(a.category || "");
        valueB = String(b.category || "");

      }


      // Level
      else if (sortColumn === "level") {

        valueA = String(a.level || "");
        valueB = String(b.level || "");

      }


      // Duration
      else if (sortColumn === "duration") {

        valueA = String(a.duration || "");
        valueB = String(b.duration || "");

      }


      // Price
      else if (sortColumn === "price") {

        valueA = Number(a.price || 0);
        valueB = Number(b.price || 0);

        const numericResult =
          valueA - valueB;

        return sortDirection === "asc"
          ? numericResult
          : -numericResult;
      }


      // ---------- TEXT SORTING ----------
      if (typeof valueA === "string") {

        const result = valueA.localeCompare(
          valueB,
          undefined,
          {
            sensitivity: "base",
            numeric: true,
          }
        );

        return sortDirection === "asc"
          ? result
          : -result;
      }


      return 0;
    });


  // =========================================================
  // CR-003 - SORT HANDLER
  // =========================================================

  const handleSort = (column) => {

    if (sortColumn === column) {

      // Same column → reverse direction
      setSortDirection(
        sortDirection === "asc"
          ? "desc"
          : "asc"
      );

    } else {

      // New column → start with ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };


  // =========================================================
  // CR-003 - SORT INDICATOR
  // =========================================================

  const getSortIndicator = (column) => {

    if (sortColumn !== column) {
      return "";
    }

    return sortDirection === "asc"
      ? " ↑"
      : " ↓";
  };


  // =========================================================
  // CR-003 - RESET FILTERS
  // =========================================================

  const resetFilters = () => {

    setSearchText("");

    setSelectedCategory("All");

    setSelectedLevel("All");

    setSortColumn(null);

    setSortDirection("asc");
  };


  // =========================================================
  // FORM HELPERS
  // =========================================================

  const handleChange = (event) => {

    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Remove the server error for the field
    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setFormError("");
  };


  // =========================================================
  // OPEN ADD FORM
  // =========================================================

  const openAddForm = () => {

    setShowForm(true);

    setEditingId(null);

    setFormData({
      ...EMPTY_COURSE,
    });

    setFormError("");

    setFieldErrors({});

    setError("");

    setSuccess("");
  };


  // =========================================================
  // OPEN EDIT FORM
  // =========================================================

  const openEditForm = (course) => {

    setShowForm(true);

    setEditingId(course.id);

    setFormData({
      title: course.title || "",
      category: course.category || "",
      level: course.level || "Beginner",
      duration: course.duration || "",
      price: String(course.price ?? ""),
      image: course.image || "",
      description: course.description || "",
    });

    setFormError("");

    setFieldErrors({});

    setError("");

    setSuccess("");
  };


  // =========================================================
  // CLOSE FORM
  // =========================================================

  const closeForm = () => {

    setShowForm(false);

    setEditingId(null);

    setFormData({
      ...EMPTY_COURSE,
    });

    setFormError("");

    setFieldErrors({});
  };


  // =========================================================
  // CREATE / UPDATE
  // =========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setFormError("");

    setError("");

    setSuccess("");

    setFieldErrors({});


    // ---------- CLIENT-SIDE VALIDATION ----------

    if (
      !formData.title.trim() ||
      !formData.category.trim() ||
      !formData.level
    ) {

      setFormError(
        "Title, category and level are required."
      );

      return;
    }


    if (!formData.duration.trim()) {

      setFormError(
        "Duration is required (for example: 8 Weeks)."
      );

      return;
    }


    if (
      formData.price === "" ||
      Number(formData.price) < 0
    ) {

      setFormError(
        "Please enter a valid price."
      );

      return;
    }


    // ---------- COURSE PAYLOAD ----------

    const coursePayload = {

      title: formData.title.trim(),

      category: formData.category.trim(),

      level: formData.level,

      duration: formData.duration.trim(),

      price: Number(formData.price),

      image: formData.image.trim(),

      description: formData.description.trim(),
    };


    setSaving(true);


    try {

      if (editingId) {

        // ---------- UPDATE ----------

        const response = await api.put(
          `/courses/${editingId}`,
          coursePayload
        );

        setSuccess(
          response.data.message
        );

      } else {

        // ---------- CREATE ----------

        const response = await api.post(
          "/courses",
          coursePayload
        );

        setSuccess(
          response.data.message
        );
      }


      // IMPORTANT:
      // Search, filters and sorting states
      // are NOT reset here.

      closeForm();

      await refreshCourses();

    } catch (error) {

      const responseData =
        error.response?.data;


      if (responseData?.errors) {

        setFieldErrors(
          responseData.errors
        );
      }


      setFormError(
        responseData?.message ||
        "Could not save the course. Please try again."
      );

    } finally {

      setSaving(false);
    }
  };


  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (course) => {

    const confirmed = window.confirm(
      `Delete "${course.title}"? This cannot be undone.`
    );


    if (!confirmed) {
      return;
    }


    setError("");

    setSuccess("");


    try {

      const response = await api.delete(
        `/courses/${course.id}`
      );

      setSuccess(
        response.data.message
      );

      // IMPORTANT:
      // Search, filters and sorting states
      // are preserved.

      await refreshCourses();

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Could not delete the course."
      );
    }
  };


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <>

      <Navbar />


      <div className="container">


        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <div className="page-header">

          <div>

            <h1>
              Manage Courses
            </h1>

            <p className="page-subtitle">
              Add new courses, update the existing ones,
              or remove courses that are no longer offered.
            </p>

          </div>


          <button
            type="button"
            className="btn btn-primary"
            onClick={
              showForm
                ? closeForm
                : openAddForm
            }
          >

            {showForm
              ? <FaTimes />
              : <FaPlus />
            }

            {showForm
              ? "Cancel"
              : "Add Course"
            }

          </button>

        </div>


        {/* =====================================================
            SUCCESS / ERROR
        ====================================================== */}

        {success && (

          <p className="success">
            {success}
          </p>

        )}


        {error && (

          <p className="error">
            {error}
          </p>

        )}


        {/* =====================================================
            ADD / EDIT FORM
        ====================================================== */}

        {showForm && (

          <section className="section-card">


            <div className="section-card-header">

              <h2>

                {editingId
                  ? "Edit Course"
                  : "New Course"
                }

              </h2>

            </div>


            <form
              className="form"
              onSubmit={handleSubmit}
            >


              {/* ---------- TITLE + CATEGORY ---------- */}

              <div className="form-row">


                <div className="form-group">

                  <label htmlFor="title">
                    Title *
                  </label>


                  <input
                    id="title"
                    className={
                      fieldErrors.title
                        ? "input input-error"
                        : "input"
                    }
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. React"
                  />


                  {fieldErrors.title && (

                    <p className="field-error">
                      {fieldErrors.title}
                    </p>

                  )}

                </div>


                <div className="form-group">

                  <label htmlFor="category">
                    Category *
                  </label>


                  <input
                    id="category"
                    className={
                      fieldErrors.category
                        ? "input input-error"
                        : "input"
                    }
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Frontend"
                  />


                  {fieldErrors.category && (

                    <p className="field-error">
                      {fieldErrors.category}
                    </p>

                  )}

                </div>

              </div>


              {/* ---------- LEVEL + DURATION + PRICE ---------- */}

              <div className="form-row">


                <div className="form-group">

                  <label htmlFor="level">
                    Level *
                  </label>


                  <select
                    id="level"
                    className={
                      fieldErrors.level
                        ? "input input-error"
                        : "input"
                    }
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                  >

                    {LEVEL_OPTIONS.map(
                      (level) => (

                        <option
                          key={level}
                          value={level}
                        >
                          {level}
                        </option>

                      )
                    )}

                  </select>


                  {fieldErrors.level && (

                    <p className="field-error">
                      {fieldErrors.level}
                    </p>

                  )}

                </div>


                <div className="form-group">

                  <label htmlFor="duration">
                    Duration *
                  </label>


                  <input
                    id="duration"
                    className={
                      fieldErrors.duration
                        ? "input input-error"
                        : "input"
                    }
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g. 10 Weeks"
                  />


                  {fieldErrors.duration && (

                    <p className="field-error">
                      {fieldErrors.duration}
                    </p>

                  )}

                </div>


                <div className="form-group">

                  <label htmlFor="price">
                    Price (Rs.) *
                  </label>


                  <input
                    id="price"
                    className={
                      fieldErrors.price
                        ? "input input-error"
                        : "input"
                    }
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g. 25000"
                  />


                  {fieldErrors.price && (

                    <p className="field-error">
                      {fieldErrors.price}
                    </p>

                  )}

                </div>

              </div>


              {/* ---------- IMAGE ---------- */}

              <div className="form-group">

                <label htmlFor="image">
                  Image URL
                </label>


                <input
                  id="image"
                  className={
                    fieldErrors.image
                      ? "input input-error"
                      : "input"
                  }
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://placehold.co/300x180?text=React"
                />


                {fieldErrors.image && (

                  <p className="field-error">
                    {fieldErrors.image}
                  </p>

                )}

              </div>


              {/* ---------- DESCRIPTION ---------- */}

              <div className="form-group">

                <label htmlFor="description">
                  Description
                </label>


                <textarea
                  id="description"
                  className={
                    fieldErrors.description
                      ? "input input-error"
                      : "input"
                  }
                  rows="4"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short summary of what students will learn."
                />


                {fieldErrors.description && (

                  <p className="field-error">
                    {fieldErrors.description}
                  </p>

                )}

              </div>


              {/* ---------- GENERAL FORM ERROR ---------- */}

              {formError && (

                <p className="error">
                  {formError}
                </p>

              )}


              {/* ---------- FORM ACTIONS ---------- */}

              <div className="form-actions">


                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >

                  <FaSave />

                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Course"
                      : "Create Course"
                  }

                </button>


                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeForm}
                  disabled={saving}
                >

                  <FaTimes />

                  Cancel

                </button>


              </div>


            </form>

          </section>

        )}


        {/* =====================================================
            CR-003 SEARCH / FILTER / SORT CONTROLS
        ====================================================== */}

        <section className="section-card">


          <div className="section-card-header">

            <div>

              <h2>
                Course List
              </h2>

              <p className="page-subtitle">
                Search, filter and sort courses.
              </p>

            </div>


            <Link
              to="/admin/enrollments"
              className="link-inline"
            >

              <FaEye />

              Manage enrollments

            </Link>

          </div>


          {/* ---------- SEARCH ---------- */}

          <div className="course-controls">


            <div className="course-search">

              <label htmlFor="course-search">
                Search Courses
              </label>


              <div className="search-input-wrapper">

                <FaSearch />

                <input
                  id="course-search"
                  type="text"
                  className="input"
                  value={searchText}
                  onChange={(event) =>
                    setSearchText(
                      event.target.value
                    )
                  }
                  placeholder="Search by title, category or course ID..."
                />

              </div>

            </div>


            {/* ---------- CATEGORY FILTER ---------- */}

            <div className="course-filter">

              <label htmlFor="category-filter">
                Category
              </label>


              <select
                id="category-filter"
                className="input"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value
                  )
                }
              >

                {categoryOptions.map(
                  (category) => (

                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* ---------- LEVEL FILTER ---------- */}

            <div className="course-filter">

              <label htmlFor="level-filter">
                Level
              </label>


              <select
                id="level-filter"
                className="input"
                value={selectedLevel}
                onChange={(event) =>
                  setSelectedLevel(
                    event.target.value
                  )
                }
              >

                <option value="All">
                  All
                </option>

                {LEVEL_OPTIONS.map(
                  (level) => (

                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* ---------- RESET ---------- */}

            <div className="course-filter-button">

              <button
                type="button"
                className="btn btn-outline"
                onClick={resetFilters}
              >

                <FaUndo />

                Reset Filters

              </button>

            </div>

          </div>


          {/* ---------- RESULT COUNTER ---------- */}

          <div className="course-result-info">

            Showing{" "}
            <strong>
              {displayedCourses.length}
            </strong>{" "}
            of{" "}
            <strong>
              {courses.length}
            </strong>{" "}
            courses

          </div>


        </section>


        {/* =====================================================
            COURSE TABLE
        ====================================================== */}

        <section className="section-card">


          {loading && (

            <p className="loading">
              Loading courses...
            </p>

          )}


          {/* ---------- NO COURSES IN DATABASE ---------- */}

          {!loading &&
            courses.length === 0 && (

              <p className="empty">
                No courses yet.
                Click "Add Course" to create
                the first one.
              </p>

            )
          }


          {/* ---------- NO SEARCH/FILTER RESULTS ---------- */}

          {!loading &&
            courses.length > 0 &&
            displayedCourses.length === 0 && (

              <div className="no-results">

                <h3>
                  No courses found.
                </h3>

                <p>
                  No courses match your current
                  search or filter criteria.
                </p>


                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetFilters}
                >

                  <FaUndo />

                  Reset Filters

                </button>

              </div>

            )
          }


          {/* ---------- TABLE ---------- */}

          {!loading &&
            displayedCourses.length > 0 && (

              <div className="table-wrapper">


                <table className="table">


                  <thead>

                    <tr>


                      {/* ID */}

                      <th>

                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort("id")
                          }
                        >

                          ID
                          {getSortIndicator("id")}

                        </button>

                      </th>


                      {/* IMAGE */}

                      <th>
                        Image
                      </th>


                      {/* TITLE */}

                      <th>

                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort("title")
                          }
                        >

                          Title
                          {getSortIndicator("title")}

                        </button>

                      </th>


                      {/* CATEGORY */}

                      <th>

                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort("category")
                          }
                        >

                          Category
                          {getSortIndicator("category")}

                        </button>

                      </th>


                      {/* LEVEL */}

                      <th>

                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort("level")
                          }
                        >

                          Level
                          {getSortIndicator("level")}

                        </button>

                      </th>


                      {/* DURATION */}

                      <th>

                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort("duration")
                          }
                        >

                          Duration
                          {getSortIndicator("duration")}

                        </button>

                      </th>


                      {/* PRICE */}

                      <th>

                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort("price")
                          }
                        >

                          Price
                          {getSortIndicator("price")}

                        </button>

                      </th>


                      {/* ACTIONS */}

                      <th className="table-actions-column">
                        Actions
                      </th>


                    </tr>

                  </thead>


                  <tbody>

                    {displayedCourses.map(
                      (course) => (

                        <tr
                          key={course.id}
                        >


                          {/* ID */}

                          <td>
                            {course.id}
                          </td>


                          {/* IMAGE */}

                          <td>

                            <img
                              src={course.image}
                              alt={course.title}
                              className="table-thumb"
                            />

                          </td>


                          {/* TITLE */}

                          <td>
                            {course.title}
                          </td>


                          {/* CATEGORY */}

                          <td>
                            {course.category}
                          </td>


                          {/* LEVEL */}

                          <td>

                            <span className="tag tag-level">
                              {course.level}
                            </span>

                          </td>


                          {/* DURATION */}

                          <td>
                            {course.duration}
                          </td>


                          {/* PRICE */}

                          <td>
                            Rs. {course.price}
                          </td>


                          {/* ACTIONS */}

                          <td>

                            <div className="table-actions">


                              <button
                                type="button"
                                className="btn btn-small btn-outline"
                                onClick={() =>
                                  openEditForm(course)
                                }
                              >

                                <FaEdit />

                                Edit

                              </button>


                              <button
                                type="button"
                                className="btn btn-small btn-danger"
                                onClick={() =>
                                  handleDelete(course)
                                }
                              >

                                <FaTrash />

                                Delete

                              </button>


                            </div>

                          </td>


                        </tr>

                      )
                    )}

                  </tbody>


                </table>


              </div>

            )
          }


        </section>


      </div>


      <Footer />

    </>

  );
}


export default ManageCourses;