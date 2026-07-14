const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Extract token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        // 2. Verify token using the secret from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Attach user data to request
        req.user = decoded; 
        next(); 
    } catch (err) {
        // Log the error to your terminal to see why the 403 is happening
        console.error("Token verification failed:", err.message);
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};

module.exports = verifyToken;