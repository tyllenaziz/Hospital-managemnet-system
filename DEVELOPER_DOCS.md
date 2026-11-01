# Hospital Management System
## User Guide & System Documentation

Welcome to the Hospital Management System! This guide will help you understand how to use the system, regardless of your role.

---

## 📋 Table of Contents

1. [Getting Started](#1-getting-started)
2. [Understanding Your Dashboard](#2-understanding-your-dashboard)
3. [Patient Registration & Management](#3-patient-registration--management)
4. [Queue System](#4-queue-system)
5. [Recording Vitals](#5-recording-vitals)
6. [Doctor Consultations](#6-doctor-consultations)
7. [Laboratory Services](#7-laboratory-services)
8. [Pharmacy & Prescriptions](#8-pharmacy--prescriptions)
9. [Billing & Payments](#9-billing--payments)
10. [Chronic Care Management](#10-chronic-care-management)
11. [Ambulance Services](#11-ambulance-services)
12. [Patient Referrals](#12-patient-referrals)
13. [Staff Attendance](#13-staff-attendance)
14. [Inventory Management](#14-inventory-management)
15. [System Settings](#15-system-settings)
16. [Common Questions](#16-common-questions)

---

## 1. Getting Started

### Logging In

1. Open the application on your computer
2. Enter your **username** and **password**
3. Click **Login**

> **Tip**: If you forget your password, contact your system administrator.

### Your Role in the System

Each staff member has a specific role that determines what they can see and do:

| Role | What You Can Do |
|------|-----------------|
| **Receptionist** | Register patients, manage queues, handle billing |
| **Nurse** | Record vitals, chronic care visits, follow-ups |
| **Doctor** | Consultations, prescriptions, lab orders, referrals |
| **Lab Technician** | Process lab tests, enter results |
| **Pharmacist** | Dispense medicines, manage inventory, direct sales |
| **Admin** | Everything + staff management & system settings |

---

## 2. Understanding Your Dashboard

When you log in, you'll see your **Dashboard** - a home screen customized for your role.

### What's on Your Dashboard

- **Quick Statistics**: Number of patients waiting, pending tasks, etc.
- **Today's Queue**: Patients you need to attend to
- **Shortcuts**: Quick links to your most-used features
- **Alerts**: Important notifications

### Navigation

- Use the **sidebar menu** on the left to access different sections
- The menu items shown depend on your role
- Click any menu item to navigate to that section

---

## 3. Patient Registration & Management

### Registering a New Patient

**Who can do this**: Receptionist, Admin

1. Click **"Register Patient"** from the sidebar or dashboard
2. Fill in the patient details:
   - **Required**: Name, Phone Number, Age, Gender, ID Number
   - **Optional**: Email, Address, Next of Kin details
3. Click **"Register"**
4. The system will create a unique **Patient Number** automatically

### Finding an Existing Patient

1. Go to **"Patient List"**
2. Use the **search bar** to find by:
   - Patient Name
   - Patient Number
   - Phone Number
   - ID Number
3. Click on a patient to view their full profile

### Viewing Patient Details

The patient profile shows:
- ✅ Personal information
- ✅ Visit history
- ✅ Previous vitals
- ✅ Past prescriptions
- ✅ Lab results
- ✅ Billing history
- ✅ Chronic conditions enrolled

---

## 4. Queue System

The queue system ensures patients are seen in proper order across departments.

### How the Queue Works

```
Reception → Nurse → Doctor → Lab (if needed) → Pharmacy → Billing
```

### Adding a Patient to Queue

**Who can do this**: Receptionist, Admin

1. Find the patient in the system
2. Click **"New Visit"**
3. Select the department (usually starts with Nurse)
4. The patient gets a **queue number**

### Managing Your Queue

**For Nurses, Doctors, Lab, Pharmacy**:

1. Go to **"Queue"** in your sidebar
2. You'll see patients waiting for your department
3. Click **"Fetch"** to start attending to a patient
4. When done, click **"Complete"** to move them to the next department

### Queue Status Meanings

| Status | Meaning |
|--------|---------|
| 🟡 **Waiting** | Patient is waiting to be seen |
| 🔵 **In Progress** | Someone is attending to the patient |
| 🟢 **Done** | Patient has been attended to |
| 🔴 **Cancelled** | Visit was cancelled |

---

## 5. Recording Vitals

**Who can do this**: Nurse, Doctor

### Taking Vitals for a Queue Patient

1. Go to your **Queue**
2. Click **"Fetch"** next to the patient
3. Fill in the vital measurements:

| Vital | What to Enter |
|-------|---------------|
| **Blood Pressure** | Example: 120/80 (systolic/diastolic) |
| **Temperature** | In Celsius (e.g., 37.5) |
| **Pulse Rate** | Beats per minute (e.g., 72) |
| **Respiratory Rate** | Breaths per minute (e.g., 18) |
| **Weight** | In kilograms |
| **Height** | In centimeters |
| **Blood Sugar** | In mg/dL (if measured) |
| **Oxygen Saturation** | SpO2 percentage (e.g., 98%) |
| **Drug Allergies** | List any known allergies |

4. Click **"Save Vitals"**
5. Click **"Send to Doctor"** to move patient to doctor's queue

---

## 6. Doctor Consultations

**Who can do this**: Doctor

### Conducting a Consultation

1. Go to your **Queue** to see waiting patients
2. Click **"Fetch"** to start consultation
3. Review the patient's:
   - Current vitals (recorded by nurse)
   - Medical history
   - Previous visits
4. Enter your **diagnosis** and **notes**

### Ordering Lab Tests

1. During consultation, click **"Order Lab Tests"**
2. Search and select the tests needed
3. Click **"Order"**
4. The patient will be added to the Lab queue

### Creating a Prescription

1. Click **"Prescribe Medicine"**
2. For each medicine:
   - Search from inventory OR enter custom medicine name
   - Enter quantity, dosage, and duration
   - Add instructions (e.g., "Take after meals")
3. Add notes if needed
4. Click **"Save Prescription"**

### Completing the Consultation

- **Without Lab**: Click **"Complete"** → Patient goes to Pharmacy
- **With Lab**: Click **"Send to Lab"** → Patient goes to Lab first

---

## 7. Laboratory Services

**Who can do this**: Lab Technician

### Processing Lab Orders

1. Go to **"Pending Orders"** to see your queue
2. Click on an order to view details
3. Click **"Start Processing"**

### Entering Results

1. Open the lab order
2. For each test, enter the result values
3. Mark abnormal results if applicable
4. Add any remarks
5. Click **"Save Results"**
6. Click **"Complete"** to finish

### Viewing & Printing Results

- Results are automatically available to the doctor
- Click **"Print Results"** for a printable lab report

---

## 8. Pharmacy & Prescriptions

**Who can do this**: Pharmacist

### Dispensing Prescribed Medicines

1. Go to **"Pending Prescriptions"**
2. Click on a prescription to view details
3. For each medicine:
   - Check stock availability
   - Confirm quantity
   - The system will warn if stock is low
4. Click **"Dispense"**
5. Print the receipt if needed

### Direct Sales (Over-the-Counter)

For customers buying medicine without a prescription:

1. Go to **"Direct Sale"**
2. Search for medicines or scan barcode
3. Add items to cart
4. Enter quantity for each item
5. Select payment method (Cash, M-Pesa, Card)
6. Click **"Complete Sale"**
7. Print receipt

---

## 9. Billing & Payments

**Who can do this**: Receptionist, Pharmacist, Admin

### What's Included in a Bill

- Consultation fee
- Lab test charges
- Medicine costs
- Any additional services
- Discounts (if applicable)

### Viewing Patient Bills

1. Go to **"Patient Bills"** or search for the patient
2. Bills are grouped by visit
3. Click on a bill to see all items

### Processing Payment

1. Open the bill
2. Click **"Make Payment"**
3. Enter the amount being paid
4. Select payment method:
   - 💵 **Cash**
   - 💳 **Card**
   - 📱 **M-Pesa** (will send payment prompt to patient's phone)
   - 🏥 **Insurance**
5. For M-Pesa: Enter patient's phone number, they'll receive STK push
6. Click **"Process Payment"**
7. Print receipt

### Payment Status

| Status | Meaning |
|--------|---------|
| ⏳ **Pending** | Not yet paid |
| 🔶 **Partial** | Partially paid |
| ✅ **Paid** | Fully paid |

---

## 10. Chronic Care Management

For patients with long-term conditions like diabetes, hypertension, HIV, etc.

### Available Clinics

| Clinic | Purpose |
|--------|---------|
| **Diabetes (DM)** | Type 1 & 2 diabetes management |
| **Hypertension (HTN)** | Blood pressure management |
| **HIV/AIDS** | HIV care and ART management |
| **TB** | Tuberculosis treatment |
| **Antenatal (ANC)** | Pregnancy care |
| **Postnatal (PNC)** | Post-delivery care |
| **Child Wellness (CWC)** | Child health & immunization |
| **Mental Health (MH)** | Psychiatric care |

### Enrolling a Patient in Chronic Care

**Who can do this**: Doctor, Nurse, Receptionist

1. Open patient's profile
2. Click **"Enroll in Chronic Clinic"**
3. Select the clinic type
4. Record baseline measurements
5. Add enrollment notes
6. Set follow-up date
7. Click **"Enroll"**

### Recording a Chronic Care Visit

**Who can do this**: Nurse

1. Go to **"Chronic Care"** → **"Clinic Visits"**
2. Find the patient or scheduled appointment
3. Record vitals:
   - The system shows comparison with last visit
   - Abnormal readings are highlighted
4. Add notes about patient's condition
5. Save the visit

### Doctor Review

**Who can do this**: Doctor

1. Go to **"Pending Reviews"**
2. Review nurse's recorded vitals
3. Add doctor notes and recommendations
4. Decide if full consultation is needed
5. Schedule next follow-up

### Managing Defaulters

Patients who miss appointments are tracked:

1. Go to **"Defaulters"**
2. View list of patients who missed appointments
3. Contact them to reschedule
4. Update their status

---

## 11. Ambulance Services

### Requesting an Ambulance

**Who can do this**: Receptionist, Nurse, Doctor

1. Go to **"Ambulance"** → **"New Request"**
2. Select request type:
   - 🚨 **Emergency**
   - 🔄 **Transfer**
   - 📤 **Referral**
3. Enter details:
   - Patient information
   - Pickup location
   - Destination
   - Priority level
   - Special instructions
4. Submit request

### Approving Requests

**Who can do this**: Doctor

1. Go to **"Pending Requests"**
2. Review patient condition and need
3. Click **"Approve"** or **"Reject"**
4. Add any notes

### Dispatching Ambulance

**Who can do this**: Admin

1. View approved requests
2. Select available ambulance
3. Assign driver
4. Click **"Dispatch"**
5. Track status: Dispatched → On Route → At Pickup → Returning → Completed

---

## 12. Patient Referrals

When a patient needs care at another facility.

### Creating a Referral

**Who can do this**: Doctor

1. During consultation, click **"Create Referral"**
2. Fill in:
   - Receiving hospital name
   - Department being referred to
   - Reason for referral
   - Clinical summary
   - Current diagnosis
   - Medications patient is on
   - Services needed
3. Set priority: Routine, Urgent, or Emergency
4. Click **"Submit Referral"**
5. Print referral letter for patient

### Tracking Referrals

- View all referrals in **"Referrals"** section
- Track status: Pending → Accepted → Completed
- Add follow-up notes when patient returns

---

## 13. Staff Attendance

### Checking In

1. Go to **"Attendance"**
2. Click **"Check In"**
3. Your arrival time is recorded

### Checking Out

1. Go to **"Attendance"**
2. Click **"Check Out"**
3. Your departure time is recorded

### Viewing Attendance (Admin)

1. Go to **"Attendance"** → **"Reports"**
2. View:
   - Who is present today
   - Absent staff
   - Late arrivals
   - Individual attendance history

---

## 14. Inventory Management

**Who can do this**: Pharmacist, Admin

### Managing Medicines

1. Go to **"Inventory"** → **"Medicines"**
2. View current stock levels
3. See medicines expiring soon (highlighted)

### Adding New Medicine

1. Click **"Add Medicine"**
2. Enter:
   - Medicine name
   - Barcode
   - Quantity
   - Price
   - Expiry date
3. Click **"Save"**

### Updating Stock

1. Find the medicine
2. Click **"Edit"**
3. Update quantity or other details
4. Click **"Save"**

### Managing Equipment

1. Go to **"Inventory"** → **"Equipment"**
2. Track hospital equipment:
   - Serial numbers
   - Location
   - Maintenance status
   - Warranty information

---

## 15. System Settings

**Who can do this**: Admin only

### General Settings

- **Consultation Fee**: Set default fee charged per visit
- **Hospital Details**: Update hospital name, contacts, logo

### User Management

1. Go to **"Staff Management"**
2. Add new staff members
3. Assign roles
4. Reset passwords if needed
5. Deactivate accounts when staff leave

---

## 16. Common Questions

### Q: How do I reset my password?
**A**: Contact your system administrator.

### Q: A patient is in wrong queue - how do I fix it?
**A**: Cancel the current queue item and add them to the correct queue.

### Q: The system says "stock is low" - what to do?
**A**: The pharmacy needs to restock that medicine. Inform the pharmacist.

### Q: How do I print a receipt?
**A**: After payment, click the **"Print Receipt"** button that appears.

### Q: Patient forgot their number - how to find them?
**A**: Search by name, phone number, or ID number in Patient List.

### Q: How do I see a patient's previous visits?
**A**: Open their profile and go to "Visit History" tab.

### Q: M-Pesa payment failed - what now?
**A**: Wait a moment and check payment status. If still failing, try again or use another payment method.

### Q: A lab test isn't in the system - what to do?
**A**: Lab tests can be added by Admin or Lab supervisor.

---

## 🆘 Need Help?

If you encounter any issues:

1. **Check this guide first** - most answers are here
2. **Ask your supervisor** - they may know the solution
3. **Contact IT support** - for technical issues
4. **Report bugs** - note down what happened and when

---

## 📝 Quick Reference

### Common Shortcuts

| Action | Where to Find It |
|--------|------------------|
| Register new patient | Dashboard → Quick Actions |
| Search patient | Sidebar → Patient List |
| View your queue | Sidebar → Queue |
| Record vitals | When patient is fetched |
| Create prescription | During consultation |
| Process payment | Patient Bills → Payment |
| Direct sale | Pharmacy → Direct Sale |

### Daily Checklist

**Reception**:
- [ ] Check in
- [ ] Review waiting queue
- [ ] Register new patients
- [ ] Process payments

**Nurse**:
- [ ] Check in
- [ ] Record vitals for waiting patients
- [ ] Manage chronic care visits
- [ ] Schedule follow-ups

**Doctor**:
- [ ] Check in
- [ ] Attend to consultation queue
- [ ] Review chronic care visits
- [ ] Process pending lab results

**Lab**:
- [ ] Check in
- [ ] Process pending lab orders
- [ ] Enter and verify results
- [ ] Complete and submit results

**Pharmacy**:
- [ ] Check in
- [ ] Dispense pending prescriptions
- [ ] Handle direct sales
- [ ] Monitor stock levels

---

*Last Updated: January 2026*

*For technical documentation, troubleshooting, and API details, please see [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md).*
