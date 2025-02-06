import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Button,
  List,
  ListItem,
  Checkbox
} from '@mui/material';
import { styled } from '@mui/material/styles';
import StudentSidebar from '../components/StudentSidebar';
import CustomAppBar from '../components/CustomAppBar';

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

const StyledProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: '#E3F2FD',
  '& .MuiLinearProgress-bar': {
    borderRadius: 4
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  textTransform: 'none',
  padding: '8px 16px'
}));

const StudentDashboard = () => {
  const [courses] = useState([
    { name: 'Chemistry', progress: 80, status: 'Finish' },
    { name: 'Biology', progress: 60, status: 'Finish' },
    { name: 'Physics', progress: 0, status: 'Start' }
  ]);

  const todoList = [
    { title: 'Assignment 1.', date: 'Tomorrow', status: 'Finish' },
    { title: 'Tests and quizzes', date: '13th Jan,2025', status: 'Finish' },
    { title: 'Course Completion', date: '10th Jan,2025', status: 'Start' }
  ];

  return (
    <Box sx={{ display: 'flex', bgcolor: '#F5F7FA', minHeight: '100vh' }}>
      <StudentSidebar />
      <Main>
        <CustomAppBar />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Course Progress
                </Typography>
                <Box sx={{ mt: 3 }}>
                  {courses.map((course, index) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1">{course.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {course.progress}% done
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <StyledProgressBar
                          variant="determinate"
                          value={course.progress}
                          sx={{ flex: 1 }}
                        />
                        <ActionButton
                          variant="contained"
                          color="primary"
                          size="small"
                        >
                          {course.status}
                        </ActionButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  To do List
                </Typography>
                <List>
                  {todoList.map((item, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        px: 0
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox />
                        <Box>
                          <Typography variant="body1">{item.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.date}
                          </Typography>
                        </Box>
                      </Box>
                      <ActionButton
                        variant="contained"
                        color="primary"
                        size="small"
                      >
                        {item.status}
                      </ActionButton>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Main>
    </Box>
  );
};

export default StudentDashboard;