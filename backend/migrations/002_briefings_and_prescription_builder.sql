-- ============================================================================
-- Migration 002: Pre-Session Patient Briefings (Feature 11)
--             +  Prescription Builder upgrade (Feature 12)
--
-- Run once against the existing database:
--   mysql -u <user> -p smart_therapy_db < backend/migrations/002_briefings_and_prescription_builder.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Defensive fix: backend/models/appointmentModel.js already reads/writes
--    `sessions.time_slot` (see its comments — it was added by an untracked
--    `migration_add_time_slot_to_sessions.sql` that never made it into the
--    committed smart_therapy_db.sql dump). This briefing/prescription work
--    also reads that column, so we add it here defensively — a no-op if
--    your local DB already has it from that earlier migration.
-- ----------------------------------------------------------------------------
ALTER TABLE `sessions` ADD COLUMN IF NOT EXISTS `time_slot` varchar(50) DEFAULT NULL;

-- ----------------------------------------------------------------------------
-- 1. Persist the patient's Vitals Check (Feature 2) so it can be summarized
--    for the therapist before a session (Feature 11). We keep one row per
--    submission (history) instead of overwriting — the briefing always reads
--    the most recent row for that patient.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `patient_vitals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `concerns` text DEFAULT NULL COMMENT 'JSON array of selected concern chips',
  `duration` varchar(100) DEFAULT NULL,
  `severity` varchar(100) DEFAULT NULL,
  `gender_pref` varchar(50) DEFAULT NULL,
  `language_pref` varchar(50) DEFAULT NULL,
  `format_pref` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_patient_vitals_patient` (`patient_id`),
  CONSTRAINT `fk_vitals_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ----------------------------------------------------------------------------
-- 2. Medicine catalog — searched from the Prescription Builder.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `medicines` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `generic_name` varchar(150) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `common_strength` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_medicines_name` (`name`),
  KEY `idx_medicines_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ----------------------------------------------------------------------------
-- 3. Medical test catalog — searched from the Prescription Builder.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `medical_tests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_tests_name` (`name`),
  KEY `idx_tests_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ----------------------------------------------------------------------------
-- 4. Extend prescriptions with the two new briefing fields:
--    - presession_summary : snapshot of the AI-generated questionnaire
--      summary, captured the moment the therapist saved this prescription
--      (stays fixed even if the patient later submits new vitals).
--    - additional_briefing: free text the doctor types themselves.
-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- 4. Extend prescriptions with the two new briefing fields:
--    - presession_summary : snapshot of the AI-generated questionnaire
--      summary, captured the moment the therapist saved this prescription
--      (stays fixed even if the patient later submits new vitals).
--    - additional_briefing: free text the doctor types themselves.
-- ----------------------------------------------------------------------------
ALTER TABLE `prescriptions`
  ADD COLUMN IF NOT EXISTS `presession_summary` TEXT DEFAULT NULL AFTER `medications`,
  ADD COLUMN IF NOT EXISTS `additional_briefing` TEXT DEFAULT NULL AFTER `presession_summary`;


-- ----------------------------------------------------------------------------
-- 5. Structured medicine lines for a prescription
--    (search catalog -> dosage -> Morning/Noon/Night frequency -> duration).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `prescription_medicines` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prescription_id` int(11) NOT NULL,
  `medicine_id` int(11) DEFAULT NULL,
  `medicine_name` varchar(150) NOT NULL COMMENT 'snapshot, kept even if the catalog entry changes later',
  `dosage` varchar(50) DEFAULT NULL COMMENT 'e.g. 50mg, 1 tablet',
  `frequency_code` varchar(20) DEFAULT NULL COMMENT 'Rx-pad style, e.g. 1-0-1',
  `frequency_label` varchar(100) DEFAULT NULL COMMENT 'e.g. Morning & Night',
  `duration_days` int(11) DEFAULT NULL,
  `instructions` varchar(150) DEFAULT NULL COMMENT 'e.g. After meal',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_prescription_medicines_prescription` (`prescription_id`),
  CONSTRAINT `fk_presmed_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_presmed_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ----------------------------------------------------------------------------
-- 6. Selected tests for a prescription.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `prescription_tests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prescription_id` int(11) NOT NULL,
  `test_id` int(11) DEFAULT NULL,
  `test_name` varchar(150) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_prescription_tests_prescription` (`prescription_id`),
  CONSTRAINT `fk_prestest_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prestest_test` FOREIGN KEY (`test_id`) REFERENCES `medical_tests` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ----------------------------------------------------------------------------
