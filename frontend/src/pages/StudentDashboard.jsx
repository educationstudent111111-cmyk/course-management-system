import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaEye,
  FaGraduationCap,
  FaSearch,
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function StudentDashboard() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();

  useEffect(() => {
    const loadReport = async () => {
      try {
        const response = await api.get("/reports/my");
        setReport(response.data.report);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Failed to load your learning report."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  const recentEnrollments = report?.recentEnrollments || [];
  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };
  const reportValue = (value) => {
    if (loading) return "...";
    if (error || value === undefined || value === null) return "—";
    return value;
  };

  return (
    <>
      <Navbar />

      <div className="container">
        <div className="page-header">
          <div>
            <h1>Student Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {user?.full_name || user?.username}!
            </p>
          </div>

          <Link to="/courses" className="btn btn-primary">
            <FaSearch />
            Browse Courses
          </Link>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(report?.enrolledCourses)}
            </span>
            <span className="dashboard-card-label">Approved Courses</span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(report?.pendingRequests)}
            </span>
            <span className="dashboard-card-label">Pending Requests</span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(
                report?.totalEnrollmentValue === undefined
                  ? undefined
                  : `Rs. ${Number(report.totalEnrollmentValue).toFixed(2)}`
              )}
            </span>
            <span className="dashboard-card-label">
              Total Enrollment Value
            </span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(report?.distinctCategories)}
            </span>
            <span className="dashboard-card-label">Distinct Categories</span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(formatDate(report?.earliestEnrollment))}
            </span>
            <span className="dashboard-card-label">First Enrollment</span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(formatDate(report?.latestEnrollment))}
            </span>
            <span className="dashboard-card-label">Latest Enrollment</span>
          </div>
        </div>

        <section className="section-card">
          <div className="section-card-header">
            <h2>My Recent Enrollments</h2>
            <Link to="/my-enrollments" className="link-inline">
              <FaEye />
              View all
            </Link>
          </div>

          {loading && <p className="loading">Loading...</p>}
          {!loading && !error && recentEnrollments.length === 0 && (
            <p className="empty">
              You have not enrolled in any courses yet. Head over to the courses
              page and enroll in your first course.
            </p>
          )}
          {!loading && !error && recentEnrollments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Requested On</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.enrollmentId}>
                      <td>
                        <Link to={`/courses/${enrollment.courseId}`}>
                          {enrollment.title}
                        </Link>
                      </td>
                      <td>{enrollment.category}</td>
                      <td>{enrollment.level}</td>
                      <td>
                        <span className={`tag enrollment-status ${enrollment.status}`}>
                          {enrollment.status}
                        </span>
                        {enrollment.status === "rejected" &&
                          enrollment.decisionNote && (
                            <div className="decision-note">
                              {enrollment.decisionNote}
                            </div>
                          )}
                      </td>
                      <td>{formatDate(enrollment.enrolledAt)}</td>
                      <td>{formatDate(enrollment.reviewedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="section-card-header">
            <h2>Quick Actions</h2>
          </div>

          <div className="quick-actions">
            <Link to="/courses" className="quick-action">
              <span className="quick-action-icon"><FaBook /></span>
              <span>Browse all courses</span>
            </Link>
            <Link to="/my-enrollments" className="quick-action">
              <span className="quick-action-icon"><FaGraduationCap /></span>
              <span>View my enrollments</span>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default StudentDashboard;
