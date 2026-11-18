import { useEffect, useState } from "react";

import api from "../services/api";
import { getUser, updateStoredUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const emptyPasswordFields = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function Profile() {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState(getUser()?.full_name || "");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileFieldError, setProfileFieldError] = useState("");
  const [passwordFields, setPasswordFields] = useState(emptyPasswordFields);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/users/me");
        setProfile(response.data.user);
        setFullName(response.data.user.full_name);
      } catch (error) {
        setProfileError(
          error.response?.data?.message || "Unable to load your profile."
        );
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileFieldError("");
    setProfileSaving(true);

    try {
      const response = await api.put("/users/me", {
        full_name: fullName,
      });
      setProfile(response.data.user);
      setFullName(response.data.user.full_name);
      updateStoredUser({
        ...getUser(),
        full_name: response.data.user.full_name,
      });
      setProfileSuccess(response.data.message);
    } catch (error) {
      setProfileError(
        error.response?.data?.message || "Unable to update your profile."
      );
      setProfileFieldError(
        error.response?.data?.errors?.full_name ||
          error.response?.data?.errors?.username ||
          error.response?.data?.errors?.role ||
          ""
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    setPasswordErrors({});
    setPasswordSaving(true);

    try {
      const response = await api.put("/users/me/password", passwordFields);
      setPasswordFields(emptyPasswordFields);
      setPasswordSuccess(response.data.message);
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || "Unable to change your password."
      );
      setPasswordErrors(error.response?.data?.errors || {});
    } finally {
      setPasswordSaving(false);
    }
  };

  const updatePasswordField = (field, value) => {
    setPasswordFields((current) => ({ ...current, [field]: value }));
    setPasswordErrors((current) => ({ ...current, [field]: "" }));
  };

  return (
    <>
      <Navbar />
      <main className="container">
        <div className="page-header">
          <div>
            <h1>My Profile</h1>
            <p className="page-subtitle">
              View and update your account information.
            </p>
          </div>
        </div>

        {profileLoading && <p className="loading">Loading your profile...</p>}
        {profileError && <p className="error">{profileError}</p>}

        {profile && (
          <>
            <section className="section-card">
              <div className="section-card-header">
                <h2>Profile Information</h2>
              </div>

              <dl className="profile-information">
                <div>
                  <dt>User ID</dt>
                  <dd>{profile.id}</dd>
                </div>
                <div>
                  <dt>Username</dt>
                  <dd>{profile.username}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{profile.role}</dd>
                </div>
              </dl>
            </section>

            <section className="section-card">
              <div className="section-card-header">
                <h2>Change Full Name</h2>
              </div>

              {profileSuccess && <p className="success">{profileSuccess}</p>}
              <form className="profile-form" onSubmit={saveProfile} noValidate>
                <div className="form-group">
                  <label htmlFor="profile-full-name">Full name</label>
                  <input
                    id="profile-full-name"
                    type="text"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setProfileFieldError("");
                      setProfileError("");
                      setProfileSuccess("");
                    }}
                    minLength={3}
                    maxLength={100}
                    autoComplete="name"
                    disabled={profileSaving}
                    aria-invalid={Boolean(profileFieldError)}
                    aria-describedby={
                      profileFieldError ? "profile-name-error" : undefined
                    }
                  />
                  {profileFieldError && (
                    <span
                      className="field-error"
                      id="profile-name-error"
                      role="alert"
                    >
                      {profileFieldError}
                    </span>
                  )}
                  {profileError && !profileFieldError && (
                    <span className="field-error" role="alert">
                      {profileError}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={profileSaving || profileLoading}
                >
                  {profileSaving ? "Saving..." : "Save Full Name"}
                </button>
              </form>
            </section>

            <section className="section-card">
              <div className="section-card-header">
                <h2>Change Password</h2>
              </div>

              {passwordSuccess && (
                <p className="success">{passwordSuccess}</p>
              )}
              {passwordError && <p className="error">{passwordError}</p>}

              <form
                className="profile-form"
                onSubmit={changePassword}
                noValidate
              >
                {[
                  {
                    field: "currentPassword",
                    label: "Current password",
                    autoComplete: "current-password",
                  },
                  {
                    field: "newPassword",
                    label: "New password",
                    autoComplete: "new-password",
                  },
                  {
                    field: "confirmPassword",
                    label: "Confirm new password",
                    autoComplete: "new-password",
                  },
                ].map(({ field, label, autoComplete }) => (
                  <div className="form-group" key={field}>
                    <label htmlFor={`profile-${field}`}>{label}</label>
                    <input
                      id={`profile-${field}`}
                      type="password"
                      value={passwordFields[field]}
                      onChange={(event) =>
                        updatePasswordField(field, event.target.value)
                      }
                      autoComplete={autoComplete}
                      disabled={passwordSaving}
                      aria-invalid={Boolean(passwordErrors[field])}
                      aria-describedby={
                        passwordErrors[field]
                          ? `profile-${field}-error`
                          : undefined
                      }
                    />
                    {passwordErrors[field] && (
                      <span
                        className="field-error"
                        id={`profile-${field}-error`}
                        role="alert"
                      >
                        {passwordErrors[field]}
                      </span>
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? "Changing..." : "Change Password"}
                </button>
              </form>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

export default Profile;
