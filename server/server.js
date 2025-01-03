const express = require('express');
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User'); // Import User model
const userRoutes = require('./routes/userRoutes'); // Import user routes
const securityMiddleware = require('./middleware/securityMiddleware'); // Import security middleware
const app = express();

dotenv.config();

const port = process.env.PORT || 8000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  strict: true,  // Enforce schema validation
})
.then(() => {
  console.log('MongoDB connected');
  // Verify indexes
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    console.log('Available collections:', collections);
  });
})
.catch(err => console.log('MongoDB connection error:', err));

// Enable debugging for Mongoose
mongoose.set('debug', true);

// Middleware to parse incoming JSON requests
app.use(express.json());

// Middleware for security
securityMiddleware(app);

// Use routes
app.use('/api/users', userRoutes);

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Handle other errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
