const CaseloadModel = require('../models/caseloadModel');

const getMyCaseload = async (req, res) => {
    try {
        const caseload = await CaseloadModel.getMyCaseload(req.user.id);
        res.status(200).json({ success: true, data: caseload });
    } catch (err) {
        console.error('Get caseload error:', err);
        res.status(500).json({ message: 'Server error fetching caseload.' });
    }
};

module.exports = { getMyCaseload };
