import { useFormik } from "formik";
import React, { useState } from "react";
import * as Yup from "yup";
import { useSignupMutation } from "../../services/authAPI";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  var [signupFn, { isLoading }] = useSignupMutation();
  var [serverError, setServerError] = useState("");
  var [usernameError, setUsernameError] = useState("");
  var navigate = useNavigate();

  // Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Full name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email address is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  var signupForm = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setServerError("");
      setUsernameError("");
      try {
        await signupFn(values).unwrap();
        navigate("/verify-otp", { state: { email: values.email } });
      } catch (err) {
        const errorMsg = err.data?.msg || "An error occurred during signup";
        if (errorMsg.toLowerCase().includes("username")) {
          setUsernameError(errorMsg);
        } else {
          setServerError(errorMsg);
        }
      }
    },
  });

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "85vh" }}
    >
      <div
        className="card shadow-lg border-secondary bg-dark text-light w-100"
        style={{ maxWidth: "450px", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="card-body p-4 p-md-5">
          <h2 className="text-center mb-2 fw-bold text-info">Sign Up</h2>
          <p className="text-center text-secondary mb-4 small">
            Join us to discover what to watch next effortlessly
          </p>

          <form onSubmit={signupForm.handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-light opacity-75 small uppercase fw-bold">Full Name</label>
              <input
                type="text"
                className={`form-control form-control-lg bg-dark bg-opacity-50 text-light shadow-none ${ (signupForm.touched.name && signupForm.errors.name) || usernameError ? 'border-danger' : 'border-secondary'}`}
                placeholder="Enter your name"
                {...signupForm.getFieldProps("name")}
                style={{ borderRadius: "10px", border: `1px solid ${(signupForm.touched.name && signupForm.errors.name) || usernameError ? '#dc3545' : 'rgba(255,255,255,0.2)'}` }}
              />
              {signupForm.touched.name && signupForm.errors.name && (
                <div className="text-danger small mt-1">{signupForm.errors.name}</div>
              )}
              {usernameError && (
                <div className="text-danger small mt-1 fw-bold">
                  {usernameError}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label text-light opacity-75 small uppercase fw-bold">Email Address</label>
              <input
                type="email"
                className={`form-control form-control-lg bg-dark bg-opacity-50 text-light shadow-none ${ (signupForm.touched.email && signupForm.errors.email) || serverError ? 'border-danger' : 'border-secondary'}`}
                placeholder="name@example.com"
                {...signupForm.getFieldProps("email")}
                style={{ borderRadius: "10px", border: `1px solid ${(signupForm.touched.email && signupForm.errors.email) || serverError ? '#dc3545' : 'rgba(255,255,255,0.2)'}` }}
              />
              {signupForm.touched.email && signupForm.errors.email && (
                <div className="text-danger small mt-1">{signupForm.errors.email}</div>
              )}
              {serverError && (
                <div className="text-danger small mt-1 fw-bold">
                  {serverError}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label text-light opacity-75 small uppercase fw-bold">Password</label>
              <input
                type="password"
                className={`form-control form-control-lg bg-dark bg-opacity-50 text-light shadow-none ${signupForm.touched.password && signupForm.errors.password ? 'border-danger' : 'border-secondary'}`}
                placeholder="Create a password"
                {...signupForm.getFieldProps("password")}
                style={{ borderRadius: "10px", border: `1px solid ${signupForm.touched.password && signupForm.errors.password ? '#dc3545' : 'rgba(255,255,255,0.2)'}` }}
              />
              {signupForm.touched.password && signupForm.errors.password && (
                <div className="text-danger small mt-1">{signupForm.errors.password}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-info btn-lg w-100 shadow-sm text-dark fw-bold"
              style={{ borderRadius: "10px" }}
              disabled={isLoading}
            >
              {isLoading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-secondary mb-0">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-info text-decoration-none fw-bold"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
