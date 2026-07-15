const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


const authRoutes = require('./routes/authRoutes');
const therapistRoutes = require('./routes/therapistRoutes');
const patientRoutes = require('./routes/patientRoutes');


const app = express();


app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.use('/api/auth', authRoutes);
app.use('/api/therapist', therapistRoutes);
app.use('/api/patient', patientRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));