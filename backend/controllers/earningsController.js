const EarningsModel = require('../models/earningsModel');

const getMyEarnings = async (req, res) => {
    try {
        const summary = await EarningsModel.getSummary(req.user.id);
        res.status(200).json({ success: true, data: summary });
    } catch (err) {
        console.error('Get earnings error:', err);
        res.status(500).json({ message: 'Server error fetching earnings.' });
    }
};

module.exports = { getMyEarnings };
