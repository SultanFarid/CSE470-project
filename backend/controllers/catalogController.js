const MedicineModel = require('../models/medicineModel');
const MedicalTestModel = require('../models/medicalTestModel');

// GET /api/catalog/medicines/search?q=
const searchMedicines = async (req, res) => {
    try {
        const { q } = req.query;
        const results = await MedicineModel.search(q);
        res.status(200).json(results);
    } catch (err) {
        console.error('Search medicines error:', err);
        res.status(500).json({ message: 'Server error searching medicines.' });
    }
};

// GET /api/catalog/tests/search?q=
const searchTests = async (req, res) => {
    try {
        const { q } = req.query;
        const results = await MedicalTestModel.search(q);
        res.status(200).json(results);
    } catch (err) {
        console.error('Search tests error:', err);
        res.status(500).json({ message: 'Server error searching tests.' });
    }
};

module.exports = { searchMedicines, searchTests };
