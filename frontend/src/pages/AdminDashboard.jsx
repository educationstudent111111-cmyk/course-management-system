import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaChartBar,
  FaClipboardList,
  FaSearch,
  FaUsers,
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function AdminDashboard() {
  const [report, setReport] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [reportError, setReportError] = useState("");
  const [enrollmentsError, setEnrollmentsError] = useState("");

  const user = getUser();

  useEffect(() => {
    const loadDashboard = async () => {
      const [reportResult, enrollmentsResult] = await Promise.allSettled([
        api.get("/reports/overview"),
        api.get("/enrollments"),
      ]);

      if (reportResult.status === "fulfilled") {
        setReport(reportResult.value.data.report);
      } else {
        setReportError(
          reportResult.reason.response?.data?.message ||
            "Failed to load the reporting overview."
        );
      }
      setReportLoading(false);

      if (enrollmentsResult.status === "fulfilled") {
        setEnrollments(enrollmentsResult.value.data.enrollments || []);
      } else {
        setEnrollmentsError(
          enrollmentsResult.reason.response?.data?.message ||
            "Failed to load recent enrollments."
        );
      }
      setEnrollmentsLoading(false);
    };

    loadDashboard();
  }, []);

  const recentEnrollments = enrollments.slice(0, 6);
  const categoryBreakdown = report?.enrollmentsByCategory || [];
  const maxCategoryEnrollments = Math.max(
    0,
    ...categoryBreakdown.map((item) => item.enrollmentCount)
  );

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  const reportValue = (value) => {
    if (reportLoading) return "...";
    if (reportError || value === undefined || value === null) return "—";
    return value;
  };

  return (
    <>
      <Navbar />

      <div className="container">
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {user?.full_name || user?.username}. Here is an
              overview of the system.
            </p>
          </div>

          <Link to="/admin/courses" className="btn btn-primary">
            <FaChartBar />
            Manage Courses
          </Link>
        </div>

        {reportError && <p className="error">{reportError}</p>}

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(report?.totalCourses)}
            </span>
            <span className="dashboard-card-label">Total Courses</span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(report?.totalStudents)}
            </span>
            <span className="dashboard-card-label">Total Students</span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(report?.totalEnrollments)}
            </span>
            <span className="dashboard-card-label">Approved Enrollments</span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(report?.pendingEnrollments)}
            </span>
            <span className="dashboard-card-label">Pending Requests</span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(report?.studentsWithEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Students with Enrollments
            </span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(report?.enrollmentsLast30Days)}
            </span>
            <span className="dashboard-card-label">
              Enrollments in the Last 30 Days
            </span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportValue(report?.coursesWithoutEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Courses Without Enrollments
            </span>
          </div>
        </div>

        <div className="report-grid">
          <section className="section-card">
            <div className="section-card-header">
              <h2>Enrollments by Category</h2>
            </div>

            {reportLoading && <p className="loading">Loading...</p>}
            {!reportLoading && !reportError && categoryBreakdown.length === 0 && (
              <p className="empty">No course categories are available.</p>
            )}
            {!reportLoading && !reportError && categoryBreakdown.length > 0 && (
              <div className="category-breakdown">
                {categoryBreakdown.map((item) => (
                  <div className="category-row" key={item.category}>
                    <div className="category-label">
                      <span>{item.category}</span>
                      <strong>{item.enrollmentCount}</strong>
                    </div>
                    <div
                      className="category-bar-track"
                      role="img"
                      aria-label={`${item.category}: ${item.enrollmentCount} enrollments`}
                    >
                      <span
                        className="category-bar"
                        style={{
                          width:
                            maxCategoryEnrollments === 0
                              ? "0%"
                              : `${(item.enrollmentCount / maxCategoryEnrollments) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="section-card">
            <div className="section-card-header">
              <h2>Top Five Courses</h2>
            </div>

            {reportLoading && <p className="loading">Loading...</p>}
            {!reportLoading &&
              !reportError &&
              (report?.topCourses || []).length === 0 && (
                <p className="empty">No course enrollments are available.</p>
              )}
            {!reportLoading &&
              !reportError &&
              (report?.topCourses || []).length > 0 && (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Category</th>
                        <th>Enrollments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.topCourses.map((course) => (
                        <tr key={course.courseId}>
                          <td>{course.title}</td>
                          <td>{course.category}</td>
                          <td>{course.enrollmentCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </section>
        </div>

        <section className="section-card">
          <div className="section-card-header">
            <h2>Recent Enrollments</h2>
            <Link to="/admin/enrollments" className="link-inline">
              Manage enrollments
            </Link>
          </div>

          {enrollmentsError && <p className="error">{enrollmentsError}</p>}
          {enrollmentsLoading && <p className="loading">Loading...</p>}
          {!enrollmentsLoading && !enrollmentsError && recentEnrollments.length === 0 && (
            <p className="empty">No enrollments have been made yet.</p>
          )}
          {!enrollmentsLoading &&
            !enrollmentsError &&
            recentEnrollments.length > 0 && (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Username</th>
                      <th>Course</th>
                      <th>Category</th>
                      <th>Level</th>
                      <th>Enrolled On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEnrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td>{enrollment.full_name}</td>
                        <td>{enrollment.username}</td>
                        <td>{enrollment.title}</td>
                        <td>{enrollment.category}</td>
                        <td>
                          <span className="tag tag-level">
                            {enrollment.level}
                          </span>
                        </td>
                        <td>{formatDate(enrollment.enrolled_at)}</td>
                        <td>
                          <span className={`tag enrollment-status ${enrollment.status}`}>
                            {enrollment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        <section className="section-card">
          <div className="section-card-header">
            <h2>Administration</h2>
          </div>

          <div className="quick-actions">
            <Link to="/admin/courses" className="quick-action">
              <span className="quick-action-icon"><FaBook /></span>
              <span>Add, edit and delete courses</span>
            </Link>
            <Link to="/admin/enrollments" className="quick-action">
              <span className="quick-action-icon"><FaUsers /></span>
              <span>View and remove enrollments</span>
            </Link>
            <Link to="/admin/audit-logs" className="quick-action">
              <span className="quick-action-icon"><FaClipboardList /></span>
              <span>Review administrative audit logs</span>
            </Link>
            <Link to="/courses" className="quick-action">
              <span className="quick-action-icon"><FaSearch /></span>
              <span>See the public course list</span>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default AdminDashboard;
