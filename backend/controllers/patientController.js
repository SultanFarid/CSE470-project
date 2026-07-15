const PatientModel = require('../models/patientModel');


exports.getPatientProfile = async (req, res) => {

    const userId = req.user?.id || req.userId; 

    if (!userId) {
        return res.status(401).json({ 
            message: "Unauthorized access. Please log in again." 
        });
    }

    try {

        const results = await PatientModel.findByUserId(userId);


        if (results.length === 0) {
            return res.status(404).json({ 
                message: "Patient profile not found." 
            });
        }


        return res.status(200).json(results[0]);
        
    } catch (err) {
        console.error("Error fetching patient profile:", err);
        return res.status(500).json({ 
            message: "A database error occurred while loading your profile." 
        });
    }
};


exports.uploadPatientPhoto = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No photo file was uploaded.' });
    }
    const fileUrl = `/uploads/profile_photos/${req.file.filename}`;
    return res.status(200).json({ url: fileUrl });
};

exports.updatePatientProfile = async (req, res) => {

    const userId = req.user?.id || req.userId; 


    if (!userId) {
        return res.status(401).json({ 
            message: "Unauthorized action. Please log in again." 
        });
    }

 
    const { name, contact_number, location, preferred_language, profile_photo_url } = req.body;

    try {

        await PatientModel.updateName(userId, name);


        const profileData = { contact_number, location, preferred_language, profile_photo_url };
        await PatientModel.updateProfile(userId, profileData);


        return res.status(200).json({ 
            message: "Your profile has been updated successfully!" 
        });
        
    } catch (err) {
        console.error("Error updating patient profile data:", err);
        return res.status(500).json({ 
            message: "Failed to save your new profile details to the database." 
        });
    }
};