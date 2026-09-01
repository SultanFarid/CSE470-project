# 🧠 Smart Patient-Therapist Routing & Recovery Tracking System

A full-stack, AI-augmented healthcare platform designed to streamline mental health consultations, automate patient-therapist matchmaking, manage clinical prescriptions, track daily rehabilitation routines, and facilitate administrative credentialing and group therapy.

---

## 🌟 Comprehensive Feature Overview

The platform is structured into four core modules: **Patient Features**, **Therapist Features**, **Administrator Features**, and **System-Wide Services**.

---

### 🧑‍⚕️ Patient Features

#### 1. Patient’s Dashboard
* **Profile Management:** After registration and login, patients can manage and update their personal details directly from their Recovery Hub dashboard.
* **Editable Information:** Profile photo upload, display name, contact number, geographic location, and preferred language.
* **Overview Central:** Real-time visibility into active consultations, daily recovery task checklists, care plan streaks, unread notifications, and quick access to official prescriptions.

#### 2. Vitals Check (Initial Assessment)
* **Step-by-Step Clinical Intake:** Patients complete a guided multi-step intake assessment capturing their core mental health struggles, symptom duration, self-reported severity (including crisis detection), and session format preferences.
* **Routing Decision:** Upon completion, patients can choose between:
  1. **AI Matchmaker:** Letting the system automatically analyze their responses to find the top matching therapist.
  2. **Manual Directory Search:** Browsing the therapist catalog with custom filters.

#### 3. AI-Powered Therapist Matchmaker
* **Intelligent Scoring Algorithm:** Combines intake questionnaire responses, specialty relevance, language and format preferences, location signals, and weighted patient feedback ratings.
* **Top Recommendations:** Automatically ranks and presents the top 3 best-fitting licensed therapists with compatibility scores and match rationales.

#### 4. Therapist Directory & Manual Search
* **Catalog Exploration:** Patients can explore the verified therapist directory.
* **Multi-Criteria Filtering:** Filter by clinical specialty (e.g., Anxiety, Depression, Trauma/PTSD, Sleep Disorders), preferred language (English, Bengali), and gender.
* **Detailed Public Profiles:** Displays therapist qualifications, hospital affiliation, consultation fee, bio, session formats (Online Video / In-Person), and aggregated patient reviews & tags.

#### 5. Appointment Booking System
* **Real-Time Calendar & Slots:** Patients view live available time slots based on the therapist's set availability matrix.
* **Interactive Pre-Session Intake:** Optional confidential pre-session briefing questionnaire where patients can share deeper emotional triggers, somatic/sleep symptoms, and confidential notes for the doctor.
* **Visual Status Tracking:** Dashboard cards display the lifecycle of appointments (`Pending`, `Confirmed`, `Completed`) with real-time cancel options.

#### 6. Daily Care Plan Tracker
* **Prescription-to-Task Conversion:** Following a consultation, patients receive an automated prompt to accept their doctor's prescribed care plan into their daily checklist.
* **Interactive Checklists & Video Player:** Check off daily medication doses and watch prescribed therapeutic exercise videos directly via embedded YouTube video players.
* **Habit & Streak Counter:** Real-time care streak counter that tracks daily consecutive task completions to promote recovery adherence.

#### 7. Review and Feedback System
* **Post-Session Evaluation:** When a session is completed, patients can rate their consultation (1–5 stars) and select structured feedback tags across four categories:
  * *Communication Style* (e.g., Listens carefully, Explains clearly)
  * *Personality* (e.g., Warm & supportive, Non-judgmental)
  * *Clinical Approach* (e.g., Good at treatment, Structured sessions)
  * *Session Experience* (e.g., On time, Felt understood)
* **AI Feedback Loop:** Review scores and tags feed directly into the AI Matchmaker algorithm to optimize future therapist recommendations.

---

### 👨‍⚕️ Therapist Features

#### 8. Therapist Dashboard & Public Profile Editor
* **Command Center:** Overview of daily consultations, active patient caseload, pending group sessions, and reputation summary.
* **Live Profile Customization:** Therapists can edit their public-facing biography, consultation fee, listed specialties, languages, consultation modes (Online Video / In-Person), and avatar—instantly synced to the patient directory.

#### 9. Therapist Job Request Form (Credentialing Application)
* **Professional Onboarding:** Prospective therapists apply through a comprehensive multi-section credentialing portal.
* **Verification Verification Documents:** Submission of medical license numbers, educational qualifications, clinical experience history, and government ID document uploads.
* **Deadline Enforcement:** Strict dynamic application deadlines configured and monitored by administrators.

#### 10. Availability Matrix (Schedule Manager)
* **Weekly Slot Grid:** Interactive weekly calendar where therapists toggle checkboxes to open or close specific hourly consultation slots.
* **Conflict Prevention:** Automatically accounts for booked sessions and prevents overlapping or duplicate bookings.

#### 11. Pre-Session Patient Briefings & AI Copilot
* **15-Second Clinical Intake Summary:** AI automatically condenses the patient's vitals intake and confidential briefing into a concise summary before the appointment starts.
* **AI Clinical Copilot Suggestions:** Gemini-powered clinical analysis providing recommended therapeutic exercises, medications (with dosage and frequency), and diagnostic test scales tailored to the patient's symptoms.
* **Therapist Opt-In Control:** Animated loading indicator with an explicit prompt allowing the therapist to choose when to view suggestions.

