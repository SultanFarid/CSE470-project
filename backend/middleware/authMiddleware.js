const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded; 
        next(); 
    } catch (err) {
        console.error("Token verification failed:", err.message);
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};

// Case-insensitive & trimmed Role Helper
const checkRole = (userRole, targetRole) => {
    if (!userRole) return false;
    return userRole.toString().trim().toLowerCase() === targetRole.toLowerCase();
};

const isAdmin = (req, res, next) => {
    if (!req.user || !checkRole(req.user.role, 'admin')) {
        return res.status(403).json({ message: "Admin access required." });
    }
    next();
};

const isTherapist = (req, res, next) => {
    if (!req.user || !checkRole(req.user.role, 'therapist')) {
        return res.status(403).json({ message: "Therapist access required." });
    }
    next();
};

const isPatient = (req, res, next) => {
    if (!req.user || !checkRole(req.user.role, 'patient')) {
        return res.status(403).json({ message: "Patient access required." });
    }
    next();
};

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.isAdmin = isAdmin;
module.exports.isTherapist = isTherapist;
module.exports.isPatient = isPatient;