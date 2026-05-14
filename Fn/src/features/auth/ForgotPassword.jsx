import React, { useState, useEffect } from 'react';
import { useForgotPasswordMutation, useVerifyResetOTPMutation } from '../../services/authAPI';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  
  const [forgotPassword, { isLoading: isSending }] = useForgotPasswordMutation();
  const [verifyResetOTP, { isLoading: isVerifying }] = useVerifyResetOTPMutation();
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await forgotPassword({ email }).unwrap();
      setMessage(response.msg || 'OTP has been sent to your email.');
      setStep(2);
      setTimer(60);
    } catch (err) {
      setError(err.data?.msg || 'Something went wrong');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setMessage('');
    setError('');
    try {
      const response = await forgotPassword({ email }).unwrap();
      setMessage(response.msg || 'A new OTP has been sent to your email.');
      setTimer(60);
    } catch (err) {
      setError(err.data?.msg || 'Failed to resend OTP');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (otp.length !== 6) {
      return setError('Please enter a valid 6-digit OTP');
    }
    
    try {
      await verifyResetOTP({ email, otp }).unwrap();
      // On success, navigate to reset password page with the OTP as the token
      navigate(`/reset-password/${otp}`);
    } catch (err) {
      setError(err.data?.msg || 'Invalid or expired OTP');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Forgot Password</h2>
              
              {message && <div className="alert alert-success">{message}</div>}
              {error && <div className="alert alert-danger">{error}</div>}

              {step === 1 ? (
                <>
                  <p className="text-center text-muted mb-4">
                    Enter your email address and we'll send you an OTP to reset your password.
                  </p>
                  <form onSubmit={handleEmailSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 mb-3" disabled={isSending}>
                      {isSending ? 'Sending...' : 'Send OTP'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <p className="text-center text-muted mb-4">
                    Enter the 6-digit OTP sent to <strong>{email}</strong>
                  </p>
                  <form onSubmit={handleOtpSubmit}>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control text-center"
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 mb-2" disabled={isVerifying}>
                      {isVerifying ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    
                    <div className="text-center mb-3">
                      <button 
                        type="button"
                        className="btn btn-link text-decoration-none small"
                        onClick={handleResend}
                        disabled={isSending || timer > 0}
                      >
                        {isSending 
                          ? 'Sending...' 
                          : timer > 0 
                          ? `Resend OTP in ${timer}s` 
                          : "Didn't receive code? Resend OTP"}
                      </button>
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-outline-secondary w-100 text-decoration-none"
                      onClick={() => {
                        setStep(1);
                        setTimer(0);
                      }}
                    >
                      Back to Email
                    </button>
                  </form>
                </>
              )}

              <div className="text-center mt-3">
                <Link to="/login" className="text-decoration-none">Back to Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
