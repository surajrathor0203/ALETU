import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import StudentSidebar from '../components/StudentSidebar'; // Replace Sidebar import
import CustomAppBar from '../components/CustomAppBar';
import axios from 'axios';
import { getAuthFromCookies } from '../utils/cookies';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Add drawer width constant
const drawerWidth = 240;

// Add Main styled component
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    width: `calc(100% - ${drawerWidth}px)`,
    overflow: 'auto'
  }),
);

const SessionRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    email: '',
    class: '',
    chapter: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const authData = getAuthFromCookies();
    
    if (authData) {
      setFormData(prev => ({
        ...prev,
        studentName: `${authData.firstName} ${authData.lastName}` || '',
        studentId: authData.username || '', // Using username as customId (studentrsss001)
        email: authData.email || ''
      }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Store in Firebase
      const sessionRequestRef = collection(db, 'sessionRequests');
      const sessionData = {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      // Save to Firebase first
      await addDoc(sessionRequestRef, sessionData);

      // Try API call, but don't block on failure
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/sessions/request`,
          formData,
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true
          }
        );
      } catch (apiError) {
        console.warn('API call failed, but Firebase storage succeeded:', apiError);
        // Continue execution since Firebase storage was successful
      }

      // Show success and redirect
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/student'), 2000);
      
    } catch (err) {
      setError('Failed to submit request. Please try again later.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#F5F7FA', minHeight: '100vh' }}>
      <StudentSidebar />
      <Main>
        <CustomAppBar />
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Request a Session
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                margin="normal"
                label="Student Name"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                disabled
              />
              <TextField
                fullWidth
                margin="normal"
                label="Student ID"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                disabled
              />
              <TextField
                fullWidth
                margin="normal"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
              />
              <TextField
                fullWidth
                required
                margin="normal"
                label="Class"
                name="class"
                value={formData.class}
                onChange={handleChange}
                select
              >
                <MenuItem value="Class 6">Class 6</MenuItem>
                <MenuItem value="Class 7">Class 7</MenuItem>
                <MenuItem value="Class 8">Class 8</MenuItem>
              </TextField>
              <TextField
                fullWidth
                required
                margin="normal"
                label="Chapter"
                name="chapter"
                value={formData.chapter}
                onChange={handleChange}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
              >
                Submit Request
              </Button>
            </Box>
          </Paper>
          <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
            <Alert severity="error">{error}</Alert>
          </Snackbar>
          <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
            <Alert severity="success">Session request submitted successfully!</Alert>
          </Snackbar>
        </Container>
      </Main>
    </Box>
  );
};

export default SessionRequest;