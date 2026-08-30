-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Aug 30, 2026 at 05:48 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `smart_therapy_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `care_plan_items`
--

CREATE TABLE `care_plan_items` (
  `id` int(11) NOT NULL,
  `prescription_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `therapist_id` int(11) NOT NULL,
  `item_type` enum('medication','exercise') NOT NULL,
  `title` varchar(255) NOT NULL,
  `youtube_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `care_plan_items`
--

INSERT INTO `care_plan_items` (`id`, `prescription_id`, `patient_id`, `therapist_id`, `item_type`, `title`, `youtube_url`, `is_active`, `created_at`) VALUES
(1, 1, 14, 2, 'medication', 'Take morning anxiety medication', NULL, 1, '2026-08-15 00:40:43'),
(2, 1, 14, 2, 'exercise', 'Daily breathing exercise', 'https://www.youtube.com/watch?v=aXItOY0sLRY', 1, '2026-08-15 00:40:43'),
(3, 2, 15, 2, 'medication', 'Evening magnesium supplement', NULL, 1, '2026-08-15 00:40:43'),
(4, 2, 15, 2, 'exercise', 'Shoulder & neck mobility stretch', 'https://www.youtube.com/watch?v=g_tea8ZNk5A', 1, '2026-08-15 00:40:43'),
(5, 3, 16, 2, 'medication', 'Take evening dose', NULL, 1, '2026-08-15 00:40:43'),
(6, 3, 16, 2, 'exercise', 'Progressive muscle relaxation', 'https://www.youtube.com/watch?v=1nZEdqcGVzo', 1, '2026-08-15 00:40:43'),
(7, 4, 1, 4, 'medication', 'Take prescribed dose', NULL, 1, '2026-08-15 00:40:43'),
(8, 4, 1, 4, 'exercise', 'Daily mindfulness practice', 'https://www.youtube.com/watch?v=inpok4MKVLM', 1, '2026-08-15 00:40:43'),
(9, 5, 14, 5, 'medication', 'Take prescribed dose', NULL, 1, '2026-08-15 00:40:43'),
(10, 5, 14, 5, 'exercise', 'Daily mindfulness practice', 'https://www.youtube.com/watch?v=inpok4MKVLM', 1, '2026-08-15 00:40:43'),
(11, 6, 15, 6, 'medication', 'Take prescribed dose', NULL, 1, '2026-08-15 00:40:43'),
(12, 6, 15, 6, 'exercise', 'Daily mindfulness practice', 'https://www.youtube.com/watch?v=inpok4MKVLM', 1, '2026-08-15 00:40:43'),
(13, 7, 16, 7, 'medication', 'Take prescribed dose', NULL, 1, '2026-08-15 00:40:43'),
(14, 7, 16, 7, 'exercise', 'Daily mindfulness practice', 'https://www.youtube.com/watch?v=inpok4MKVLM', 1, '2026-08-15 00:40:43'),
(15, 8, 1, 8, 'medication', 'Take prescribed dose', NULL, 1, '2026-08-15 00:40:43'),
(16, 8, 1, 8, 'exercise', 'Daily mindfulness practice', 'https://www.youtube.com/watch?v=inpok4MKVLM', 1, '2026-08-15 00:40:43'),
(17, 9, 14, 9, 'medication', 'Take prescribed dose', NULL, 1, '2026-08-15 00:40:43'),
(18, 9, 14, 9, 'exercise', 'Daily mindfulness practice', 'https://www.youtube.com/watch?v=inpok4MKVLM', 1, '2026-08-15 00:40:43'),
(19, 10, 15, 10, 'medication', 'Take prescribed dose', NULL, 1, '2026-08-15 00:40:43'),
(20, 10, 15, 10, 'exercise', 'Daily mindfulness practice', 'https://www.youtube.com/watch?v=inpok4MKVLM', 1, '2026-08-15 00:40:43'),
(21, 11, 16, 11, 'medication', 'Take prescribed dose', NULL, 1, '2026-08-15 00:40:43'),
(22, 11, 16, 11, 'exercise', 'Daily mindfulness practice', 'https://www.youtube.com/watch?v=inpok4MKVLM', 1, '2026-08-15 00:40:43'),
(23, 12, 1, 12, 'medication', 'Take prescribed dose', NULL, 1, '2026-08-15 00:40:43'),
(24, 12, 1, 12, 'exercise', 'Daily mindfulness practice', 'https://www.youtube.com/watch?v=inpok4MKVLM', 1, '2026-08-15 00:40:43'),
(25, 13, 14, 13, 'medication', 'Take prescribed dose', NULL, 1, '2026-08-15 00:40:43'),
(26, 13, 14, 13, 'exercise', 'Daily mindfulness practice', 'https://www.youtube.com/watch?v=inpok4MKVLM', 1, '2026-08-15 00:40:43');

-- --------------------------------------------------------

--
-- Table structure for table `care_plan_logs`
--

CREATE TABLE `care_plan_logs` (
  `id` int(11) NOT NULL,
  `care_plan_item_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `log_date` date NOT NULL,
  `completed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `care_plan_logs`
--

INSERT INTO `care_plan_logs` (`id`, `care_plan_item_id`, `patient_id`, `log_date`, `completed_at`) VALUES
(1, 1, 14, '2026-08-15', '2026-08-15 00:40:43'),
(2, 1, 14, '2026-08-14', '2026-08-15 00:40:43'),
(3, 1, 14, '2026-08-13', '2026-08-15 00:40:43'),
(4, 1, 14, '2026-08-12', '2026-08-15 00:40:43'),
(5, 1, 14, '2026-08-11', '2026-08-15 00:40:43'),
(6, 1, 14, '2026-08-10', '2026-08-15 00:40:43'),
(7, 1, 14, '2026-08-09', '2026-08-15 00:40:43'),
(8, 2, 14, '2026-08-15', '2026-08-15 00:40:43'),
(9, 2, 14, '2026-08-14', '2026-08-15 00:40:43'),
(10, 2, 14, '2026-08-13', '2026-08-15 00:40:43'),
(11, 2, 14, '2026-08-12', '2026-08-15 00:40:43'),
(12, 2, 14, '2026-08-10', '2026-08-15 00:40:43'),
(15, 3, 15, '2026-08-15', '2026-08-15 00:40:43'),
(16, 3, 15, '2026-08-13', '2026-08-15 00:40:43'),
(17, 3, 15, '2026-08-11', '2026-08-15 00:40:43'),
(18, 3, 15, '2026-08-09', '2026-08-15 00:40:43'),
(22, 4, 15, '2026-08-14', '2026-08-15 00:40:43'),
(23, 4, 15, '2026-08-12', '2026-08-15 00:40:43'),
(24, 4, 15, '2026-08-10', '2026-08-15 00:40:43'),
(25, 5, 16, '2026-08-15', '2026-08-15 00:40:43'),
(26, 5, 16, '2026-08-12', '2026-08-15 00:40:43'),
(28, 6, 16, '2026-08-13', '2026-08-15 00:40:43'),
(29, 7, 1, '2026-08-15', '2026-08-15 00:40:43'),
(30, 7, 1, '2026-08-14', '2026-08-15 00:40:43'),
(31, 7, 1, '2026-08-13', '2026-08-15 00:40:43'),
(32, 7, 1, '2026-08-12', '2026-08-15 00:40:43'),
(33, 7, 1, '2026-08-11', '2026-08-15 00:40:43'),
(34, 7, 1, '2026-08-10', '2026-08-15 00:40:43'),
(35, 7, 1, '2026-08-09', '2026-08-15 00:40:43'),
(36, 8, 1, '2026-08-15', '2026-08-15 00:40:43'),
(37, 8, 1, '2026-08-14', '2026-08-15 00:40:43'),
(38, 8, 1, '2026-08-13', '2026-08-15 00:40:43'),
(39, 8, 1, '2026-08-12', '2026-08-15 00:40:43'),
(40, 8, 1, '2026-08-10', '2026-08-15 00:40:43'),
(43, 9, 14, '2026-08-15', '2026-08-15 00:40:43'),
(44, 9, 14, '2026-08-13', '2026-08-15 00:40:43'),
(45, 9, 14, '2026-08-11', '2026-08-15 00:40:43'),
(46, 9, 14, '2026-08-09', '2026-08-15 00:40:43'),
(50, 10, 14, '2026-08-14', '2026-08-15 00:40:43'),
(51, 10, 14, '2026-08-12', '2026-08-15 00:40:43'),
(52, 10, 14, '2026-08-10', '2026-08-15 00:40:43'),
(53, 11, 15, '2026-08-15', '2026-08-15 00:40:43'),
(54, 11, 15, '2026-08-12', '2026-08-15 00:40:43'),
(56, 12, 15, '2026-08-13', '2026-08-15 00:40:43'),
(57, 13, 16, '2026-08-15', '2026-08-15 00:40:43'),
(58, 13, 16, '2026-08-14', '2026-08-15 00:40:43'),
(59, 13, 16, '2026-08-13', '2026-08-15 00:40:43'),
(60, 13, 16, '2026-08-12', '2026-08-15 00:40:43'),
(61, 13, 16, '2026-08-11', '2026-08-15 00:40:43'),
(62, 13, 16, '2026-08-10', '2026-08-15 00:40:43'),
(63, 13, 16, '2026-08-09', '2026-08-15 00:40:43'),
(64, 14, 16, '2026-08-15', '2026-08-15 00:40:43'),
(65, 14, 16, '2026-08-14', '2026-08-15 00:40:43'),
(66, 14, 16, '2026-08-13', '2026-08-15 00:40:43'),
(67, 14, 16, '2026-08-12', '2026-08-15 00:40:43'),
(68, 14, 16, '2026-08-10', '2026-08-15 00:40:43'),
(71, 15, 1, '2026-08-15', '2026-08-15 00:40:43'),
(72, 15, 1, '2026-08-13', '2026-08-15 00:40:43'),
(73, 15, 1, '2026-08-11', '2026-08-15 00:40:43'),
(74, 15, 1, '2026-08-09', '2026-08-15 00:40:43'),
(78, 16, 1, '2026-08-14', '2026-08-15 00:40:43'),
(79, 16, 1, '2026-08-12', '2026-08-15 00:40:43'),
(80, 16, 1, '2026-08-10', '2026-08-15 00:40:43'),
(81, 17, 14, '2026-08-15', '2026-08-15 00:40:43'),
(82, 17, 14, '2026-08-12', '2026-08-15 00:40:43'),
(84, 18, 14, '2026-08-13', '2026-08-15 00:40:43'),
(85, 19, 15, '2026-08-15', '2026-08-15 00:40:43'),
(86, 19, 15, '2026-08-14', '2026-08-15 00:40:43'),
(87, 19, 15, '2026-08-13', '2026-08-15 00:40:43'),
(88, 19, 15, '2026-08-12', '2026-08-15 00:40:43'),
(89, 19, 15, '2026-08-11', '2026-08-15 00:40:43'),
(90, 19, 15, '2026-08-10', '2026-08-15 00:40:43'),
(91, 19, 15, '2026-08-09', '2026-08-15 00:40:43'),
(92, 20, 15, '2026-08-15', '2026-08-15 00:40:43'),
(93, 20, 15, '2026-08-14', '2026-08-15 00:40:43'),
(94, 20, 15, '2026-08-13', '2026-08-15 00:40:43'),
(95, 20, 15, '2026-08-12', '2026-08-15 00:40:43'),
(96, 20, 15, '2026-08-10', '2026-08-15 00:40:43'),
(99, 21, 16, '2026-08-15', '2026-08-15 00:40:43'),
(100, 21, 16, '2026-08-13', '2026-08-15 00:40:43'),
(101, 21, 16, '2026-08-11', '2026-08-15 00:40:43'),
(102, 21, 16, '2026-08-09', '2026-08-15 00:40:43'),
(106, 22, 16, '2026-08-14', '2026-08-15 00:40:43'),
(107, 22, 16, '2026-08-12', '2026-08-15 00:40:43'),
(108, 22, 16, '2026-08-10', '2026-08-15 00:40:43'),
(109, 23, 1, '2026-08-15', '2026-08-15 00:40:43'),
(110, 23, 1, '2026-08-12', '2026-08-15 00:40:43'),
(112, 24, 1, '2026-08-13', '2026-08-15 00:40:43'),
(113, 25, 14, '2026-08-15', '2026-08-15 00:40:43'),
(114, 25, 14, '2026-08-14', '2026-08-15 00:40:43'),
(115, 25, 14, '2026-08-13', '2026-08-15 00:40:43'),
(116, 25, 14, '2026-08-12', '2026-08-15 00:40:43'),
(117, 25, 14, '2026-08-11', '2026-08-15 00:40:43'),
(118, 25, 14, '2026-08-10', '2026-08-15 00:40:43'),
(119, 25, 14, '2026-08-09', '2026-08-15 00:40:43'),
(120, 26, 14, '2026-08-15', '2026-08-15 00:40:43'),
(121, 26, 14, '2026-08-14', '2026-08-15 00:40:43'),
(122, 26, 14, '2026-08-13', '2026-08-15 00:40:43'),
(123, 26, 14, '2026-08-12', '2026-08-15 00:40:43'),
(124, 26, 14, '2026-08-10', '2026-08-15 00:40:43');

-- --------------------------------------------------------

--
-- Table structure for table `group_sessions`
--

CREATE TABLE `group_sessions` (
  `id` int(11) NOT NULL,
  `therapist_id` int(11) NOT NULL,
  `topic` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `capacity` int(11) NOT NULL DEFAULT 10,
  `scheduled_at` datetime NOT NULL,
  `status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
  `rejection_reason` varchar(500) DEFAULT NULL,
  `session_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `group_sessions`
--

INSERT INTO `group_sessions` (`id`, `therapist_id`, `topic`, `description`, `capacity`, `scheduled_at`, `status`, `rejection_reason`, `session_notes`, `created_at`) VALUES
(1, 2, 'Mindfulness & Anxiety Support Group', 'A weekly guided session on grounding techniques and anxiety management for patients dealing with everyday stress.', 10, '2026-08-20 00:40:43', 'pending', NULL, NULL, '2026-08-13 00:40:43'),
(2, 2, 'Stress Management Workshop', 'An interactive workshop covering time-management and relaxation techniques for managing work-related stress.', 15, '2026-08-25 00:40:43', 'approved', NULL, NULL, '2026-08-05 00:40:43'),
(3, 2, 'Grief Support Circle', 'A safe space for patients processing loss to share and support one another.', 8, '2026-08-10 00:40:43', 'rejected', 'Overlaps with another approved group session in the same time slot. Please resubmit with a different time.', NULL, '2026-07-31 00:40:43'),
(4, 4, 'Coping Skills Workshop', 'A group session focused on coping skills workshop.', 8, '2026-08-21 00:40:43', 'pending', NULL, NULL, '2026-08-10 00:40:43'),
(5, 5, 'Anger Management Circle', 'A group session focused on anger management circle.', 9, '2026-08-22 00:40:43', 'approved', NULL, NULL, '2026-08-09 00:40:43'),
(6, 6, 'Sleep Hygiene Group', 'A group session focused on sleep hygiene group.', 10, '2026-08-23 00:40:43', 'rejected', 'Scheduling conflict with an existing approved session.', NULL, '2026-08-08 00:40:43'),
(7, 7, 'Building Healthy Habits', 'A group session focused on building healthy habits.', 11, '2026-08-24 00:40:43', 'pending', NULL, NULL, '2026-08-07 00:40:43'),
(8, 8, 'Self-Esteem Support Group', 'A group session focused on self-esteem support group.', 12, '2026-08-25 00:40:43', 'approved', NULL, NULL, '2026-08-06 00:40:43'),
(9, 9, 'Coping Skills Workshop', 'A group session focused on coping skills workshop.', 13, '2026-08-26 00:40:43', 'rejected', 'Scheduling conflict with an existing approved session.', NULL, '2026-08-05 00:40:43'),
(10, 10, 'Anger Management Circle', 'A group session focused on anger management circle.', 14, '2026-08-27 00:40:43', 'pending', NULL, NULL, '2026-08-04 00:40:43'),
(11, 11, 'Sleep Hygiene Group', 'A group session focused on sleep hygiene group.', 15, '2026-08-28 00:40:43', 'approved', NULL, NULL, '2026-08-03 00:40:43'),
(12, 12, 'Building Healthy Habits', 'A group session focused on building healthy habits.', 16, '2026-08-29 00:40:43', 'rejected', 'Scheduling conflict with an existing approved session.', NULL, '2026-08-02 00:40:43'),
(13, 13, 'Self-Esteem Support Group', 'A group session focused on self-esteem support group.', 17, '2026-08-30 00:40:43', 'pending', NULL, NULL, '2026-08-01 00:40:43');

-- --------------------------------------------------------

--
-- Table structure for table `group_session_enrollments`
--

CREATE TABLE `group_session_enrollments` (
  `id` int(11) NOT NULL,
  `group_session_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `status` enum('requested','confirmed','attended','absent') NOT NULL DEFAULT 'requested',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `group_session_enrollments`
