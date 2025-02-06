import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Paper,
  Typography,
  styled
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import moment from 'moment'; // Add this import
import Sidebar from '../components/Sidebar';
import CustomAppBar from '../components/CustomAppBar';

// Styled components
const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0, // Changed from drawerWidth to 0
    width: `calc(100% - ${drawerWidth}px)`, // Add this line
    overflow: 'auto' // Add this line
  }),
);

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  textTransform: 'none',
}));

const CalendarEvent = styled(Paper)(({ theme, variant }) => ({
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: variant === 'zoom' ? '#E3F2FD' : '#000000',
  color: variant === 'zoom' ? '#1976D2' : '#FFFFFF',
}));

const TeacherDashboard = () => {
  const [currentWeek] = useState('02 - 08 Jan');
  // Remove unused currentMonth state

  // Add analytics state
  const [analyticsData] = useState({
    totalSessions: 24,
    analytics: {
      successRate: 86,
      aboveAverage: 72,
      failures: 14
    },
    monthlyStats: [
      { month: 'Aug', sessions: 15 },
      { month: 'Sep', sessions: 18 },
      { month: 'Oct', sessions: 22 },
      { month: 'Nov', sessions: 20 },
      { month: 'Dec', sessions: 24 }
    ]
  });

  // Add new state for selected filter
  const [selectedFilter, setSelectedFilter] = useState('All Course');
  
  // Add filter options
  const filterOptions = [
    'All Course',
    'One by One',
    'Webinar',
    'Personal Coaching',
    'Workshop'
  ];

  // Filter data based on selection (you can modify this based on your data structure)
  const getFilteredData = (filter) => {
    switch(filter) {
      case 'One by One':
        return weekDays.map(day => ({
          ...day,
          events: day.events.filter(event => event.title.includes('one'))
        }));
      case 'Webinar':
        return weekDays.map(day => ({
          ...day,
          events: day.events.filter(event => event.platform === 'Zoom')
        }));
      // Add other cases as needed
      default:
        return weekDays;
    }
  };

  const weekDays = [
    {
      day: 'Mon',
      date: '02',
      events: [
        { title: 'Teacher class schedule', time: '10:44 am', attendees: 3 },
        { title: 'Some Schedule', time: '10:44 am', attendees: 2 },
        { title: 'One on one Session', time: '10:44 am', attendees: 2 }
      ]
    },
    { day: 'Tues', date: '03', events: [] },
    { day: 'Wed', date: '04', events: [] },
    { day: 'Thu', date: '05', events: [] },
    {
      day: 'Fri',
      date: '06',
      events: [
        { title: 'Meeting students', time: '10:44 am', platform: 'Zoom' }
      ]
    },
    { day: 'Sat', date: '07', events: [] }
  ];

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = currentDate.clone().startOf('month').day();
    const daysInMonth = currentDate.daysInMonth();
    const calendar = [];

    let date = 1;
    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          week.push(null);
        } else if (date > daysInMonth) {
          week.push(null);
        } else {
          week.push(date);
          date++;
        }
      }
      calendar.push(week);
      if (date > daysInMonth) break;
    }
    return calendar;
  };

  // Add new state for calendar
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment());

  // Update calendar navigation functions
  const handlePrevMonth = () => {
    setCurrentDate(prev => prev.clone().subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => prev.clone().add(1, 'month'));
  };

  // Add date selection handler
  const handleDateSelect = (day) => {
    if (day) {
      const newDate = currentDate.clone().date(day);
      setSelectedDate(newDate);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh', // Add this line
    bgcolor: '#f5f5f5'
    }}>
      <Sidebar />
      <Main>
        <CustomAppBar />
        
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Teacher's Calendar
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography color="textSecondary">
              {currentWeek}
            </Typography>
            <Box>
              <IconButton size="small">
                <ChevronLeftIcon />
              </IconButton>
              <IconButton size="small">
                <ChevronRightIcon />
              </IconButton>
            </Box>
            <Typography color="textSecondary" variant="body2">
              (GMT +06:00) nairobi Time
            </Typography>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ display: 'flex', gap: 3 }}>
            
          {/* Left Side - Calendar Grid */}
          <Card sx={{ flex: 1, maxWidth: 800 }}>
            <CardContent>
              <Grid container spacing={3}>
                {getFilteredData(selectedFilter).map((day, index) => (
                  <Grid item xs={2} key={index}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography color="textSecondary" gutterBottom>
                        {day.day}
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        {day.date}
                      </Typography>
                      {day.events.map((event, eventIndex) => (
                        <CalendarEvent
                          key={eventIndex}
                          variant={event.platform?.toLowerCase()}
                        >
                          <Typography variant="body2">
                            {event.title}
                          </Typography>
                          <Typography variant="caption">
                            {event.time}
                            {event.attendees && (
                              <span style={{ marginLeft: 8 }}>
                                {Array(event.attendees).fill('●').join(' ')}
                              </span>
                            )}
                          </Typography>
                          {event.platform && (
                            <Typography variant="caption" display="block">
                              {event.platform}
                            </Typography>
                          )}
                        </CalendarEvent>
                      ))}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Right Side - Mini Calendar */}
          <Card sx={{ width: 300, height: 'fit-content' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {currentDate.format('MMMM YYYY')}
                </Typography>
                <Box>
                  <IconButton size="small" onClick={handlePrevMonth}>
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton size="small" onClick={handleNextMonth}>
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <Typography key={day} align="center" color="text.secondary" sx={{ py: 0.5 }}>
                    {day}
                  </Typography>
                ))}
                {generateCalendarDays().flat().map((day, i) => {
                  const isSelected = day && currentDate.clone().date(day).isSame(selectedDate, 'day');
                  const isToday = day && currentDate.clone().date(day).isSame(moment(), 'day');
                  
                  return (
                    <Button
                      key={i}
                      disabled={!day}
                      onClick={() => handleDateSelect(day)}
                      sx={{
                        minWidth: 0,
                        p: 0.5,
                        borderRadius: '50%',
                        color: day ? (isSelected ? 'white' : isToday ? 'primary.main' : 'inherit') : 'transparent',
                        bgcolor: isSelected ? 'primary.main' : 'transparent',
                        '&:hover': {
                          bgcolor: isSelected ? 'primary.dark' : 'action.hover'
                        }
                      }}
                    >
                      {day || '-'}
                    </Button>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Bottom Section */}
        <Container maxWidth="lg">
          <Grid container spacing={12}>
            <Grid item xs={8}>
              {/* Course Type Filters */}
              <Box sx={{ mb: 4 }}>
                {filterOptions.map((filter) => (
                  <StyledButton
                    key={filter}
                    sx={{ mr: 1 }}
                    color={selectedFilter === filter ? 'inherit' : 'primary'}
                    // variant={selectedFilter === filter ? 'contained' : 'text'}
                    onClick={() => setSelectedFilter(filter)}
                  >
                    {filter}
                  </StyledButton>
                ))}
              </Box>

              {/* Action Cards */}
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Paper
                          sx={{
                            width: 64,
                            height: 64,
                            bgcolor: 'grey.100',
                          }}
                        />
                        <Box>
                          <Typography variant="h6">
                            Review AI generated Lessons
                          </Typography>
                          <Typography color="textSecondary">
                            Lesson Planner
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography>Pending : 3</Typography>
                        <StyledButton
                          variant="contained"
                          color="primary"
                        //   sx={{ bgcolor: 'primary.light', color: 'primary.main' }}
                        >
                          Review Now
                        </StyledButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Paper
                          sx={{
                            width: 64,
                            height: 64,
                            bgcolor: 'grey.100',
                          }}
                        />
                        <Box>
                          <Typography variant="h6">
                            One-on-one Sessions
                          </Typography>
                          <Typography color="textSecondary">
                            Schedule lessons
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <StyledButton variant="contained" color="primary">
                          Schedule!
                        </StyledButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Right side with Analytics */}
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Analytics Stats</Typography>
                    <Typography variant="body2" color="text.secondary">
                      From Aug-Dec, 2024
                    </Typography>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                      <Typography color="text.secondary" variant="body2">
                        Success Rate
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {analyticsData.analytics.successRate}%
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography color="text.secondary" variant="body2">
                        Above Average
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {analyticsData.analytics.aboveAverage}%
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography color="text.secondary" variant="body2">
                        Failures
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {analyticsData.analytics.failures}%
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ height: 200 }}>
                    {/* Monthly Sessions Bar Chart */}
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'flex-end', gap: 2 }}>
                      {analyticsData.monthlyStats.map((stat) => (
                        <Box key={stat.month} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: '100%',
                              bgcolor: 'primary.main',
                              height: `${(stat.sessions / 30) * 100}%`,
                              borderRadius: 1,
                              mb: 1
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {stat.month}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>



          </Grid>
        </Container>

      </Main>
    </Box>
  );
};

export default TeacherDashboard;