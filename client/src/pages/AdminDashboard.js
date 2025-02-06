import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Card,
  CardContent,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import { Edit, Trash2, Users, UserCheck, UserX, UserPlus, LogOut } from 'lucide-react';
import { collection, query, getDocs, deleteDoc, doc, addDoc, setDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { sendEmailWithCredentials } from '../services/email.service';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, students: 0, teachers: 0 });
  const [activeTab, setActiveTab] = useState(0); // 0 for Students, 1 for Teachers
  const [userId, setUserId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+91',
    userType: 'Teacher'
  });

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser?.uid) {
      setUserId(currentUser.uid);
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);
      const usersData = [];
      const statsData = { students: 0, teachers: 0 };

      querySnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        usersData.push(userData);
        if (userData.userType === 'Student') statsData.students++;
        if (userData.userType === 'Teacher') statsData.teachers++;
      });

      statsData.total = statsData.students + statsData.teachers;
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, "users", userId));
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const generateTeacherId = async () => {
    let counter = 1;
    let id = '';
    let isUnique = false;
    
    while (!isUnique) {
      id = `T${counter.toString().padStart(3, '0')}`;
      const q = query(collection(db, "users"), where("customId", "==", id));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        isUnique = true;
      } else {
        counter++;
        if (counter > 999) {
          throw new Error('No available teacher IDs');
        }
      }
    }
    return id;
  };

  const generateUniqueUsername = async (firstName, lastName, customId) => {
    const baseUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
    let username = `${baseUsername}${customId.toLowerCase()}`;
    
    // Check if username exists
    const q = query(collection(db, "users"), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        // If username exists, append a random number
        username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
    }
    
    return username;
  };

  const handleAddTeacher = async () => {
    try {
        if (!newTeacher.email || !newTeacher.firstName || !newTeacher.lastName || !newTeacher.phone) {
            throw { code: 'validation-error', message: 'Please fill in all required fields' };
        }

        const password = generatePassword();
        const currentUser = JSON.parse(localStorage.getItem('user'));
        let emailSent = false;
        
        const customId = await generateTeacherId();
        const username = await generateUniqueUsername(
            newTeacher.firstName,
            newTeacher.lastName,
            customId
        );

        // Create new teacher account using a secondary auth instance or admin SDK
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            newTeacher.email,
            password
        );

        // Store teacher data in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
            ...newTeacher,
            uid: userCredential.user.uid,
            email: newTeacher.email,
            username,
            customId,
            createdAt: new Date().toISOString()
        });

        try {
            await sendEmailWithCredentials({
                to: newTeacher.email,
                username: newTeacher.email,
                password: password,
                loginUrl: `${window.location.origin}/login`,
                name: `${newTeacher.firstName} ${newTeacher.lastName}`
            });
            emailSent = true;
        } catch (emailError) {
            console.error("Email sending failed:", emailError);
        }

        if (currentUser?.email && currentUser?.password) {
          await signInWithEmailAndPassword(auth, currentUser.email, currentUser.password);
      }

        setOpenDialog(false);
        setNewTeacher({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            countryCode: '+91',
            userType: 'Teacher'
        });
        fetchUsers();
        
        alert(emailSent 
            ? 'Teacher account created successfully!' 
            : 'Teacher account created successfully, but failed to send welcome email. Password: ' + password);

    } catch (error) {
      console.error("Error adding student:", error);
      let errorMessage = '';
      
      switch (error.code) {
          case 'auth/email-already-in-use':
              errorMessage = 'This email address is already registered.';
              break;
          case 'auth/invalid-email':
              errorMessage = 'Please enter a valid email address.';
              break;
          case 'validation-error':
              errorMessage = error.message;
              break;
          default:
              errorMessage = 'Failed to create student account. Please try again.';
      }
      
      alert(errorMessage);
  }
};

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const StatCard = ({ title, value, icon: Icon }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon size={24} />
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4">{value}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Admin Dashboard</Typography>
        <Button 
          variant="outlined" 
          onClick={handleLogout}
          startIcon={<LogOut />}
        >
          Logout
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard title="Total Users" value={stats.students + stats.teachers} icon={Users} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Students" value={stats.students} icon={UserCheck} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Teachers" value={stats.teachers} icon={UserX} />
        </Grid>
      </Grid>

      <Paper sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Students" />
          <Tab label="Teachers" />
        </Tabs>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<UserPlus />}
          onClick={() => setOpenDialog(true)}
        >
          Add Teacher
        </Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>User Type</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users
              .filter(user => {
                if (activeTab === 0) return user.userType === 'Student';
                if (activeTab === 1) return user.userType === 'Teacher';
                return false;
              })
              .map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.customId}</TableCell>
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.userType}</TableCell>
                  <TableCell>{`${user.countryCode} ${user.phone}`}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => navigate(`/admin/edit-user/${userId}/${user.id}`)}>
                      <Edit size={20} />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 size={20} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #eee',
          pb: 2,
          fontWeight: 'bold'
        }}>
          Add New Teacher
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2.5,
            py: 1
          }}>
            <TextField
              label="First Name"
              value={newTeacher.firstName}
              onChange={(e) => setNewTeacher(prev => ({ ...prev, firstName: e.target.value }))}
              fullWidth
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <TextField
              label="Last Name"
              value={newTeacher.lastName}
              onChange={(e) => setNewTeacher(prev => ({ ...prev, lastName: e.target.value }))}
              fullWidth
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <TextField
              label="Email"
              type="email"
              value={newTeacher.email}
              onChange={(e) => setNewTeacher(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ width: '30%' }}>
                <InputLabel>Code</InputLabel>
                <Select
                  value={newTeacher.countryCode}
                  label="Code"
                  onChange={(e) => setNewTeacher(prev => ({ ...prev, countryCode: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                >
                  <MenuItem value="+91">+91</MenuItem>
                  <MenuItem value="+1">+1</MenuItem>
                  <MenuItem value="+44">+44</MenuItem>
                </Select>
              </FormControl>
              <TextField
                sx={{ 
                  width: '70%',
                  '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                }}
                label="Phone Number"
                value={newTeacher.phone}
                onChange={(e) => setNewTeacher(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid #eee',
          pt: 2,
          px: 3,
          gap: 1
        }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddTeacher} 
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Add Teacher
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;