-- 7. Letterhead fields for the printed prescription (Feature 8 profile add-ons).
-- ----------------------------------------------------------------------------
ALTER TABLE `therapist_profiles`
  ADD COLUMN `hospital_name` varchar(150) DEFAULT '' AFTER `session_type`,
  ADD COLUMN `qualification` varchar(150) DEFAULT '' AFTER `hospital_name`;


-- ----------------------------------------------------------------------------
-- 8. Seed data — Medicines (representative catalog across common categories,
--    weighted toward mental health since this is a therapy platform, plus
--    general/primary-care medicine so the catalog is broadly usable).
-- ----------------------------------------------------------------------------
INSERT INTO `medicines` (`name`, `generic_name`, `category`, `common_strength`) VALUES
-- Antidepressants
('Sertraline', 'Sertraline HCl', 'Antidepressant (SSRI)', '50mg'),
('Fluoxetine', 'Fluoxetine HCl', 'Antidepressant (SSRI)', '20mg'),
('Escitalopram', 'Escitalopram Oxalate', 'Antidepressant (SSRI)', '10mg'),
('Paroxetine', 'Paroxetine HCl', 'Antidepressant (SSRI)', '20mg'),
('Citalopram', 'Citalopram HBr', 'Antidepressant (SSRI)', '20mg'),
('Venlafaxine', 'Venlafaxine HCl', 'Antidepressant (SNRI)', '75mg'),
('Duloxetine', 'Duloxetine HCl', 'Antidepressant (SNRI)', '30mg'),
('Bupropion', 'Bupropion HCl', 'Antidepressant (NDRI)', '150mg'),
('Mirtazapine', 'Mirtazapine', 'Antidepressant (NaSSA)', '15mg'),
('Amitriptyline', 'Amitriptyline HCl', 'Antidepressant (TCA)', '25mg'),
('Nortriptyline', 'Nortriptyline HCl', 'Antidepressant (TCA)', '25mg'),
('Imipramine', 'Imipramine HCl', 'Antidepressant (TCA)', '25mg'),
('Clomipramine', 'Clomipramine HCl', 'Antidepressant (TCA)', '25mg'),
-- Anxiolytics / Sedatives
('Alprazolam', 'Alprazolam', 'Anxiolytic (Benzodiazepine)', '0.5mg'),
('Diazepam', 'Diazepam', 'Anxiolytic (Benzodiazepine)', '5mg'),
('Lorazepam', 'Lorazepam', 'Anxiolytic (Benzodiazepine)', '1mg'),
('Clonazepam', 'Clonazepam', 'Anxiolytic (Benzodiazepine)', '0.5mg'),
('Buspirone', 'Buspirone HCl', 'Anxiolytic (Non-benzodiazepine)', '10mg'),
('Hydroxyzine', 'Hydroxyzine HCl', 'Anxiolytic / Antihistamine', '25mg'),
('Propranolol', 'Propranolol HCl', 'Beta-blocker (anxiety/tremor)', '10mg'),
-- Mood stabilizers & antipsychotics
('Lithium Carbonate', 'Lithium Carbonate', 'Mood Stabilizer', '300mg'),
('Sodium Valproate', 'Valproic Acid', 'Mood Stabilizer', '200mg'),
('Lamotrigine', 'Lamotrigine', 'Mood Stabilizer', '25mg'),
('Carbamazepine', 'Carbamazepine', 'Mood Stabilizer', '200mg'),
('Quetiapine', 'Quetiapine Fumarate', 'Antipsychotic (Atypical)', '25mg'),
('Olanzapine', 'Olanzapine', 'Antipsychotic (Atypical)', '5mg'),
('Risperidone', 'Risperidone', 'Antipsychotic (Atypical)', '2mg'),
('Aripiprazole', 'Aripiprazole', 'Antipsychotic (Atypical)', '10mg'),
('Haloperidol', 'Haloperidol', 'Antipsychotic (Typical)', '5mg'),
-- Sleep aids
('Zolpidem', 'Zolpidem Tartrate', 'Sleep Aid', '10mg'),
('Zopiclone', 'Zopiclone', 'Sleep Aid', '7.5mg'),
('Melatonin', 'Melatonin', 'Sleep Aid (Supplement)', '3mg'),
-- ADHD / Cognitive
('Methylphenidate', 'Methylphenidate HCl', 'ADHD (Stimulant)', '10mg'),
('Atomoxetine', 'Atomoxetine HCl', 'ADHD (Non-stimulant)', '25mg'),
('Donepezil', 'Donepezil HCl', 'Cognitive / Dementia', '5mg'),
('Memantine', 'Memantine HCl', 'Cognitive / Dementia', '10mg'),
-- Analgesics / NSAIDs
('Paracetamol', 'Acetaminophen', 'Analgesic', '500mg'),
('Ibuprofen', 'Ibuprofen', 'Analgesic / NSAID', '400mg'),
('Aspirin', 'Acetylsalicylic Acid', 'Analgesic / NSAID', '75mg'),
('Naproxen', 'Naproxen Sodium', 'Analgesic / NSAID', '250mg'),
('Diclofenac', 'Diclofenac Sodium', 'Analgesic / NSAID', '50mg'),
-- Gastrointestinal
('Omeprazole', 'Omeprazole', 'Gastrointestinal (PPI)', '20mg'),
('Esomeprazole', 'Esomeprazole', 'Gastrointestinal (PPI)', '20mg'),
('Pantoprazole', 'Pantoprazole', 'Gastrointestinal (PPI)', '40mg'),
('Ranitidine', 'Ranitidine HCl', 'Gastrointestinal (H2 Blocker)', '150mg'),
('Domperidone', 'Domperidone', 'Gastrointestinal (Antiemetic)', '10mg'),
('Ondansetron', 'Ondansetron HCl', 'Gastrointestinal (Antiemetic)', '4mg'),
('Loperamide', 'Loperamide HCl', 'Gastrointestinal (Antidiarrheal)', '2mg'),
('ORS', 'Oral Rehydration Salts', 'Gastrointestinal (Rehydration)', '1 sachet'),
-- Cardiovascular
('Amlodipine', 'Amlodipine Besylate', 'Cardiovascular (CCB)', '5mg'),
('Atorvastatin', 'Atorvastatin Calcium', 'Cardiovascular (Statin)', '20mg'),
('Losartan', 'Losartan Potassium', 'Cardiovascular (ARB)', '50mg'),
('Metoprolol', 'Metoprolol Tartrate', 'Cardiovascular (Beta-blocker)', '50mg'),
-- Antidiabetic / Endocrine
('Metformin', 'Metformin HCl', 'Antidiabetic', '500mg'),
('Insulin (Regular)', 'Human Insulin', 'Antidiabetic', '100 IU/mL'),
('Levothyroxine', 'Levothyroxine Sodium', 'Endocrine (Thyroid)', '50mcg'),
('Prednisolone', 'Prednisolone', 'Corticosteroid', '5mg'),
-- Respiratory / Antihistamine
('Salbutamol Inhaler', 'Salbutamol', 'Respiratory (Bronchodilator)', '100mcg/puff'),
('Montelukast', 'Montelukast Sodium', 'Respiratory (Leukotriene)', '10mg'),
('Cetirizine', 'Cetirizine HCl', 'Antihistamine', '10mg'),
('Loratadine', 'Loratadine', 'Antihistamine', '10mg'),
('Fexofenadine', 'Fexofenadine HCl', 'Antihistamine', '120mg'),
-- Antibiotics
('Azithromycin', 'Azithromycin', 'Antibiotic (Macrolide)', '500mg'),
('Amoxicillin', 'Amoxicillin', 'Antibiotic (Penicillin)', '500mg'),
('Ciprofloxacin', 'Ciprofloxacin HCl', 'Antibiotic (Fluoroquinolone)', '500mg'),
('Doxycycline', 'Doxycycline Hyclate', 'Antibiotic (Tetracycline)', '100mg'),
('Metronidazole', 'Metronidazole', 'Antibiotic / Antiprotozoal', '400mg'),
-- Vitamins & Supplements
('Vitamin D3', 'Cholecalciferol', 'Vitamin / Supplement', '1000 IU'),
('Vitamin B Complex', 'B-Complex Vitamins', 'Vitamin / Supplement', '1 tablet'),
('Folic Acid', 'Folic Acid', 'Vitamin / Supplement', '5mg'),
('Iron (Ferrous Sulfate)', 'Ferrous Sulfate', 'Vitamin / Supplement', '325mg'),
('Calcium Carbonate', 'Calcium Carbonate', 'Vitamin / Supplement', '500mg'),
('Multivitamin', 'Multivitamin & Minerals', 'Vitamin / Supplement', '1 tablet'),
('Omega-3', 'Fish Oil (EPA/DHA)', 'Vitamin / Supplement', '1000mg'),
('Zinc Sulfate', 'Zinc Sulfate', 'Vitamin / Supplement', '20mg'),
('Vitamin B12 (Methylcobalamin)', 'Methylcobalamin', 'Vitamin / Supplement', '1500mcg');


