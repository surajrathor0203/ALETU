import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CustomAppBar from '../components/CustomAppBar';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Checkbox,
  Chip,
  Button,
} from '@mui/material';
import { Edit as EditIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('My Courses');
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const q = query(collection(db, "users"), where("userType", "==", "Student"));
      const querySnapshot = await getDocs(q);
      const studentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: 'Active',
        academicStatus: ['Avg', 'Active', 'Fail', 'Distinction', 'Moderate'][Math.floor(Math.random() * 5)],
        lastQuizUpdate: Math.random() > 0.5 ? 'Completed' : 'Not Completed',
        recentLogin: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        })
      }));
      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': '#E5FBF3',
      'Not Active': '#F5F5F5',
    };
    return colors[status] || '#E5FBF3';
  };

  const getAcademicStatusColor = (status) => {
    const colors = {
      'Avg': '#F59E0B',
      'Active': '#F59E0B',
      'Fail': '#6B7280',
      'Distinction': '#3B82F6',
      'Moderate': '#F59E0B',
    };
    return colors[status] || '#F59E0B';
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedStudents(students.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <CustomAppBar />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Select
              size="small"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="My Courses">My Courses</MenuItem>
              <MenuItem value="All Courses">All Courses</MenuItem>
            </Select>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 300 }}
            />
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              <IconButton size="small">
                <EditIcon />
              </IconButton>
              <IconButton size="small">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedStudents.length === students.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Recent Login</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Student Academics</TableCell>
                  <TableCell>Latest Quiz Update</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Loading...</TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow 
                      key={student.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                        />
                      </TableCell>
                      <TableCell>{student.customId || '#' + student.id.slice(0, 5)}</TableCell>
                      <TableCell>{student.recentLogin}</TableCell>
                      <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                      <TableCell>
                        <Chip
                          label={student.status}
                          sx={{
                            bgcolor: getStatusColor(student.status),
                            color: '#10B981',
                            border: 'none',
                            borderRadius: '4px',
                            height: '24px',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.academicStatus}
                          sx={{
                            bgcolor: 'transparent',
                            color: getAcademicStatusColor(student.academicStatus),
                            border: `1px solid ${getAcademicStatusColor(student.academicStatus)}`,
                            borderRadius: '4px',
                            height: '24px',
                          }}
                        />
                      </TableCell>
                      <TableCell>{student.lastQuizUpdate}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" color="primary">
              Donload
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default TeacherStudents;