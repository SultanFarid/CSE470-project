# Smart Patient-Therapist Routing and Recovery Tracking System

A comprehensive MERN-stack (using MySQL) web application designed to connect patients with therapists based on AI matching, track daily recovery plans, and manage hospital credentialing for medical professionals.

## 🚀 Features Implemented So Far
* **Role-Based Authentication:** Unified login system routing Patients, Therapists, and Admins to their respective dashboards.
* **Hospital Credentialing Application:** A comprehensive 10-section HR job request form for therapists, including strict deadline enforcement.
* **MVC Architecture:** Clean separation of frontend UI, backend controllers, and database models.

---

## 📂 Project Structure & Team Rules

To avoid merge conflicts and overwritten code, this project strictly follows the **Model-View-Controller (MVC)** architecture. 

### ⚠️ Core Files (DO NOT EDIT without team communication)
If you need to add a line to these files, please drop a message in the group chat before pushing your code.
* `backend/server.js`: The main entry point. You will add your route imports here.
* `backend/config/db.js`: Database connection config.
* `frontend/src/App.jsx`: The main React router. You will add your page routes here.
* `frontend/src/services/api.js`: Centralized Axios API calls.

### 🛠️ Where to Add Your Code (Safe Zones)
When building a new feature, you should create *new* files in these isolated directories:
* **Frontend UI:** `frontend/src/components/[your-feature-name]/`
* **Backend Logic:** `backend/controllers/[yourFeature]Controller.js`
* **Backend Routes:** `backend/routes/[yourFeature]Routes.js`
* **Database Models:** `backend/models/[yourFeature]Model.js`

**Branching Rule:** NEVER write code directly on the `main` branch. Always create a feature branch (`git checkout -b feature/your-feature-name`), commit your work, and open a Pull Request.

---

## 💻 Simulation & Setup Steps (For Local Lab PCs)

Follow these exact steps to run the project on your local machine.

### 1. Prerequisites
* Install Node.js.
* Install VS Code.
* Install XAMPP.

### 2. Database Setup (MySQL)
1. Open XAMPP and start both the **Apache** and **MySQL** modules.
2. Go to `http://localhost/phpmyadmin` in your browser.
3. Create a new database named `smart_therapy_db`.
4. Click the **Import** tab, choose the `smart_therapy_db.sql` file located in the root of this repository, and click **Import**.

### 3. Backend Setup
1. Open a terminal and navigate to the backend folder:
   cd backend
2. Install the required Node packages:
   npm install
3. Start the backend server:
   node server.js
   (You should see "Backend server running on port 5000" in the console).

### 4. Frontend Setup
1. Open a **second, separate terminal window** and navigate to the frontend folder:
   cd frontend
2. Install the React dependencies:
   npm install
3. Start the Vite development server:
   npm run dev
4. Open your browser and navigate to the local link provided (usually `http://localhost:5173`).

### 🧪 Test Credentials
You can log in using the following test accounts:
* **Admin:** admin@test.com / admin123
* **Patient:** patient@test.com / password123
* **Therapist:** sarah@therapy.com / password123
