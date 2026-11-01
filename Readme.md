# Hospital Management System - Developer Documentation

## 1. System Overview

This is a comprehensive Hospital Management System (HMS) built using a **Node.js/Express** backend and a **React/Vite** frontend. It is designed to be packaged as a desktop application using **Electron**.

### Architecture
- **Backend**: Node.js, Express, MySQL (REST API).
- **Frontend**: React, Vite, TailwindCSS, Axios.
- **Database**: MySQL with 25+ tables.
- **Desktop Wrapper**: Electron (loads the frontend build).
- **Integration**: `localbridge` handles communication between Electron and the local backend server.
- **Payment Integration**: M-Pesa STK Push for mobile payments.

---

## 2. Setup & Installation

### Prerequisites
- Node.js (v16+)
- MySQL Server (Running on default port 3306 or configured via `.env`)
- npm or pnpm

### Installation

1.  **Clone the repository**
2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    # Setup Database
    # Execute the contents of schema.sql in your MySQL database
    # Create .env file with DB credentials
    npm start
    ```
3.  **Prisma & Bootstrap Commands**
    ```bash
    cd backend
    npx prisma migrate dev --name init
    npx prisma generate
    npm run prisma:seed
    npm run create:superadmin -- --username superadmin --password YourStrongPassword --phone 0700000000
    ```
    Notes:
    - `npx prisma migrate dev --name init` creates or updates your local database tables from `backend/prisma/schema.prisma`.
    - `npx prisma generate` regenerates Prisma Client after schema changes.
    - `npm run prisma:seed` seeds the master lab catalog and syncs it to hospitals.
    - `npm run create:superadmin -- --username ... --password ...` creates a platform superadmin user, or updates the existing user to `superadmin` if that username already exists.
4.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
5.  **Electron Desktop App**
    ```bash
    # From root directory
    npm install
    npm start
    ```

---

## 3. Directory Structure

### Backend (`/backend`)
- **`config/`**: Database configuration (`db.js`).
- **`controllers/`**: 18 controller files handling API logic.
- **`routes/`**: 18 route files defining API endpoints.
- **`middlewares/`**: Auth middleware (`authMiddleware.js`) and Role-based access (`roleMiddleware.js`).
- **`models/`**: 13 model files for database interactions.
- **`utils/`**: Helper functions including queue cleanup utilities.
- **`schema.sql`**: Complete database structure definition (716 lines).

### Frontend (`/frontend`)
- **`src/components/`**: 15 reusable UI components.
- **`src/pages/`**: 11 page module directories with 54+ page components.
- **`src/context/`**: React Context (AuthContext, SettingsContext).
- **`src/routes/`**: Application routing (`AppRoutes.jsx` - 659 lines).
- **`src/services/`**: API service configurations.

---

## 4. User Roles & Access Control

### Available Roles
| Role | Description |
|------|-------------|
| `admin` | Full system access, staff management, statistics |
| `supervisor` | Administrative oversight capabilities |
| `receptionist` | Patient registration, queue management, billing |
| `doctor` | Consultations, prescriptions, lab orders, referrals |
| `nurse` | Vitals recording, chronic care visits, patient care |
| `lab` | Lab test management, sample processing, results entry |
| `pharmacy` | Prescription dispensing, direct sales, inventory |

### Role-Based Dashboard Access
Each role has a dedicated dashboard providing quick access to their specific modules.

---

## 5. Modules Documentation

### 5.1 Authentication & Users
**Purpose**: Manages user login, registration, and role-based access control (RBAC).

*   **Database Table**: `users`
*   **Roles**: `admin`, `receptionist`, `doctor`, `lab`, `pharmacy`, `nurse`, `supervisor`.
*   **API Routes** (`/api/users`):
    *   `POST /login`: Authenticate user.
    *   `POST /register`: Create new user.
    *   `POST /refresh-token`: Refresh JWT token.
    *   `POST /logout`: Logout user.
    *   `GET /`: List all users (Admin only).
*   **Frontend**:
    *   `Auth/`: Login pages.
    *   Protected Routes wrapper in `AppRoutes.jsx`.

---

### 5.2 Patient Management
**Purpose**: Core module for registering and managing patient records.

*   **Database Tables**: `patients`
*   **Key Fields**: `patient_number` (unique), name, phone, age, gender, ID number, next of kin details, address info.
*   **API Routes** (`/api/patients`):
    *   `POST /register`: Register a new patient.
    *   `GET /`: Get all patients with pagination.
    *   `GET /search`: Search patients by name/ID/phone.
    *   `GET /:id`: Get specific patient details.
    *   `GET /:id/visits`: Get visit history.
    *   `GET /visits/:visitId/details`: Get detailed visit info.
*   **Frontend** (`pages/Patients`):
    *   `RegisterPatient.jsx`: Comprehensive patient registration form.
    *   `PatientList.jsx`: Searchable patient table view.
    *   `PatientDetails.jsx`: Complete patient history and records.
    *   `VitalsRecording.jsx`: Interface for recording patient vitals.

---

### 5.3 Queue Management
**Purpose**: Manages the flow of patients between departments (Nurse, Doctor, Lab, Pharmacy, Billing).

*   **Database Tables**: `queue`, `vitals`
*   **Departments**: `doctor`, `nurse`, `lab`, `pharmacy`, `billing`
*   **Status Flow**: `waiting` → `in_progress` → `done` or `cancelled`
*   **Auto-Expiry**: Stored procedure `expire_old_queue_items` runs hourly to clear items older than 24 hours.
*   **API Routes** (`/api/queue`):
    *   `GET /:department`: Get queue for specific department.
    *   `GET /item/:id`: Get single queue item by ID.
    *   `PUT /:queueId/fetch`: Doctor/Nurse fetches patient.
    *   `PUT /:queueId/complete`: Complete doctor consultation.
    *   `PUT /:queueId/complete-with-lab`: Complete with lab order.
    *   `POST /:queueId/vitals`: Record vitals for queue item.
    *   `GET /:queueId/vitals`: Get vitals for a queue item.
    *   `PUT /:queueId/lab-complete`: Lab marks complete.
    *   `PUT /:queueId/pharmacy-complete`: Pharmacy marks complete.
    *   `PUT /:queueId/cancel`: Cancel queue item.
    *   `GET /admin/expiring`: Get expiring queue items.
    *   `POST /admin/cleanup`: Manual queue cleanup trigger.
    *   `GET /admin/stats`: Queue statistics.
*   **Frontend** (`pages/Patients`):
    *   `QueueManagement.jsx`: Interface for viewing and managing patient queues.

---

### 5.4 Vitals Recording
**Purpose**: Track patient vital signs throughout their visit.

*   **Database Table**: `vitals`
*   **Measurements**:
    *   Blood pressure (systolic/diastolic)
    *   Temperature (Celsius)
    *   Pulse rate (BPM)
    *   Respiratory rate
    *   Weight (kg) / Height (cm)
    *   Blood sugar (mg/dL)
    *   Oxygen saturation (SpO2)
    *   BMI (calculated)
    *   Drug allergies
*   **Frontend Components**:
    *   `VitalsRecording.jsx`: Nurse interface for recording vitals.
    *   `VitalsDisplay.jsx`: Reusable component for displaying vitals.

---

### 5.5 Inventory (Medicine & Equipment)
**Purpose**: Tracks medical supplies, medicines, and hospital equipment.

*   **Database Tables**: `medicines`, `equipment`
*   **Medicine Fields**: name, barcode, stock, price, expiry_date.
*   **Equipment Fields**: name, serial_number, purchase_date, warranty_expiry, status, location.
*   **Equipment Status**: `active`, `maintenance`, `retired`, `broken`.
*   **API Routes**:
    *   `/api/inventory`: CRUD for medicines.
    *   `/api/equipment`: CRUD for equipment assets.
    *   `/api/medicines`: Detailed medicine management.
*   **Frontend** (`pages/Inventory`):
    *   `InventoryDashboard.jsx`: Overview of inventory status.
    *   `MedicineList.jsx`: Medicine inventory management.
    *   `EquipmentList.jsx`: Equipment tracking.
    *   `AddMedicine.jsx`: Add new medicine.
    *   `AddEquipment.jsx`: Add new equipment.
    *   `BarcodeScannerView.jsx`: Barcode-based medicine lookup.
    *   `DirectSalesList.jsx`: View direct sales history.

---

### 5.6 Prescriptions & Pharmacy
**Purpose**: Doctors prescribe medication; Pharmacy dispenses it.

*   **Database Tables**: `prescriptions`, `prescription_items`, `sales`, `sales_items`
*   **Prescription Status**: `pending`, `dispensed`, `cancelled`
*   **Custom Medicines**: Supports prescribing medicines not in inventory with custom names and prices.
*   **API Routes** (`/api/prescriptions`):
    *   `POST /`: Create prescription (Doctor).
    *   `GET /all`: Get all prescriptions with filters/pagination.
    *   `GET /stats/summary`: Prescription statistics.
    *   `GET /:id`: Get prescription details.
    *   `GET /doctor/:doctorId`: Get by doctor.
    *   `GET /patient/:patientId`: Get by patient.
    *   `GET /status/pending`: Pending prescriptions (Pharmacy queue).
    *   `GET /status/dispensed`: Dispensed prescriptions.
    *   `PUT /:id/status`: Update prescription status.
    *   `POST /:prescriptionId/dispense`: Dispense medicines and update stock.
    *   `GET /:prescriptionId/receipt`: Get dispensing receipt.
    *   `GET /queue/:queueId`: Get prescription by queue.
    *   `GET /patient/:patientId/latest`: Get latest prescription for patient.
*   **Frontend** (`pages/pharmacy`):
    *   `PrescriptionList.jsx`: View pending prescriptions.
    *   `PrescriptionDetails.jsx`: Detailed prescription view.
    *   `DispensePrescription.jsx`: Dispense interface with stock validation.
    *   `DispensedPrescriptions.jsx`: History of dispensed prescriptions.
    *   `PrescriptionReceipt.jsx`: Printable receipt generation.
    *   `DirectSale.jsx`: Over-the-counter medicine sales.

---

### 5.7 Direct Sales (Over-the-Counter)
**Purpose**: Handle walk-in medicine purchases without prescription.

*   **Database Tables**: `direct_sales`, `direct_sale_items`
*   **Features**:
    *   Barcode scanning support.
    *   Custom item entry for unlisted medicines.
    *   Multiple payment methods.
*   **API Routes** (`/api/sales`):
    *   Direct sale creation and history retrieval.
*   **Frontend** (`pages/pharmacy`):
    *   `DirectSale.jsx`: POS-style interface for direct sales.

---

### 5.8 Laboratory
**Purpose**: Manage lab tests, orders, and results with parametric testing support.

*   **Database Tables**: `lab_tests` (catalog), `lab_test_parameters`, `lab_orders`, `lab_order_items`, `lab_results`
*   **Test Categories**: Supports categorized tests with multiple parameters per test.
*   **Order Status**: `pending` → `in_progress` → `completed` or `cancelled`
*   **API Routes** (`/api/lab`):
    *   **Test Catalog**:
        *   `GET /tests`: List all available tests.
        *   `GET /tests/search`: Search tests.
        *   `GET /tests/:id`: Get test details.
        *   `POST /tests`: Create test (Admin/Lab).
        *   `PUT /tests/:id`: Update test.
        *   `DELETE /tests/:id`: Delete test (Admin only).
    *   **Lab Orders**:
        *   `GET /orders/pending`: Pending orders for lab queue.
        *   `GET /orders/all`: All orders with filters.
        *   `GET /orders/:id`: Order details.
        *   `PUT /orders/:orderId/start`: Start processing.
        *   `PUT /orders/:orderId/complete`: Mark order complete.
        *   `GET /orders/queue/:queueId`: Get order by queue.
    *   **Results**:
        *   `GET /results/all`: All results.
        *   `GET /results/patient/:patientId`: Patient's lab history.
        *   `POST /results/:itemId`: Add results.
        *   `PUT /results/:itemId`: Update results.
*   **Frontend** (`pages/Lab`):
    *   `LabTestManagement.jsx`: Lab queue and test management.
    *   `LabOrderDetails.jsx`: Detailed order view with results entry.
    *   `LabResults.jsx`: Results viewing and editing.
    *   `PatientLabHistory.jsx`: Patient's complete lab history.
*   **Components**:
    *   `LabResultsPrint.jsx`: Printable lab results format.

---

### 5.9 Billing & Payments
**Purpose**: Invoicing, payment processing, and consolidated billing per visit.

*   **Database Tables**: `bills`, `bill_items`, `payments`
*   **Bill Components**:
    *   Consultation fee (from system settings)
    *   Lab fees
    *   Pharmacy/medicine fees
    *   Discounts
*   **Payment Methods**: `cash`, `card`, `insurance`, `mpesa`
*   **Payment Status**: `pending`, `partial`, `paid`
*   **API Routes** (`/api/bills`):
    *   `POST /`: Create bill.
    *   `GET /pending`: Pending bills.
    *   `GET /:id`: Bill details.
    *   `GET /patient/:patientId`: Patient's bill history.
    *   `GET /`: All bills.
    *   `POST /:billId/lab-tests`: Add lab tests to bill.
    *   `POST /:billId/medicines`: Add medicines to bill.
    *   `POST /:billId/payment`: Record payment.
*   **Frontend** (`pages/Patients`):
    *   `BillingManagement.jsx`: Create and manage invoices.
    *   `PatientBills.jsx`: Consolidated bill view per visit.
*   **Components**:
    *   `BillPaymentModal.jsx`: Payment processing modal.
    *   `BillingReceipt.jsx`: Receipt generation.
    *   `PatientBillsReceipt.jsx`: Detailed bill receipt.

---

### 5.10 M-Pesa Integration
**Purpose**: Mobile money payment integration via Safaricom M-Pesa STK Push.

*   **Configuration**: Requires M-Pesa API credentials in `.env`.
*   **API Routes** (`/api/mpesa`):
    *   `POST /stkpush`: Initiate STK Push payment request.
    *   `POST /callback`: Callback endpoint for Safaricom.
    *   `GET /status/:checkoutRequestId`: Query payment status.
    *   `GET /check/:checkoutRequestId`: Poll payment status.
*   **Flow**:
    1. User initiates payment with phone number.
    2. STK Push sent to customer's phone.
    3. Customer enters PIN to confirm.
    4. Callback updates payment status.

---

### 5.11 Ambulance Management
**Purpose**: Fleet management, dispatch control, and ambulance request handling.

*   **Database Tables**: `ambulances`, `ambulance_requests`
*   **Ambulance Types**: `Basic`, `Advanced`, `Mobile ICU`, `Neonatal`
*   **Ambulance Status**: `Available`, `On Call`, `On Trip`, `Maintenance`
*   **Request Direction**: `INCOMING` (external to hospital), `OUTGOING` (hospital dispatch)
*   **Request Types**: `Referral`, `Emergency`, `Transfer`, `Pharmacy Pickup`
*   **Request Status Flow**: `Pending` → `Approved` → `Assigned` → `Dispatched` → `On Route` → `At Pickup` → `On Return` → `Completed`
*   **Priority Levels**: `Low`, `Medium`, `High`, `Critical`
*   **API Routes** (`/api/ambulance`):
    *   **Ambulance Management**:
        *   `GET /`: List all ambulances.
        *   `GET /available`: Available ambulances only.
        *   `POST /`: Create ambulance (Admin).
        *   `PUT /:id`: Update ambulance.
        *   `PATCH /:id/status`: Update ambulance status.
    *   **Request Management**:
        *   `GET /requests`: All requests.
        *   `GET /requests/pending`: Pending requests.
        *   `GET /requests/:id`: Request details.
        *   `POST /requests`: Create outgoing request.
        *   `POST /requests/incoming`: Create incoming request (Receptionist).
        *   `POST /requests/:id/approve`: Doctor approval.
        *   `POST /requests/:id/assign`: Assign ambulance (Admin).
        *   `POST /requests/:id/print`: Mark as printed.
        *   `PATCH /requests/:id/status`: Update request status.
*   **Frontend** (`pages/ambulance`):
    *   Fleet dashboard and request tracking interfaces.

---

### 5.12 Referrals
**Purpose**: Managing patient referrals to/from other healthcare facilities.

*   **Database Table**: `referrals`
*   **Key Data**:
    *   Clinical summary and diagnosis.
    *   Patient condition: `Stable`, `Critical`, `Urgent`, `Emergency`.
    *   Priority: `Routine`, `Urgent`, `Emergency`.
    *   Services needed (JSON array).
    *   Investigations done.
    *   Current medications.
    *   Referring doctor contact details.
*   **Status**: `Pending`, `Accepted`, `Rejected`, `Completed`, `Cancelled`
*   **API Routes** (`/api/referrals`):
    *   `POST /`: Create referral (Doctor).
    *   `GET /`: List referrals (Admin sees all, Doctor sees own).
    *   `GET /statistics`: Referral statistics.
    *   `GET /patient/:patientId`: Patient's referral history.
    *   `GET /:id`: Referral details.
    *   `PATCH /:id/status`: Update status.
    *   `PUT /:id`: Update referral.
    *   `DELETE /:id`: Delete referral.
*   **Frontend** (`pages/doctor`):
    *   `Referral.jsx`: Create new referral form.
    *   `ReferralListPage.jsx`: List all referrals.
    *   `ReferralDetailsPage.jsx`: Detailed referral view with print support.

---

### 5.13 Chronic Care Module
**Purpose**: Manage long-term care for patients with chronic conditions (Diabetes, Hypertension, HIV, TB, ANC, etc.).

*   **Database Tables**: `clinics`, `chronic_enrollments`, `clinic_visits`
*   **Default Clinics**:
    | Code | Name | Follow-up Days |
    |------|------|----------------|
    | DM | Diabetes Clinic | 30 |
    | HTN | Hypertension Clinic | 30 |
    | HIV | HIV/AIDS Clinic | 30 |
    | TB | Tuberculosis Clinic | 14 |
    | ANC | Antenatal Clinic | 28 |
    | PNC | Postnatal Clinic | 42 |
    | CWC | Child Wellness Clinic | 30 |
    | MH | Mental Health Clinic | 30 |
*   **Enrollment Status**: `active`, `discharged`, `transferred`, `deceased`, `lost_to_follow_up`
*   **Visit Status**: `recorded` → `reviewed` → `escalated`/`completed`
*   **API Routes** (`/api/chronic`):
    *   **Clinic Management**:
        *   `GET /clinics`: List all clinics.
        *   `POST /clinics`: Create clinic (Admin).
        *   `PUT /clinics/:id`: Update clinic.
    *   **Enrollment**:
        *   `POST /enroll`: Enroll patient in clinic.
        *   `PUT /enrollment/:enrollment_id/discharge`: Discharge patient.
        *   `GET /patient/:patient_id/enrollments`: Patient's enrollments.
        *   `GET /clinic/:clinic_id/patients`: Patients in a clinic.
        *   `GET /enrollment/:enrollment_id`: Enrollment details.
*   **API Routes** (`/api/clinic-visits`):
    *   `POST /record`: Record clinic visit (Nurse).
    *   `GET /enrollment/:enrollment_id/history`: Visit history.
    *   `GET /enrollment/:enrollment_id/trend`: Vitals trend for graphs.
    *   `GET /today`: Today's clinic visits.
    *   `GET /pending-reviews`: Visits pending doctor review.
    *   `PUT /:visit_id/review`: Doctor reviews visit.
    *   `POST /:visit_id/escalate`: Escalate to full consultation.
    *   `GET /abnormal`: Get visits with abnormal readings.
*   **Frontend** (`pages/ChronicCare`):
    *   `ClinicManagement.jsx`: Admin management of clinics.
    *   `EnrollPatient.jsx`: Patient enrollment interface.
    *   `NurseClinicVisit.jsx`: Nurse-led clinic visit recording.
    *   `DoctorReview.jsx`: Doctor review of chronic visits.
*   **Components**:
    *   `ChronicEnrollmentModal.jsx`: Quick enrollment modal.

---

### 5.14 Follow-Up Appointments
**Purpose**: Schedule and track follow-up appointments, identify defaulters.

*   **Database Table**: `follow_ups`
*   **Department Options**: `nurse`, `doctor`, `lab`
*   **Status**: `scheduled`, `completed`, `missed`, `cancelled`, `rescheduled`
*   **Defaulter Tracking**: Automatic identification of patients who miss appointments.
*   **API Routes** (`/api/follow-ups`):
    *   `POST /schedule`: Schedule follow-up.
    *   `GET /today`: Today's appointments.
    *   `GET /upcoming`: Upcoming appointments.
    *   `GET /missed`: Missed appointments.
    *   `GET /calendar`: Calendar view data.
    *   `GET /defaulters`: Get defaulter list.
    *   `PUT /:id/complete`: Mark as completed.
    *   `PUT /:id/missed`: Mark as missed.
    *   `PUT /:id/reschedule`: Reschedule appointment.
    *   `POST /auto-mark-missed`: Admin utility to auto-mark past appointments.
*   **Frontend** (`pages/FollowUp`):
    *   `ClinicCalendar.jsx`: Calendar view of appointments.
    *   `Defaulters.jsx`: Defaulter tracking dashboard.
*   **Components**:
    *   `FollowUpModal.jsx`: Quick follow-up scheduling.

---

### 5.15 Doctor Consultation
**Purpose**: Full doctor consultation workflow with diagnosis, prescriptions, and lab orders.

*   **Workflow**:
    1. Fetch patient from queue.
    2. View vitals recorded by nurse.
    3. Enter diagnosis and notes.
    4. Create prescription (optional).
    5. Order lab tests (optional).
    6. Complete consultation or send to lab.
*   **Frontend** (`pages/doctor`):
    *   `ConsultationPage.jsx`: Comprehensive consultation interface (54KB - feature-rich).
    *   `DoctorPrescriptions.jsx`: View doctor's prescriptions.
    *   `DoctorPrescriptionDetails.jsx`: Detailed prescription view.

---

### 5.16 Staff Attendance
**Purpose**: Track employee attendance with check-in/check-out functionality.

*   **Features**:
    *   Check-in/Check-out recording.
    *   Present/Absent/Late arrivals tracking.
    *   Employee attendance history view.
*   **Frontend** (`pages/Attendance`):
    *   `CheckInCheckOut.jsx`: Daily check-in/out interface.
    *   `Present.jsx`: Currently present staff.
    *   `Absent.jsx`: Absent staff tracking.
    *   `LateArrivals.jsx`: Late arrival reports.
    *   `AddStaff.jsx`: Staff management.
    *   `EmployeeAttendanceView.jsx`: Comprehensive attendance reports.

---

### 5.17 Admin Dashboard & Statistics
**Purpose**: System-wide overview and administrative controls.

*   **API Routes** (`/api/admin`):
    *   **Staff Management**:
        *   `POST /staff/add`: Add new staff.
        *   `GET /staff/list`: List all staff.
        *   `PUT /staff/update/:id`: Update staff.
        *   `DELETE /staff/delete/:id`: Delete staff.
    *   **Statistics**:
        *   `GET /dashboard/stats`: Dashboard statistics.
        *   `GET /revenue/stats`: Revenue statistics.
        *   `GET /patients/stats`: Patient statistics.
*   **Frontend** (`pages/Dashboard`):
    *   `AdminDashboard.jsx`: System overview with statistics.
    *   `DoctorDashboard.jsx`: Doctor's assigned patients and queue.
    *   `NurseDashboard.jsx`: Vitals recording and patient care.
    *   `ReceptionDashboard.jsx`: Registration and queue management.
    *   `LabDashboard.jsx`: Pending lab orders.
    *   `PharmacyDashboard.jsx`: Pending prescriptions.

---

### 5.18 System Settings
**Purpose**: Configure system-wide settings.

*   **Database Table**: `system_settings`
*   **Default Settings**:
    *   `consultation_fee`: Default consultation fee (500).
*   **API Routes** (`/api/settings`):
    *   Settings retrieval and update endpoints.
*   **Frontend Components**:
    *   `Settings.jsx`: System settings configuration.

---

## 6. Reusable Components

| Component | Purpose |
|-----------|---------|
| `Navbar.jsx` | Top navigation bar |
| `Sidebar.jsx` | Role-based sidebar navigation |
| `ProtectedRoute.jsx` | Route access control wrapper |
| `BarcodeScanner.jsx` | Barcode scanning functionality |
| `BillPaymentModal.jsx` | Payment processing modal |
| `BillingReceipt.jsx` | Bill receipt generation |
| `ChronicEnrollmentModal.jsx` | Quick chronic care enrollment |
| `FollowUpModal.jsx` | Follow-up scheduling modal |
| `LabResultsPrint.jsx` | Printable lab results |
| `MedicineModal.jsx` | Medicine entry/edit modal |
| `NewVisitModal.jsx` | Quick new visit creation |
| `PatientBillsReceipt.jsx` | Detailed patient bill receipt |
| `Receipt.jsx` | Generic receipt component |
| `VitalsDisplay.jsx` | Vitals information display |

---

## 7. Database Schema Overview

### Core Tables
- `users` - System users with roles
- `patients` - Patient demographics and contact info

### Clinical Tables
- `queue` - Patient workflow queue
- `vitals` - Patient vital signs
- `prescriptions` / `prescription_items` - Doctor prescriptions
- `lab_orders` / `lab_order_items` / `lab_results` - Lab management
- `referrals` - Patient referrals

### Chronic Care Tables
- `clinics` - Chronic care clinic definitions
- `chronic_enrollments` - Patient enrollments in clinics
- `clinic_visits` - Nurse-led clinic visits
- `follow_ups` - Scheduled appointments

### Financial Tables
- `bills` / `bill_items` - Patient invoices
- `payments` - Payment records
- `sales` / `sales_items` - Prescription sales
- `direct_sales` / `direct_sale_items` - OTC sales

### Inventory Tables
- `medicines` - Medicine inventory
- `equipment` - Hospital equipment
- `lab_tests` / `lab_test_parameters` - Lab test catalog

### Operations Tables
- `ambulances` / `ambulance_requests` - Ambulance management
- `system_settings` - System configuration

---

## 8. API Route Summary

| Route Prefix | Controller | Purpose |
|--------------|------------|---------|
| `/api/users` | userController | Authentication & user management |
| `/api/patients` | patientController | Patient registration & records |
| `/api/queue` | queueController | Queue management & workflow |
| `/api/prescriptions` | prescriptionController | Prescription management |
| `/api/lab` | labController | Laboratory operations |
| `/api/bills` | billController | Billing & invoicing |
| `/api/inventory` | InventoryController | Medicine inventory |
| `/api/medicines` | medicineController | Medicine CRUD |
| `/api/equipment` | equipmentController | Equipment management |
| `/api/ambulance` | ambulanceController | Ambulance fleet & requests |
| `/api/referrals` | referralController | Patient referrals |
| `/api/chronic` | chronicController | Chronic clinic management |
| `/api/clinic-visits` | clinicVisitController | Chronic care visits |
| `/api/follow-ups` | followUpController | Follow-up scheduling |
| `/api/admin` | adminController | Admin dashboard & stats |
| `/api/mpesa` | mpesaController | M-Pesa payments |
| `/api/sales` | salesController | Direct sales |
| `/api/settings` | SettingsController | System settings |

---

## 9. Typical Workflows

### Patient Visit Workflow
```
Registration → Vitals (Nurse) → Consultation (Doctor) → Lab Tests → Pharmacy → Billing → Payment
```

### Chronic Care Workflow
```
Enrollment → Scheduled Visit → Nurse Records Vitals → Doctor Reviews → Follow-up Scheduled
```

### Lab Order Workflow
```
Doctor Orders → Lab Receives → Sample Collection → Processing → Results Entry → Doctor Review
```

### Prescription Workflow
```
Doctor Prescribes → Pharmacy Queue → Stock Check → Dispensing → Sale Record → Receipt
```

### Ambulance Request Workflow
```
Request Created → Doctor Approval → Ambulance Assigned → Dispatch → At Pickup → Completion
```

### Referral Workflow
```
Doctor Creates → Documentation → Hospital Transfer → Follow-up → Completion
```

---

## 10. Development Notes

- **Authentication**: JWT-based with refresh tokens. Access tokens in `Authorization` header (`Bearer <token>`).
- **Error Handling**: All controllers use `try/catch` blocks with proper error responses.
- **Database**: Use `backend/migrations/complete_database_setup.sql` for one-shot full setup (base schema + platform/multi-tenant migrations), or `schema.sql` followed by migration scripts for staged upgrades.
- **Prisma**: Prisma is configured from `backend/prisma.config.ts` and the schema lives in `backend/prisma/schema.prisma`.
- **Superadmin Bootstrap**: Create the platform superadmin from `backend/` with:
  ```bash
  npm run create:superadmin -- --username superadmin --password YourStrongPassword --phone 0700000000
  ```
- **Queue Cleanup**: Automatic hourly cleanup of stale queue items (>24 hours).
- **Event Scheduler**: MySQL Event Scheduler must be enabled for auto-expiry.
- **Printing**: Multiple receipt/document printing support throughout the system.
- **Real-time Updates**: Consider implementing WebSocket for live queue updates.

---

## 11. Environment Variables (.env)

```env
# Database
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=hospital_db
DB_PORT=3306
DB_POOL_LIMIT=30

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# M-Pesa (for production)
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=your_callback_url

# Server
PORT=5000
```

---

## 12. Future Considerations

- **Reporting Module**: Comprehensive reporting and analytics.
- **Insurance Integration**: Insurance claim processing.
- **Telemedicine**: Video consultation support.
- **Mobile App**: Patient-facing mobile application.
- **SMS Notifications**: Appointment reminders via SMS.
- **Audit Logging**: Comprehensive activity audit trail.
- **Multi-branch Support**: Support for hospital chains.
