import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  TextField,
  InputAdornment,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { getAuthFromCookies } from '../utils/cookies';
import { logout } from '../services/auth.service';

const CustomAppBar = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const authData = getAuthFromCookies();
    if (authData) {
      const displayName = `${authData.firstName} ${authData.lastName}` || 'User';
      setUserName(displayName);
    }
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      setError('Logout failed. Please try again.');
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };

  return (
    <AppBar 
      position="static" 
      color="transparent" 
      elevation={0}
      sx={{ mb: 4, px: 2, py: 1 }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}>
        <TextField
          size="small"
          placeholder="Search"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                ⌘/
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton>
            <NotificationsIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography>{userName}</Typography>
            <IconButton onClick={handleMenuOpen}>
              <AccountCircleIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {error && (
        <Alert severity="error" sx={{ width: '100%', mt: 1 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
      )}
    </AppBar>
  );
};

export default CustomAppBar;