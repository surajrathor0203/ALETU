import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  Paper,
  Grid,
} from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SignUpForm = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [userType, setUserType] = React.useState('Student');
  const [countryCode, setCountryCode] = React.useState('+91');
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    try {
      setError('');
      setLoading(true);
      
      const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        countryCode: countryCode,
        userType: userType
      };

      await signup(formData.get('email'), formData.get('password'), userData);
      navigate('/login');
    } catch (error) {
      setError('Failed to create an account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: 8,
          borderRadius: 2,
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
          Sign in to your Account
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Id"
            name="email"
            autoComplete="email"
            sx={{ mb: 2 }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                <InputLabel>Country Code</InputLabel>
                <Select
                  value={countryCode}
                  label="Country Code"
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  <MenuItem value="+91">+91 (IN)</MenuItem>
                  <MenuItem value="+1">+1 (US)</MenuItem>
                  <MenuItem value="+44">+44 (UK)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={8}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="phone"
                label="Telephone Number"
                type="tel"
                id="phone"
                autoComplete="tel"
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>

          <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
            <InputLabel>Select</InputLabel>
            <Select
              value={userType}
              label="Select"
              onChange={(e) => setUserType(e.target.value)}
            >
              <MenuItem value="Student">Student</MenuItem>
              <MenuItem value="Teacher">Teacher</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </Select>
          </FormControl>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 2,
              mb: 3,
              py: 1.5,
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
            }}
            disabled={loading}
          >
            Sign Up!
          </Button>

          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Do not have an account?{' '}
              <Button
                href="/login"
                variant="text"
                sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
              >
                Login here!
              </Button>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SignUpForm;