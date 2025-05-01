const express = require('express');
const app = express();
const port = 5000;

// Serve static files from the current directory
app.use(express.static('.'));

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Shape Shifter Duel game running at http://localhost:${port}`);
});