import { useFormik } from "formik";
import React, { useState } from "react";
import * as Yup from "yup";
import { useLoginMutation } from "../../services/authAPI";
import { useDispatch } from "react-redux";
import { updateUser } from "./userSlice";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [loginFn, { isLoading }] = useLoginMutation();
  const [serverError, setServerError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    username: Yup.string()
      .trim()
      .required("Username is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const loginForm = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema,
    onSubmit: (values) => {
      setServerError("");
      loginFn(values).unwrap()
        .then((userData) => {
          if (userData?.msg === "loginsuccess") {
            // Check if user is verified
            if (!userData.isVerified) {
              navigate("/verify-otp", { state: { email: userData.email } });
              return;
            }

            dispatch(updateUser(userData));
            window.localStorage.setItem("user", JSON.stringify(userData));
            
            // Check if user has selected genre preferences
            if (!userData.preferences?.genres || userData.preferences.genres.length === 0) {
              navigate("/interests");
            } else {
              navigate("/");
            }
          } else {
            setServerError("Login failed! Please check your credentials.");
          }
        })
        .catch((err) => {
          setServerError(err.data?.msg || "Login failed! Please check your credentials.");
        });
    },
  });

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <div
        className="card shadow-lg border-secondary bg-dark text-light w-100"
        style={{ maxWidth: "400px", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="card-body p-5">
          <h2 className="text-center mb-2 fw-bold text-info">User Login</h2>
          <p className="text-center text-secondary mb-4 small">
            Please enter your details
          </p>

          {serverError && (
            <div className="alert alert-danger bg-danger bg-opacity-10 border-danger text-danger text-center mb-4 small py-2" style={{ borderRadius: "10px" }}>
              {serverError}
            </div>
          )}

          <form onSubmit={loginForm.handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-light opacity-75 small uppercase fw-bold">Username</label>
              <input
                type="text"
                className={`form-control form-control-lg bg-dark bg-opacity-50 text-light shadow-none ${loginForm.touched.username && loginForm.errors.username ? 'border-danger' : 'border-secondary'}`}
                placeholder="Enter username"
                {...loginForm.getFieldProps("username")}
                style={{ borderRadius: "10px", border: `1px solid ${loginForm.touched.username && loginForm.errors.username ? '#dc3545' : 'rgba(255,255,255,0.2)'}` }}
              />
              {loginForm.touched.username && loginForm.errors.username && (
                <div className="text-danger small mt-1">{loginForm.errors.username}</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label text-light opacity-75 small uppercase fw-bold">Password</label>
              <input
                type="password"
                className={`form-control form-control-lg bg-dark bg-opacity-50 text-light shadow-none ${loginForm.touched.password && loginForm.errors.password ? 'border-danger' : 'border-secondary'}`}
                placeholder="Enter password"
                {...loginForm.getFieldProps("password")}
                style={{ borderRadius: "10px", border: `1px solid ${loginForm.touched.password && loginForm.errors.password ? '#dc3545' : 'rgba(255,255,255,0.2)'}` }}
              />
              {loginForm.touched.password && loginForm.errors.password && (
                <div className="text-danger small mt-1">{loginForm.errors.password}</div>
              )}
            </div>

            <div className="mb-4 text-end">
              <Link to="/forgot-password" size="sm" className="text-info text-decoration-none small">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-info btn-lg w-100 shadow-sm text-dark fw-bold d-flex align-items-center justify-content-center"
              style={{ borderRadius: "10px", minHeight: "48px" }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-secondary mb-0">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-info text-decoration-none fw-bold"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
