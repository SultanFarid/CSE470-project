const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 1. Import Routes
const authRoutes = require('./routes/authRoutes');
const therapistRoutes = require('./routes/therapistRoutes');

// 2. Initialize the app
const app = express();

// 3. Setup Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// 4. Bind Routes (This MUST come after const app = express())
app.use('/api/auth', authRoutes);
app.use('/api/therapist', therapistRoutes);

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));