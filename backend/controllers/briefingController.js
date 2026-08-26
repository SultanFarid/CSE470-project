const BriefingModel = require('../models/briefingModel');

// GET /api/briefings/session/:sessionId
const getBriefingForSession = async (req, res) => {
    try {
        const therapistId = req.user?.id;
        const { sessionId } = req.params;
        const briefing = await BriefingModel.getBriefingForSession(sessionId, therapistId);
        // Summary is already resolved inside BriefingModel (buildSummary is awaited there)
        if (!briefing) {
            return res.status(404).json({ message: 'Session not found or you do not own this session.' });
        }
        res.status(200).json(briefing);
    } catch (err) {
        console.error('Get briefing error:', err);
        res.status(500).json({ message: 'Server error fetching briefing.' });
    }
};

module.exports = { getBriefingForSession };
