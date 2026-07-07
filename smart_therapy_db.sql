-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 07, 2026 at 05:58 AM
-- Server version: 10.4.22-MariaDB
-- PHP Version: 8.1.2

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
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('application_deadline', '2026-08-01 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `therapist_applications`
--

CREATE TABLE `therapist_applications` (
  `id` int(11) NOT NULL,
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
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `therapist_applications`
--

INSERT INTO `therapist_applications` (`id`, `name`, `email`, `address`, `phone`, `national_id`, `emergency_contact`, `position_applied`, `employment_type`, `shift_availability`, `start_date`, `desired_salary`, `primary_license`, `npi`, `basic_certs`, `specialty_certs`, `education_history`, `employment_history`, `emr_experience`, `languages`, `therapeutic_modalities`, `malpractice_history`, `license_suspension`, `criminal_record`, `oig_exclusion`, `immunization_proof`, `physical_capability`, `professional_references`, `truthfulness_attestation`, `status`, `created_at`) VALUES
(1, 'Dr. Robert Frost', 'robert@test.com', NULL, '01700000001', NULL, NULL, 'Clinical Psychologist', 'Full-time', NULL, NULL, NULL, 'LIC-12345 (NY)', 'NPI-9991', NULL, NULL, NULL, NULL, 'Epic, Cerner', NULL, NULL, 'None', 0, 0, 0, 0, 0, NULL, 1, 'pending', '2026-07-07 03:48:44'),
(2, 'Dr. Emily Chen', 'emily@test.com', NULL, '01700000002', NULL, NULL, 'Occupational Therapist', 'Part-time', NULL, NULL, NULL, 'LIC-67890 (CA)', 'NPI-9992', NULL, NULL, NULL, NULL, 'Meditech', NULL, NULL, 'None', 0, 0, 0, 0, 0, NULL, 1, 'pending', '2026-07-07 03:48:44');

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
  `session_type` enum('online','in-person','both') DEFAULT 'both'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `therapist_profiles`
--

INSERT INTO `therapist_profiles` (`user_id`, `profile_photo_url`, `biography`, `specialties`, `languages`, `consultation_fee`, `session_type`) VALUES
(2, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', '1500.00', 'both'),
(4, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', '1500.00', 'both'),
(5, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', '1500.00', 'both'),
(6, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', '1500.00', 'both'),
(7, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', '1500.00', 'both'),
(8, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', '1500.00', 'both'),
(9, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', '1500.00', 'both'),
(10, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', '1500.00', 'both'),
(11, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', '1500.00', 'both'),
(12, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', '1500.00', 'both'),
(13, '', 'Experienced therapist ready to help.', 'CBT, Anxiety', 'English, Bengali', '1500.00', 'both');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('patient','therapist','admin') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'Noor Jahan Oishee', 'patient@test.com', 'password123', 'patient', '2026-07-07 03:07:25'),
(2, 'Yasar Mostafa', 'therapist@test.com', 'password123', 'therapist', '2026-07-07 03:07:25'),
(3, 'Sultan Mohammad Farid', 'admin@test.com', 'admin123', 'admin', '2026-07-07 03:07:25'),
(4, 'Dr. Ayesha Rahman', 'ayesha@therapy.com', 'password123', 'therapist', '2026-07-07 03:25:53'),
(5, 'Dr. Kamal Hossain', 'kamal@therapy.com', 'password123', 'therapist', '2026-07-07 03:25:53'),
(6, 'Dr. Sarah Ahmed', 'sarah@therapy.com', 'password123', 'therapist', '2026-07-07 03:25:53'),
(7, 'Dr. Tariqul Islam', 'tariqul@therapy.com', 'password123', 'therapist', '2026-07-07 03:25:53'),
(8, 'Dr. Farhana Akter', 'farhana@therapy.com', 'password123', 'therapist', '2026-07-07 03:25:53'),
(9, 'Dr. Rafiq Mahmud', 'rafiq@therapy.com', 'password123', 'therapist', '2026-07-07 03:25:53'),
(10, 'Dr. Nusrat Jahan', 'nusrat@therapy.com', 'password123', 'therapist', '2026-07-07 03:25:53'),
(11, 'Dr. Imran Khan', 'imran@therapy.com', 'password123', 'therapist', '2026-07-07 03:25:53'),
(12, 'Dr. Salma Begum', 'salma@therapy.com', 'password123', 'therapist', '2026-07-07 03:25:53'),
(13, 'Dr. Zaid Hasan', 'zaid@therapy.com', 'password123', 'therapist', '2026-07-07 03:25:53');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `therapist_applications`
--
ALTER TABLE `therapist_applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `therapist_profiles`
--
ALTER TABLE `therapist_profiles`
  ADD PRIMARY KEY (`user_id`);

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
-- AUTO_INCREMENT for table `therapist_applications`
--
ALTER TABLE `therapist_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `therapist_profiles`
--
ALTER TABLE `therapist_profiles`
  ADD CONSTRAINT `therapist_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
