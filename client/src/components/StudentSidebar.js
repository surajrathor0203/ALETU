
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Paper,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as CourseIcon,
  PlayCircle as LearningIcon,
  VideoCall as SessionIcon,
  Help as SupportIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const StudentSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: DashboardIcon, path: '/dashboard/student' },
    { text: 'Courses', icon: CourseIcon, path: '/courses' },
    { text: 'Start Learning', icon: LearningIcon, path: '/chatInterface/${userId}' },
    { text: 'Request Session', icon: SessionIcon, path: '/request-session/${userId}' },
    { text: 'Support', icon: SupportIcon, path: '/support' },
    { text: 'Chat', icon: ChatIcon, path: '/chat' },
  ];

  return (
    <Paper
      elevation={1}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        bgcolor: 'white',
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Paper
          sx={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 1,
          }}
        >
          A
        </Paper>
        <Typography variant="subtitle1" fontWeight="bold">
          ALETU Programme
        </Typography>
      </Box>

      <Typography sx={{ px: 2, py: 1, color: 'text.secondary' }} variant="body2">
        STUDENT MENU
      </Typography>

      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              transition: 'all 0.3s ease',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
              '& .MuiListItemIcon-root': {
                transition: 'color 0.3s ease',
                color: location.pathname === item.path ? 'white' : 'action.active',
              },
            }}
          >
            <ListItemIcon>
              <item.icon />
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default StudentSidebar;