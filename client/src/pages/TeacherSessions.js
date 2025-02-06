import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,  // Added this import
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Grid,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { GOOGLE_API_CONFIG } from '../config/googleConfig';
import { initializeGoogleApi } from '../utils/googleApi';
import Sidebar from '../components/Sidebar';
import CustomAppBar from '../components/CustomAppBar';
import { styled } from '@mui/material/styles';

const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    padding: theme.spacing(2),
    minWidth: 400,
  }
}));

const TeacherSessions = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [scheduledDate, setScheduledDate] = useState(moment());
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDay, setSelectedDay] = useState(moment().date());

  useEffect(() => {
    const setup = async () => {
      try {
        await initializeGoogleApi();
        setGapiLoaded(true);
      } catch (error) {
        console.error('Failed to initialize Google API:', error);
      }
    };
    
    setup();

    // Listen to pending requests
    const pendingRequestsQuery = query(
      collection(db, 'sessionRequests'),
      where('status', '==', 'pending')
    );

    const scheduledSessionsQuery = query(
      collection(db, 'sessionRequests'),
      where('status', '==', 'scheduled')
    );

    const unsubscribePending = onSnapshot(pendingRequestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      setPendingRequests(requests);
    });

    const unsubscribeScheduled = onSnapshot(scheduledSessionsQuery, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      setScheduledSessions(sessions);
    });

    return () => {
      unsubscribePending();
      unsubscribeScheduled();
    };
  }, []);

  const ensureGoogleAuth = async () => {
    if (!gapiLoaded) {
      throw new Error('Google API not initialized');
    }

    const authInstance = window.gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      await authInstance.signIn();
    }
  };

  const createGoogleMeet = async (scheduledDate, studentName, classInfo, chapter) => {
    try {
      await ensureGoogleAuth();

      const event = {
        summary: `Tutorial Session: ${studentName} - ${classInfo} - ${chapter}`,
        description: `Tutorial session for ${studentName} on ${chapter}`,
        start: {
          dateTime: scheduledDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: scheduledDate.clone().add(1, 'hour').toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        conferenceData: {
          createRequest: { requestId: `session-${Date.now()}` }
        }
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: GOOGLE_API_CONFIG.calendarId,
        conferenceDataVersion: 1,
        resource: event
      });

      return response.result.conferenceData?.entryPoints?.[0]?.uri || null;
    } catch (error) {
      console.error('Error creating Google Meet:', error);
      return null;
    }
  };

  const handleScheduleSession = async () => {
    try {
      const meetingLink = await createGoogleMeet(
        scheduledDate, 
        selectedRequest.studentName,
        selectedRequest.class,
        selectedRequest.chapter
      );

      const sessionRef = doc(db, 'sessionRequests', selectedRequest._id);
      await updateDoc(sessionRef, {
        status: 'scheduled',
        scheduledDate: scheduledDate.toDate(),
        meetingLink: meetingLink,
        updatedAt: new Date()
      });
      setScheduleDialogOpen(false);
    } catch (error) {
      console.error('Error scheduling session:', error);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, 'month'));
  };

  const getDaysInMonth = () => {
    const daysInMonth = currentDate.daysInMonth();
    const firstDayOfMonth = currentDate.clone().startOf('month').day();
    const days = [];

    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <CustomAppBar />
        
        <Grid container spacing={3}>
          {/* Left side - Sessions */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Session Request Log
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Student Id</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Chapter Lesson</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request._id}>
                        <TableCell>{request.studentName}</TableCell>
                        <TableCell>{request.studentId || '#S0112'}</TableCell>
                        <TableCell>{request.class}</TableCell>
                        <TableCell>{request.chapter}</TableCell>
                        <TableCell>
                          <Button
                            color="primary"
                            onClick={() => {
                              setSelectedRequest(request);
                              setScheduleDialogOpen(true);
                            }}
                          >
                            Schedule
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Scheduled Sessions
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Student Id</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Chapter Lesson</TableCell>
                      <TableCell>Scheduled Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scheduledSessions.map((session) => (
                      <TableRow key={session._id}>
                        <TableCell>{session.studentName}</TableCell>
                        <TableCell>{session.studentId || '#S0112'}</TableCell>
                        <TableCell>{session.class}</TableCell>
                        <TableCell>{session.chapter}</TableCell>
                        <TableCell>
                          {moment(session.scheduledDate?.toDate()).format('Do MMM,YYYY')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Right side - Calendar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography color="text.secondary">
                  {currentDate.format('MMMM YYYY')}
                </Typography>
                <Box>
                  <IconButton size="small" onClick={handlePreviousMonth}>
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton size="small" onClick={handleNextMonth}>
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {days.map((day) => (
                  <Typography
                    key={day}
                    align="center"
                    color="text.secondary"
                    sx={{ py: 1 }}
                  >
                    {day}
                  </Typography>
                ))}
                {getDaysInMonth().map((day, index) => (
                  <Button
                    key={index}
                    variant={day === selectedDay && currentDate.month() === moment().month() ? 'contained' : 'text'}
                    disabled={!day}
                    sx={{
                      minWidth: 0,
                      p: 1,
                      borderRadius: '50%',
                      color: day === selectedDay && currentDate.month() === moment().month() ? 'white' : 'inherit',
                      visibility: day ? 'visible' : 'hidden'
                    }}
                    onClick={() => setSelectedDay(day)}
                  >
                    {day}
                  </Button>
                ))}
              </Box>

              <Button
                variant="contained"
                fullWidth
                startIcon={<AddIcon />}
                sx={{ mt: 4 }}
              >
                Generate Lesson plans
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Schedule Dialog */}
      <StyledDialog 
        open={scheduleDialogOpen} 
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          pb: 2,
          '& .MuiTypography-root': {
            fontSize: '1.5rem',
            fontWeight: 600
          }
        }}>
          Schedule New Session
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedRequest && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                Session Details
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography color="text.secondary">Student Name</Typography>
                  <Typography fontWeight={500}>{selectedRequest.studentName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="text.secondary">Class</Typography>
                  <Typography fontWeight={500}>{selectedRequest.class}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography color="text.secondary">Chapter</Typography>
                  <Typography fontWeight={500}>{selectedRequest.chapter}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DateTimePicker
              label="Select Date & Time"
              value={scheduledDate}
              onChange={setScheduledDate}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  sx: { mb: 2 }
                }
              }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2, 
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            onClick={() => setScheduleDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleScheduleSession} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            Schedule Session
          </Button>
        </DialogActions>
      </StyledDialog>
    </Box>
  );
};

export default TeacherSessions;