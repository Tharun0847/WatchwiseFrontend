import { useFormik } from "formik";
import React from "react";
import { useLoginMutation } from "../../services/authAPI";
import { useDispatch } from "react-redux";
import { updateUser } from "./userSlice";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  var [loginFn] = useLoginMutation();
  var dispatch = useDispatch();
  var navigate = useNavigate();

  const loginForm = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    onSubmit: (values) => {
      loginFn(values).then((res) => {
        if (res.data?.msg === "loginsuccess") {
          const userData = res.data;
          dispatch(updateUser(userData));
          window.localStorage.setItem("user", JSON.stringify(userData));
          window.localStorage.setItem("token", userData.token);
          
          // Check if user has selected genre preferences
          if (!userData.preferences?.genres || userData.preferences.genres.length === 0) {
            navigate("/interests");
          } else {
            navigate("/");
          }
        } else {
          alert("Login failed! Please check your credentials.");
        }
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

          <form onSubmit={loginForm.handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-light opacity-75 small uppercase fw-bold">Username</label>
              <input
                type="text"
                className="form-control form-control-lg bg-dark bg-opacity-50 text-light border-secondary shadow-none"
                placeholder="Enter username"
                {...loginForm.getFieldProps("username")}
                style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)" }}
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-light opacity-75 small uppercase fw-bold">Password</label>
              <input
                type="password"
                className="form-control form-control-lg bg-dark bg-opacity-50 text-light border-secondary shadow-none"
                placeholder="Enter password"
                {...loginForm.getFieldProps("password")}
                style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)" }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-info btn-lg w-100 shadow-sm text-dark fw-bold"
              style={{ borderRadius: "10px" }}
            >
              Sign In
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
