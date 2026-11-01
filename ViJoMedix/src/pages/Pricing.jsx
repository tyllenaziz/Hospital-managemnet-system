
import React from 'react';
import { LuCheck, LuX, LuSparkles, LuBuilding, LuBuilding2, LuShield, LuHeadphones, LuZap } from 'react-icons/lu';

const Pricing = () => {
    const plans = [
        {
            name: 'Starter',
            description: 'For small clinics & dispensaries',
            price: 'KES 10,000',
            period: '/mo',
            popular: false,
            features: [
                { text: 'Patient Registration', included: true },
                { text: 'Basic Vitals Recording', included: true },
                { text: 'Queue Management', included: true },
                { text: 'Email Support', included: true },
                { text: 'Up to 500 patients/month', included: true },
                { text: 'Pharmacy Module', included: false },
                { text: 'Lab Management', included: false },
                { text: 'Multi-branch Support', included: false },
            ],
            cta: 'Start Free Trial',
            icon: <LuBuilding size={28} />
        },
        {
            name: 'Professional',
            description: 'For hospitals & nursing homes',
            price: 'KES 20,000',
            period: '/mo',
            popular: true,
            features: [
                { text: 'Everything in Starter', included: true },
                { text: 'Inpatient Management', included: true },
                { text: 'Pharmacy & Inventory', included: true },
                { text: 'Billing & Insurance', included: true },
                { text: 'Lab Management', included: true },
                { text: 'Priority Support', included: true },
                { text: 'Unlimited patients', included: true },
                { text: 'Multi-branch Support', included: false },
            ],
            cta: 'Get Started',
            icon: <LuBuilding2 size={28} />
        },
        {
            name: 'Enterprise',
            description: 'For large multi-branch networks',
            price: 'Custom',
            period: '',
            popular: false,
            features: [
                { text: 'Everything in Professional', included: true },
                { text: 'Multi-branch Support', included: true },
                { text: 'Advanced Analytics', included: true },
                { text: 'IoT Device Integration', included: true },
                { text: 'Custom Integrations', included: true },
                { text: 'Dedicated Account Manager', included: true },
                { text: 'SLA Guarantee', included: true },
                { text: 'On-site Training', included: true },
            ],
            cta: 'Contact Sales',
            icon: <LuShield size={28} />
        }
    ];

    const faqs = [
        { q: 'Is there a free trial?', a: 'Yes! All plans come with a 14-day free trial. No credit card required.' },
        { q: 'Can I upgrade or downgrade my plan?', a: 'Absolutely. You can change your plan at any time and well prorate the difference.' },
        { q: 'What payment methods do you accept?', a: 'We accept M-Pesa, credit/debit cards, and bank transfers for enterprise clients.' },
        { q: 'Do you offer discounts for annual billing?', a: 'Yes! Get 2 months free when you pay annually (17% discount).' },
    ];

    return (
        <div className="pricing-page">
            {/* Hero Section */}
            <section className="pricing-hero">
                <div className="container">
                    <div className="pricing-hero-content">
                        <span className="pricing-badge">
                            <LuSparkles /> Transparent Pricing
                        </span>
                        <h1>Simple, Honest <span className="text-gradient">Pricing</span></h1>
                        <p>Choose the plan that fits your facility. No hidden fees, no surprises.</p>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pricing-cards-section">
                <div className="container">
                    <div className="pricing-grid">
                        {plans.map((plan, index) => (
                            <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                                {plan.popular && (
                                    <div className="popular-badge">
                                        <LuZap /> Most Popular
                                    </div>
                                )}
                                <div className="pricing-card-header">
                                    <div className="pricing-icon">{plan.icon}</div>
                                    <h3>{plan.name}</h3>
                                    <p>{plan.description}</p>
                                </div>
                                <div className="pricing-amount">
                                    <span className="price">{plan.price}</span>
                                    <span className="period">{plan.period}</span>
                                </div>
                                <ul className="pricing-features">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className={feature.included ? 'included' : 'excluded'}>
                                            {feature.included ? <LuCheck className="check" /> : <LuX className="x" />}
                                            <span>{feature.text}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className={`pricing-cta ${plan.popular ? 'primary' : 'secondary'}`}>
                                    {plan.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Indicators */}
            <section className="pricing-trust">
                <div className="container">
                    <div className="trust-grid">
                        <div className="trust-item">
                            <LuShield size={32} />
                            <h4>Secure & Compliant</h4>
                            <p>HIPAA-ready with encrypted data</p>
                        </div>
                        <div className="trust-item">
                            <LuHeadphones size={32} />
                            <h4>24/7 Support</h4>
                            <p>Always here when you need us</p>
                        </div>
                        <div className="trust-item">
                            <LuZap size={32} />
                            <h4>99.9% Uptime</h4>
                            <p>Reliable infrastructure</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="pricing-faq">
                <div className="container">
                    <h2>Frequently Asked <span className="text-gradient">Questions</span></h2>
                    <div className="faq-grid">
                        {faqs.map((faq, i) => (
                            <div key={i} className="faq-item">
                                <h4>{faq.q}</h4>
                                <p>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Pricing;
