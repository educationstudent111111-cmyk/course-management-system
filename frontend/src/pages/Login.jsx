import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSearch, FaSignInAlt } from "react-icons/fa";

import api from "../services/api";
import { saveAuth } from "../services/auth";
import Navbar from "../components/Navbar";


function Login() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();


  // =====================================================
  // CR-005: Read session expiry information from URL
  // =====================================================

  const searchParams = new URLSearchParams(location.search);

  const sessionExpired =
    searchParams.get("sessionExpired") === "true";

  const fromUrl =
    searchParams.get("from");


  // =====================================================
  // Preserve existing React Router redirect
  // =====================================================

  const redirectFromState =
    location.state?.from;


  // Use URL "from" first, then existing router state
  const redirectTo =
    fromUrl || redirectFromState;


  // =====================================================
  // Login submit
  // =====================================================

  const handleSubmit = async (event) => {

    // Stop the browser from reloading the whole page
    event.preventDefault();

    setError("");


    // -----------------------------------------------------
    // Simple client-side validation
    // -----------------------------------------------------

    if (!username.trim() || !password) {

      setError(
        "Please enter both username and password."
      );

      return;
    }


    setLoading(true);


    try {

      // ---------------------------------------------------
      // Send login request
      // ---------------------------------------------------

      const response = await api.post("/auth/login", {
        username,
        password,
      });


      // ---------------------------------------------------
      // Save the new JWT and user information
      // ---------------------------------------------------

      saveAuth(
        response.data.token,
        response.data.user
      );


      // ---------------------------------------------------
      // Get user role
      // ---------------------------------------------------

      const role =
        response.data.user.role;


      // ---------------------------------------------------
      // Return to the originally requested page
      // ---------------------------------------------------

      if (
        redirectTo &&
        !redirectTo.startsWith("/login")
      ) {

        navigate(redirectTo);

      }

      // ---------------------------------------------------
      // Normal Admin login
      // ---------------------------------------------------

      else if (role === "admin") {

        navigate("/admin");

      }

      // ---------------------------------------------------
      // Normal Student login
      // ---------------------------------------------------

      else {

        navigate("/student");

      }

    } catch (error) {

      // ---------------------------------------------------
      // Server returned an HTTP error
      // ---------------------------------------------------

      if (error.response) {

        // -------------------------------------------------
        // CR-005: Failed login credentials
        //
        // A 401 from /auth/login must NOT trigger the
        // session-expired redirect.
        // -------------------------------------------------

        if (error.response.status === 401) {

          setError(
            "Invalid username or password"
          );

        }

        // -------------------------------------------------
        // Other server errors
        // -------------------------------------------------

        else {

          setError(
            error.response.data?.message ||
            `Login failed (status ${error.response.status})`
          );

        }

      }

      // ---------------------------------------------------
      // Network error
      // ---------------------------------------------------

      else {

        setError(
          "Cannot reach the server. Please check that the backend is running on http://localhost:3000"
        );

      }

    } finally {

      // Always stop loading
      setLoading(false);

    }

  };


  // =====================================================
  // Page UI
  // =====================================================

  return (

    <>

      <Navbar />


      <div className="login-container">

        <h1>Login</h1>


        <p className="login-subtitle">
          Sign in to enroll in courses.
        </p>


        {/* =================================================
            CR-005: Session Expired Message
            ================================================= */}

        {sessionExpired && (

          <p className="error">

            Your session has expired. Please log in again.

          </p>

        )}


        <form onSubmit={handleSubmit}>

          {/* =================================================
              Username
              ================================================= */}

          <div className="form-group">

            <label htmlFor="username">
              Username
            </label>


            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter username"
              autoComplete="username"
              disabled={loading}
            />

          </div>


          {/* =================================================
              Password
              ================================================= */}

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>


            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loading}
            />

          </div>


          {/* =================================================
              Login Error
              ================================================= */}

          {error && (

            <p className="error">
              {error}
            </p>

          )}


          {/* =================================================
              Login Button
              ================================================= */}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >

            <FaSignInAlt />

            {loading
              ? "Logging in..."
              : "Login"
            }

          </button>

        </form>


        {/* =================================================
            Browse Courses
            ================================================= */}

        <p className="login-footer">

          Not sure where to go?{" "}

          <Link to="/courses">

            <FaSearch /> Browse the courses

          </Link>{" "}

          first.

        </p>

      </div>

    </>

  );

}


export default Login;
