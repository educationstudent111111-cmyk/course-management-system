const TOKEN_KEY = "token";
const USER_KEY = "user";


// =====================================================
// Save token + user after successful login
// =====================================================
export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}


// =====================================================
// Read the stored authentication token
// =====================================================
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}


// =====================================================
// Read the logged-in user
// =====================================================
export function getUser() {

  const userJson = localStorage.getItem(USER_KEY);

  if (!userJson) {
    return null;
  }

  try {

    return JSON.parse(userJson);

  } catch (error) {

    // If stored user data is invalid,
    // treat the user as logged out.
    console.error(
      "Could not read user from localStorage:",
      error.message
    );

    return null;
  }
}


// =====================================================
// Clear authentication data
// Used during logout and session expiry
// =====================================================
export function clearAuth() {

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}


// =====================================================
// Check whether the user is currently logged in
// =====================================================
export function isLoggedIn() {

  return Boolean(
    getToken() &&
    getUser()
  );
}


// =====================================================
// Get the current user's role
// =====================================================
export function getUserRole() {

  const user = getUser();

  return user
    ? user.role
    : null;
}


// =====================================================
// Check whether the current user is an Admin
// =====================================================
export function isAdmin() {

  return getUserRole() === "admin";
}


// =====================================================
// Check whether the current user is a Student
// =====================================================
export function isStudent() {

  return getUserRole() === "student";
}

