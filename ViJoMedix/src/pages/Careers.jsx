
import React from 'react';
import { LuMapPin, LuMail, LuGlobe, LuRocket, LuTarget, LuTrendingUp } from 'react-icons/lu';

const Careers = () => {
    const culturePoints = [
        {
            icon: <LuRocket size={28} />,
            title: 'Innovation First',
            description: 'We push boundaries with IoT, AI, and cloud computing to solve real medical challenges.'
        },
        {
            icon: <LuTarget size={28} />,
            title: 'Impact Driven',
            description: 'Every line of code we write contributes to better patient outcomes in real hospitals.'
        },
        {
            icon: <LuTrendingUp size={28} />,
            title: 'Growth Mindset',
            description: 'We invest in our team\'s learning and development. Your growth is our growth.'
        }
    ];

    const positions = [
        {
            title: 'Senior Full Stack Engineer',
            location: 'Nairobi, Kenya (Hybrid)',
            department: 'Engineering',
            type: 'Full-time'
        },
        {
            title: 'Product Designer (UI/UX)',
            location: 'Remote',
            department: 'Design',
            type: 'Full-time'
        },
        {
            title: 'Sales Executive',
            location: 'Nairobi, Kenya',
            department: 'Sales',
            type: 'Full-time'
        },
        {
            title: 'DevOps Engineer',
            location: 'Remote',
            department: 'Engineering',
            type: 'Full-time'
        },
        {
            title: 'Customer Success Manager',
            location: 'Nairobi, Kenya',
            department: 'Operations',
            type: 'Full-time'
        }
    ];

    return (
        <div className="careers-page">
            {/* Hero Section */}
            <section className="careers-hero">
                <div className="container">
                    <h1>Build the Future of Healthcare with <span className="text-gradient">NextVijo</span></h1>
                    <p>NextVijo is the technology company behind ViJoMedix. We are dedicated to digitizing healthcare in Africa and beyond. Our mission is to create systems that save lives.</p>
                </div>
            </section>

            {/* Culture Section */}
            <section className="careers-culture">
                <div className="container">
                    <div className="culture-grid">
                        {culturePoints.map((point, i) => (
                            <div key={i} className="culture-card">
                                <div className="culture-icon">{point.icon}</div>
                                <h3>{point.title}</h3>
                                <p>{point.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Open Positions */}
            <section className="careers-positions">
                <div className="container">
                    <h2>Open <span className="text-gradient">Positions</span></h2>
                    <div className="positions-list">
                        {positions.map((job, i) => (
                            <div key={i} className="position-card">
                                <div className="position-info">
                                    <h3>{job.title}</h3>
                                    <div className="position-meta">
                                        <span><LuMapPin size={16} /> {job.location}</span>
                                        <span><LuGlobe size={16} /> {job.department}</span>
                                    </div>
                                </div>
                                <button className="position-apply">Apply Now</button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="careers-cta">
                <div className="container">
                    <div className="careers-cta-box">
                        <h3>Don't see your role?</h3>
                        <p>We're always looking for exceptional talent. Send your CV and we'll reach out when we have the perfect opportunity.</p>
                        <a href="mailto:careers@nextvijo.com">
                            Email Us <LuMail size={18} />
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Careers;