--

INSERT INTO `group_session_enrollments` (`id`, `group_session_id`, `patient_id`, `status`, `requested_at`) VALUES
(1, 2, 14, 'confirmed', '2026-08-15 00:40:43'),
(2, 2, 16, 'requested', '2026-08-15 00:40:43');

-- --------------------------------------------------------

--
-- Table structure for table `medical_tests`
--

CREATE TABLE `medical_tests` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medical_tests`
--

INSERT INTO `medical_tests` (`id`, `name`, `category`, `description`, `is_active`) VALUES
(1, 'PHQ-9 Depression Screening', 'Psychiatric Screening', 'Patient Health Questionnaire — depression severity', 1),
(2, 'GAD-7 Anxiety Screening', 'Psychiatric Screening', 'Generalized Anxiety Disorder 7-item scale', 1),
(3, 'MMSE (Mini-Mental State Exam)', 'Psychiatric Screening', 'Cognitive impairment screening', 1),
(4, 'Beck Depression Inventory', 'Psychiatric Screening', 'Self-report depression severity measure', 1),
(5, 'Sleep Study (Polysomnography)', 'Sleep', 'Overnight monitoring for sleep disorders', 1),
(6, 'Complete Blood Count (CBC)', 'Blood / Hematology', 'General blood health panel', 1),
(7, 'Thyroid Function Test (TSH, T3, T4)', 'Endocrine', 'Screens for thyroid-related mood symptoms', 1),
(8, 'Fasting Blood Sugar', 'Endocrine', 'Baseline glucose level', 1),
(9, 'HbA1c', 'Endocrine', '3-month average blood sugar level', 1),
(10, 'Lipid Profile', 'Cardiovascular', 'Cholesterol and triglyceride panel', 1),
(11, 'Liver Function Test (LFT)', 'Hepatic', 'Checks liver health — relevant before starting many psychiatric meds', 1),
(12, 'Renal Function Test (RFT / Creatinine)', 'Renal', 'Checks kidney function — relevant for Lithium monitoring', 1),
(13, 'Vitamin D Level', 'Vitamin / Nutrition', 'Screens for deficiency linked to mood symptoms', 1),
(14, 'Vitamin B12 Level', 'Vitamin / Nutrition', 'Screens for deficiency linked to fatigue/mood symptoms', 1),
(15, 'Serum Electrolytes', 'Blood Chemistry', 'Sodium, Potassium, Chloride levels', 1),
(16, 'ESR (Erythrocyte Sedimentation Rate)', 'Blood / Inflammation', 'General inflammation marker', 1),
(17, 'CRP (C-Reactive Protein)', 'Blood / Inflammation', 'General inflammation marker', 1),
(18, 'Urine Routine Examination', 'Urinalysis', 'General urine screening', 1),
(19, 'Lithium Serum Level', 'Drug Monitoring', 'Required periodic monitoring for patients on Lithium', 1),
(20, 'Prolactin Level', 'Endocrine', 'Monitors side effects of some antipsychotics', 1),
(21, 'Cortisol Level', 'Endocrine', 'Assesses stress-hormone / adrenal function', 1),
(22, 'Drug Toxicology Screen', 'Toxicology', 'Screens for substance use', 1),
(23, 'ECG (Electrocardiogram)', 'Cardiovascular', 'Heart rhythm check — relevant before some psychiatric medications', 1),
(24, 'EEG (Electroencephalogram)', 'Neurological', 'Brain electrical activity', 1),
(25, 'MRI Brain', 'Imaging', 'Detailed brain imaging', 1),
(26, 'CT Scan Brain', 'Imaging', 'Brain imaging, faster than MRI', 1),
(27, 'Chest X-Ray', 'Imaging', 'General chest screening', 1),
(28, 'Pregnancy Test (Beta-hCG)', 'Reproductive Health', 'Required before prescribing certain medications', 1),
(29, 'HIV Screening', 'Infectious Disease', 'Standard screening panel', 1),
(30, 'Hepatitis B Screening', 'Infectious Disease', 'Standard screening panel', 1),
(31, 'Folate Level', 'Vitamin / Nutrition', 'Screens for deficiency linked to mood symptoms', 1),
(32, 'Testosterone Level', 'Endocrine', 'Hormone panel', 1),
(33, 'Serum Calcium', 'Blood Chemistry', 'Electrolyte / bone health panel', 1),
(34, 'C-Peptide Test', 'Endocrine', 'Assesses insulin production', 1),
(35, 'Pharmacogenomic Panel (Psychiatric Medication Response)', 'Genetic', 'Guides medication choice based on genetic markers', 1);

-- --------------------------------------------------------

--
-- Table structure for table `medicines`
--

CREATE TABLE `medicines` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `generic_name` varchar(150) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `common_strength` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicines`
--

