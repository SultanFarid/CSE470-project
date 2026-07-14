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

module.exports = { loginUser };