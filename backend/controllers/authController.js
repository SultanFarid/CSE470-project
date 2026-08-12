const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const loginUser = async (req, res) => {
    // 1. Extract the role alongside email and password
    const { email, password, role } = req.body;

    try {
        const user = await UserModel.findByEmail(email);

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 2. STRICT ROLE CHECK: Does the selected tab match their actual database account?
        if (role && user.role !== role) {
            return res.status(403).json({ 
                message: `Account found, but you are not a registered ${role}. Please select the correct tab.` 
            });
        }

        // 3. Password Check
        if (password !== user.password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 4. Sign a JWT so protected routes (verifyToken middleware) can identify this user.
        //    Payload uses "id" because authMiddleware attaches this as req.user, and
        //    controllers read req.user.id to know which patient/therapist is logged in.
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Patient self-signup. Role is intentionally hardcoded to 'patient' here (never read
// from req.body) so this endpoint can never be used to create therapist/admin accounts.
// Therapists still go through the existing /apply -> admin-approval flow untouched.
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

        // Auto-login after signup, same token shape as loginUser, so the frontend
        // can send the user straight to their dashboard.
        const token = jwt.sign(
            { id: newUser.id, role: 'patient' },
            process.env.JWT_SECRET,
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

module.exports = { loginUser, registerPatient };