#### 12. Prescription Builder & Video Library
* **Structured Clinical Prescription:** Fill in clinical observations, dosage instructions, and follow-up consultation dates.
* **Curated Exercise Video Library:** In-database catalog of verified therapeutic exercise videos (e.g., shoulder/neck mobility stretches, 4-7-8 diaphragmatic breathing, PMR, CBT exercises) with 1-click addition to the care plan.
* **Historical Multi-Session Tracking:** View previous prescription history for returning follow-up patients with 1-click medication re-use.
* **Official PDF Rx Generation:** Generates downloadable, printable vector PDFs featuring doctor credentials, hospital header, Rx badges, medication tables, diagnostic test lists, and previous session comparisons.

#### 13. Patient Therapy Status Tracking (Active Caseload)
* **Caseload Monitoring:** Therapists can track all assigned patients, monitor their active recovery progress, check whether daily checklist tasks are being completed, and view prescription statuses.

#### 14. Medical History Archive
* **Searchable Patient Database:** Securely search past patient records by name or diagnosis.
* **Historical Records Access:** Inspect past consultation dates, clinical notes, diagnostic evaluations, and past prescriptions.

#### 15. Earnings & Job Info Dashboard
* **Financial Overview:** Track completed consultations, accumulated earnings, session-by-session payout breakdowns, and consultation volume metrics.
* **Wallet & Redemption:** In-app wallet system allowing therapists to monitor balances and request redemptions.

---

### 🛡️ Administrator Features

#### 16. Admin Verification Dashboard
* **Applicant Review Pipeline:** Secure administrative panel to inspect credentials, resume data, and verification documents uploaded by therapist applicants.
* **Decision Management:** Approve, reject, or schedule interviews/vivas for candidates.
* **Automated Role Promotion:** Approving an application automatically upgrades the user's role and unlocks the full therapist workspace.

#### 17. Admin User Management Panel
* **User Search & Role Filtering:** Search all registered platform users by name or email with Patient, Therapist, and Admin filters.
* **Account Controls:** View registration dates, total consultation count, and last login timestamps.
* **Security & Moderation:** Temporarily suspend or permanently deactivate accounts with automated notification dispatch to affected users.

#### 18. Platform Analytics Dashboard
* **High-Level Statistics:** Real-time analytics displaying total registered patients, active therapists, completed sessions, and platform revenue.
* **Visual Data Charts:** Monthly session volume bar charts and confirmed vs. cancelled appointment breakdown ratios.
* **Data Privacy:** Fully aggregated metrics ensuring individual patient privacy is strictly preserved.

---

### ⚙️ System Features

#### 19. In-App Notification System
* **Automated Cross-Role Alerts:** Real-time notification dispatch engine for patients, therapists, and admins.
* **Event Triggers:** 
  * Patients receive reminders for upcoming appointments, pending care plan opt-ins, and follow-up requests.
  * Therapists receive instant alerts when a patient books a new time slot or responds to a follow-up.
  * System alerts for document verification decisions and account status changes.

#### 20. Group Therapy Management System
* **Therapist Proposals:** Therapists can propose targeted group therapy sessions (topic, description, capacity, scheduled date/time).
* **Admin Approval Workflow:** Proposals are routed to admins for quality review and approval.
* **Patient Enrollment:** Approved group sessions appear in the public catalog where patients can view open seats and join with 1 click.
* **Session Execution & Attendance:** Therapists manage enrolled participant rosters, mark live attendance, and record shared group session notes.

---

## 🛠️ Technology Stack & Architecture

* **Frontend:** React 18, Vite, React Router v6, Lucide Icons, jsPDF, Vanilla CSS (Modern CSS Variables & Responsive Grid Layouts).
* **Backend:** Node.js, Express.js (RESTful API, MVC Architecture), JWT Authentication, Multer (File Uploads).
* **Database:** MySQL (relational database with foreign key constraints, connection pooling via `mysql2`).
* **AI & Machine Learning:** Google Gemini AI API (`gemini-3.6-flash`) for clinical intake summarization and copilot recommendations.
* **PDF Engine:** Client-side vector PDF generation engine for digital prescriptions.

---

## 💻 Local Setup & Installation Guide

Follow these steps to run the application on your local machine:

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [XAMPP](https://www.apachefriends.org/) (for Apache and MySQL)
* [Git](https://git-scm.com/)

---

### 2. Database Configuration
1. Launch **XAMPP Control Panel** and start both **Apache** and **MySQL**.
2. Open your web browser and go to: `http://localhost/phpmyadmin`
3. Create a new database named `smart_therapy_db` with collation `utf8mb4_general_ci`.
4. Select `smart_therapy_db`, click on the **Import** tab, choose the `smart_therapy_db.sql` file from the project root directory, and click **Import**.

---

### 3. Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create or verify your `.env` file in the `backend` directory:
   ```env
   PORT=5001
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=smart_therapy_db
   JWT_SECRET=your_jwt_secret_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
   *(Server will start running on port `5001`)*

---

### 4. Frontend Setup
1. Open a **second terminal window** and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the displayed local URL in your browser (typically `http://localhost:5173`).

---

### 🧪 Demo Credentials

You can use these accounts to test all platform roles and workflows:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@test.com` | `admin123` |
| **Licensed Therapist** | `sarah@therapy.com` | `password123` |
| **Licensed Therapist** | `sultan@therapy.com` | `password123` |
| **Patient** | `patient@test.com` | `password123` |

---

## 👥 Project Team & Guidelines
* Developed for the **CSE470 Software Engineering Project**.
* Follows standard Model-View-Controller (MVC) architectural separation and modular React component structure.
