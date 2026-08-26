const ArchiveModel = require('../models/archiveModel');

const searchPatients = async (req, res) => {
    try {
        const { search } = req.query;
        const patients = await ArchiveModel.searchMyPatients(req.user.id, search);
        res.status(200).json({ success: true, data: patients });
    } catch (err) {
        console.error('Search patients error:', err);
        res.status(500).json({ message: 'Server error searching patient archive.' });
    }
};

const getPatientHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const history = await ArchiveModel.getPatientHistory(req.user.id, patientId);
        res.status(200).json({ success: true, data: history });
    } catch (err) {
        console.error('Get patient history error:', err);
        res.status(500).json({ message: 'Server error fetching patient history.' });
    }
};

module.exports = { searchPatients, getPatientHistory };
