## Backend Quick Commands

Run these from `backend/`:

```bash
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
npm run create:superadmin -- --username superadmin --password YourStrongPassword --phone 0700000000
```

Notes:
- `npx prisma migrate dev --name init` creates or updates local tables from Prisma schema.
- `npx prisma generate` regenerates Prisma Client.
- `npm run prisma:seed` seeds the master lab catalog and syncs lab tests to hospitals.
- `npm run create:superadmin -- --username ... --password ...` creates or upgrades a user into a platform superadmin.

Complete Workflow Examples:
Scenario 1: Patient needs lab tests only
1. Doctor orders lab tests:
jsonPUT /api/queue/1/complete-with-lab
Authorization: Bearer DOCTOR_TOKEN
{
  "notes": "Patient has fever and cough",
  "diagnosis": "Suspected infection",
  "lab_tests": [1, 3, 5],
  "nextDepartment": "lab"
}
2. Lab technician fetches order:
jsonGET /api/lab/orders/pending
Authorization: Bearer LAB_TOKEN
3. Lab tech starts working on order:
jsonPUT /api/lab/orders/1/start
Authorization: Bearer LAB_TOKEN
4. Lab tech adds results for each test:
jsonPOST /api/lab/results/1
Authorization: Bearer LAB_TOKEN
{
  "result_value": "15.2",
  "remarks": "Elevated white blood cell count",
  "is_abnormal": true
}
5. Billing creates bill and adds lab tests:
jsonPOST /api/bills
Authorization: Bearer BILLING_TOKEN
{
  "patient_id": 1,
  "queue_id": 1,
  "consultation_fee": 500
}

Response: { "success": true, "bill": { "id": 1 } }

POST /api/bills/1/lab-tests
{
  "lab_order_id": 1
}
Scenario 2: Patient needs both lab tests and medicines
1. Doctor orders everything:
jsonPUT /api/queue/1/complete-with-lab
{
  "notes": "High blood pressure detected",
  "diagnosis": "Hypertension",
  "lab_tests": [2, 4],
  "nextDepartment": "lab"
}
2. After lab is complete, doctor reviews and prescribes:
jsonPOST /api/prescriptions
Authorization: Bearer DOCTOR_TOKEN
{
  "queue_id": 1,
  "patient_id": 1,
  "notes": "Lab results confirm hypertension",
  "diagnosis": "Essential Hypertension",
  "items": [
    {
      "medicine_id": 3,
      "quantity": 30,
      "dosage": "10mg",
      "duration": "30 days",
      "instructions": "Take once daily in the morning"
    }
  ],
  "nextDepartment": "pharmacy"
}
3. Pharmacy dispenses medicine:
jsonPOST /api/prescriptions/1/dispense
Authorization: Bearer PHARMACY_TOKEN
{
  "items": [
    {
      "barcode": "1234567890123",
      "quantity": 30
    }
  ],
  "payment_method": "cash"
}
4. Billing creates comprehensive bill:
jsonPOST /api/bills
{
  "patient_id": 1,
  "queue_id": 1,
  "consultation_fee": 500
}

POST /api/bills/1/lab-tests
{
  "lab_order_id": 1
}

POST /api/bills/1/medicines
{
  "prescription_id": 1
}
5. Patient makes payment:
jsonPOST /api/bills/1/payment
Authorization: Bearer BILLING_TOKEN
{
  "amount": 2500,
  "payment_method": "mpesa",
  "reference_number": "QWE123RTY456"
}
Scenario 3: View complete bill with all services
jsonGET /api/bills/1
Authorization: Bearer TOKEN

Response:
{
  "id": 1,
  "patient_name": "John Doe",
  "phone": "0712345678",
  "consultation_fee": 500,
  "lab_fee": 1200,
  "pharmacy_fee": 800,
  "total_amount": 2500,
  "discount": 0,
  "final_amount": 2500,
  "payment_status": "paid",
  "items": [
    {
      "type": "consultation",
      "description": "Doctor Consultation",
      "quantity": 1,
      "unit_price": 500,
      "subtotal": 500
    },
    {
      "type": "lab_test",
      "description": "Complete Blood Count",
      "quantity": 1,
      "unit_price": 600,
      "subtotal": 600
    },
    {
      "type": "lab_test",
      "description": "Blood Sugar Test",
      "quantity": 1,
      "unit_price": 600,
      "subtotal": 600
    },
    {
      "type": "medicine",
      "description": "Amlodipine 10mg",
      "quantity": 30,
      "unit_price": 26.67,
      "subtotal": 800
    }
  ]
}
Summary of the Complete Flow:






GET /attendance?date=2025-10-07
