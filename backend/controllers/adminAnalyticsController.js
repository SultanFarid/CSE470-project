const AdminAnalyticsModel = require('../models/adminAnalyticsModel');

const getDashboardStats = async (req, res) => {
    try {
        const [
            totalPatients,
            activeTherapists,
            sessionsByMonth,
            appointmentRatio,
            totalRevenue
        ] = await Promise.all([
            AdminAnalyticsModel.getTotalPatients(),
            AdminAnalyticsModel.getActiveTherapists(),
            AdminAnalyticsModel.getSessionsByMonth(),
            AdminAnalyticsModel.getAppointmentRatio(),
            AdminAnalyticsModel.getTotalRevenue()
        ]);

        res.status(200).json({
            totalPatients,
            activeTherapists,
            sessionsByMonth,
            appointmentRatio,
            totalRevenue
        });
    } catch (error) {
        console.error('Analytics fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getDashboardStats };