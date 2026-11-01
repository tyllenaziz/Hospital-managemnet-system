# Hospital Management System - Developer Documentation

## 1. Project Overview
**Hospital Management System** is a comprehensive Hospital Management System designed for efficient healthcare administration. It follows a modular, offline-first architecture to support varied hospital operations including consultancy, queuing, pharmacy, lab, radiology, and billing.

### Tech Stack
*   **Backend:** Node.js, Express, Sequelize ORM, MySQL Database
*   **Frontend:** React (Vite), TailwindCSS, Context API for state management
*   **Offline Capability:** Local-first architecture (referenced in modular design)

---

## 2. System Architecture

The system is built on a **Client-Server Architecture**:
1.  **Client (Frontend):** React SPA that consumes REST APIs. It handles role-based routing (Admin, Doctor, Nurse, etc.) and state management via Context API.
2.  **Server (Backend):** Express.js REST API layer that interacts with the MySQL database via Sequelize.
3.  **Database:** Relational MySQL database storing all hospital records (Users, Patients, Bills, etc.).

### Data Flow
1.  **Request:** User interacts with React Frontend -> API Request sent to Node.js Backend using `useAuth` wrapper (fetch interceptor).
2.  **Processing:** Express Middleware (`moduleAccess`, `auth`) validates request -> Controller executes logic -> Service/Model interacts with DB.
3.  **Response:** JSON response sent back -> Frontend updates state/UI.

---

## 3. Directory Structure

### Backend (`/backend`)
Handles API logic, database connections, and business rules.

*   **`/config`**: Configuration files (Database connection `dbconfig.js`).
*   **`/controllers`**: Logic for handling API requests (e.g., `adminController.js`, `patientController.js`).
*   **`/models`**: Sequelize models defining database schema (Entity definitions).
    *   *Key Models:* `User.js`, `Patient.js`, `Bill.js`, `Queue.js`, `RadiologyOrder.js`.
*   **`/routes`**: API route definitions mapping URLs to controllers.
    *   `authRoutes.js`: Login/Register
    *   `adminRoutes.js`: Dashboard stats, reports
    *   `patientRoutes.js`: Patient registration, retrieval
    *   `queueRoutes.js`: Managing patient flow (waiting/in-progress)
    *   `labRoutes.js`: Lab orders and results
    *   `pharmacyRoutes.js`: Prescriptions and inventory
    *   `radiologyRoutes.js`: Imaging orders
*   **`server.js`**: Entry point. Sets up Express app, middleware, database sync (Sequelize), and mounts routes.

### Frontend (`/frontend/src`)
React-based user interface.

*   **`/components`**: Reusable UI components.
    *   `Sidebar.jsx`: Main navigation menu (role-aware).
    *   `Navbar.jsx`: Top bar with user profile.
    *   `ProtectedRoute.jsx`: HOC for route security based on roles.
*   **`/context`**: Global state management.
    *   `AuthContext.jsx`: Handles user login state, token storage, and `authenticatedFetch`.
*   **`/pages`**: Application views organized by module.
    *   **`/Admin`**: Administrative tasks (Module Management, Expenses, Audit Logs).
    *   **`/Dashboard`**: Role-specific dashboards (`AdminDashboard`, `DoctorDashboard`, `NurseDashboard`).
    *   **`/Patients`**: Patient management (`RegisterPatient`, `QueueManagement`, `VitalsRecording`).
    *   **`/Doctor`**: Consultation interfaces (`ConsultationPage`, `DoctorPrescriptions`).
    *   **`/Lab`**: Laboratory workflows (`LabResults`, `LabTestManagement`).
    *   **`/Pharmacy`**: Dispensing and Inventory (`DispensePrescription`, `MedicineList`).
*   **`AppRoutes.jsx`**: Central routing configuration defining all URL paths and their access control.

---

## 4. Key Workflows

### A. Patient Journey (The "Flow")
1.  **Registration:** Receptionist registers a new patient -> `POST /api/patients`.
2.  **Triage:** Patient added to Nurse Queue -> Nurse records Vitals -> `POST /api/queue`.
3.  **Consultation:** Patient moves to Doctor Queue -> Doctor views history, adds Diagnosis/Prescription -> `POST /api/prescriptions` or `POST /api/lab/orders`.
4.  **Diagnostics (Optional):**
    *   **Lab:** Lab Tech views order -> Enters results -> `PUT /api/lab/results`.
    *   **Radiology:** Radiologist views request -> Uploads image/report.
5.  **Pharmacy:** Pharmacist views prescription -> Dispenses medicine -> `POST /api/inventory/dispense`.
6.  **Billing:** All actions (Consultation, Lab, Meds) generate bill items. Cashier finalizes payment -> `POST /api/bills/pay`.

### B. Authentication & Security
*   **JWT:** Used for securing API endpoints.
*   **Role-Based Access Control (RBAC):**
    *   **Frontend:** `ProtectedRoute` component restricts access to routes.
    *   **Backend:** Middleware checks user roles before processing requests (`moduleAccess`).

---

## 5. Setup & Installation
1.  **Database:** Ensure MySQL is running. Import `schema.sql` if provided.
2.  **Backend:**
    ```bash
    cd backend
    npm install
    npm start
    ```
3.  **Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## 6. Development Guidelines
*   **Adding a New Feature:**
    1.  Create Model in `backend/models`.
    2.  Create Controller in `backend/controllers`.
    3.  Define Route in `backend/routes` and register in `server.js`.
    4.  Create Frontend Page in `frontend/src/pages`.
    5.  Add Route in `frontend/src/AppRoutes.jsx`.
    6.  Add Link to `Sidebar.jsx`.

---
*Generated by Antigravity Agent*