INSERT INTO `medicines` (`id`, `name`, `generic_name`, `category`, `common_strength`, `is_active`) VALUES
(1, 'Sertraline', 'Sertraline HCl', 'Antidepressant (SSRI)', '50mg', 1),
(2, 'Fluoxetine', 'Fluoxetine HCl', 'Antidepressant (SSRI)', '20mg', 1),
(3, 'Escitalopram', 'Escitalopram Oxalate', 'Antidepressant (SSRI)', '10mg', 1),
(4, 'Paroxetine', 'Paroxetine HCl', 'Antidepressant (SSRI)', '20mg', 1),
(5, 'Citalopram', 'Citalopram HBr', 'Antidepressant (SSRI)', '20mg', 1),
(6, 'Venlafaxine', 'Venlafaxine HCl', 'Antidepressant (SNRI)', '75mg', 1),
(7, 'Duloxetine', 'Duloxetine HCl', 'Antidepressant (SNRI)', '30mg', 1),
(8, 'Bupropion', 'Bupropion HCl', 'Antidepressant (NDRI)', '150mg', 1),
(9, 'Mirtazapine', 'Mirtazapine', 'Antidepressant (NaSSA)', '15mg', 1),
(10, 'Amitriptyline', 'Amitriptyline HCl', 'Antidepressant (TCA)', '25mg', 1),
(11, 'Nortriptyline', 'Nortriptyline HCl', 'Antidepressant (TCA)', '25mg', 1),
(12, 'Imipramine', 'Imipramine HCl', 'Antidepressant (TCA)', '25mg', 1),
(13, 'Clomipramine', 'Clomipramine HCl', 'Antidepressant (TCA)', '25mg', 1),
(14, 'Alprazolam', 'Alprazolam', 'Anxiolytic (Benzodiazepine)', '0.5mg', 1),
(15, 'Diazepam', 'Diazepam', 'Anxiolytic (Benzodiazepine)', '5mg', 1),
(16, 'Lorazepam', 'Lorazepam', 'Anxiolytic (Benzodiazepine)', '1mg', 1),
(17, 'Clonazepam', 'Clonazepam', 'Anxiolytic (Benzodiazepine)', '0.5mg', 1),
(18, 'Buspirone', 'Buspirone HCl', 'Anxiolytic (Non-benzodiazepine)', '10mg', 1),
(19, 'Hydroxyzine', 'Hydroxyzine HCl', 'Anxiolytic / Antihistamine', '25mg', 1),
(20, 'Propranolol', 'Propranolol HCl', 'Beta-blocker (anxiety/tremor)', '10mg', 1),
(21, 'Lithium Carbonate', 'Lithium Carbonate', 'Mood Stabilizer', '300mg', 1),
(22, 'Sodium Valproate', 'Valproic Acid', 'Mood Stabilizer', '200mg', 1),
(23, 'Lamotrigine', 'Lamotrigine', 'Mood Stabilizer', '25mg', 1),
(24, 'Carbamazepine', 'Carbamazepine', 'Mood Stabilizer', '200mg', 1),
(25, 'Quetiapine', 'Quetiapine Fumarate', 'Antipsychotic (Atypical)', '25mg', 1),
(26, 'Olanzapine', 'Olanzapine', 'Antipsychotic (Atypical)', '5mg', 1),
(27, 'Risperidone', 'Risperidone', 'Antipsychotic (Atypical)', '2mg', 1),
(28, 'Aripiprazole', 'Aripiprazole', 'Antipsychotic (Atypical)', '10mg', 1),
(29, 'Haloperidol', 'Haloperidol', 'Antipsychotic (Typical)', '5mg', 1),
(30, 'Zolpidem', 'Zolpidem Tartrate', 'Sleep Aid', '10mg', 1),
(31, 'Zopiclone', 'Zopiclone', 'Sleep Aid', '7.5mg', 1),
(32, 'Melatonin', 'Melatonin', 'Sleep Aid (Supplement)', '3mg', 1),
(33, 'Methylphenidate', 'Methylphenidate HCl', 'ADHD (Stimulant)', '10mg', 1),
(34, 'Atomoxetine', 'Atomoxetine HCl', 'ADHD (Non-stimulant)', '25mg', 1),
(35, 'Donepezil', 'Donepezil HCl', 'Cognitive / Dementia', '5mg', 1),
(36, 'Memantine', 'Memantine HCl', 'Cognitive / Dementia', '10mg', 1),
(37, 'Paracetamol', 'Acetaminophen', 'Analgesic', '500mg', 1),
(38, 'Ibuprofen', 'Ibuprofen', 'Analgesic / NSAID', '400mg', 1),
(39, 'Aspirin', 'Acetylsalicylic Acid', 'Analgesic / NSAID', '75mg', 1),
(40, 'Naproxen', 'Naproxen Sodium', 'Analgesic / NSAID', '250mg', 1),
(41, 'Diclofenac', 'Diclofenac Sodium', 'Analgesic / NSAID', '50mg', 1),
(42, 'Omeprazole', 'Omeprazole', 'Gastrointestinal (PPI)', '20mg', 1),
(43, 'Esomeprazole', 'Esomeprazole', 'Gastrointestinal (PPI)', '20mg', 1),
(44, 'Pantoprazole', 'Pantoprazole', 'Gastrointestinal (PPI)', '40mg', 1),
(45, 'Ranitidine', 'Ranitidine HCl', 'Gastrointestinal (H2 Blocker)', '150mg', 1),
(46, 'Domperidone', 'Domperidone', 'Gastrointestinal (Antiemetic)', '10mg', 1),
(47, 'Ondansetron', 'Ondansetron HCl', 'Gastrointestinal (Antiemetic)', '4mg', 1),
(48, 'Loperamide', 'Loperamide HCl', 'Gastrointestinal (Antidiarrheal)', '2mg', 1),
(49, 'ORS', 'Oral Rehydration Salts', 'Gastrointestinal (Rehydration)', '1 sachet', 1),
(50, 'Amlodipine', 'Amlodipine Besylate', 'Cardiovascular (CCB)', '5mg', 1),
(51, 'Atorvastatin', 'Atorvastatin Calcium', 'Cardiovascular (Statin)', '20mg', 1),
(52, 'Losartan', 'Losartan Potassium', 'Cardiovascular (ARB)', '50mg', 1),
(53, 'Metoprolol', 'Metoprolol Tartrate', 'Cardiovascular (Beta-blocker)', '50mg', 1),
(54, 'Metformin', 'Metformin HCl', 'Antidiabetic', '500mg', 1),
(55, 'Insulin (Regular)', 'Human Insulin', 'Antidiabetic', '100 IU/mL', 1),
(56, 'Levothyroxine', 'Levothyroxine Sodium', 'Endocrine (Thyroid)', '50mcg', 1),
(57, 'Prednisolone', 'Prednisolone', 'Corticosteroid', '5mg', 1),
(58, 'Salbutamol Inhaler', 'Salbutamol', 'Respiratory (Bronchodilator)', '100mcg/puff', 1),
(59, 'Montelukast', 'Montelukast Sodium', 'Respiratory (Leukotriene)', '10mg', 1),
(60, 'Cetirizine', 'Cetirizine HCl', 'Antihistamine', '10mg', 1),
(61, 'Loratadine', 'Loratadine', 'Antihistamine', '10mg', 1),
(62, 'Fexofenadine', 'Fexofenadine HCl', 'Antihistamine', '120mg', 1),
(63, 'Azithromycin', 'Azithromycin', 'Antibiotic (Macrolide)', '500mg', 1),
(64, 'Amoxicillin', 'Amoxicillin', 'Antibiotic (Penicillin)', '500mg', 1),
(65, 'Ciprofloxacin', 'Ciprofloxacin HCl', 'Antibiotic (Fluoroquinolone)', '500mg', 1),
(66, 'Doxycycline', 'Doxycycline Hyclate', 'Antibiotic (Tetracycline)', '100mg', 1),
(67, 'Metronidazole', 'Metronidazole', 'Antibiotic / Antiprotozoal', '400mg', 1),
(68, 'Vitamin D3', 'Cholecalciferol', 'Vitamin / Supplement', '1000 IU', 1),
(69, 'Vitamin B Complex', 'B-Complex Vitamins', 'Vitamin / Supplement', '1 tablet', 1),
(70, 'Folic Acid', 'Folic Acid', 'Vitamin / Supplement', '5mg', 1),
(71, 'Iron (Ferrous Sulfate)', 'Ferrous Sulfate', 'Vitamin / Supplement', '325mg', 1),
(72, 'Calcium Carbonate', 'Calcium Carbonate', 'Vitamin / Supplement', '500mg', 1),
(73, 'Multivitamin', 'Multivitamin & Minerals', 'Vitamin / Supplement', '1 tablet', 1),
(74, 'Omega-3', 'Fish Oil (EPA/DHA)', 'Vitamin / Supplement', '1000mg', 1),
(75, 'Zinc Sulfate', 'Zinc Sulfate', 'Vitamin / Supplement', '20mg', 1),
(76, 'Vitamin B12 (Methylcobalamin)', 'Methylcobalamin', 'Vitamin / Supplement', '1500mcg', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` varchar(500) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'general',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 2, 'Anika Rahman has booked a session with you.', 'booking_alert', 1, '2026-08-13 00:40:43'),
(2, 2, 'Tanvir Hasan has booked a session with you.', 'booking_alert', 1, '2026-08-14 00:40:43'),
(3, 2, 'Your group session \"Stress Management Workshop\" has been approved and is now visible to patients.', 'group_session_update', 0, '2026-08-06 00:40:43'),
(4, 2, 'Your group session proposal \"Grief Support Circle\" was not approved.', 'group_session_update', 0, '2026-08-01 00:40:43'),
(5, 2, 'Sadia Islam requested to join \"Stress Management Workshop\".', 'group_session_join', 0, '2026-08-12 00:40:43'),
(6, 4, 'You have a new session booked.', 'booking_alert', 0, '2026-08-14 00:40:43'),
(7, 4, 'Your group session \"Coping Skills Workshop\" status was updated to pending.', 'group_session_update', 0, '2026-08-13 00:40:43'),
(8, 5, 'You have a new session booked.', 'booking_alert', 1, '2026-08-13 00:40:43'),
(9, 5, 'Your group session \"Anger Management Circle\" status was updated to approved.', 'group_session_update', 0, '2026-08-12 00:40:43'),
(10, 6, 'You have a new session booked.', 'booking_alert', 0, '2026-08-12 00:40:43'),
(11, 6, 'Your group session \"Sleep Hygiene Group\" status was updated to rejected.', 'group_session_update', 0, '2026-08-11 00:40:43'),
(12, 7, 'You have a new session booked.', 'booking_alert', 1, '2026-08-11 00:40:43'),
(13, 7, 'Your group session \"Building Healthy Habits\" status was updated to pending.', 'group_session_update', 0, '2026-08-10 00:40:43'),
(14, 8, 'You have a new session booked.', 'booking_alert', 0, '2026-08-10 00:40:43'),
(15, 8, 'Your group session \"Self-Esteem Support Group\" status was updated to approved.', 'group_session_update', 0, '2026-08-09 00:40:43'),
(16, 9, 'You have a new session booked.', 'booking_alert', 1, '2026-08-09 00:40:43'),
(17, 9, 'Your group session \"Coping Skills Workshop\" status was updated to rejected.', 'group_session_update', 0, '2026-08-08 00:40:43'),
(18, 10, 'You have a new session booked.', 'booking_alert', 0, '2026-08-08 00:40:43'),
(19, 10, 'Your group session \"Anger Management Circle\" status was updated to pending.', 'group_session_update', 0, '2026-08-07 00:40:43'),
(20, 11, 'You have a new session booked.', 'booking_alert', 1, '2026-08-07 00:40:43'),
(21, 11, 'Your group session \"Sleep Hygiene Group\" status was updated to approved.', 'group_session_update', 0, '2026-08-06 00:40:43'),
(22, 12, 'You have a new session booked.', 'booking_alert', 0, '2026-08-06 00:40:43'),
(23, 12, 'Your group session \"Building Healthy Habits\" status was updated to rejected.', 'group_session_update', 0, '2026-08-05 00:40:43'),
(24, 13, 'You have a new session booked.', 'booking_alert', 1, '2026-08-05 00:40:43'),
(25, 13, 'Your group session \"Self-Esteem Support Group\" status was updated to pending.', 'group_session_update', 0, '2026-08-04 00:40:43'),
(26, 15, 'Don\'t forget to complete today\'s exercises and daily checklist!', 'exercise_reminder', 0, '2026-08-15 15:26:27'),
(27, 15, 'Don\'t forget to complete today\'s exercises and daily checklist!', 'exercise_reminder', 0, '2026-08-26 03:32:20'),
(28, 29, 'Don\'t forget to complete today\'s exercises and daily checklist!', 'exercise_reminder', 0, '2026-08-26 07:59:41'),
(29, 1, 'Don\'t forget to complete today\'s exercises and daily checklist!', 'exercise_reminder', 0, '2026-08-27 12:17:39'),
(30, 1, 'Don\'t forget to complete today\'s exercises and daily checklist!', 'exercise_reminder', 0, '2026-08-28 10:49:33'),
(31, 1, 'Don\'t forget to complete today\'s exercises and daily checklist!', 'exercise_reminder', 0, '2026-08-29 11:55:38'),
(32, 1, 'It\'s been a week since your last session. Ready to book your next one?', 'book_session_reminder', 0, '2026-08-29 11:55:38');

-- --------------------------------------------------------

--
-- Table structure for table `patient_profiles`
--

CREATE TABLE `patient_profiles` (
  `user_id` int(11) NOT NULL,
  `profile_photo_url` varchar(255) DEFAULT '',
  `contact_number` varchar(20) DEFAULT '',
  `location` varchar(255) DEFAULT '',
  `preferred_language` varchar(50) DEFAULT 'English'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient_profiles`
--

INSERT INTO `patient_profiles` (`user_id`, `profile_photo_url`, `contact_number`, `location`, `preferred_language`) VALUES
(1, NULL, '01712345678', 'Dhaka', 'English'),
(14, '', '01812345601', 'Dhanmondi, Dhaka', 'Bengali'),
(15, '', '01812345602', 'Gulshan, Dhaka', 'English'),
(16, '', '01812345603', 'Mirpur, Dhaka', 'Bengali'),
(17, '', '01912345601', 'Uttara, Dhaka', 'Bengali'),
(18, '', '01912345602', 'Banani, Dhaka', 'English'),
(19, '', '01912345603', 'Mohammadpur, Dhaka', 'Bengali'),
(20, '', '01912345604', 'Bashundhara, Dhaka', 'English'),
(21, '', '01912345605', 'Motijheel, Dhaka', 'Bengali'),
(22, '', '01912345606', 'Farmgate, Dhaka', 'Bengali'),
(23, '', '01912345607', 'Rampura, Dhaka', 'English'),
(24, '', '01912345608', 'Khilgaon, Dhaka', 'Bengali'),
(25, '', '01912345609', 'Badda, Dhaka', 'Bengali'),
(26, '', '01912345610', 'Dhanmondi, Dhaka', 'English'),
(27, '', '01912345611', 'Uttara, Dhaka', 'Bengali'),
(28, '', '01912345612', 'Gulshan, Dhaka', 'English');

-- --------------------------------------------------------

--
-- Table structure for table `patient_vitals`
--

CREATE TABLE `patient_vitals` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `concerns` text DEFAULT NULL COMMENT 'JSON array of selected concern chips',
  `duration` varchar(100) DEFAULT NULL,
  `severity` varchar(100) DEFAULT NULL,
  `gender_pref` varchar(50) DEFAULT NULL,
  `language_pref` varchar(50) DEFAULT NULL,
  `format_pref` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient_vitals`
--

INSERT INTO `patient_vitals` (`id`, `patient_id`, `concerns`, `duration`, `severity`, `gender_pref`, `language_pref`, `format_pref`, `notes`, `created_at`) VALUES
(1, 1, '[\"Anxiety\"]', '2-4 weeks', 'Moderate — affecting my daily life', 'Male', 'No preference', 'Either', 'no\n', '2026-08-28 14:59:52'),
(2, 1, '[\"Depression\"]', '2-4 weeks', 'Mild — manageable most days', 'Male', 'No preference', 'Either', 'no', '2026-08-28 15:07:27'),
(3, 1, '[\"Anxiety\"]', '2-4 weeks', 'Moderate — affecting my daily life', 'Male', 'No preference', 'Either', 'n', '2026-08-28 15:10:07'),
(4, 1, '[\"Substance Use\"]', '1-6 months', 'Moderate — affecting my daily life', 'Male', 'No preference', 'Either', 'n', '2026-08-29 01:16:21'),
(5, 1, '[\"Depression\"]', '2-4 weeks', 'Moderate — affecting my daily life', 'Female', 'No preference', 'Either', '', '2026-08-29 07:53:22'),
(6, 1, '[\"Depression\"]', 'Less than 2 weeks', 'Mild — manageable most days', 'No preference', 'No preference', 'Either', '', '2026-08-29 09:08:55'),
(7, 1, '[\"Sleep Problems\"]', 'More than 6 months', 'Severe — significantly impacting me', 'No preference', 'No preference', 'Either', '', '2026-08-29 09:40:52'),
(8, 1, '[\"Anxiety\"]', '2-4 weeks', 'Mild — manageable most days', 'No preference', 'No preference', 'Either', '', '2026-08-29 11:56:32'),
(9, 1, '[\"Sleep Problems\"]', '1-6 months', 'Severe — significantly impacting me', 'No preference', 'No preference', 'In-Person', '', '2026-08-29 12:04:54'),
(10, 1, '[\"Depression\"]', 'Less than 2 weeks', 'Moderate — affecting my daily life', 'No preference', 'No preference', 'In-Person', '', '2026-08-29 15:01:35'),
(11, 1, '[\"Substance Use\"]', '1-6 months', 'Severe — significantly impacting me', 'No preference', 'No preference', 'Either', '', '2026-08-29 15:33:52');

-- --------------------------------------------------------

--
-- Table structure for table `prescriptions`
--

CREATE TABLE `prescriptions` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `therapist_id` int(11) NOT NULL,
  `session_notes` text DEFAULT NULL,
  `medications` text DEFAULT NULL,
  `presession_summary` text DEFAULT NULL,
  `additional_briefing` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `care_plan_accepted` tinyint(1) NOT NULL DEFAULT 0,
  `follow_up_recommended` tinyint(1) NOT NULL DEFAULT 0,
  `follow_up_date` date DEFAULT NULL,
  `follow_up_notes` text DEFAULT NULL,
  `follow_up_status` enum('none','proposed','accepted','declined') NOT NULL DEFAULT 'none',
  `follow_up_responded_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `prescriptions`
--

INSERT INTO `prescriptions` (`id`, `session_id`, `patient_id`, `therapist_id`, `session_notes`, `medications`, `presession_summary`, `additional_briefing`, `created_at`, `updated_at`, `care_plan_accepted`) VALUES
(1, 5, 14, 2, 'Good progress this session. Anxiety symptoms have noticeably decreased since starting the breathing exercises. Continuing current plan.', 'Sertraline 50mg - once daily, morning', NULL, NULL, '2026-08-15 00:40:43', '2026-08-15 00:40:43', 0),
(2, 7, 15, 2, 'Discussed work-related stress triggers. Patient reports difficulty keeping up with the exercise routine on busy days - agreed to shorter daily sessions.', 'None currently prescribed', NULL, NULL, '2026-08-15 00:40:43', '2026-08-15 00:40:43', 0),
(3, 9, 16, 2, 'Patient has missed several check-ins. Following up to see if the current plan still fits their schedule.', 'Escitalopram 10mg - once daily', NULL, NULL, '2026-08-15 00:40:43', '2026-08-15 00:40:43', 0),
(4, 15, 1, 4, 'Session went well. Reviewing homework from last week and adjusting the plan going forward.', 'As discussed in session', NULL, NULL, '2026-08-15 00:40:43', '2026-08-27 12:18:59', 1),
(5, 18, 14, 5, 'Session went well. Reviewing homework from last week and adjusting the plan going forward.', 'As discussed in session', NULL, NULL, '2026-08-15 00:40:43', '2026-08-15 00:40:43', 0),
(6, 21, 15, 6, 'Session went well. Reviewing homework from last week and adjusting the plan going forward.', 'As discussed in session', NULL, NULL, '2026-08-15 00:40:43', '2026-08-15 00:40:43', 0),
(7, 24, 16, 7, 'Session went well. Reviewing homework from last week and adjusting the plan going forward.', 'As discussed in session', NULL, NULL, '2026-08-15 00:40:43', '2026-08-15 00:40:43', 0),
(8, 27, 1, 8, 'Session went well. Reviewing homework from last week and adjusting the plan going forward.', 'As discussed in session', NULL, NULL, '2026-08-15 00:40:43', '2026-08-28 03:28:23', 1),
(9, 30, 14, 9, 'Session went well. Reviewing homework from last week and adjusting the plan going forward.', 'As discussed in session', NULL, NULL, '2026-08-15 00:40:43', '2026-08-15 00:40:43', 0),
(10, 33, 15, 10, 'Session went well. Reviewing homework from last week and adjusting the plan going forward.', 'As discussed in session', NULL, NULL, '2026-08-15 00:40:43', '2026-08-15 00:40:43', 0),
(11, 36, 16, 11, 'Session went well. Reviewing homework from last week and adjusting the plan going forward.', 'As discussed in session', NULL, NULL, '2026-08-15 00:40:43', '2026-08-15 00:40:43', 0),
(12, 39, 1, 12, 'Session went well. Reviewing homework from last week and adjusting the plan going forward.', 'As discussed in session', NULL, NULL, '2026-08-15 00:40:43', '2026-08-15 00:40:43', 0),
(13, 42, 14, 13, 'Session went well. Reviewing homework from last week and adjusting the plan going forward.', 'As discussed in session', NULL, NULL, '2026-08-15 00:40:43', '2026-08-15 00:40:43', 0);

-- --------------------------------------------------------

--
-- Table structure for table `prescription_medicines`
--

CREATE TABLE `prescription_medicines` (
  `id` int(11) NOT NULL,
  `prescription_id` int(11) NOT NULL,
  `medicine_id` int(11) DEFAULT NULL,
  `medicine_name` varchar(150) NOT NULL COMMENT 'snapshot, kept even if the catalog entry changes later',
  `dosage` varchar(50) DEFAULT NULL COMMENT 'e.g. 50mg, 1 tablet',
  `frequency_code` varchar(20) DEFAULT NULL COMMENT 'Rx-pad style, e.g. 1-0-1',
  `frequency_label` varchar(100) DEFAULT NULL COMMENT 'e.g. Morning & Night',
  `duration_days` int(11) DEFAULT NULL,
  `instructions` varchar(150) DEFAULT NULL COMMENT 'e.g. After meal',
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `prescription_tests`
--

CREATE TABLE `prescription_tests` (
  `id` int(11) NOT NULL,
  `prescription_id` int(11) NOT NULL,
  `test_id` int(11) DEFAULT NULL,
  `test_name` varchar(150) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `therapist_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `tags` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `session_id`, `patient_id`, `therapist_id`, `rating`, `tags`, `created_at`) VALUES
(1, 6, 14, 2, 5, 'Empathetic,Punctual,Great listener', '2026-06-15 00:40:43'),
(2, 8, 15, 2, 4, 'Professional,Empathetic', '2026-05-15 00:40:43'),
(3, 11, 1, 2, 5, 'Empathetic,Helpful', '2026-07-15 00:40:43'),
(4, 15, 1, 4, 5, 'Empathetic,Punctual', '2026-08-03 00:40:43'),
(5, 18, 14, 5, 4, 'Professional,Helpful', '2026-07-28 00:40:43'),
(6, 21, 15, 6, 3, 'Great listener,Patient', '2026-07-22 00:40:43'),
(7, 24, 16, 7, 5, 'Knowledgeable,Calm', '2026-07-16 00:40:43'),
(8, 27, 1, 8, 4, 'Encouraging,Empathetic', '2026-07-10 00:40:43'),
(9, 30, 14, 9, 5, 'Empathetic,Punctual', '2026-07-04 00:40:43'),
(10, 33, 15, 10, 4, 'Professional,Helpful', '2026-06-28 00:40:43'),
(11, 36, 16, 11, 3, 'Great listener,Patient', '2026-06-22 00:40:43'),
(12, 39, 1, 12, 5, 'Knowledgeable,Calm', '2026-06-16 00:40:43'),
(13, 42, 14, 13, 4, 'Encouraging,Empathetic', '2026-06-10 00:40:43'),
(14, 12, 1, 2, 5, '[\"Warm and supportive\",\"Listens carefully\",\"Good at treatment\",\"Comfortable pace\"]', '2026-08-27 12:18:08');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `therapist_id` int(11) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `fee` decimal(10,2) DEFAULT NULL,
  `scheduled_date` date DEFAULT NULL,
  `scheduled_time` time DEFAULT NULL,
  `session_type` enum('online','in-person') NOT NULL DEFAULT 'online',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `time_slot` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `patient_id`, `therapist_id`, `status`, `fee`, `scheduled_date`, `scheduled_time`, `session_type`, `created_at`, `updated_at`, `time_slot`) VALUES
(1, 14, 2, 'confirmed', 1500.00, '2026-08-15', '10:00:00', 'online', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(2, 15, 2, 'in_progress', 1500.00, '2026-08-15', '13:30:00', 'in-person', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(3, 16, 2, 'confirmed', 1500.00, '2026-08-22', '11:00:00', 'online', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(4, 15, 2, 'cancelled', 1500.00, NULL, NULL, 'online', '2026-07-26 00:40:43', '2026-08-15 00:40:43', NULL),
(5, 14, 2, 'completed', 1500.00, '2026-08-01', NULL, 'online', '2026-08-01 00:40:43', '2026-08-15 00:40:43', NULL),
(6, 14, 2, 'completed', 1500.00, '2026-06-16', NULL, 'online', '2026-06-15 00:40:43', '2026-08-15 00:40:43', NULL),
(7, 15, 2, 'completed', 1500.00, '2026-08-05', NULL, 'in-person', '2026-08-05 00:40:43', '2026-08-15 00:40:43', NULL),
(8, 15, 2, 'completed', 1500.00, '2026-05-17', NULL, 'online', '2026-05-15 00:40:43', '2026-08-15 00:40:43', NULL),
(9, 16, 2, 'completed', 1500.00, '2026-08-09', NULL, 'online', '2026-08-09 00:40:43', '2026-08-15 00:40:43', NULL),
(10, 16, 2, 'completed', 1800.00, '2026-04-17', NULL, 'in-person', '2026-04-15 00:40:43', '2026-08-15 00:40:43', NULL),
(11, 1, 2, 'cancelled', 1500.00, '2026-07-16', NULL, 'online', '2026-07-15 00:40:43', '2026-08-28 03:35:34', NULL),
(12, 1, 2, 'completed', 1500.00, '2026-03-18', NULL, 'online', '2026-03-15 00:40:43', '2026-08-15 00:40:43', NULL),
(13, 15, 4, 'pending', 1200.00, '2026-08-15', '09:30:00', 'online', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(14, 14, 4, 'confirmed', 1200.00, '2026-08-20', '11:00:00', 'in-person', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(15, 1, 4, 'cancelled', 1200.00, '2026-08-03', NULL, 'online', '2026-08-03 00:40:43', '2026-08-28 03:35:23', NULL),
(16, 16, 5, 'confirmed', 1300.00, '2026-08-15', '11:00:00', 'online', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(17, 15, 5, 'confirmed', 1300.00, '2026-08-21', '11:00:00', 'in-person', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(18, 14, 5, 'completed', 1300.00, '2026-07-28', NULL, 'online', '2026-07-28 00:40:43', '2026-08-15 00:40:43', NULL),
(19, 1, 6, 'cancelled', 1400.00, '2026-08-15', '14:00:00', 'online', '2026-08-15 00:40:43', '2026-08-28 03:26:37', NULL),
(20, 16, 6, 'confirmed', 1400.00, '2026-08-22', '11:00:00', 'in-person', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(21, 15, 6, 'completed', 1400.00, '2026-07-22', NULL, 'online', '2026-07-22 00:40:43', '2026-08-15 00:40:43', NULL),
(22, 14, 7, 'confirmed', 1500.00, '2026-08-15', '16:00:00', 'online', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(23, 1, 7, 'cancelled', 1500.00, '2026-08-23', '11:00:00', 'in-person', '2026-08-15 00:40:43', '2026-08-27 12:36:07', NULL),
(24, 16, 7, 'completed', 1500.00, '2026-07-16', NULL, 'online', '2026-07-16 00:40:43', '2026-08-15 00:40:43', NULL),
(25, 15, 8, 'pending', 1600.00, '2026-08-15', '09:30:00', 'online', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(26, 14, 8, 'confirmed', 1600.00, '2026-08-24', '11:00:00', 'in-person', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(27, 1, 8, 'cancelled', 1600.00, '2026-07-10', NULL, 'online', '2026-07-10 00:40:43', '2026-08-28 03:38:08', NULL),
(28, 16, 9, 'confirmed', 1700.00, '2026-08-15', '11:00:00', 'online', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(29, 15, 9, 'confirmed', 1700.00, '2026-08-25', '11:00:00', 'in-person', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(30, 14, 9, 'completed', 1700.00, '2026-07-04', NULL, 'online', '2026-07-04 00:40:43', '2026-08-15 00:40:43', NULL),
(31, 1, 10, 'cancelled', 1800.00, '2026-08-15', '14:00:00', 'online', '2026-08-15 00:40:43', '2026-08-28 03:35:16', NULL),
(32, 16, 10, 'confirmed', 1800.00, '2026-08-26', '11:00:00', 'in-person', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(33, 15, 10, 'completed', 1800.00, '2026-06-28', NULL, 'online', '2026-06-28 00:40:43', '2026-08-15 00:40:43', NULL),
(34, 14, 11, 'confirmed', 1900.00, '2026-08-15', '16:00:00', 'online', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(35, 1, 11, 'cancelled', 1900.00, '2026-08-27', '11:00:00', 'in-person', '2026-08-15 00:40:43', '2026-08-27 12:19:13', NULL),
(36, 16, 11, 'completed', 1900.00, '2026-06-22', NULL, 'online', '2026-06-22 00:40:43', '2026-08-15 00:40:43', NULL),
(37, 15, 12, 'pending', 2000.00, '2026-08-15', '09:30:00', 'online', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(38, 14, 12, 'confirmed', 2000.00, '2026-08-28', '11:00:00', 'in-person', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(39, 1, 12, 'cancelled', 2000.00, '2026-06-16', NULL, 'online', '2026-06-16 00:40:43', '2026-08-28 04:58:48', NULL),
(40, 16, 13, 'confirmed', 2100.00, '2026-08-15', '11:00:00', 'online', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(41, 15, 13, 'confirmed', 2100.00, '2026-08-29', '11:00:00', 'in-person', '2026-08-15 00:40:43', '2026-08-15 00:40:43', NULL),
(42, 14, 13, 'completed', 2100.00, '2026-06-10', NULL, 'online', '2026-06-10 00:40:43', '2026-08-15 00:40:43', NULL),
(43, 1, 2, 'cancelled', NULL, '2026-08-29', NULL, 'online', '2026-08-28 05:01:01', '2026-08-28 05:01:06', '12:00 PM - 01:00 PM'),
(44, 1, 4, 'cancelled', NULL, '2026-08-31', NULL, 'online', '2026-08-28 05:03:55', '2026-08-28 05:05:06', '02:00 PM - 03:00 PM'),
(45, 1, 4, 'cancelled', NULL, '2026-08-31', NULL, 'online', '2026-08-28 06:32:17', '2026-08-28 11:24:42', '02:00 PM - 03:00 PM'),
(46, 1, 4, 'cancelled', NULL, '2026-10-05', NULL, 'online', '2026-08-28 10:00:38', '2026-08-28 11:18:09', '02:00 PM - 03:00 PM'),
(47, 1, 4, 'pending', NULL, '2026-08-31', NULL, 'online', '2026-08-29 11:56:12', '2026-08-29 11:56:12', '02:00 PM - 03:00 PM');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('application_deadline', '2026-08-01 00:00:00'),
('application_deadline_active', '1'),
('application_deadline_date', '2026-08-31'),
('application_deadline_time', '23:59');

-- --------------------------------------------------------

--
-- Table structure for table `task_completions`
--

CREATE TABLE `task_completions` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `completed_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `therapist_applications`
--

CREATE TABLE `therapist_applications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `national_id` varchar(50) DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `position_applied` varchar(100) DEFAULT NULL,
  `employment_type` varchar(50) DEFAULT NULL,
  `shift_availability` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `desired_salary` decimal(10,2) DEFAULT NULL,
  `primary_license` text NOT NULL,
  `npi` varchar(50) DEFAULT NULL,
  `basic_certs` text DEFAULT NULL,
  `specialty_certs` text DEFAULT NULL,
  `education_history` text DEFAULT NULL,
  `employment_history` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `emr_experience` varchar(255) DEFAULT NULL,
  `languages` varchar(255) DEFAULT NULL,
  `therapeutic_modalities` varchar(255) DEFAULT NULL,
  `malpractice_history` text DEFAULT NULL,
  `license_suspension` tinyint(1) DEFAULT 0,
  `criminal_record` tinyint(1) DEFAULT 0,
  `oig_exclusion` tinyint(1) DEFAULT 0,
  `immunization_proof` tinyint(1) DEFAULT 0,
  `physical_capability` tinyint(1) DEFAULT 0,
  `professional_references` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `truthfulness_attestation` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('pending','under_review','approved','rejected') DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `viva_scheduled_at` datetime DEFAULT NULL,
  `viva_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `therapist_applications`
--

INSERT INTO `therapist_applications` (`id`, `user_id`, `name`, `email`, `address`, `phone`, `national_id`, `emergency_contact`, `position_applied`, `employment_type`, `shift_availability`, `start_date`, `desired_salary`, `primary_license`, `npi`, `basic_certs`, `specialty_certs`, `education_history`, `employment_history`, `emr_experience`, `languages`, `therapeutic_modalities`, `malpractice_history`, `license_suspension`, `criminal_record`, `oig_exclusion`, `immunization_proof`, `physical_capability`, `professional_references`, `truthfulness_attestation`, `status`, `reviewed_by`, `reviewed_at`, `viva_scheduled_at`, `viva_notes`, `created_at`) VALUES
(1, NULL, 'Dr. Robert Frost', 'robert@test.com', NULL, '01700000001', NULL, NULL, 'Clinical Psychologist', 'Full-time', NULL, NULL, NULL, 'LIC-12345 (NY)', 'NPI-9991', NULL, NULL, NULL, NULL, 'Epic, Cerner', NULL, NULL, 'None', 0, 0, 0, 0, 0, NULL, 1, 'pending', NULL, NULL, NULL, NULL, '2026-07-07 03:48:44'),
(2, NULL, 'Dr. Emily Chen', 'emily@test.com', NULL, '01700000002', NULL, NULL, 'Occupational Therapist', 'Part-time', NULL, NULL, NULL, 'LIC-67890 (CA)', 'NPI-9992', NULL, NULL, NULL, NULL, 'Meditech', NULL, NULL, 'None', 0, 0, 0, 0, 0, NULL, 1, 'pending', NULL, NULL, NULL, NULL, '2026-07-07 03:48:44');

-- --------------------------------------------------------

--
-- Table structure for table `therapist_availability`
--

CREATE TABLE `therapist_availability` (
  `id` int(11) NOT NULL,
  `therapist_id` int(11) NOT NULL,
  `day_of_week` tinyint(4) NOT NULL COMMENT '0=Monday ... 6=Sunday, matches ScheduleManager.jsx DAYS array',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `therapist_availability`
--

INSERT INTO `therapist_availability` (`id`, `therapist_id`, `day_of_week`, `start_time`, `end_time`) VALUES
(1, 2, 0, '09:00:00', '10:00:00'),
(2, 2, 0, '10:00:00', '11:00:00'),
(3, 2, 0, '11:00:00', '12:00:00'),
(4, 2, 0, '12:00:00', '13:00:00'),
(5, 2, 0, '13:00:00', '14:00:00'),
(6, 2, 0, '14:00:00', '15:00:00'),
(7, 2, 0, '15:00:00', '16:00:00'),
(8, 2, 0, '16:00:00', '17:00:00'),
(9, 2, 1, '09:00:00', '10:00:00'),
(10, 2, 1, '10:00:00', '11:00:00'),
(11, 2, 1, '11:00:00', '12:00:00'),
(12, 2, 1, '12:00:00', '13:00:00'),
(13, 2, 1, '13:00:00', '14:00:00'),
(14, 2, 1, '14:00:00', '15:00:00'),
(15, 2, 1, '15:00:00', '16:00:00'),
(16, 2, 1, '16:00:00', '17:00:00'),
(17, 2, 2, '09:00:00', '10:00:00'),
(18, 2, 2, '10:00:00', '11:00:00'),
(19, 2, 2, '11:00:00', '12:00:00'),
(20, 2, 2, '12:00:00', '13:00:00'),
(21, 2, 2, '13:00:00', '14:00:00'),
(22, 2, 2, '14:00:00', '15:00:00'),
(23, 2, 2, '15:00:00', '16:00:00'),
(24, 2, 2, '16:00:00', '17:00:00'),
(25, 2, 3, '09:00:00', '10:00:00'),
(26, 2, 3, '10:00:00', '11:00:00'),
(27, 2, 3, '11:00:00', '12:00:00'),
(28, 2, 3, '12:00:00', '13:00:00'),
(29, 2, 3, '13:00:00', '14:00:00'),
(30, 2, 3, '14:00:00', '15:00:00'),
(31, 2, 3, '15:00:00', '16:00:00'),
(32, 2, 3, '16:00:00', '17:00:00'),
(33, 2, 4, '09:00:00', '10:00:00'),
(34, 2, 4, '10:00:00', '11:00:00'),
(35, 2, 4, '11:00:00', '12:00:00'),
(36, 2, 4, '12:00:00', '13:00:00'),
(37, 2, 4, '13:00:00', '14:00:00'),
(38, 2, 4, '14:00:00', '15:00:00'),
(39, 2, 4, '15:00:00', '16:00:00'),
(40, 2, 4, '16:00:00', '17:00:00'),
(41, 2, 5, '10:00:00', '11:00:00'),
(42, 2, 5, '11:00:00', '12:00:00'),
(43, 2, 5, '12:00:00', '13:00:00'),
(44, 4, 0, '10:00:00', '11:00:00'),
(45, 4, 0, '11:00:00', '12:00:00'),
(46, 4, 0, '14:00:00', '15:00:00'),
(47, 4, 2, '10:00:00', '11:00:00'),
(48, 4, 2, '11:00:00', '12:00:00'),
(49, 4, 2, '14:00:00', '15:00:00'),
(50, 4, 4, '10:00:00', '11:00:00'),
(51, 4, 4, '11:00:00', '12:00:00'),
(52, 4, 4, '14:00:00', '15:00:00'),
(53, 5, 0, '10:00:00', '11:00:00'),
(54, 5, 0, '11:00:00', '12:00:00'),
(55, 5, 0, '14:00:00', '15:00:00'),
(56, 5, 2, '10:00:00', '11:00:00'),
(57, 5, 2, '11:00:00', '12:00:00'),
(58, 5, 2, '14:00:00', '15:00:00'),
(59, 5, 4, '10:00:00', '11:00:00'),
(60, 5, 4, '11:00:00', '12:00:00'),
(61, 5, 4, '14:00:00', '15:00:00'),
(62, 6, 0, '10:00:00', '11:00:00'),
(63, 6, 0, '11:00:00', '12:00:00'),
(64, 6, 0, '14:00:00', '15:00:00'),
(65, 6, 2, '10:00:00', '11:00:00'),
(66, 6, 2, '11:00:00', '12:00:00'),
(67, 6, 2, '14:00:00', '15:00:00'),
(68, 6, 4, '10:00:00', '11:00:00'),
(69, 6, 4, '11:00:00', '12:00:00'),
(70, 6, 4, '14:00:00', '15:00:00'),
(71, 7, 0, '10:00:00', '11:00:00'),
(72, 7, 0, '11:00:00', '12:00:00'),
(73, 7, 0, '14:00:00', '15:00:00'),
(74, 7, 2, '10:00:00', '11:00:00'),
(75, 7, 2, '11:00:00', '12:00:00'),
(76, 7, 2, '14:00:00', '15:00:00'),
(77, 7, 4, '10:00:00', '11:00:00'),
(78, 7, 4, '11:00:00', '12:00:00'),
(79, 7, 4, '14:00:00', '15:00:00'),
(80, 8, 0, '10:00:00', '11:00:00'),
(81, 8, 0, '11:00:00', '12:00:00'),
(82, 8, 0, '14:00:00', '15:00:00'),
(83, 8, 2, '10:00:00', '11:00:00'),
(84, 8, 2, '11:00:00', '12:00:00'),
(85, 8, 2, '14:00:00', '15:00:00'),
(86, 8, 4, '10:00:00', '11:00:00'),
(87, 8, 4, '11:00:00', '12:00:00'),
(88, 8, 4, '14:00:00', '15:00:00'),
(89, 9, 0, '10:00:00', '11:00:00'),
(90, 9, 0, '11:00:00', '12:00:00'),
(91, 9, 0, '14:00:00', '15:00:00'),
(92, 9, 2, '10:00:00', '11:00:00'),
(93, 9, 2, '11:00:00', '12:00:00'),
(94, 9, 2, '14:00:00', '15:00:00'),
(95, 9, 4, '10:00:00', '11:00:00'),
(96, 9, 4, '11:00:00', '12:00:00'),
(97, 9, 4, '14:00:00', '15:00:00'),
(98, 10, 0, '10:00:00', '11:00:00'),
(99, 10, 0, '11:00:00', '12:00:00'),
(100, 10, 0, '14:00:00', '15:00:00'),
(101, 10, 2, '10:00:00', '11:00:00'),
(102, 10, 2, '11:00:00', '12:00:00'),
(103, 10, 2, '14:00:00', '15:00:00'),
(104, 10, 4, '10:00:00', '11:00:00'),
(105, 10, 4, '11:00:00', '12:00:00'),
(106, 10, 4, '14:00:00', '15:00:00'),
(107, 11, 0, '10:00:00', '11:00:00'),
(108, 11, 0, '11:00:00', '12:00:00'),
(109, 11, 0, '14:00:00', '15:00:00'),
(110, 11, 2, '10:00:00', '11:00:00'),
(111, 11, 2, '11:00:00', '12:00:00'),
(112, 11, 2, '14:00:00', '15:00:00'),
(113, 11, 4, '10:00:00', '11:00:00'),
(114, 11, 4, '11:00:00', '12:00:00'),
(115, 11, 4, '14:00:00', '15:00:00'),
(116, 12, 0, '10:00:00', '11:00:00'),
(117, 12, 0, '11:00:00', '12:00:00'),
(118, 12, 0, '14:00:00', '15:00:00'),
(119, 12, 2, '10:00:00', '11:00:00'),
(120, 12, 2, '11:00:00', '12:00:00'),
(121, 12, 2, '14:00:00', '15:00:00'),
(122, 12, 4, '10:00:00', '11:00:00'),
(123, 12, 4, '11:00:00', '12:00:00'),
(124, 12, 4, '14:00:00', '15:00:00'),
(125, 13, 0, '10:00:00', '11:00:00'),
(126, 13, 0, '11:00:00', '12:00:00'),
(127, 13, 0, '14:00:00', '15:00:00'),
(128, 13, 2, '10:00:00', '11:00:00'),
(129, 13, 2, '11:00:00', '12:00:00'),
(130, 13, 2, '14:00:00', '15:00:00'),
(131, 13, 4, '10:00:00', '11:00:00'),
(132, 13, 4, '11:00:00', '12:00:00'),
(133, 13, 4, '14:00:00', '15:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `therapist_availability_exceptions`
--

CREATE TABLE `therapist_availability_exceptions` (
  `id` int(11) NOT NULL,
  `therapist_id` int(11) NOT NULL,
  `exception_date` date NOT NULL,
  `type` enum('blocked','custom_hours') NOT NULL DEFAULT 'blocked',
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `therapist_availability_exceptions`
--

INSERT INTO `therapist_availability_exceptions` (`id`, `therapist_id`, `exception_date`, `type`, `start_time`, `end_time`, `reason`, `created_at`) VALUES
(1, 2, '2026-08-24', 'blocked', NULL, NULL, 'Annual leave', '2026-08-15 00:40:43'),
(2, 2, '2026-08-31', 'custom_hours', '12:00:00', '15:00:00', 'Half day - conference', '2026-08-15 00:40:43');

-- --------------------------------------------------------

--
-- Table structure for table `therapist_profiles`
--

CREATE TABLE `therapist_profiles` (
  `user_id` int(11) NOT NULL,
  `profile_photo_url` varchar(255) DEFAULT '',
  `biography` text DEFAULT NULL,
  `specialties` varchar(255) DEFAULT '',
  `languages` varchar(255) DEFAULT '',
  `consultation_fee` decimal(10,2) DEFAULT 0.00,
  `session_type` enum('online','in-person','both') DEFAULT 'both',
  `hospital_name` varchar(150) DEFAULT '',
  `qualification` varchar(150) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `therapist_profiles`
--

INSERT INTO `therapist_profiles` (`user_id`, `profile_photo_url`, `biography`, `specialties`, `languages`, `consultation_fee`, `session_type`, `hospital_name`, `qualification`) VALUES
(2, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', 1500.00, 'both', '', ''),
(4, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', 1500.00, 'both', '', ''),
(5, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', 1500.00, 'both', '', ''),
(6, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', 1500.00, 'both', '', ''),
(7, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', 1500.00, 'both', '', ''),
(8, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', 1500.00, 'both', '', ''),
(9, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', 1500.00, 'both', '', ''),
(10, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', 1500.00, 'both', '', ''),
(11, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', 1500.00, 'both', '', ''),
(12, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', 1500.00, 'both', '', ''),
(13, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', 1500.00, 'both', '', '');

-- --------------------------------------------------------

--
-- Table structure for table `therapist_schedule_settings`
--

CREATE TABLE `therapist_schedule_settings` (
  `therapist_id` int(11) NOT NULL,
  `slot_duration_minutes` int(11) NOT NULL DEFAULT 30,
  `buffer_minutes` int(11) NOT NULL DEFAULT 0,
  `last_confirmed_at` timestamp NULL DEFAULT NULL COMMENT 'Stamped every time the therapist saves ScheduleManager — treated as "I confirm this is my schedule".'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `therapist_schedule_settings`
--

INSERT INTO `therapist_schedule_settings` (`therapist_id`, `slot_duration_minutes`, `buffer_minutes`, `last_confirmed_at`) VALUES
(2, 60, 10, NULL),
(4, 60, 0, NULL),
(5, 60, 10, NULL),
(6, 60, 15, NULL),
(7, 60, 5, NULL),
(8, 60, 0, NULL),
(9, 60, 10, NULL),
(10, 60, 15, NULL),
(11, 60, 5, NULL),
(12, 60, 0, NULL),
(13, 60, 10, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('patient','therapist','admin') NOT NULL,
  `status` enum('active','suspended','deactivated') NOT NULL DEFAULT 'active',
  `last_login` timestamp NULL DEFAULT NULL,
  `suspended_at` timestamp NULL DEFAULT NULL,
  `deactivated_at` timestamp NULL DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `display_name`, `email`, `password`, `role`, `status`, `last_login`, `suspended_at`, `deactivated_at`, `contact_number`, `location`, `profile_photo`, `created_at`) VALUES
(1, 'Noor Jahan Oishee', 'Noor Jahan Oishee', 'patient@test.com', 'password123', 'patient', 'active', '2026-08-29 15:01:20', NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:07:25'),
(2, 'Yasar Mostafa', 'Yasar Mostafa', 'therapist@test.com', 'password123', 'therapist', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:07:25'),
(3, 'Sultan Mohammad Farid', 'Sultan Mohammad Farid', 'admin@test.com', 'admin123', 'admin', 'active', '2026-08-26 08:10:50', NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:07:25'),
(4, 'Dr. Ayesha Rahman', 'Dr. Ayesha Rahman', 'ayesha@therapy.com', 'password123', 'therapist', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:25:53'),
(5, 'Dr. Kamal Hossain', 'Dr. Kamal Hossain', 'kamal@therapy.com', 'password123', 'therapist', 'active', '2026-08-28 10:48:45', NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:25:53'),
(6, 'Dr. Sarah Ahmed', 'Dr. Sarah Ahmed', 'sarah@therapy.com', 'password123', 'therapist', 'active', '2026-08-26 05:56:57', NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:25:53'),
(7, 'Dr. Tariqul Islam', 'Dr. Tariqul Islam', 'tariqul@therapy.com', 'password123', 'therapist', 'active', '2026-08-26 03:33:04', NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:25:53'),
(8, 'Dr. Farhana Akter', 'Dr. Farhana Akter', 'farhana@therapy.com', 'password123', 'therapist', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:25:53'),
(9, 'Dr. Rafiq Mahmud', 'Dr. Rafiq Mahmud', 'rafiq@therapy.com', 'password123', 'therapist', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:25:53'),
(10, 'Dr. Nusrat Jahan', 'Dr. Nusrat Jahan', 'nusrat@therapy.com', 'password123', 'therapist', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:25:53'),
(11, 'Dr. Imran Khan', 'Dr. Imran Khan', 'imran@therapy.com', 'password123', 'therapist', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:25:53'),
(12, 'Dr. Salma Begum', 'Dr. Salma Begum', 'salma@therapy.com', 'password123', 'therapist', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:25:53'),
(13, 'Dr. Zaid Hasan', 'Dr. Zaid Hasan', 'zaid@therapy.com', 'password123', 'therapist', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-07 03:25:53'),
(14, 'Anika Rahman', 'Anika Rahman', 'anika@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-13 15:22:47'),
(15, 'Tanvir Hasan', 'Tanvir Hasan', 'tanvir@test.com', 'password123', 'patient', 'active', '2026-08-26 06:56:45', NULL, NULL, NULL, NULL, NULL, '2026-07-13 15:22:47'),
(16, 'Sadia Islam', 'Sadia Islam', 'sadia@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-13 15:22:47'),
(17, 'Rafiul Islam', 'Rafiul Islam', 'rafiul@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-18 00:40:43'),
(18, 'Mim Akter', 'Mim Akter', 'mim@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 00:40:43'),
(19, 'Shanto Das', 'Shanto Das', 'shanto@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-07 00:40:43'),
(20, 'Priya Chowdhury', 'Priya Chowdhury', 'priya@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-17 00:40:43'),
(21, 'Arif Hossain', 'Arif Hossain', 'arif@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-27 00:40:43'),
(22, 'Nabila Sultana', 'Nabila Sultana', 'nabila@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-07 00:40:43'),
(23, 'Fahim Ahmed', 'Fahim Ahmed', 'fahim@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-17 00:40:43'),
(24, 'Ruma Begum', 'Ruma Begum', 'ruma@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-27 00:40:43'),
(25, 'Sabbir Rahman', 'Sabbir Rahman', 'sabbir@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-06 00:40:43'),
(26, 'Tania Ferdous', 'Tania Ferdous', 'tania@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-16 00:40:43'),
(27, 'Mahin Chowdhury', 'Mahin Chowdhury', 'mahin@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-01 00:40:43'),
(28, 'Jannatul Ferdous', 'Jannatul Ferdous', 'jannat@test.com', 'password123', 'patient', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-16 00:40:43'),
(29, '', 'Patient Teset', 'patient100@test.com', 'patient123', 'patient', 'active', '2026-08-26 07:59:41', NULL, NULL, NULL, NULL, NULL, '2026-08-26 06:57:51');

-- --------------------------------------------------------

--
-- Table structure for table `wallet_transactions`
--

CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `therapist_id` int(11) NOT NULL,
  `type` enum('credit','debit') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `related_session_id` int(11) DEFAULT NULL,
  `related_withdrawal_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_wallet_tx_therapist` (`therapist_id`),
  KEY `idx_wallet_tx_session` (`related_session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wallet_withdrawals`
--

CREATE TABLE IF NOT EXISTS `wallet_withdrawals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `therapist_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `account_holder_name` varchar(150) NOT NULL,
  `bank_name` varchar(150) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `branch_name` varchar(150) DEFAULT NULL,
  `status` enum('pending','completed','rejected') NOT NULL DEFAULT 'completed',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `processed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_withdrawals_therapist` (`therapist_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `care_plan_items`
--
ALTER TABLE `care_plan_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cpi_patient` (`patient_id`),
  ADD KEY `fk_cpi_therapist` (`therapist_id`),
  ADD KEY `fk_cpi_prescription` (`prescription_id`);

--
-- Indexes for table `care_plan_logs`
--
ALTER TABLE `care_plan_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_item_day` (`care_plan_item_id`,`log_date`),
  ADD KEY `fk_cpl_patient` (`patient_id`);

--
-- Indexes for table `group_sessions`
--
ALTER TABLE `group_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_group_therapist` (`therapist_id`);

--
-- Indexes for table `group_session_enrollments`
--
ALTER TABLE `group_session_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_enrollment` (`group_session_id`,`patient_id`),
  ADD KEY `fk_enroll_patient` (`patient_id`);

--
-- Indexes for table `medical_tests`
--
ALTER TABLE `medical_tests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tests_name` (`name`),
  ADD KEY `idx_tests_category` (`category`);

--
-- Indexes for table `medicines`
--
ALTER TABLE `medicines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_medicines_name` (`name`),
  ADD KEY `idx_medicines_category` (`category`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_notif_user` (`user_id`);

--
-- Indexes for table `patient_profiles`
--
ALTER TABLE `patient_profiles`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `patient_vitals`
--
ALTER TABLE `patient_vitals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_patient_vitals_patient` (`patient_id`);

--
-- Indexes for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_session` (`session_id`),
  ADD KEY `fk_presc_patient` (`patient_id`),
  ADD KEY `fk_presc_therapist` (`therapist_id`);

--
-- Indexes for table `prescription_medicines`
--
ALTER TABLE `prescription_medicines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_prescription_medicines_prescription` (`prescription_id`),
  ADD KEY `fk_presmed_medicine` (`medicine_id`);

--
-- Indexes for table `prescription_tests`
--
ALTER TABLE `prescription_tests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_prescription_tests_prescription` (`prescription_id`),
  ADD KEY `fk_prestest_test` (`test_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_session_review` (`session_id`),
  ADD KEY `fk_review_patient` (`patient_id`),
  ADD KEY `fk_review_therapist` (`therapist_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sessions_patient` (`patient_id`),
  ADD KEY `fk_sessions_therapist` (`therapist_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `task_completions`
--
ALTER TABLE `task_completions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_patient_date` (`patient_id`,`completed_date`);

--
-- Indexes for table `therapist_applications`
--
ALTER TABLE `therapist_applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `therapist_availability`
--
ALTER TABLE `therapist_availability`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_avail_therapist` (`therapist_id`);

--
-- Indexes for table `therapist_availability_exceptions`
--
ALTER TABLE `therapist_availability_exceptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_exception_therapist` (`therapist_id`);

--
-- Indexes for table `therapist_profiles`
--
ALTER TABLE `therapist_profiles`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `therapist_schedule_settings`
--
ALTER TABLE `therapist_schedule_settings`
  ADD PRIMARY KEY (`therapist_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `care_plan_items`
--
ALTER TABLE `care_plan_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `care_plan_logs`
--
ALTER TABLE `care_plan_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125;

--
-- AUTO_INCREMENT for table `group_sessions`
--
ALTER TABLE `group_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `group_session_enrollments`
--
ALTER TABLE `group_session_enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `medical_tests`
--
ALTER TABLE `medical_tests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `medicines`
--
ALTER TABLE `medicines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `patient_vitals`
--
ALTER TABLE `patient_vitals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `prescriptions`
--
ALTER TABLE `prescriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `prescription_medicines`
--
ALTER TABLE `prescription_medicines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `prescription_tests`
--
ALTER TABLE `prescription_tests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `task_completions`
--
ALTER TABLE `task_completions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `therapist_applications`
--
ALTER TABLE `therapist_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `therapist_availability`
--
ALTER TABLE `therapist_availability`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=134;

--
-- AUTO_INCREMENT for table `therapist_availability_exceptions`
--
ALTER TABLE `therapist_availability_exceptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `care_plan_items`
--
ALTER TABLE `care_plan_items`
  ADD CONSTRAINT `fk_cpi_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cpi_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cpi_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `care_plan_logs`
--
ALTER TABLE `care_plan_logs`
  ADD CONSTRAINT `fk_cpl_item` FOREIGN KEY (`care_plan_item_id`) REFERENCES `care_plan_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cpl_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `group_sessions`
--
ALTER TABLE `group_sessions`
  ADD CONSTRAINT `fk_group_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `group_session_enrollments`
--
ALTER TABLE `group_session_enrollments`
  ADD CONSTRAINT `fk_enroll_group` FOREIGN KEY (`group_session_id`) REFERENCES `group_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_enroll_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `patient_profiles`
--
ALTER TABLE `patient_profiles`
  ADD CONSTRAINT `patient_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `patient_vitals`
--
ALTER TABLE `patient_vitals`
  ADD CONSTRAINT `fk_vitals_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD CONSTRAINT `fk_presc_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_presc_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_presc_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `prescription_medicines`
--
ALTER TABLE `prescription_medicines`
  ADD CONSTRAINT `fk_presmed_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_presmed_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `prescription_tests`
--
ALTER TABLE `prescription_tests`
  ADD CONSTRAINT `fk_prestest_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_prestest_test` FOREIGN KEY (`test_id`) REFERENCES `medical_tests` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_review_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_review_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_review_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `fk_sessions_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sessions_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `therapist_availability`
--
ALTER TABLE `therapist_availability`
  ADD CONSTRAINT `fk_avail_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `therapist_availability_exceptions`
--
ALTER TABLE `therapist_availability_exceptions`
  ADD CONSTRAINT `fk_exception_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `therapist_profiles`
--
ALTER TABLE `therapist_profiles`
  ADD CONSTRAINT `therapist_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `therapist_schedule_settings`
--
ALTER TABLE `therapist_schedule_settings`
  ADD CONSTRAINT `fk_settings_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
