import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});


// =====================================================
// 1. Add JWT token to every request
// =====================================================
api.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// =====================================================
// 2. Global response interceptor
//    CR-005: Global Session Expiry Handling
// =====================================================

let isRedirectingToLogin = false;

api.interceptors.response.use(

  // Successful response
  (response) => {
    return response;
  },


  // Error response
  (error) => {

    // Get the HTTP status code
    const status = error.response?.status;

    // Get the requested URL
    const requestUrl = error.config?.url || "";


    // -------------------------------------------------
    // Only handle HTTP 401 Unauthorized responses
    // -------------------------------------------------
    if (status === 401) {

      // Do NOT handle the login request here.
      // A failed login should remain a normal login error.
      const isLoginRequest =
        requestUrl.includes("/auth/login");


      if (!isLoginRequest && !isRedirectingToLogin) {

        isRedirectingToLogin = true;


        // ---------------------------------------------
        // Clear authentication information
        // ---------------------------------------------
        localStorage.removeItem("token");
        localStorage.removeItem("user");


        // ---------------------------------------------
        // Preserve the current page
        // ---------------------------------------------
        const currentPath =
          window.location.pathname +
          window.location.search +
          window.location.hash;


        // ---------------------------------------------
        // Redirect to Login
        // ---------------------------------------------
        const loginUrl =
          `/login?sessionExpired=true&from=${encodeURIComponent(
            currentPath
          )}`;


        window.location.href = loginUrl;
      }
    }


    // -------------------------------------------------
    // HTTP 403
    // Do NOT clear authentication or redirect.
    // -------------------------------------------------
    if (status === 403) {

      // The request is rejected because of permissions/
      // role, not because the session has expired.

      // Authentication information remains stored.
    }


    // -------------------------------------------------
    // Network errors
    // error.response is undefined.
    //
    // Therefore, nothing is removed and the user
    // remains logged in.
    // -------------------------------------------------

    return Promise.reject(error);
  }
);


export default api;

