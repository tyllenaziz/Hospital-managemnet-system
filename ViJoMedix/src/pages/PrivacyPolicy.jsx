
import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="legal-page">
            <section className="legal-hero">
                <div className="container">
                    <h1>Privacy <span className="text-gradient">Policy</span></h1>
                    <p>Last updated: February 1, 2026</p>
                </div>
            </section>

            <section className="legal-content">
                <div className="container">
                    <div className="legal-body">
                        <h2>1. Introduction</h2>
                        <p>
                            NextVijo ("we", "our", or "us") operates the ViJoMedix healthcare management platform.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                            when you use our software and services.
                        </p>

                        <h2>2. Information We Collect</h2>
                        <h3>2.1 Personal Information</h3>
                        <p>We may collect personal information that you provide directly to us, including:</p>
                        <ul>
                            <li>Name, email address, and phone number</li>
                            <li>Healthcare facility name and address</li>
                            <li>Payment and billing information</li>
                            <li>User account credentials</li>
                        </ul>

                        <h3>2.2 Patient Health Information</h3>
                        <p>
                            ViJoMedix processes Protected Health Information (PHI) on behalf of healthcare facilities.
                            This information is owned by the healthcare facility and processed according to their
                            instructions and applicable healthcare regulations.
                        </p>

                        <h2>3. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul>
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process transactions and send related information</li>
                            <li>Send technical notices and support messages</li>
                            <li>Respond to your comments, questions, and requests</li>
                            <li>Monitor and analyze trends, usage, and activities</li>
                        </ul>

                        <h2>4. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational security measures to protect your
                            personal information against unauthorized access, alteration, disclosure, or destruction.
                            These measures include encryption, access controls, and regular security assessments.
                        </p>

                        <h2>5. Data Retention</h2>
                        <p>
                            We retain personal information for as long as necessary to provide our services and
                            fulfill the purposes described in this policy, unless a longer retention period is
                            required by law.
                        </p>

                        <h2>6. Your Rights</h2>
                        <p>Depending on your location, you may have the right to:</p>
                        <ul>
                            <li>Access the personal information we hold about you</li>
                            <li>Request correction of inaccurate information</li>
                            <li>Request deletion of your personal information</li>
                            <li>Object to or restrict certain processing activities</li>
                            <li>Data portability</li>
                        </ul>

                        <h2>7. Third-Party Services</h2>
                        <p>
                            We may use third-party services for payment processing (M-Pesa, bank integrations),
                            cloud hosting, and analytics. These providers have their own privacy policies governing
                            the use of your information.
                        </p>

                        <h2>8. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any changes
                            by posting the new policy on this page and updating the "Last updated" date.
                        </p>

                        <h2>9. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at:<br />
                            <strong>Email:</strong> privacy@nextvijo.com<br />
                            <strong>Address:</strong> Nairobi, Kenya
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
