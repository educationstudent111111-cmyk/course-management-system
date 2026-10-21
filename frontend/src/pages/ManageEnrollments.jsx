// import { useEffect, useState } from "react";
// import { FaTrash } from "react-icons/fa";

// import api from "../services/api";
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";


// function ManageEnrollments() {

//   // Course list - used to fill the "filter by course" dropdown
//   const [courses, setCourses] = useState([]);

//   // "" means "show every enrollment"
//   const [selectedCourseId, setSelectedCourseId] = useState("");

//   // The enrollments currently shown in the table
//   const [enrollments, setEnrollments] = useState([]);

//   // When one course is selected the backend also returns the course
//   const [selectedCourse, setSelectedCourse] = useState(null);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // Changing this number tells the effect below to reload the table.
//   // We use it after a delete so the table shows fresh data.
//   const [reloadKey, setReloadKey] = useState(0);


//   // ---------- Load the course dropdown options (once) ----------
//   useEffect(() => {

//     const loadCourseOptions = async () => {

//       try {

//         const response = await api.get("/courses");

//         setCourses(response.data.courses);

//       } catch (error) {

//         // The dropdown is optional, so a failure here is not fatal.
//         console.error("Could not load course options:", error.message);

//       }
//     };

//     loadCourseOptions();

//   }, []);


//   // ---------- Load the enrollment table ----------
  
//   useEffect(() => {

//     const loadEnrollments = async () => {

//       setLoading(true);
//       setError("");

//       try {

//         if (selectedCourseId === "") {

//           // ---- All enrollments ----
//           const response = await api.get("/enrollments");

//           setEnrollments(response.data.enrollments);
//           setSelectedCourse(null);

//         } else {

//           // ---- Students enrolled in one course ----
//           const response = await api.get(
//             `/enrollments/course/${selectedCourseId}`
//           );

//           setEnrollments(response.data.enrollments);
//           setSelectedCourse(response.data.course);

//         }

//       } catch (error) {

//         setError(
//           error.response?.data?.message ||
//           "Failed to load enrollments"
//         );

//         setEnrollments([]);

//       } finally {

//         setLoading(false);

//       }
//     };

//     loadEnrollments();

//   }, [selectedCourseId, reloadKey]);


//   // ---------- Delete an enrollment ----------
//   const handleDelete = async (enrollment) => {

//     const confirmed = window.confirm(
//       `Remove ${enrollment.full_name || enrollment.username}${
//         enrollment.title ? ` from "${enrollment.title}"` : ""
//       }?`
//     );

//     if (!confirmed) {
//       return;
//     }

//     setError("");
//     setSuccess("");

//     try {

//       const response = await api.delete(`/enrollments/${enrollment.id}`);

//       setSuccess(response.data.message);

//       // Ask the effect above to reload the table
//       setReloadKey(reloadKey + 1);

//     } catch (error) {

//       setError(
//         error.response?.data?.message ||
//         "Could not delete the enrollment."
//       );

//     }
//   };


//   const formatDate = (value) => {
//     if (!value) return "-";

//     return new Date(value).toLocaleDateString();
//   };


//   return (

//     <>
//       <Navbar />

//       <div className="container">

//         <div className="page-header">

//           <div>
//             <h1>Manage Enrollments</h1>

//             <p className="page-subtitle">
//               See who is enrolled in what, and remove enrollments when
//               needed.
//             </p>
//           </div>

//         </div>


//         {/* ---------- Filter by course ---------- */}

//         <div className="filter-bar">

//           <div className="form-group">

//             <label htmlFor="courseFilter">
//               Show enrollments for
//             </label>

//             <select
//               id="courseFilter"
//               className="input"
//               value={selectedCourseId}
//               onChange={(event) => {
//                 setSuccess("");
//                 setSelectedCourseId(event.target.value);
//               }}
//             >
//               <option value="">All courses</option>

//               {courses.map((course) => (
//                 <option key={course.id} value={course.id}>
//                   {course.title}
//                 </option>
//               ))}

//             </select>

//           </div>

//         </div>


//         {/* ---------- Messages ---------- */}

//         {success && <p className="success">{success}</p>}

//         {error && <p className="error">{error}</p>}


//         {/* ---------- Table ---------- */}

//         <section className="section-card">

//           <div className="section-card-header">

//             <h2>
//               {selectedCourse
//                 ? `Students enrolled in "${selectedCourse.title}"`
//                 : "All Enrollments"}
//               {!loading && ` (${enrollments.length})`}
//             </h2>

