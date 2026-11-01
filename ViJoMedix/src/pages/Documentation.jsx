
import React, { useState } from 'react';
import { LuBook, LuCode, LuSettings, LuUsers, LuDatabase, LuShield, LuChevronDown, LuChevronRight, LuArrowLeft } from 'react-icons/lu';

const Documentation = () => {
    const [activeSection, setActiveSection] = useState(null);
    const [activeGuide, setActiveGuide] = useState(null);

    const docSections = [
        {
            id: 'modules',
            icon: <LuDatabase size={28} />,
            title: 'Modules',
            description: 'Deep dive into each module of the ViJoMedix system.',
            guides: [
                {
                    id: 'patient-management',
                    title: 'Patient Management',
                    content: `
## Patient Management Module

### Patient Records
- Demographics (name, DOB, gender, address)
- Contact information
- Next of kin details
- Insurance information
- Medical history

### Search & Retrieval
- Search by name, ID, or phone number
- Advanced filters (date range, department)
- Quick patient card scanning

### Patient History
- View all past visits
- Access previous diagnoses
- Review medication history
- Check lab result trends
                    `
                },
                {
                    id: 'queue-system',
                    title: 'Queue System',
                    content: `
## Queue System Module

### Queue Types
- **Registration Queue:** New patients awaiting registration
- **Triage Queue:** Patients waiting for vitals
- **Consultation Queue:** Patients waiting for doctor
- **Lab Queue:** Patients with pending tests
- **Pharmacy Queue:** Patients with prescriptions
- **Billing Queue:** Patients ready to pay

### Queue Management
- Real-time status updates
- Average wait time display
- Priority handling for emergencies
- Automatic notifications
                    `
                },
                {
                    id: 'lab-module',
                    title: 'Lab Module',
                    content: `
## Laboratory Module

### Test Catalog
- Over 500 preconfigured tests
- Custom test creation
- Test panels and profiles
- Reference ranges by age/gender

### Workflow
1. Receive lab order
2. Collect sample
3. Process test
4. Enter results
5. Validate and release

### Result Entry
- Parametric results with units
- Automatic flagging (High/Low/Critical)
- Digital signatures
- Result history comparison
                    `
                },
                {
                    id: 'billing-insurance',
                    title: 'Billing & Insurance',
                    content: `
## Billing & Insurance Module

### Billing Features
- Automatic charge consolidation
- Multiple payment methods
- Split payments
- Deposit handling
- Credit management

### Insurance Processing
- NHIF integration
- Private insurance support
- Pre-authorization workflow
- Claims submission
- Rejection handling

### Payment Methods
- Cash
- M-Pesa (STK Push)
- Card payments
- Insurance claims
- Corporate billing
                    `
                }
            ]
        },
        {
            id: 'administration',
            icon: <LuSettings size={28} />,
            title: 'Administration',
            description: 'Configure and customize ViJoMedix for your needs.',
            guides: [
                {
                    id: 'system-settings',
                    title: 'System Settings',
                    content: `
## System Settings

### General Settings
- Facility name and branding
- Working hours configuration
- Date and time format
- Currency settings

### Notification Settings
- Email notifications
- SMS alerts
- System announcements

### Consultation Fees
- Set fees by doctor type
- Configure service charges
- Tax settings
                    `
                },
                {
                    id: 'user-permissions',
                    title: 'User Permissions',
                    content: `
## User Permissions

### Role-Based Access Control
Each role has predefined permissions that can be customized.

### Permission Categories
- **View:** Can see data but not modify
- **Create:** Can add new records
- **Edit:** Can modify existing records
- **Delete:** Can remove records
- **Admin:** Full access to settings

### Custom Roles
Create custom roles with specific permission combinations for your facility's needs.
                    `
                },
                {
                    id: 'backup-restore',
                    title: 'Backup & Restore',
                    content: `
## Backup & Restore

### Automatic Backups
- Daily automated backups at 2:00 AM
- 30-day retention policy
- Encrypted backup files

### Manual Backup
1. Go to Admin → System → Backup
2. Click "Create Backup Now"
3. Download backup file to external storage

### Restore Process
1. Go to Admin → System → Restore
2. Upload backup file
3. Verify backup integrity
4. Confirm restoration
                    `
                },
                {
                    id: 'integrations',
                    title: 'Integrations',
                    content: `
## Integrations

### M-Pesa Integration
- STK Push for payments
- Real-time transaction status
- Automatic reconciliation

### SMS Gateway
- Patient appointment reminders
- Lab result notifications
- Payment confirmations

### Hardware Integration
- Barcode scanners
- Receipt printers
- Biometric devices
- IoT vitals monitors
                    `
                }
            ]
        },
        {
            id: 'security',
            icon: <LuShield size={28} />,
            title: 'Security & Compliance',
            description: 'Security best practices and compliance guidelines.',
            guides: [
                {
                    id: 'data-protection',
                    title: 'Data Protection',
                    content: `
## Data Protection

### Encryption
- All data encrypted at rest (AES-256)
- TLS 1.3 for data in transit
- Encrypted database backups

### Access Control
- Role-based permissions
- Session timeout after inactivity
- IP whitelisting available
- Two-factor authentication

### Data Retention
- Configurable retention policies
- Secure data deletion
- Audit trail preservation
                    `
                },
                {
                    id: 'access-control',
                    title: 'Access Control',
                    content: `
## Access Control

### Authentication
- Strong password requirements
- Account lockout after failed attempts
- Password expiry policies
- Single sign-on (SSO) available

### Authorization
- Granular permission system
- Department-based access
- Record-level security
- Time-based access restrictions
                    `
                },
                {
                    id: 'audit-logs',
                    title: 'Audit Logs',
                    content: `
## Audit Logs

### What's Logged
- User login/logout events
- Patient record access
- Data modifications
- System configuration changes
- Failed access attempts

### Accessing Logs
Navigate to Admin → System → Audit Logs

### Log Retention
- 7 years default retention
- Export to external systems
- Tamper-proof storage
                    `
                },
                {
                    id: 'compliance',
                    title: 'Compliance',
                    content: `
## Compliance

### Healthcare Standards
- HIPAA-ready infrastructure
- Kenya Data Protection Act compliant
- WHO digital health guidelines

### Best Practices
- Regular security assessments
- Staff training requirements
- Incident response procedures
- Business continuity planning

### Certifications
- ISO 27001 aligned
- Regular third-party audits
- Penetration testing
                    `
                }
            ]
        }
    ];

    const handleGuideClick = (sectionId, guideId) => {
        setActiveSection(sectionId);
        setActiveGuide(guideId);
    };

    const handleBack = () => {
        setActiveSection(null);
        setActiveGuide(null);
    };

    const currentSection = docSections.find(s => s.id === activeSection);
    const currentGuide = currentSection?.guides.find(g => g.id === activeGuide);

    return (
        <div className="docs-page">
            {/* Hero Section */}
            <section className="docs-hero">
                <div className="container">
                    <h1><span className="text-gradient">Documentation</span></h1>
                    <p>Everything you need to get the most out of ViJoMedix.</p>
                </div>
            </section>

            {/* Documentation Content */}
            <section className="docs-content">
                <div className="container">
                    {activeGuide ? (
                        // Guide Detail View
                        <div className="docs-guide-view">
                            <button className="docs-back-btn" onClick={handleBack}>
                                <LuArrowLeft size={18} /> Back to Documentation
                            </button>
                            <div className="docs-guide-header">
                                <span className="docs-guide-category">{currentSection.title}</span>
                                <h2>{currentGuide.title}</h2>
                            </div>
                            <div className="docs-guide-content">
                                {currentGuide.content.split('\n').map((line, i) => {
                                    if (line.startsWith('## ')) {
                                        return <h2 key={i}>{line.replace('## ', '')}</h2>;
                                    } else if (line.startsWith('### ')) {
                                        return <h3 key={i}>{line.replace('### ', '')}</h3>;
                                    } else if (line.startsWith('**') && line.endsWith('**')) {
                                        return <p key={i}><strong>{line.replace(/\*\*/g, '')}</strong></p>;
                                    } else if (line.startsWith('- ')) {
                                        return <li key={i}>{line.replace('- ', '')}</li>;
                                    } else if (line.startsWith('| ')) {
                                        return null; // Skip table formatting for now
                                    } else if (line.trim()) {
                                        return <p key={i}>{line}</p>;
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    ) : (
                        // Grid View
                        <div className="docs-grid">
                            {docSections.map((section) => (
                                <div key={section.id} className="docs-card">
                                    <div className="docs-icon">{section.icon}</div>
                                    <h3>{section.title}</h3>
                                    <p>{section.description}</p>
                                    <ul className="docs-links">
                                        {section.guides.map((guide) => (
                                            <li key={guide.id}>
                                                <button
                                                    onClick={() => handleGuideClick(section.id, guide.id)}
                                                    className="docs-link-btn"
                                                >
                                                    {guide.title} <LuChevronRight size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Help CTA */}
            {!activeGuide && (
                <section className="docs-cta">
                    <div className="container">
                        <div className="docs-cta-box">
                            <h3>Need Help?</h3>
                            <p>Can't find what you're looking for? Our support team is here to help.</p>
                            <a href="mailto:support@nexvijo.com" className="btn btn-primary">Contact Support</a>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Documentation;
