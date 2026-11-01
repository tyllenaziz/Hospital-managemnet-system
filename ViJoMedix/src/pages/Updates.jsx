
import React from 'react';
import { LuCalendar, LuRocket, LuWrench, LuZap, LuSparkles } from 'react-icons/lu';

const Updates = () => {
    const updates = [
        {
            version: 'v2.1.0',
            date: 'Feb 10, 2026',
            title: 'IoT Integration Beta',
            description: 'Introduced support for automated vitals collection using supported IoT medical devices. Connect blood pressure monitors, pulse oximeters, and glucometers directly to ViJoMedix for seamless data capture.',
            type: 'feature',
            icon: <LuZap />
        },
        {
            version: 'v2.0.5',
            date: 'Jan 25, 2026',
            title: 'Performance Improvements',
            description: 'Optimized database queries decreasing load times by 40% for large patient records. Enhanced the pharmacy module for faster medication dispensing workflows.',
            type: 'fix',
            icon: <LuWrench />
        },
        {
            version: 'v2.0.0',
            date: 'Jan 01, 2026',
            title: 'New UI Overhaul',
            description: 'Released the completely redesigned dashboard with dark mode support and improved accessibility. New navigation structure, refined color palette, and enhanced mobile responsiveness.',
            type: 'major',
            icon: <LuRocket />
        },
        {
            version: 'v1.9.8',
            date: 'Dec 15, 2025',
            title: 'M-Pesa STK Push Enhancement',
            description: 'Improved M-Pesa payment reliability with automatic retry logic and better error handling. Added payment receipts and transaction history in the billing module.',
            type: 'feature',
            icon: <LuSparkles />
        },
        {
            version: 'v1.9.5',
            date: 'Dec 01, 2025',
            title: 'Lab Results Digital Signatures',
            description: 'Lab technicians can now digitally sign test results before releasing them to doctors. Added audit trail for all lab result modifications.',
            type: 'feature',
            icon: <LuSparkles />
        }
    ];

    return (
        <div className="updates-page">
            {/* Hero Section */}
            <section className="updates-hero">
                <div className="container">
                    <h1>Product <span className="text-gradient">Updates</span></h1>
                    <p>See what's new in ViJoMedix. We're constantly improving to serve you better.</p>
                </div>
            </section>

            {/* Timeline */}
            <section className="updates-content">
                <div className="container">
                    <div className="updates-timeline">
                        {updates.map((update, i) => (
                            <div key={i} className={`update-item ${update.type}`}>
                                <div className="update-dot"></div>
                                <div className="update-card">
                                    <div className="update-meta">
                                        <span className="update-date">{update.date}</span>
                                        <span className="update-version">{update.version}</span>
                                        <span className={`update-type ${update.type}`}>
                                            {update.icon}
                                            {update.type === 'feature' ? 'New Feature' : update.type === 'fix' ? 'Bug Fix' : 'Major Release'}
                                        </span>
                                    </div>
                                    <h3>{update.title}</h3>
                                    <p>{update.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Updates;
