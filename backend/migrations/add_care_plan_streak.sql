-- Migration: Feature 6 improvements
-- Run: C:\xampp\mysql\bin\mysql.exe -u root smart_therapy_db < migrations/add_care_plan_streak.sql

-- 1. Track whether the patient has accepted a prescription's care plan
ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS care_plan_accepted TINYINT(1) NOT NULL DEFAULT 0;

-- 2. Record which dates a patient checked off at least one task (for streak counter)
CREATE TABLE IF NOT EXISTS task_completions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  patient_id    INT NOT NULL,
  completed_date DATE NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_patient_date (patient_id, completed_date)
);
