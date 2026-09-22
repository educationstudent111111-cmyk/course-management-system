import { useEffect, useState } from "react";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CourseCard from "../components/CourseCard";

function Courses() {

  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- Filter states ----------
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");


  // ---------- Load courses from backend ----------
  useEffect(() => {

    const getCourses = async () => {

      try {

        const response = await api.get("/courses");

        setCourses(response.data.courses || []);

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load courses"
        );

      } finally {

        setLoading(false);

      }
    };

    getCourses();

  }, []);


  // ---------- Build category list ----------
  const categories = [
    "All",
    ...new Set(
      courses
        .map((course) => course.category)
        .filter(Boolean)
    ),
  ];


  // ---------- Level list ----------
  const levels = [
    "All",
    "Beginner",
    "Intermediate",
    "Advanced",
  ];


  // ---------- Apply all filters ----------
  const filteredCourses = courses.filter((course) => {

    // Convert values safely to strings.
    // This prevents errors when description or duration is null.
    const title = String(course.title || "");
    const category = String(course.category || "");
    const level = String(course.level || "");
    const description = String(course.description || "");
    const duration = String(course.duration || "");

    const search = searchText.toLowerCase().trim();

    // Search title, category, level, description and duration
    const matchesSearch =
      title.toLowerCase().includes(search) ||
      category.toLowerCase().includes(search) ||
      level.toLowerCase().includes(search) ||
      description.toLowerCase().includes(search) ||
      duration.toLowerCase().includes(search);


    // Category filter
    const matchesCategory =
      selectedCategory === "All" ||
      category === selectedCategory;


    // Level filter
    const matchesLevel =
      selectedLevel === "All" ||
      level === selectedLevel;


    // Price
    const coursePrice = Number(course.price);


    // Minimum price
    const matchesMinPrice =
      minPrice === "" ||
      coursePrice >= Number(minPrice);


    // Maximum price
    const matchesMaxPrice =
      maxPrice === "" ||
      coursePrice <= Number(maxPrice);


    // All filters must match
    return (
      matchesSearch &&
      matchesCategory &&
      matchesLevel &&
      matchesMinPrice &&
      matchesMaxPrice
    );

  });


  // ---------- Clear all filters ----------
  const clearAllFilters = () => {

    setSearchText("");
    setSelectedCategory("All");
    setSelectedLevel("All");
    setMinPrice("");
    setMaxPrice("");

  };


  // ---------- Check whether any filter is active ----------
  const hasActiveFilters =
    searchText.trim() !== "" ||
    selectedCategory !== "All" ||
    selectedLevel !== "All" ||
    minPrice !== "" ||
    maxPrice !== "";


  return (

    <>
      <Navbar />

      <div className="container">

        <div className="page-header">

          <div>

            <h1>Our Courses</h1>

            <p className="page-subtitle">
              Browse the full catalogue and view the details of any course.
            </p>

          </div>

        </div>


        {/* ---------- Filters ---------- */}

        {!loading && !error && courses.length > 0 && (

          <div className="filter-bar">

            {/* Search */}

            <input
              type="text"
              className="input"
              placeholder="Search by title, category, level, description or duration..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />


            {/* Category */}

            <select
              className="input"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
            >

              {categories.map((category) => (

                <option key={category} value={category}>
                  {category}
                </option>

              ))}

            </select>


            {/* Level */}

            <select
              className="input"
              value={selectedLevel}
              onChange={(event) =>
                setSelectedLevel(event.target.value)
              }
            >

              {levels.map((level) => (

                <option key={level} value={level}>
                  {level === "All" ? "All Levels" : level}
                </option>

              ))}

            </select>


            {/* Minimum Price */}

            <input
              type="number"
              className="input"
              placeholder="Minimum price"
              min="0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
            />


            {/* Maximum Price */}

            <input
              type="number"
              className="input"
              placeholder="Maximum price"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />


            {/* Clear All */}

            {hasActiveFilters && (

              <button
                type="button"
                className="clear-filter-btn"
                onClick={clearAllFilters}
              >
                Clear All Filters
              </button>

            )}

          </div>

        )}


        {/* ---------- Active filter chips ---------- */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          hasActiveFilters && (

            <div className="filter-chips">

              {searchText.trim() !== "" && (
                <span className="filter-chip">
                  Search: {searchText}
                </span>
              )}

              {selectedCategory !== "All" && (
                <span className="filter-chip">
                  Category: {selectedCategory}
                </span>
              )}

              {selectedLevel !== "All" && (
                <span className="filter-chip">
                  Level: {selectedLevel}
                </span>
              )}

              {minPrice !== "" && (
                <span className="filter-chip">
                  Min Price: {minPrice}
                </span>
              )}

              {maxPrice !== "" && (
                <span className="filter-chip">
                  Max Price: {maxPrice}
                </span>
              )}

            </div>

          )}


        {/* ---------- Loading state ---------- */}

        {loading && (
          <p className="loading">
            Loading courses...
          </p>
        )}


        {/* ---------- Error state ---------- */}

        {error && !loading && (
          <p className="error">
            {error}
          </p>
        )}


        {/* ---------- No courses exist ---------- */}

        {!loading &&
          !error &&
          courses.length === 0 && (

            <p className="empty">
              There are no courses available at the moment.
            </p>

          )}


        {/* ---------- Courses exist but no filter matches ---------- */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          filteredCourses.length === 0 && (

            <p className="empty">
              No courses match the selected filters.
              Try changing or clearing your filters.
            </p>

          )}


        {/* ---------- Course list ---------- */}

        {!loading &&
          !error &&
          filteredCourses.length > 0 && (

            <>

              {/* Result counter */}

              <p className="result-count">
                Showing {filteredCourses.length} of {courses.length} courses
              </p>


              {/* Course cards */}

              <div className="course-grid">

                {filteredCourses.map((course) => (

                  <CourseCard
                    key={course.id}
                    course={course}
                  />

                ))}

              </div>

            </>

          )}

      </div>

      <Footer />

    </>
  );
}

export default Courses;

