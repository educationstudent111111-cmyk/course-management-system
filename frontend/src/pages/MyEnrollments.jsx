import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function MyEnrollments() {

  const [enrollments, setEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // CR-006
  const [cancellingId, setCancellingId] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const [cancelError, setCancelError] = useState("");

  const [sortOption, setSortOption] = useState("newest");

  const user = getUser();


  // ======================================================
  // LOAD ENROLLMENTS
  // ======================================================

  const loadEnrollments = async () => {

    try {

      setError("");

      const response =
        await api.get("/enrollments/my");

      setEnrollments(
        response.data.enrollments || []
      );

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Failed to load your enrollments"
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadEnrollments();

  }, []);


  // ======================================================
  // CR-006
  // CANCEL ENROLLMENT
  // ======================================================

  const handleCancelEnrollment = async (enrollmentId) => {

    // Confirmation
    const confirmed = window.confirm(
      "Are you sure you want to cancel this enrollment?"
    );


    if (!confirmed) {
      return;
    }


    try {

      setCancellingId(enrollmentId);

      setSuccessMessage("");

      setCancelError("");


      // Student-only backend endpoint
      await api.delete(
        `/enrollments/my/${enrollmentId}`
      );


      // Success message
      setSuccessMessage(
        "Enrollment cancelled successfully."
      );


      // Refresh list without page reload
      await loadEnrollments();

} catch (error) {

  console.error("Cancel enrollment error:", error);

  console.log("Status:", error.response?.status);
  console.log("Response:", error.response?.data);

  setCancelError(
    error.response?.data?.message ||
    error.message ||
    "Failed to cancel enrollment."
  );


    } finally {

      setCancellingId(null);

    }
  };


  // ======================================================
  // SAFE PRICE
  // ======================================================

  const getSafePrice = (price) => {

    const numericPrice = Number(price);

    return Number.isFinite(numericPrice)
      ? numericPrice
      : 0;
  };


  // ======================================================
  // SUMMARY
  // ======================================================

  const totalCourses =
    enrollments.length;


  const totalValue =
    enrollments.reduce(
      (total, enrollment) => {

        return total +
          getSafePrice(enrollment.price);

      },
      0
    );


  const averagePrice =
    totalCourses > 0
      ? totalValue / totalCourses
      : 0;


  const distinctCategories =
    new Set(
      enrollments
        .map(
          (enrollment) =>
            enrollment.category
        )
        .filter(Boolean)
    ).size;


  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (value) => {

    if (!value) {
      return "-";
    }


    const date = new Date(value);


    if (Number.isNaN(date.getTime())) {
      return "-";
    }


    return date.toLocaleDateString();
  };


  // ======================================================
  // FORMAT PRICE
  // ======================================================

  const formatPrice = (value) => {

    const numericValue = Number(value);


    if (!Number.isFinite(numericValue)) {
      return "0.00";
    }


    return numericValue.toFixed(2);
  };


  // ======================================================
  // SORT
  // ======================================================

  const sortedEnrollments =
    [...enrollments].sort((a, b) => {

      if (sortOption === "newest") {

        return (
          new Date(b.enrolled_at || 0) -
          new Date(a.enrolled_at || 0)
        );
      }


      if (sortOption === "oldest") {

        return (
          new Date(a.enrolled_at || 0) -
          new Date(b.enrolled_at || 0)
        );
      }


      if (sortOption === "price-high") {

        return (
          getSafePrice(b.price) -
          getSafePrice(a.price)
        );
      }


      if (sortOption === "price-low") {

        return (
          getSafePrice(a.price) -
          getSafePrice(b.price)
        );
      }


      if (sortOption === "title-az") {

        return String(a.title || "")
          .toLowerCase()
          .localeCompare(
            String(b.title || "")
              .toLowerCase()
          );
      }


      return 0;
    });


  // ======================================================
  // UI
  // ======================================================

  return (

    <>
      <Navbar />

      <div className="container">

        {/* Header */}

        <div className="page-header">

          <div>

            <h1>My Enrollments</h1>

            <p className="page-subtitle">

              {user?.full_name
                ? `${user.full_name}, these are the courses you are enrolled in.`
                : "These are the courses you are enrolled in."}

            </p>

          </div>


          <Link
            to="/courses"
            className="btn btn-primary"
          >
            <FaSearch />
            Browse More Courses
          </Link>

        </div>


        {/* Loading */}

        {loading && (

          <p className="loading">
            Loading your enrollments...
          </p>

        )}


        {/* Main error */}

        {error && !loading && (

          <p className="error">
            {error}
          </p>

        )}


        {/* CR-006 Success */}

        {successMessage && !loading && (

          <div className="success-message">
            {successMessage}
          </div>

        )}


        {/* CR-006 Error */}

        {cancelError && !loading && (

          <div className="error-message">
            {cancelError}
          </div>

        )}


        {/* Summary */}

        {!loading &&
          !error &&
          enrollments.length > 0 && (

            <div className="enrollment-summary">

              <div className="summary-card">

                <h3>Total Enrolled Courses</h3>

                <p>
                  {totalCourses}
                </p>

              </div>


              <div className="summary-card">

                <h3>Total Course Value</h3>

                <p>
                  Rs. {formatPrice(totalValue)}
                </p>

              </div>


              <div className="summary-card">

                <h3>Average Course Price</h3>

                <p>
                  Rs. {formatPrice(averagePrice)}
                </p>

              </div>


              <div className="summary-card">

                <h3>Distinct Categories</h3>

                <p>
                  {distinctCategories}
                </p>

              </div>

            </div>

          )}


        {/* Sorting */}

        {!loading &&
          !error &&
          enrollments.length > 0 && (

            <div className="enrollment-controls">

              <label htmlFor="sort-enrollments">
                Sort By:
              </label>


              <select
                id="sort-enrollments"
                value={sortOption}
                onChange={(event) =>
                  setSortOption(
                    event.target.value
                  )
                }
              >

                <option value="newest">
                  Newest Enrolled
                </option>

                <option value="oldest">
                  Oldest Enrolled
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="title-az">
                  Course Title: A to Z
                </option>

              </select>

            </div>

          )}


        {/* Empty */}

        {!loading &&
          !error &&
          enrollments.length === 0 && (

            <div className="empty-box">

              <p className="empty">
                You are not enrolled in any courses yet.
              </p>


              <Link
                to="/courses"
                className="btn btn-primary"
              >
                <FaSearch />
                Find a Course
              </Link>

            </div>

          )}


        {/* Enrollment Cards */}

        {!loading &&
          !error &&
          enrollments.length > 0 && (

            <div className="course-grid">

              {sortedEnrollments.map(
                (enrollment) => (

                  <article
                    className="course-card"
                    key={enrollment.id}
                  >

                    <img
                      src={enrollment.image}
                      alt={enrollment.title}
                      className="course-card-image"
                      loading="lazy"
                    />


                    <div className="course-card-body">

                      <div className="course-card-tags">

                        <span className="tag tag-category">
                          {enrollment.category}
                        </span>

                        <span className="tag tag-level">
                          {enrollment.level}
                        </span>

                      </div>


                      <h3 className="course-card-title">
                        {enrollment.title}
                      </h3>


                      <p className="course-card-summary">

                        {enrollment.description?.slice(
                          0,
                          100
                        )}

                        {enrollment.description?.length > 100
                          ? "..."
                          : ""}

                      </p>


                      <ul className="course-card-meta">

                        <li>
                          <strong>
                            Duration:
                          </strong>{" "}
                          {enrollment.duration}
                        </li>


                        <li>
                          <strong>
                            Price:
                          </strong>{" "}
                          Rs.{" "}
                          {formatPrice(
                            enrollment.price
                          )}
                        </li>


                        <li>
                          <strong>
                            Enrolled on:
                          </strong>{" "}
                          {formatDate(
                            enrollment.enrolled_at
                          )}
                        </li>

                      </ul>


                      {/* View Course */}

                      <Link
                        to={`/courses/${enrollment.course_id}`}
                        className="btn btn-outline btn-block"
                      >
                        View Course
                      </Link>


                      {/* CR-006 Cancel */}

                      <button
                        type="button"
                        className="cancel-enrollment-btn"
                        onClick={() =>
                          handleCancelEnrollment(
                            enrollment.id
                          )
                        }
                        disabled={
                          cancellingId ===
                          enrollment.id
                        }
                      >

                        {cancellingId ===
                        enrollment.id
                          ? "Cancelling..."
                          : "Cancel Enrollment"}

                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

      </div>

      <Footer />

    </>
  );
}


export default MyEnrollments;