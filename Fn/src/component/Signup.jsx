import { useFormik } from "formik";
import React from "react";
import { useSignupMutation } from "../services/authAPI";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  var [signupFn] = useSignupMutation();
  var navigate = useNavigate();

  var signupForm = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: (values) => {
      signupFn(values).then(() => {
        navigate("/login");
      });
    },
  });

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "85vh" }}
    >
      <div
        className="card shadow-lg border-secondary bg-dark text-light"
        style={{ width: "450px", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="card-body p-5">
          <h2 className="text-center mb-2 fw-bold text-info">Sign Up</h2>
          <p className="text-center text-secondary mb-4 small">
            Join us to discover what to watch next effortlessly
          </p>

          <form onSubmit={signupForm.handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-light opacity-75 small uppercase fw-bold">Full Name</label>
              <input
                type="text"
                className="form-control form-control-lg bg-dark bg-opacity-50 text-light border-secondary shadow-none"
                placeholder="Enter your name"
                {...signupForm.getFieldProps("name")}
                style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)" }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-light opacity-75 small uppercase fw-bold">Email Address</label>
              <input
                type="email"
                className="form-control form-control-lg bg-dark bg-opacity-50 text-light border-secondary shadow-none"
                placeholder="name@example.com"
                {...signupForm.getFieldProps("email")}
                style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)" }}
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-light opacity-75 small uppercase fw-bold">Password</label>
              <input
                type="password"
                className="form-control form-control-lg bg-dark bg-opacity-50 text-light border-secondary shadow-none"
                placeholder="Create a password"
                {...signupForm.getFieldProps("password")}
                style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)" }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-info btn-lg w-100 shadow-sm text-dark fw-bold"
              style={{ borderRadius: "10px" }}
            >
              Sign Up
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