//           </div>


//           {loading && <p className="loading">Loading enrollments...</p>}


//           {!loading && enrollments.length === 0 && (
//             <p className="empty">
//               {selectedCourseId === ""
//                 ? "No enrollments have been made yet."
//                 : "No students are enrolled in this course yet."}
//             </p>
//           )}


//           {!loading && enrollments.length > 0 && (
//             <div className="table-wrapper">

//               <table className="table">

//                 <thead>

//                   {selectedCourseId === "" ? (

//                     /* ---------- All enrollments ---------- */
//                     <tr>
//                       <th>Student</th>
//                       <th>Username</th>
//                       <th>Course</th>
//                       <th>Category</th>
//                       <th>Level</th>
//                       <th>Enrolled On</th>
//                       <th className="table-actions-column">Actions</th>
//                     </tr>

//                   ) : (

//                     /* ---------- One course ---------- */
//                     <tr>
//                       <th>Student</th>
//                       <th>Username</th>
//                       <th>Enrolled On</th>
//                       <th className="table-actions-column">Actions</th>
//                     </tr>

//                   )}

//                 </thead>


//                 <tbody>

//                   {enrollments.map((enrollment) => (

//                     <tr key={enrollment.id}>

//                       <td>{enrollment.full_name}</td>

//                       <td>{enrollment.username}</td>


//                       {/* These columns only exist in "all courses" mode */}
//                       {selectedCourseId === "" && (
//                         <>
//                           <td>{enrollment.title}</td>
//                           <td>{enrollment.category}</td>
//                           <td>
//                             <span className="tag tag-level">
//                               {enrollment.level}
//                             </span>
//                           </td>
//                         </>
//                       )}


//                       <td>{formatDate(enrollment.enrolled_at)}</td>


//                       <td>
//                         <button
//                           type="button"
//                           className="btn btn-small btn-danger"
//                           onClick={() => handleDelete(enrollment)}
//                         >
//                           <FaTrash />
//                           Remove
//                         </button>
//                       </td>

//                     </tr>

//                   ))}

//                 </tbody>

//               </table>

//             </div>
//           )}

//         </section>

//       </div>

//       <Footer />

//     </>
//   );
// }

// export default ManageEnrollments;