-- ----------------------------------------------------------------------------
-- 9. Seed data — Medical Tests (psychiatric screening tools + common labs
--    and imaging a therapist or referring physician might order).
-- ----------------------------------------------------------------------------
INSERT INTO `medical_tests` (`name`, `category`, `description`) VALUES
('PHQ-9 Depression Screening', 'Psychiatric Screening', 'Patient Health Questionnaire — depression severity'),
('GAD-7 Anxiety Screening', 'Psychiatric Screening', 'Generalized Anxiety Disorder 7-item scale'),
('MMSE (Mini-Mental State Exam)', 'Psychiatric Screening', 'Cognitive impairment screening'),
('Beck Depression Inventory', 'Psychiatric Screening', 'Self-report depression severity measure'),
('Sleep Study (Polysomnography)', 'Sleep', 'Overnight monitoring for sleep disorders'),
('Complete Blood Count (CBC)', 'Blood / Hematology', 'General blood health panel'),
('Thyroid Function Test (TSH, T3, T4)', 'Endocrine', 'Screens for thyroid-related mood symptoms'),
('Fasting Blood Sugar', 'Endocrine', 'Baseline glucose level'),
('HbA1c', 'Endocrine', '3-month average blood sugar level'),
('Lipid Profile', 'Cardiovascular', 'Cholesterol and triglyceride panel'),
('Liver Function Test (LFT)', 'Hepatic', 'Checks liver health — relevant before starting many psychiatric meds'),
('Renal Function Test (RFT / Creatinine)', 'Renal', 'Checks kidney function — relevant for Lithium monitoring'),
('Vitamin D Level', 'Vitamin / Nutrition', 'Screens for deficiency linked to mood symptoms'),
('Vitamin B12 Level', 'Vitamin / Nutrition', 'Screens for deficiency linked to fatigue/mood symptoms'),
('Serum Electrolytes', 'Blood Chemistry', 'Sodium, Potassium, Chloride levels'),
('ESR (Erythrocyte Sedimentation Rate)', 'Blood / Inflammation', 'General inflammation marker'),
('CRP (C-Reactive Protein)', 'Blood / Inflammation', 'General inflammation marker'),
('Urine Routine Examination', 'Urinalysis', 'General urine screening'),
('Lithium Serum Level', 'Drug Monitoring', 'Required periodic monitoring for patients on Lithium'),
('Prolactin Level', 'Endocrine', 'Monitors side effects of some antipsychotics'),
('Cortisol Level', 'Endocrine', 'Assesses stress-hormone / adrenal function'),
('Drug Toxicology Screen', 'Toxicology', 'Screens for substance use'),
('ECG (Electrocardiogram)', 'Cardiovascular', 'Heart rhythm check — relevant before some psychiatric medications'),
('EEG (Electroencephalogram)', 'Neurological', 'Brain electrical activity'),
('MRI Brain', 'Imaging', 'Detailed brain imaging'),
('CT Scan Brain', 'Imaging', 'Brain imaging, faster than MRI'),
('Chest X-Ray', 'Imaging', 'General chest screening'),
('Pregnancy Test (Beta-hCG)', 'Reproductive Health', 'Required before prescribing certain medications'),
('HIV Screening', 'Infectious Disease', 'Standard screening panel'),
('Hepatitis B Screening', 'Infectious Disease', 'Standard screening panel'),
('Folate Level', 'Vitamin / Nutrition', 'Screens for deficiency linked to mood symptoms'),
('Testosterone Level', 'Endocrine', 'Hormone panel'),
('Serum Calcium', 'Blood Chemistry', 'Electrolyte / bone health panel'),
('C-Peptide Test', 'Endocrine', 'Assesses insulin production'),
('Pharmacogenomic Panel (Psychiatric Medication Response)', 'Genetic', 'Guides medication choice based on genetic markers');
