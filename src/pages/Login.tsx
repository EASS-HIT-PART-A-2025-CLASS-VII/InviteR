import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginContainer = styled(Box)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF69B4 0%, #FFD700 100%);
`;

const LoginForm = styled(Paper)`
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const OTPInput = styled(TextField)`
  & input {
    text-align: center;
    letter-spacing: 0.5rem;
    font-size: 1.5rem;
  }
`;

const LoginButton = styled(Button)`
  margin-top: 1rem;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  background-color: #FF69B4;
  color: white;
  &:hover {
    background-color: #ff4da6;
  }
`;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyOTP } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return cleaned;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      await login(cleanPhoneNumber);
      localStorage.setItem('phoneNumber', cleanPhoneNumber);
      setStep('otp');
    } catch (err) {
      setError('שגיאה בשליחת קוד האימות. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verifyOTP(phoneNumber, otp);
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from);
    } catch (err) {
      setError('קוד האימות שגוי. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <Container maxWidth="sm">
        <LoginForm elevation={3}>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            התחברות
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit}>
              <TextField
                fullWidth
                label="מספר טלפון"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="050-000-0000"
                required
                sx={{ mb: 2 }}
                variant="outlined"
              />
              <LoginButton
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || phoneNumber.replace(/\D/g, '').length !== 10}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'שלח קוד אימות'}
              </LoginButton>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit}>
              <Typography variant="body1" gutterBottom color="textSecondary">
                קוד האימות נשלח למספר {phoneNumber}
              </Typography>
              <OTPInput
                fullWidth
                label="קוד אימות"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                sx={{ mb: 2 }}
                variant="outlined"
              />
              <LoginButton
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || otp.length !== 6}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'אימות'}
              </LoginButton>
              <Button
                variant="text"
                fullWidth
                onClick={() => setStep('phone')}
                sx={{ mt: 1 }}
              >
                חזרה להזנת מספר טלפון
              </Button>
            </form>
          )}
        </LoginForm>
      </Container>
    </LoginContainer>
  );
};

export default Login; 