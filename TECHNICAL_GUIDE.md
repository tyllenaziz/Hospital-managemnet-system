# Technical Guide & Troubleshooting

This document outlines technical details, scripts, and troubleshooting steps for the Hospital Management System, specifically focusing on recent updates to the Lab and Doctor modules.

---

## 🛠️ Database Seeding & Repair

### Lab Tests & Parameters
If lab tests are missing or parameters are not showing up, use the repair script. This script:
1.  **Recreates** `lab_tests` and `lab_test_parameters` tables if missing.
2.  **Cleans** existing data.
3.  **Seeds** 14 standard lab tests with correct `hospital_id` linkage.

**How to Run:**
```bash
node backend/scripts/seed_lab_tests.js
```

**Common Issues Fixed:**
- Missing `lab_test_parameters` table.
- Lab tests not linked to a hospital (causing visibility issues).

### Queue Repair
If patients are waiting but "Queue item not found" errors occur, run the queue repair script to fix NULL `hospital_id` or `queue_number`s.

**How to Run:**
```bash
node backend/scripts/repair_queue_data.js
```

---

## 🔌 API Endpoints

### Lab Completion Workflow
We have standardized the Lab Completion API to ensure patients are correctly returned to the Doctor's queue.

**Endpoint:**
`PUT /api/queue/:queueId/lab-complete`

**Payload:**
```json
{
  "labOrderId": 123
}
```

**Why this change?**
- Previously, the system tried to complete via `/api/lab/orders/:id/complete`, which disconnected the queue flow.
- The new endpoint uses the **Active Lab Queue ID** (fetched dynamically) to ensure the correct visit is updated.
- It verifies the queue item is in `waiting` or `in_progress` status.

---

## 🐛 Troubleshooting & Fixes

### "Assignment to constant variable" Error
**Symptom:** API crashes with `TypeError: Assignment to constant variable` when fetching lab results.
**Cause:** The code was trying to append to a `const sql` string.
**Fix:** Variable declarations changed to `let sql` in `labController.js`.

### "Maximum update depth exceeded" in Imaging Modal
**Symptom:** Infinite loop/crash when opening Imaging Order modal.
**Cause:** `useEffect` dependency on unstable prop object `selectedImaging`.
**Fix:** `useEffect` now only runs when `isOpen` changes to `true`.

### Doctor Consultation API 404
**Symptom:** "Queue item not found" when trying to complete consultation.
**Cause:** API was only looking for `waiting` queue items, but the patient was already `in_progress`.
**Fix:** Backend updated to check `status IN ('waiting', 'in_progress')`.

---

## 🎨 UX Improvements

### Doctor Consultation
- **Loading State:** "Complete" buttons now show a spinner ("Processing...") during API calls.
- **Success Feedback:** A green toast notification appears on success.
- **Navigation:** System waits 2 seconds before redirecting to dashboard to ensure the user sees the success message.
- **Header:** The "Complete" button in the header now shares the same loading state logic.
