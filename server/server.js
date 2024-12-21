const express = require('express');
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();



dotenv.config();

const port = process.env.PORT || 8000;
// Middleware to parse incoming JSON requests
app.use(express.json());

// Define a basic route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
