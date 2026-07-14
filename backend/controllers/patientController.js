const PatientModel = require('../models/patientModel');

/**
 * 1. GET PROFILE DATA
 * This function runs when the patient logs in and opens their dashboard.
 * It fetches only their specific data from the database.
 */
exports.getPatientProfile = async (req, res) => {
    // FIXED: Dynamically get the logged-in user's ID from the auth token middleware
    const userId = req.user?.id || req.userId; 

    // Safety check: If no user ID is found, stop and return an error
    if (!userId) {
        return res.status(401).json({ 
            message: "Unauthorized access. Please log in again." 
        });
    }

    try {
        // Query the database using the model method for this specific user ID
        const results = await PatientModel.findByUserId(userId);

        // If no rows match this user ID in the database
        if (results.length === 0) {
            return res.status(404).json({ 
                message: "Patient profile not found." 
            });
        }

        // Return the correct logged-in user's profile record (the first match)
        return res.status(200).json(results[0]);
        
    } catch (err) {
        console.error("Error fetching patient profile:", err);
        return res.status(500).json({ 
            message: "A database error occurred while loading your profile." 
        });
    }
};

/**
 * 2. UPDATE PROFILE DATA
 * This function runs when the patient fills out the form on the dashboard 
 * and clicks the 'Save' button.
 */
exports.updatePatientProfile = async (req, res) => {
    // FIXED: Dynamically get the logged-in user's ID from the auth token middleware
    const userId = req.user?.id || req.userId; 

    // Safety check: If no user ID is found, stop and return an error
    if (!userId) {
        return res.status(401).json({ 
            message: "Unauthorized action. Please log in again." 
        });
    }

    // Extract the updated text values sent from the frontend form
    const { name, contact_number, location, preferred_language, profile_photo_url } = req.body;

    try {
        // First step: Update the user's name inside the primary 'users' table
        await PatientModel.updateName(userId, name);

        // Second step: Gather and update the remaining text metrics inside the 'patient_profiles' table
        const profileData = { contact_number, location, preferred_language, profile_photo_url };
        await PatientModel.updateProfile(userId, profileData);

        // Send a success confirmation back to the frontend application
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