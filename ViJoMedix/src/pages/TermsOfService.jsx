
import React from 'react';

const TermsOfService = () => {
    return (
        <div className="legal-page">
            <section className="legal-hero">
                <div className="container">
                    <h1>Terms of <span className="text-gradient">Service</span></h1>
                    <p>Last updated: February 1, 2026</p>
                </div>
            </section>

            <section className="legal-content">
                <div className="container">
                    <div className="legal-body">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using ViJoMedix software and services provided by NextVijo ("Company"),
                            you agree to be bound by these Terms of Service. If you do not agree to these terms,
                            please do not use our services.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            ViJoMedix is a comprehensive hospital management system that provides patient management,
                            billing, pharmacy, laboratory, and other healthcare-related software solutions. The service
                            is provided as a licensed software product.
                        </p>

                        <h2>3. User Accounts</h2>
                        <p>
                            You are responsible for maintaining the confidentiality of your account credentials and
                            for all activities that occur under your account. You agree to notify us immediately of
                            any unauthorized use of your account.
                        </p>

                        <h2>4. License Grant</h2>
                        <p>
                            Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license
                            to use ViJoMedix for your internal business purposes in accordance with your subscription plan.
                        </p>

                        <h2>5. Acceptable Use</h2>
                        <p>You agree not to:</p>
                        <ul>
                            <li>Use the service for any unlawful purpose</li>
                            <li>Attempt to gain unauthorized access to any part of the service</li>
                            <li>Interfere with or disrupt the service or servers</li>
                            <li>Reverse engineer, decompile, or disassemble the software</li>
                            <li>Share your license with unauthorized parties</li>
                        </ul>

                        <h2>6. Data Ownership</h2>
                        <p>
                            You retain all rights to your data entered into ViJoMedix. We do not claim ownership
                            of patient records, billing data, or any other information you input into the system.
                            You are responsible for ensuring you have proper consent to store patient information.
                        </p>

                        <h2>7. Payment Terms</h2>
                        <p>
                            Subscription fees are billed according to your chosen plan (monthly or annually).
                            All fees are non-refundable except as expressly stated otherwise. We reserve the right
                            to modify pricing with 30 days advance notice.
                        </p>

                        <h2>8. Support and Maintenance</h2>
                        <p>
                            Technical support is provided according to your subscription tier. We will provide
                            software updates and security patches as part of your active subscription.
                        </p>

                        <h2>9. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, NextVijo shall not be liable for any indirect,
                            incidental, special, consequential, or punitive damages, or any loss of profits or
                            revenues, whether incurred directly or indirectly.
                        </p>

                        <h2>10. Indemnification</h2>
                        <p>
                            You agree to indemnify and hold harmless NextVijo and its officers, directors, employees,
                            and agents from any claims, damages, or expenses arising from your use of the service
                            or violation of these Terms.
                        </p>

                        <h2>11. Termination</h2>
                        <p>
                            Either party may terminate this agreement with 30 days written notice. Upon termination,
                            your access to the service will be discontinued, and you should export any data you wish
                            to retain before the termination date.
                        </p>

                        <h2>12. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of Kenya.
                            Any disputes shall be resolved in the courts of Nairobi, Kenya.
                        </p>

                        <h2>13. Contact Information</h2>
                        <p>
                            For questions about these Terms of Service, please contact us at:<br />
                            <strong>Email:</strong> legal@nextvijo.com<br />
                            <strong>Address:</strong> Nairobi, Kenya
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TermsOfService;
