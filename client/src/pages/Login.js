import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import Cookies from 'js-cookie';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const storeLoginHistory = async (userId, email) => {
    try {
      const db = getFirestore();
      const timestamp = new Date().toISOString();
      
      // Store login history
      await addDoc(collection(db, 'loginHistory'), {
        userId,
        email,
        timestamp,
        userAgent: navigator.userAgent,
        loginTime: Date.now()
      });

      // Update user's last login
      await setDoc(doc(db, 'users', userId), {
        lastLogin: timestamp
      }, { merge: true });

    } catch (error) {
      console.error('Error storing login history:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      setError('');
      setLoading(true);
      const { user } = await login(formData.get('email'), formData.get('password'));
      
      // Store login history
      await storeLoginHistory(user.uid, formData.get('email'));
      
      if (rememberMe) {
        Cookies.set('rememberMe', formData.get('email'), { expires: 30 });
      } else {
        Cookies.remove('rememberMe');
      }
      
      // Navigate based on user type
      if (!user || !user.userType) {
        setError('Invalid user data');
        return;
      }

      const userType = user.userType.toLowerCase();
      switch (userType) {
        case 'student':
          navigate(`/dashboard/student/${user.uid}`);
          break;
        case 'teacher':
          navigate(`/dashboard/teacher/${user.uid}`);
          break;
        case 'admin':
          navigate(`/dashboard/admin/${user.uid}`);
          break;
        default:
          setError('Invalid user type');
          navigate('/');
      }
    } catch (error) {
      setError('Failed to login: ' + error.message);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const rememberedEmail = Cookies.get('rememberMe');
    if (rememberedEmail) {
      const form = document.querySelector('form');
      if (form) {
        form.email.value = rememberedEmail;
        setRememberMe(true);
      }
    }
  }, []);

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 2 }}>
        <Typography component="h1" variant="h4" sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center' }}>
          Login
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
              />
            }
            label="Remember me"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            Login
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/signup')}
          >
            Don't have an account? Sign Up
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;