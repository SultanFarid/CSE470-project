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

        res.status(200).json({
            message: 'Login successful',
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