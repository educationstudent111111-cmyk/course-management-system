import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import {
  FaChartBar,
  FaGraduationCap,
  FaShoppingCart,
  FaSignInAlt,
  FaTimesCircle,
} from "react-icons/fa";

import api from "../services/api";

import {
  isLoggedIn,
  isStudent,
  isAdmin,
} from "../services/auth";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function CourseDetails() {

  const { id } = useParams();

  const location = useLocation();


  // ======================================================
  // STATE
  // ======================================================

  const [course, setCourse] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [enrolling, setEnrolling] = useState(false);

  // CR-006
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState("");

  const [checkingEnrollment, setCheckingEnrollment] =
    useState(false);


  // ======================================================
  // AUTH STATE
  // ======================================================

  const loggedIn = isLoggedIn();

  const studentLoggedIn = isStudent();

  const adminLoggedIn = isAdmin();


  // ======================================================
  // LOAD COURSE
  // ======================================================

  useEffect(() => {

    const getCourse = async () => {

      try {

        setLoading(true);

        setError("");

        const response =
          await api.get(`/courses/${id}`);

        setCourse(
          response.data.course
        );

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load course"
        );

      } finally {

        setLoading(false);

      }
    };


    getCourse();

  }, [id]);


  // ======================================================
  // CR-006
  // CHECK WHETHER STUDENT IS ALREADY ENROLLED
  // ======================================================

  useEffect(() => {

    const checkEnrollment = async () => {

      if (!studentLoggedIn) {

        setIsEnrolled(false);

        return;
      }


      try {

        setCheckingEnrollment(true);

        const response =
          await api.get("/enrollments/my");

        const enrollments =
          response.data.enrollments || [];

        const enrollment = enrollments.find(
          (item) => String(item.course_id) === String(id)
        );
        const status = enrollment?.status || "";

        setEnrollmentStatus(status);
        setIsEnrolled(status === "pending" || status === "approved");

      } catch (error) {

        console.error(
          "Error checking enrollment:",
          error
        );

        setIsEnrolled(false);

      } finally {

        setCheckingEnrollment(false);

      }
    };


    checkEnrollment();

  }, [id, studentLoggedIn]);


  // ======================================================
  // CR-007
  // COURSE AVAILABILITY
  // ======================================================

  const isUnlimited =
    course &&
    (course.max_students === null ||
      course.max_students === undefined);

  const isFull =
    course &&
    !isUnlimited &&
    course.is_full === true;

  const availabilityText =
    !course
      ? ""
      : isUnlimited
        ? "Unlimited"
        : `${course.enrolled_count} / ${course.max_students} students`;


  // ======================================================
  // CR-007
  // REFRESH COURSE AVAILABILITY
  // ======================================================

  const refreshCourse = async () => {

    try {

      const response =
        await api.get(`/courses/${id}`);

      setCourse(
        response.data.course
      );

    } catch (error) {

      console.error(
        "Error refreshing course:",
        error
      );

    }
  };


  // ======================================================
  // ENROLL
  // ======================================================

  const handleEnroll = async () => {

    setError("");

    setSuccess("");

    setEnrolling(true);


    try {

      const response =
        await api.post(
          "/enrollments",
          {
            courseId: id,
          }
        );

      setSuccess(response.data.message || "Enrollment request submitted.");
      setEnrollmentStatus("pending");
      setIsEnrolled(true);

      await refreshCourse();

    } catch (error) {

      if (error.response?.status === 409) {

        const message =
          error.response?.data?.message ||
          "This course is full. No more students can enroll.";

        setIsEnrolled(message.toLowerCase().includes("already enrolled") ||
          message.toLowerCase().includes("request is already pending"));

        setError(message);

        await refreshCourse();

      } else {

        setError(
          error.response?.data?.message ||
          "Enrollment failed. Please try again."
        );

      }

    } finally {

      setEnrolling(false);

    }
  };


  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {

    return (

      <>
        <Navbar />

        <div className="container">

          <p className="loading">
            Loading course...
          </p>

        </div>
      </>

    );
  }


  // ======================================================
  // COURSE NOT FOUND
  // ======================================================

  if (error && !course) {

    return (

      <>
        <Navbar />

        <div className="container">

          <p className="error">
            {error}
          </p>

          <div className="center-actions">

            <Link
              to="/courses"
              className="btn btn-primary"
            >
              Back to Courses
            </Link>

          </div>

        </div>

        <Footer />

      </>

    );
  }


  // ======================================================
  // COURSE DETAILS
  // ======================================================

  return (

    <>
      <Navbar />

      <div className="container">

        {/* Breadcrumb */}

        <p className="breadcrumb">

          <Link to="/courses">
            Courses
          </Link>

          <span> / </span>

          <span>
            {course.title}
          </span>

        </p>


        <div className="details-layout">


          {/* ==================================================
              LEFT - IMAGE
          ================================================== */}

          <div className="details-image-wrapper">

            <img
              src={course.image}
              alt={course.title}
              className="details-image"
            />

          </div>


          {/* ==================================================
              RIGHT - INFORMATION
          ================================================== */}

          <div className="details-info">


            {/* Tags */}

            <div className="course-card-tags">

              <span className="tag tag-category">
                {course.category}
              </span>

              <span className="tag tag-level">
                {course.level}
              </span>

            </div>


            {/* Title */}

            <h1>
              {course.title}
            </h1>


            {/* Description */}

            <p className="details-description">
              {course.description}
            </p>


            {/* Details */}

            <dl className="details-list">

              <div>

                <dt>
                  Category
                </dt>

                <dd>
                  {course.category}
                </dd>

              </div>


              <div>

                <dt>
                  Level
                </dt>

                <dd>
                  {course.level}
                </dd>

              </div>


              <div>

                <dt>
                  Duration
                </dt>

                <dd>
                  {course.duration}
                </dd>

              </div>


              <div>

                <dt>
                  Price
                </dt>

                <dd className="details-price">
                  Rs. {course.price}
                </dd>

              </div>


              {/* CR-007 */}

              <div>

                <dt>
                  Availability
                </dt>

                <dd
                  className={
                    isFull
                      ? "details-availability full"
                      : "details-availability"
                  }
                >

                  {isFull
                    ? "Course Full"
                    : availabilityText}

                </dd>

              </div>

            </dl>


            {/* CR-007 FULL COURSE MESSAGE */}

            {isFull && !isEnrolled && (

              <div className="notice">

                <p>
                  <FaTimesCircle />

                  {" "}

                  This course currently has no available seats. You can still
                  submit a request, but approval depends on availability when
                  an administrator reviews it.
                </p>

              </div>

            )}


            {/* ==================================================
                MESSAGES
            ================================================== */}

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


            {/* ==================================================
                ACTION AREA
            ================================================== */}

            <div className="details-actions">


              {/* ==================================================
                  NOT LOGGED IN
              ================================================== */}

              {!loggedIn && (

                <div className="notice">

                  <p>
                    Please login as a student to
                    enroll in this course.
                  </p>

                  <Link
                    to="/login"
                    state={{
                      from: location.pathname
                    }}
                    className="btn btn-primary"
                  >

                    <FaSignInAlt />

                    Login to Enroll

                  </Link>

                </div>

              )}


              {/* ==================================================
                  STUDENT
              ================================================== */}

              {studentLoggedIn && (

                <>

                  {checkingEnrollment && (

                    <p className="loading">
                      Checking enrollment status...
                    </p>

                  )}


                  {/* ALREADY ENROLLED */}

                  {!checkingEnrollment &&
                    isEnrolled && (

                      <div className="notice">

                        <p>
                          {enrollmentStatus === "pending"
                            ? "Request Pending Approval"
                            : "You are enrolled in this course."}
                        </p>

                        <Link
                          to="/my-enrollments"
                          className="btn btn-primary"
                        >

                          <FaGraduationCap />

                          My Enrollments

                        </Link>

                      </div>

                    )}


                  {/* AVAILABLE COURSE */}

                  {!checkingEnrollment &&
                    !isEnrolled &&
                    (

                      <>

                        {enrollmentStatus === "rejected" && (
                          <p className="notice">
                            Your previous request was rejected. You may submit
                            it again for review.
                          </p>
                        )}

                        {isFull && (
                          <p className="notice">
                            The course is currently full. You may still request
                            enrollment; approval depends on a seat being
                            available when reviewed.
                          </p>
                        )}

                        <button
                          type="button"
                          className="btn btn-primary btn-lg"
                          onClick={handleEnroll}
                          disabled={enrolling}
                        >

                          <FaShoppingCart />

                          {enrolling
                            ? "Submitting..."
                            : "Request Enrollment"}

                        </button>


                        <Link
                          to="/my-enrollments"
                          className="btn btn-outline"
                        >

                          <FaGraduationCap />

                          My Enrollments

                        </Link>

                      </>

                    )}

                </>

              )}


              {/* ==================================================
                  ADMIN
              ================================================== */}

              {adminLoggedIn && (

                <div className="notice">

                  <p>
                    You are logged in as an
                    administrator. Only students
                    can enroll in courses.
                  </p>

                  <Link
                    to="/admin/courses"
                    className="btn btn-primary"
                  >

                    <FaChartBar />

                    Manage Courses

                  </Link>

                </div>

              )}

            </div>

          </div>

        </div>

      </div>


      <Footer />

    </>

  );
}


export default CourseDetails;