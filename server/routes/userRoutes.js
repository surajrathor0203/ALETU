const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// List of approved institutes (In production, this should come from a database)
const APPROVED_INSTITUTES = [
  'Institute A',
  'Institute B',
  'Institute C'
];

// Registration route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, phone, institute, instituteId } = req.body;
    
    // Log complete request
    console.log('Complete request body:', req.body);

    // Validate all required fields
    const requiredFields = ['username', 'email', 'password', 'role', 'phone', 'institute', 'instituteId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      phone,
      institute,
      instituteId
    });

    // Validate the document before saving
    const validationError = newUser.validateSync();
    if (validationError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validationError.errors
      });
    }

    const savedUser = await newUser.save();
    console.log('Saved user document:', savedUser.toObject());

    res.status(201).json({
      message: 'User registered successfully',
      user: savedUser
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Error registering user',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role:user.role,
        phone:user.phone,
        institute:user.institute,
        instituteId:user.instituteId,

      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

module.exports = router;