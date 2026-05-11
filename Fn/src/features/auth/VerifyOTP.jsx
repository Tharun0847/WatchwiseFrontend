import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVerifyOTPMutation, useResendOTPMutation, useChangeEmailMutation } from '../../services/authAPI';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const [currentEmail, setCurrentEmail] = useState(location.state?.email);

  const [verifyOTP, { isLoading }] = useVerifyOTPMutation();
  const [resendOTP, { isLoading: isResending }] = useResendOTPMutation();
  const [changeEmail, { isLoading: isChanging }] = useChangeEmailMutation();

  if (!currentEmail) {
    return <div className="container mt-5 text-center">Invalid access. Please register first.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await verifyOTP({ email: currentEmail, otp }).unwrap();
      setMessage('Email verified successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.data?.msg || 'Verification failed');
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      await resendOTP({ email: currentEmail }).unwrap();
      setMessage('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err.data?.msg || 'Failed to resend OTP');
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await changeEmail({ oldEmail: currentEmail, newEmail }).unwrap();
      setCurrentEmail(newEmail);
      setIsEditingEmail(false);
      setMessage('Email updated! A new OTP has been sent to ' + newEmail);
    } catch (err) {
      setError(err.data?.msg || 'Failed to update email');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Verify Your Email</h2>
              
              {!isEditingEmail ? (
                <>
                  <p className="text-center text-muted">
                    We've sent a 6-digit code to <strong>{currentEmail}</strong>
                    <button 
                      className="btn btn-sm btn-link text-decoration-none ms-2"
                      onClick={() => {
                        setIsEditingEmail(true);
                        setNewEmail(currentEmail);
                      }}
                    >
                      (Change)
                    </button>
                  </p>
                  
                  {error && <div className="alert alert-danger">{error}</div>}
                  {message && <div className="alert alert-success">{message}</div>}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control form-control-lg text-center"
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 btn-lg mb-3" disabled={isLoading}>
                      {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                  </form>
                  
                  <div className="text-center">
                    <button 
                      className="btn btn-link text-decoration-none" 
                      onClick={handleResend} 
                      disabled={isResending}
                    >
                      {isResending ? 'Sending...' : "Didn't receive code? Resend OTP"}
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleChangeEmail}>
                  <p className="text-center text-muted">Enter your correct email address below:</p>
                  <div className="mb-3">
                    <input
                      type="email"
                      className="form-control"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-info w-100 mb-2" disabled={isChanging}>
                    {isChanging ? 'Updating...' : 'Update Email & Send New OTP'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-link w-100 text-decoration-none"
                    onClick={() => setIsEditingEmail(false)}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
