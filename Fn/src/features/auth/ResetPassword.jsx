import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useResetPasswordMutation } from '../../services/authAPI';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [resetPasswordFn, { isLoading }] = useResetPasswordMutation();
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('New password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Please confirm your password'),
  });

  const resetForm = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setMessage('');
      setError('');
      try {
        await resetPasswordFn({ token, password: values.password }).unwrap();
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } catch (err) {
        setError(err.data?.msg || 'Failed to reset password. OTP may be expired.');
      }
    },
  });

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow border-0 bg-dark text-light" style={{ borderRadius: '15px' }}>
            <div className="card-body p-4">
              <h2 className="text-center mb-4 text-info fw-bold">Set New Password</h2>
              
              {message && <div className="alert alert-success bg-success bg-opacity-25 text-success border-success">{message}</div>}
              {error && <div className="alert alert-danger bg-danger bg-opacity-25 text-danger border-danger">{error}</div>}

              <form onSubmit={resetForm.handleSubmit}>
                <div className="mb-3">
                  <label className="form-label text-light opacity-75 small uppercase fw-bold">New Password</label>
                  <input
                    type="password"
                    className={`form-control bg-dark bg-opacity-50 text-light shadow-none ${resetForm.touched.password && resetForm.errors.password ? 'border-danger' : 'border-secondary'}`}
                    placeholder="Enter new password"
                    {...resetForm.getFieldProps('password')}
                    style={{ borderRadius: '10px' }}
                  />
                  {resetForm.touched.password && resetForm.errors.password && (
                    <div className="text-danger small mt-1">{resetForm.errors.password}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label text-light opacity-75 small uppercase fw-bold">Confirm New Password</label>
                  <input
                    type="password"
                    className={`form-control bg-dark bg-opacity-50 text-light shadow-none ${resetForm.touched.confirmPassword && resetForm.errors.confirmPassword ? 'border-danger' : 'border-secondary'}`}
                    placeholder="Confirm new password"
                    {...resetForm.getFieldProps('confirmPassword')}
                    style={{ borderRadius: '10px' }}
                  />
                  {resetForm.touched.confirmPassword && resetForm.errors.confirmPassword && (
                    <div className="text-danger small mt-1">{resetForm.errors.confirmPassword}</div>
                  )}
                </div>
                <button 
                  type="submit" 
                  className="btn btn-info btn-lg w-100 shadow-sm text-dark fw-bold mt-3" 
                  style={{ borderRadius: '10px' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