import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function ManageEnrollments() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("enrolled_at");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const selectedCourse = courses.find(
    (course) => String(course.id) === selectedCourseId
  );

  // Load course dropdown options.
  useEffect(() => {
    let cancelled = false;

    const loadCourses = async () => {
      try {
        const response = await api.get("/courses");

        if (!cancelled) {
          setCourses(response.data.courses || []);
        }
      } catch (err) {
        console.error(
          "Could not load course options:",
          err.message
        );
      }
    };

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, []);

  // CR-008: Server-side search, filtering, sorting and pagination.
  useEffect(() => {
    let cancelled = false;

    const loadEnrollments = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/enrollments", {
          params: {
            q,
            courseId: selectedCourseId,
            from,
            to,
            sort,
            order,
            page,
            limit,
          },
        });

        if (cancelled) return;

        setEnrollments(response.data.enrollments || []);

        setPagination(
          response.data.pagination || {
            page,
            limit,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        if (cancelled) return;

        setError(
          err.response?.data?.message ||
            "Failed to load enrollments"
        );

        setEnrollments([]);

        setPagination({
          page,
          limit,
          total: 0,
          totalPages: 0,
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEnrollments();

    return () => {
      cancelled = true;
    };
  }, [
    q,
    selectedCourseId,
    from,
    to,
    sort,
    order,
    page,
    limit,
    reloadKey,
  ]);

  // Reset to page 1 whenever a filter changes.
  const changeFilter = (setter, value) => {
    setSuccess("");
    setPage(1);
    setter(value);
  };

  // Delete an enrollment and refresh the table.
  const handleDelete = async (enrollment) => {
    const confirmed = window.confirm(
      `Remove ${
        enrollment.full_name || enrollment.username
      }${
        enrollment.title
          ? ` from "${enrollment.title}"`
          : ""
      }?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await api.delete(
        `/enrollments/${enrollment.id}`
      );

      setSuccess(response.data.message);

      // If the deleted row was the only row on this page,
      // go back one page instead of showing an empty last page.
      if (enrollments.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        setReloadKey((key) => key + 1);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete the enrollment."
      );
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString();
  };

  const total = pagination.total;
  const totalPages = pagination.totalPages;

  const start =
    total === 0 ? 0 : (page - 1) * limit + 1;

  const end = Math.min(page * limit, total);

  return (
    <>
      <Navbar />

      <div className="container">
        <div className="page-header">
          <div>
            <h1>Manage Enrollments</h1>

            <p className="page-subtitle">
              Search, filter, sort and manage student enrollments.
            </p>
          </div>
        </div>

        {/* CR-008: Search and filters */}
        <div className="filter-bar">
          <div className="form-group">
            <label htmlFor="enrollmentSearch">
              Search student
            </label>

            <input
              id="enrollmentSearch"
              className="input"
              type="search"
              placeholder="Search name or username"
              value={q}
              onChange={(event) =>
                changeFilter(setQ, event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="courseFilter">
              Filter by course
            </label>

            <select
              id="courseFilter"
              className="input"
              value={selectedCourseId}
              onChange={(event) =>
                changeFilter(
                  setSelectedCourseId,
                  event.target.value
                )
              }
            >
              <option value="">All courses</option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fromDate">From date</label>

            <input
              id="fromDate"
              className="input"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) =>
                changeFilter(setFrom, event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="toDate">To date</label>

            <input
              id="toDate"
              className="input"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) =>
                changeFilter(setTo, event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="sortFilter">Sort by</label>

            <select
              id="sortFilter"
              className="input"
              value={sort}
              onChange={(event) =>
                changeFilter(setSort, event.target.value)
              }
            >
              <option value="enrolled_at">Enrollment date</option>
              <option value="student">Student name</option>
              <option value="course">Course name</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="orderFilter">Order</label>

            <select
              id="orderFilter"
              className="input"
              value={order}
              onChange={(event) =>
                changeFilter(setOrder, event.target.value)
              }
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pageSize">Rows per page</label>

            <select
              id="pageSize"
              className="input"
              value={limit}
              onChange={(event) => {
                setPage(1);
                setLimit(Number(event.target.value));
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="form-group">
            <label>Reset filters</label>

            <button
              type="button"
              className="btn"
              onClick={() => {
                setQ("");
                setSelectedCourseId("");
                setFrom("");
                setTo("");
                setSort("enrolled_at");
                setOrder("desc");
                setLimit(20);
                setPage(1);
                setSuccess("");
                setError("");
              }}
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Messages */}
        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}

        {/* Enrollment table */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>
              {selectedCourse
                ? `Students enrolled in "${selectedCourse.title}"`
                : "All Enrollments"}
            </h2>

            {!loading && (
              <p>
                Showing {start}–{end} of {total}
              </p>
            )}
          </div>

          {loading && (
            <p className="loading">Loading enrollments...</p>
          )}

          {!loading && enrollments.length === 0 && (
            <p className="empty">
              No matching enrollments found.
            </p>
          )}

          {!loading && enrollments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Username</th>

                    {!selectedCourseId && (
                      <>
                        <th>Course</th>
                        <th>Category</th>
                        <th>Level</th>
                      </>
                    )}

                    <th>Enrolled On</th>
                    <th className="table-actions-column">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>
                        {enrollment.full_name || "-"}
                      </td>

                      <td>{enrollment.username || "-"}</td>

                      {!selectedCourseId && (
                        <>
                          <td>{enrollment.title || "-"}</td>
                          <td>{enrollment.category || "-"}</td>
                          <td>
                            <span className="tag tag-level">
                              {enrollment.level || "-"}
                            </span>
                          </td>
                        </>
                      )}

                      <td>{formatDate(enrollment.enrolled_at)}</td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-small btn-danger"
                          onClick={() => handleDelete(enrollment)}
                        >
                          <FaTrash /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination controls */}
          {!loading && (
            <div className="pagination-controls">
              <button
                type="button"
                className="btn"
                disabled={page <= 1 || totalPages === 0}
                onClick={() => setPage(1)}
              >
                First
              </button>

              <button
                type="button"
                className="btn"
                disabled={page <= 1 || totalPages === 0}
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
              >
                Previous
              </button>

              <span>
                Page {totalPages === 0 ? 0 : page} of {totalPages}
              </span>

              <button
                type="button"
                className="btn"
                disabled={page >= totalPages || totalPages === 0}
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1)
                  )
                }
              >
                Next
              </button>

              <button
                type="button"
                className="btn"
                disabled={page >= totalPages || totalPages === 0}
                onClick={() => setPage(totalPages)}
              >
                Last
              </button>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}

export default ManageEnrollments;
