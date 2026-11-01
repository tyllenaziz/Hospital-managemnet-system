# Modular Offline-First Hospital Management System
## Implementation Plan & Architecture Documentation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Analysis](#2-system-analysis)
3. [Modular Architecture Design](#3-modular-architecture-design)
4. [Offline-First & LAN Architecture](#4-offline-first--lan-architecture)
5. [Cloud Sync Mechanism](#5-cloud-sync-mechanism)
6. [Multi-User Concurrency](#6-multi-user-concurrency)
7. [Database Design](#7-database-design)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Executive Summary

This document outlines the architectural redesign of the Bensmma Hospital Management System to become:
- **Modular**: Hospitals can enable/disable features based on their needs
- **Offline-First**: Full functionality without internet connection
- **LAN-Based**: Multiple devices connect via local network
- **Cloud-Syncable**: Auto-sync when internet becomes available
- **Multi-User**: Support concurrent operations across all departments

---

## 2. System Analysis

### Current Modules Identified

| Module | Core Files | Dependencies |
|--------|-----------|--------------|
| **Core (Required)** | Patient, User, Queue, Vitals | None |
| **Billing** | Bill, CashierShift, Mpesa | Core |
| **Pharmacy** | Medicine, Prescription | Core, Billing |
| **Laboratory** | LabOrder, LabTest | Core, Billing |
| **Radiology** | radiologyController | Core, Billing |
| **Inventory** | Medicine, Equipment | Core |
| **Insurance** | insuranceController | Core, Billing |
| **Chronic Care** | chronicController, clinicVisit | Core |
| **Ambulance** | ambulanceModel | Core |
| **HR/Attendance** | attendanceModel | Core |
| **Expenses** | expenseModel | Core |
| **Referrals** | Referral | Core |
| **Follow-Up** | followUpController | Core |
| **Audit** | auditController | Core |

### Current Technology Stack
- **Backend**: Node.js + Express
- **Database**: MySQL with Sequelize ORM
- **Frontend**: React + Vite
- **Desktop**: Electron (via main.js)

---

## 3. Modular Architecture Design

### 3.1 Module Classification

```
┌─────────────────────────────────────────────────────────────┐
│                    CORE MODULE (Required)                   │
│  - Patient Management                                       │
│  - User Authentication                                      │
│  - Queue System                                             │
│  - Vitals Recording                                         │
│  - Basic Reports                                            │
└─────────────────────────────────────────────────────────────┘
                              │
     ┌────────────────────────┼────────────────────────┐
     │                        │                        │
     ▼                        ▼                        ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  CLINICAL   │      │  FINANCIAL  │      │ OPERATIONS  │
├─────────────┤      ├─────────────┤      ├─────────────┤
│ □ Pharmacy  │      │ □ Billing   │      │ □ Inventory │
│ □ Laboratory│      │ □ Insurance │      │ □ HR/Staff  │
│ □ Radiology │      │ □ Expenses  │      │ □ Ambulance │
│ □ Chronic   │      │ □ M-Pesa    │      │ □ Audit     │
│ □ Referrals │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
```

### 3.2 Module Configuration Schema

```javascript
// backend/config/modules.config.js
module.exports = {
  modules: {
    // Clinical Modules
    pharmacy: { enabled: true, required: false },
    laboratory: { enabled: true, required: false },
    radiology: { enabled: false, required: false },
    chronicCare: { enabled: true, required: false },
    referrals: { enabled: true, required: false },
    
    // Financial Modules
    billing: { enabled: true, required: true },
    insurance: { enabled: false, required: false },
    expenses: { enabled: true, required: false },
    mpesa: { enabled: true, required: false },
    
    // Operations Modules
    inventory: { enabled: true, required: false },
    attendance: { enabled: true, required: false },
    ambulance: { enabled: false, required: false },
    audit: { enabled: true, required: false }
  }
};
```

### 3.3 Hospital Setup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    HOSPITAL SETUP WIZARD                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Hospital Information                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Hospital Name: [_________________________]            │ │
│  │ Address:       [_________________________]            │ │
│  │ Phone:         [_________________________]            │ │
│  │ Email:         [_________________________]            │ │
│  │ Logo:          [Upload]                               │ │
│  │ License No:    [_________________________]            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Step 2: Select Modules                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ CLINICAL                    FINANCIAL                 │ │
│  │ ☑ Pharmacy                  ☑ Billing (Required)     │ │
│  │ ☑ Laboratory                ☐ Insurance/NHIF         │ │
│  │ ☐ Radiology                 ☑ M-Pesa Integration     │ │
│  │ ☑ Chronic Care              ☑ Expense Management     │ │
│  │ ☑ Referrals                                          │ │
│  │                                                       │ │
│  │ OPERATIONS                                            │ │
│  │ ☑ Inventory                 ☑ HR/Attendance          │ │
│  │ ☐ Ambulance                 ☑ Audit Trail            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Step 3: Admin Account                                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Username: [_________________________]                 │ │
│  │ Password: [_________________________]                 │ │
│  │ Confirm:  [_________________________]                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    [Complete Setup]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Offline-First & LAN Architecture

### 4.1 Network Topology

```
                    ┌────────────────────────────────────┐
                    │         HOSPITAL LAN               │
                    └────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  LOCAL SERVER   │       │     SWITCH      │       │  BACKUP SERVER  │
│  (Main Server)  │◄─────►│    /ROUTER      │◄─────►│   (Optional)    │
│                 │       │                 │       │                 │
│ - Node.js API   │       │  192.168.1.1    │       │ - Hot Standby   │
│ - MySQL DB      │       │                 │       │ - Auto Failover │
│ - File Storage  │       └────────┬────────┘       │                 │
│                 │                │                │                 │
│ 192.168.1.10    │                │                │  192.168.1.11   │
└─────────────────┘                │                └─────────────────┘
                                   │
      ┌────────────┬───────────────┼───────────────┬────────────┐
      │            │               │               │            │
      ▼            ▼               ▼               ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│RECEPTION │ │  NURSE   │ │  DOCTOR  │ │   LAB    │ │ PHARMACY │
│  PC 1    │ │  PC 2    │ │  PC 3    │ │  PC 4    │ │  PC 5    │
│          │ │          │ │          │ │          │ │          │
│.168.1.20 │ │.168.1.21 │ │.168.1.22 │ │.168.1.23 │ │.168.1.24 │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### 4.2 Local Server Setup

#### Hardware Requirements
```
Minimum Server Specifications:
- CPU: Intel Core i5 or equivalent (4+ cores)
- RAM: 8GB minimum (16GB recommended)
- Storage: 256GB SSD (500GB+ recommended)
- Network: Gigabit Ethernet
- UPS: 1000VA minimum (for power backup)

Client Workstations:
- CPU: Intel Core i3 or equivalent
- RAM: 4GB minimum
- Storage: 128GB SSD
- Network: Gigabit Ethernet or WiFi (802.11ac+)
```

#### Server Software Stack
```
┌─────────────────────────────────────────┐
│           APPLICATION LAYER             │
│  ┌─────────────────────────────────┐   │
│  │     Node.js + Express API       │   │
│  │     (Port 3000)                 │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│            DATABASE LAYER               │
│  ┌─────────────────────────────────┐   │
│  │     MySQL 8.0                   │   │
│  │     (Port 3306)                 │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│            STORAGE LAYER                │
│  ┌─────────────────────────────────┐   │
│  │     Local File System           │   │
│  │     (Patient files, reports)    │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│          OPERATING SYSTEM               │
│  ┌─────────────────────────────────┐   │
│  │     Ubuntu Server 22.04 LTS     │   │
│  │     or Windows Server 2022      │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 4.3 Client Connection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT STARTUP FLOW                      │
└─────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  START   │
    └────┬─────┘
         │
         ▼
    ┌────────────────┐
    │ Load Electron  │
    │     App        │
    └────────┬───────┘
             │
             ▼
    ┌────────────────────┐     ┌──────────────────┐
    │ Check Local Server │────►│ Server Found?    │
    │ (192.168.1.10:3000)│     └────────┬─────────┘
    └────────────────────┘              │
                                   YES  │  NO
                              ┌─────────┴─────────┐
                              │                   │
                              ▼                   ▼
                    ┌─────────────────┐  ┌────────────────┐
                    │ Connect to API  │  │ Try Backup     │
                    │ Load Dashboard  │  │ Server         │
                    └─────────────────┘  │ (192.168.1.11) │
                                         └────────┬───────┘
                                                  │
                                                  ▼
                                         ┌────────────────┐
                                         │ Still Failed?  │────►[Show Error]
                                         │ Retry in 5s    │
                                         └────────────────┘
```

---

## 5. Cloud Sync Mechanism

### 5.1 Sync Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SYNC ARCHITECTURE                            │
└──────────────────────────────────────────────────────────────────────┘

    LOCAL SERVER                              CLOUD SERVER
    ────────────                              ────────────
┌─────────────────┐                      ┌─────────────────┐
│   MySQL DB      │                      │   Cloud MySQL   │
│   (Primary)     │                      │   (Backup)      │
└────────┬────────┘                      └────────┲────────┘
         │                                        ║
         │         ┌─────────────────────┐       ║
         │         │    SYNC ENGINE      │       ║
         └────────►│                     │◄══════╝
                   │ - Change Detection  │
                   │ - Conflict Resolver │
                   │ - Data Transform    │
                   │ - Batch Processor   │
                   └─────────────────────┘
                            │
                   ┌────────┴────────┐
                   │  SYNC QUEUE     │
                   │  (Redis/SQLite) │
                   └─────────────────┘


    ┌─────────────────────────────────────┐
    │         SYNC STATES                 │
    ├─────────────────────────────────────┤
    │  🟢 SYNCED     - Data is up to date │
    │  🟡 PENDING    - Waiting to sync    │
    │  🔵 SYNCING    - Currently syncing  │
    │  🔴 CONFLICT   - Needs resolution   │
    │  ⚪ OFFLINE    - No connection      │
    └─────────────────────────────────────┘
```

### 5.2 Sync Data Categories

```
┌──────────────────────────────────────────────────────────────────────┐
│                     DATA SYNC PRIORITY                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  HIGH PRIORITY (Sync Immediately)                                    │
│  ├── Patient Records                                                 │
│  ├── Prescriptions                                                   │
│  ├── Lab Results                                                     │
│  └── Billing/Payments                                                │
│                                                                      │
│  MEDIUM PRIORITY (Sync Every 5 Minutes)                              │
│  ├── Queue Updates                                                   │
│  ├── Vitals                                                          │
│  ├── Inventory Changes                                               │
│  └── Attendance Records                                              │
│                                                                      │
│  LOW PRIORITY (Sync Every 30 Minutes)                                │
│  ├── Audit Logs                                                      │
│  ├── System Settings                                                 │
│  └── Report Data                                                     │
│                                                                      │
│  BACKGROUND (Sync During Idle)                                       │
│  ├── File Attachments                                                │
│  ├── Historical Data                                                 │
│  └── Analytics Data                                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.3 Conflict Resolution Strategy

```
┌──────────────────────────────────────────────────────────────────────┐
│                  CONFLICT RESOLUTION RULES                           │
└──────────────────────────────────────────────────────────────────────┘

    Record Modified Locally          Record Modified in Cloud
    ────────────────────            ─────────────────────────
           │                                   │
           │        ┌────────────────┐         │
           └───────►│ COMPARE        │◄────────┘
                    │ TIMESTAMPS     │
                    └───────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │ Local is Newer  │         │ Cloud is Newer  │
    │                 │         │                 │
    │ Push to Cloud   │         │ Pull to Local   │
    └─────────────────┘         └─────────────────┘


    SPECIAL CASES:
    ══════════════

    1. SAME TIMESTAMP (Rare Edge Case)
       └── Use Server ID + Record ID as tiebreaker

    2. CRITICAL MEDICAL DATA
       └── NEVER auto-resolve - Flag for manual review
       └── Preserve BOTH versions with audit trail

    3. FINANCIAL TRANSACTIONS
       └── Use optimistic locking
       └── Reject conflicting transactions
       └── Notify user for re-submission

    4. PATIENT RECORDS
       └── Merge non-conflicting fields
       └── Flag conflicting fields for review
```

### 5.4 Sync Failure Recovery

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SYNC FAILURE RECOVERY                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SCENARIO 1: Network Failure During Sync                           │
│  ─────────────────────────────────────────                          │
│  1. Transaction rolls back automatically                            │
│  2. Failed items remain in sync queue                               │
│  3. Retry with exponential backoff (5s, 10s, 30s, 60s, 5min)        │
│  4. After 5 failures, mark as "REQUIRES_ATTENTION"                  │
│                                                                     │
│  SCENARIO 2: Partial Sync Completion                                │
│  ─────────────────────────────────────                              │
│  1. Each record has individual sync status                          │
│  2. Successfully synced records are marked                          │
│  3. Failed records retry independently                              │
│  4. Progress is preserved across restarts                           │
│                                                                     │
│  SCENARIO 3: Extended Offline Period (>24 hours)                    │
│  ──────────────────────────────────────────────                     │
│  1. System continues logging all changes                            │
│  2. When online, full differential sync triggers                    │
│  3. Large batches processed in background                           │
│  4. User notified of sync progress                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Multi-User Concurrency

### 6.1 Role-Based Concurrent Access

```
┌──────────────────────────────────────────────────────────────────────┐
│                   CONCURRENT USER SCENARIO                          │
└──────────────────────────────────────────────────────────────────────┘

    TIME
      │
      │   RECEPTION       NURSE 1        DOCTOR        LAB          PHARMACY
      │   ─────────       ───────        ──────        ───          ────────
      │
    9:00  Add patient
      │   to queue      ───────────►  
      │                  Fetch patient
    9:05                 Record vitals
      │                       │
      │                       ▼
    9:10                 Send to Doctor ──►
      │                               Start consult
      │                               Order lab tests ───►
    9:15                                              Receive order
      │                                               Process sample
    9:20                                              
      │                                               Enter results
    9:25                          ◄─────────────────  Complete & Send
      │                           Review results
      │                           Prescribe meds ────────────────────►
    9:30                                                      Dispense
      │                           Complete visit              Generate bill
      │
      ▼
```

### 6.2 Record Locking Strategy

```javascript
// OPTIMISTIC LOCKING with Version Control

// Database Schema Addition
{
  id: INTEGER,
  // ... other fields
  version: INTEGER,           // Increment on every update
  locked_by: INTEGER,         // User ID who has lock
  locked_at: DATETIME,        // Lock timestamp
  updated_by: INTEGER,        // Last modifier
  updated_at: DATETIME        // Last modification time
}

// Lock Acquisition Flow
async function acquireLock(recordId, userId) {
  const record = await Model.findByPk(recordId);
  
  // Check if already locked by another user
  if (record.locked_by && record.locked_by !== userId) {
    const lockAge = Date.now() - new Date(record.locked_at);
    const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    
    if (lockAge < LOCK_TIMEOUT) {
      throw new Error('Record is being edited by another user');
    }
    // Lock expired, allow override
  }
  
  // Acquire lock
  await record.update({
    locked_by: userId,
    locked_at: new Date()
  });
  
  return true;
}
```

### 6.3 Status Tracking System

```
┌──────────────────────────────────────────────────────────────────────┐
│                    QUEUE STATUS WORKFLOW                            │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────┐     ┌────────────┐     ┌────────────┐     ┌──────────┐
    │ WAITING │────►│IN_PROGRESS │────►│  PENDING   │────►│   DONE   │
    └─────────┘     └────────────┘     └────────────┘     └──────────┘
         │               │                   │                  │
         │               │                   │                  │
         ▼               ▼                   ▼                  ▼
    [Created when   [When fetched     [Waiting for      [All steps
     added to        by staff]         next dept]        complete]
     queue]          

    Additional Statuses:
    ┌─────────────┐
    │  CANCELLED  │  ← Patient left / mistake
    └─────────────┘
    ┌─────────────┐
    │   ON_HOLD   │  ← Pending payment/approval
    └─────────────┘
```

### 6.4 Audit Trail System

```sql
-- audit_logs table structure
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW') NOT NULL,
    user_id INT NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
);
```

---

## 7. Database Design

### 7.1 New Tables Required

```sql
-- Hospital Configuration
CREATE TABLE hospital_config (
    id INT PRIMARY KEY DEFAULT 1,
    hospital_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    logo_path VARCHAR(255),
    license_number VARCHAR(100),
    setup_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Module Configuration
CREATE TABLE module_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_code VARCHAR(50) NOT NULL UNIQUE,
    module_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT FALSE,
    config_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sync Status Tracking
CREATE TABLE sync_queue (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    data JSON NOT NULL,
    priority ENUM('HIGH', 'MEDIUM', 'LOW', 'BACKGROUND') DEFAULT 'MEDIUM',
    status ENUM('PENDING', 'SYNCING', 'COMPLETED', 'FAILED', 'CONFLICT') DEFAULT 'PENDING',
    attempts INT DEFAULT 0,
    last_attempt TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_priority (priority)
);

-- Sync Metadata
CREATE TABLE sync_metadata (
    id INT PRIMARY KEY DEFAULT 1,
    last_sync_at TIMESTAMP NULL,
    sync_status ENUM('IDLE', 'SYNCING', 'ERROR') DEFAULT 'IDLE',
    records_synced INT DEFAULT 0,
    records_pending INT DEFAULT 0,
    last_error TEXT
);
```

### 7.2 Sync-Enabled Table Modifications

```sql
-- Add sync columns to all tables
ALTER TABLE patients ADD COLUMN sync_status ENUM('synced', 'pending', 'conflict') DEFAULT 'pending';
ALTER TABLE patients ADD COLUMN sync_version INT DEFAULT 1;
ALTER TABLE patients ADD COLUMN local_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE patients ADD COLUMN cloud_updated_at TIMESTAMP NULL;

-- Repeat for all major tables:
-- users, queue, vitals, prescriptions, lab_orders, bills, etc.
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Create hospital_config and module_config tables
- [ ] Build Hospital Setup Wizard UI
- [ ] Implement module loader system
- [ ] Create conditional route loading

### Phase 2: Modular Backend (Weeks 3-4)
- [ ] Refactor routes to be module-aware
- [ ] Create middleware for module access control
- [ ] Update controllers to check module state
- [ ] Add module-specific settings API

### Phase 3: Modular Frontend (Weeks 5-6)
- [ ] Create dynamic sidebar based on enabled modules
- [ ] Implement lazy loading for module components
- [ ] Build module management admin page
- [ ] Update role permissions per module

### Phase 4: Sync Infrastructure (Weeks 7-8)
- [ ] Create sync_queue and sync_metadata tables
- [ ] Build SyncEngine service
- [ ] Implement change detection triggers
- [ ] Create conflict resolution logic

### Phase 5: LAN Optimization (Weeks 9-10)
- [ ] Optimize API for local network
- [ ] Implement connection health monitoring
- [ ] Add backup server failover
- [ ] Build local file storage system

### Phase 6: Cloud Integration (Weeks 11-12)
- [ ] Set up cloud MySQL instance
- [ ] Implement secure sync API
- [ ] Build sync status dashboard
- [ ] Test offline-to-online transitions

### Phase 7: Concurrency & Polish (Weeks 13-14)
- [ ] Implement record locking
- [ ] Enhance audit logging
- [ ] Performance optimization
- [ ] User acceptance testing

---

## User Review Required

> [!IMPORTANT]
> **Key Decisions Needed:**
> 1. Which cloud provider should be used for sync? (AWS, Azure, Google Cloud, DigitalOcean)
> 2. Should radiology module be included in initial release?
> 3. Preferred conflict resolution strategy for patient data?
> 4. Budget for cloud infrastructure?

---

*Document Version: 1.0*
*Created: February 2026*
