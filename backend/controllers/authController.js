const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { sendReminderIfNeededForPatient } = require('../jobs/exerciseReminderJob');
const { sendBookNextSessionReminderIfNeeded } = require('../jobs/bookNextSessionJob');

const loginUser = async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const user = await UserModel.findByEmail(email);

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (role && user.role !== role) {
            return res.status(403).json({ 
                message: `Account found, but you are not a registered ${role}. Please select the correct tab.` 
            });
        }

        if (password !== user.password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        await UserModel.updateLastLogin(user.id);

        // Feature 19 — send today's exercise reminder right now if the
        // patient hasn't already received one today (covers logins that
        // happen outside the 08:00 cron window).
        if (user.role === 'patient') {
            try {
                if (typeof sendReminderIfNeededForPatient === 'function') {
                    await sendReminderIfNeededForPatient(user.id);
                }
                if (typeof sendBookNextSessionReminderIfNeeded === 'function') {
                    await sendBookNextSessionReminderIfNeeded(user.id);
                }
            } catch (reminderErr) {
                // Never let a reminder failure block login itself
                console.error('Failed to send login-time exercise reminder:', reminderErr);
            }
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.display_name || user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Patient self-signup. Role is intentionally hardcoded to 'patient' here.
const registerPatient = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are all required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    try {
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const newUser = await UserModel.create(name, email, password, 'patient');

        const token = jwt.sign(
            { id: newUser.id, role: 'patient' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { id: newUser.id, name: newUser.name, email: newUser.email, role: 'patient' }
        });
    } catch (error) {
        console.error('Patient registration error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }
        res.status(500).json({ message: 'Server error while creating account.' });
    }
};

// Admin Signup
const signupAdmin = async (req, res) => {
    const { name, email, password, secretKey } = req.body;

    try {
        if (secretKey !== process.env.ADMIN_SIGNUP_SECRET) {
            return res.status(403).json({ message: 'Invalid admin secret key.' });
        }

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        const newUser = await UserModel.create(name, email, password, 'admin');

        const token = jwt.sign(
            { id: newUser.id, role: 'admin' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'Admin account created successfully',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: 'admin'
            }
        });
    } catch (error) {
        console.error('Admin signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { loginUser, registerPatient, signupAdmin };
