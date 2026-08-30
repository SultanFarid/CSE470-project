const aiMatchmaker = require('../utils/aiMatchmaker');
const TherapistProfileModel = require('../models/therapistProfileModel');
const reviewModel = require('../models/reviewModel');

exports.runMatchmaker = async (req, res) => { console.log("[Backend] Matchmaker endpoint hit!");
    try {
        const vitalsData = req.body;
        
        // Get all therapists formatted
        const therapists = await TherapistProfileModel.getAllFormatted();
        
        // Get all review summaries to pass as weighted signals
        const reviewSummaries = await reviewModel.getAllTherapistReviewSummaries();

        const topMatches = await aiMatchmaker.runAiMatchmaker(vitalsData, therapists, reviewSummaries);

        return res.status(200).json(topMatches);
    } catch (err) {
        console.error("Matchmaker Error:", err); require("fs").writeFileSync("error.log", err.stack || err.toString());
        return res.status(500).json({ message: "Failed to run AI Matchmaker" });
    }
};
