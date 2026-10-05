import { Navigate, useLocation } from "react-router-dom";

import { getUser, getToken } from "../services/auth";


function ProtectedRoute({ children, role }) {

  const location = useLocation();

  const token = getToken();
  const user = getUser();


  // =====================================================
  // 1. User is not logged in
  // =====================================================

  if (!token || !user) {

    return (
      <Navigate
        to="/login"
        state={{
          from:
            location.pathname +
            location.search +
            location.hash
        }}
        replace
      />
    );

  }


  // =====================================================
  // 2. User is logged in but has the wrong role
  // =====================================================

  if (role && user.role !== role) {

    // Do NOT clear authentication data.
    //
    // The user has a valid session but does not have
    // permission to access this page.
    //
    // This is an authorization problem, not a
    // session-expiry problem.


    return (
      <div className="access-denied-container">

        <h2>Access Denied</h2>

        <p>
          Access denied. You do not have permission
          to access this page.
        </p>

      </div>
    );

  }


  // =====================================================
  // 3. User is authenticated and has the correct role
  // =====================================================

  return children;

}


export default ProtectedRoute;

