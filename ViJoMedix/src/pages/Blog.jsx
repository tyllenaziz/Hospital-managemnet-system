
import React, { useState } from 'react';
import { LuArrowRight, LuArrowLeft, LuCalendar, LuUser, LuClock } from 'react-icons/lu';

const Blog = () => {
    const [activePost, setActivePost] = useState(null);

    const posts = [
        {
            id: 'future-hospital-management',
            title: 'The Future of Hospital Management in Africa',
            excerpt: 'How digital transformation is reducing wait times and improving mortality rates across the continent. A deep dive into the technology shaping healthcare.',
            date: 'Feb 1, 2026',
            author: 'Dr. James Mwangi',
            readTime: '8 min read',
            image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&h=300&fit=crop',
            category: 'Industry Insights',
            content: `
The healthcare landscape in Africa is undergoing a remarkable transformation. With the adoption of digital hospital management systems, facilities across the continent are seeing unprecedented improvements in patient care and operational efficiency.

## The Challenge

African healthcare facilities have historically faced significant challenges:
- Long patient wait times, often exceeding 4-6 hours
- Paper-based records prone to loss and errors
- Inefficient resource allocation
- Limited data for informed decision-making

## The Digital Solution

Modern hospital management systems like ViJoMedix are addressing these challenges head-on. By digitizing patient records, automating queue management, and providing real-time analytics, these systems are revolutionizing how healthcare is delivered.

## Key Benefits

**Reduced Wait Times**
One of the most immediate impacts is the reduction in patient wait times. Facilities using digital queue management systems report wait time reductions of 40-60%.

**Improved Accuracy**
Digital records eliminate issues with illegible handwriting and lost files. Lab results are instantly available to doctors, enabling faster diagnosis and treatment.

**Better Resource Planning**
With data-driven insights, hospital administrators can make informed decisions about staffing, inventory, and equipment allocation.

## The Road Ahead

As internet connectivity improves and smartphone penetration increases across Africa, the adoption of digital healthcare solutions will only accelerate. The future of healthcare in Africa is digital, and the transformation is already underway.
            `
        },
        {
            id: 'iot-patient-care',
            title: 'Why IoT is the Next Big Thing in Patient Care',
            excerpt: 'From smart wearables to automated vitals monitoring, discover how IoT devices are revolutionizing the way we collect and analyze patient data.',
            date: 'Jan 28, 2026',
            author: 'Sarah Kimani',
            readTime: '6 min read',
            image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=500&h=300&fit=crop',
            category: 'Technology',
            content: `
The Internet of Things (IoT) is transforming patient care in ways we never imagined. Connected medical devices are enabling continuous monitoring, early detection, and more personalized treatment plans.

## What is Healthcare IoT?

Healthcare IoT refers to the network of connected medical devices that collect, transmit, and analyze patient health data. These devices range from simple wearable fitness trackers to sophisticated hospital-grade monitoring equipment.

## Real-World Applications

**Automated Vitals Capture**
IoT-enabled blood pressure monitors, pulse oximeters, and glucometers can automatically transmit readings to hospital management systems. This eliminates manual data entry errors and ensures accurate, timestamped records.

**Remote Patient Monitoring**
Patients with chronic conditions can be monitored from home, reducing the need for frequent hospital visits while enabling early intervention when readings indicate potential problems.

**Smart Hospital Beds**
Pressure-sensing beds can detect patient movement, preventing bedsores and alerting staff when patients attempt to leave their beds unsupervised.

## Integration with ViJoMedix

ViJoMedix's IoT integration module allows healthcare facilities to connect supported devices directly to the patient management system. Vitals are automatically captured and linked to patient records, creating a seamless workflow for nursing staff.

## The Future is Connected

As IoT technology becomes more affordable and accessible, we expect to see even broader adoption in healthcare. The result will be more proactive, personalized, and efficient patient care.
            `
        },
        {
            id: 'pharmacy-inventory-tips',
            title: '5 Tips for Efficient Pharmacy Inventory Management',
            excerpt: 'Stop losing money to expired drugs and stockouts. Learn the best practices that successful pharmacies use to optimize their inventory.',
            date: 'Jan 15, 2026',
            author: 'Peter Ochieng',
            readTime: '5 min read',
            image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&h=300&fit=crop',
            category: 'Best Practices',
            content: `
Effective pharmacy inventory management is crucial for patient safety and business profitability. Here are five tips to help you optimize your pharmacy operations.

## 1. Implement Automatic Reorder Points

Set minimum stock levels for each medication. When inventory falls below this threshold, the system should automatically generate purchase orders or alerts. This prevents stockouts while avoiding overstocking.

## 2. Track Expiry Dates Religiously

Medication expiry is a major source of waste in pharmacies. Use "First Expiry, First Out" (FEFO) dispensing practices and set up automated alerts for medications approaching their expiry dates.

## 3. Conduct Regular Stock Takes

Schedule monthly or quarterly physical inventory counts to reconcile system records with actual stock. This helps identify discrepancies, pilferages, or system errors early.

## 4. Analyze Consumption Patterns

Use your pharmacy management system's reporting tools to identify fast-moving and slow-moving items. Adjust your ordering quantities based on actual consumption data rather than intuition.

## 5. Maintain Supplier Relationships

Build strong relationships with reliable suppliers. Negotiate favorable terms, but also have backup suppliers for critical medications to ensure consistent availability.

## Using ViJoMedix for Inventory Management

ViJoMedix's pharmacy module includes all the tools you need for effective inventory management: automatic reorder points, expiry tracking, stock take functionality, and comprehensive reporting. Take advantage of these features to optimize your pharmacy operations.
            `
        },
        {
            id: 'nhif-integration-guide',
            title: 'NHIF Integration: What Hospital Administrators Need to Know',
            excerpt: 'A comprehensive guide to integrating your hospital management system with Kenya\'s National Hospital Insurance Fund for seamless claims processing.',
            date: 'Jan 8, 2026',
            author: 'Grace Wanjiku',
            readTime: '10 min read',
            image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&h=300&fit=crop',
            category: 'Guides',
            content: `
Integrating with NHIF (National Hospital Insurance Fund) is essential for any healthcare facility in Kenya that wants to serve insured patients efficiently. This guide covers everything you need to know about NHIF integration.

## Understanding NHIF

NHIF is Kenya's primary health insurance scheme, covering millions of Kenyans. As a healthcare facility, accepting NHIF patients can significantly expand your patient base.

## Registration Requirements

Before you can process NHIF claims, your facility must:
- Be registered with NHIF as a contracted healthcare provider
- Have valid practice licenses for all medical practitioners
- Maintain proper patient records and documentation

## The Claims Process

**Step 1: Patient Verification**
Verify patient NHIF membership using their ID number. The ViJoMedix system can validate membership status in real-time.

**Step 2: Service Delivery**
Provide services according to NHIF-approved protocols. Ensure all services are properly documented.

**Step 3: Claims Submission**
Submit claims electronically through the NHIF portal or via integrated systems. Include all required documentation.

**Step 4: Follow-up**
Track claim status and respond promptly to any queries or rejections.

## Common Reasons for Claim Rejection

- Incomplete patient information
- Services not covered under NHIF
- Missing or illegible documentation
- Exceeding benefit limits

## How ViJoMedix Helps

ViJoMedix streamlines NHIF integration with features like real-time eligibility verification, automated claims generation, and rejection tracking. Our system is regularly updated to comply with NHIF requirements.
            `
        },
        {
            id: 'city-hospital-case-study',
            title: 'Case Study: How City Hospital Reduced Wait Times by 60%',
            excerpt: 'An inside look at how one of Nairobi\'s busiest hospitals transformed their patient flow using ViJoMedix queue management system.',
            date: 'Dec 22, 2025',
            author: 'Dr. James Mwangi',
            readTime: '7 min read',
            image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=500&h=300&fit=crop',
            category: 'Case Studies',
            content: `
City Hospital in Nairobi was facing a crisis. Patient complaints about long wait times were increasing, staff morale was low, and the facility was losing patients to competitors. Here's how they turned things around.

## The Challenge

Before implementing ViJoMedix, City Hospital faced:
- Average wait times of 4+ hours for outpatient services
- Long registration queues every morning
- Frequent patient complaints and negative reviews
- Staff overwhelmed by manual processes

## The Solution

City Hospital implemented ViJoMedix with a focus on queue management and patient flow optimization.

**Phase 1: Digital Registration**
They introduced self-service kiosks for returning patients and dedicated counters for new registrations. This alone reduced morning queues by 50%.

**Phase 2: Smart Queue Management**
The queue management system distributed patients across available doctors based on specialty and current load. Real-time queue displays kept patients informed.

**Phase 3: Integrated Billing**
Pre-billing at registration meant patients could pay and leave quickly after consultation, without waiting in another queue.

## The Results

After 6 months:
- Average wait time reduced from 4 hours to 1.5 hours (60% reduction)
- Patient satisfaction scores improved by 45%
- Staff productivity increased by 35%
- Monthly patient volume grew by 25%

## Key Learnings

- Technology alone isn't enough - staff training is crucial
- Patient communication is key to managing expectations
- Data-driven decisions lead to continuous improvement
- Start small and iterate based on feedback
            `
        },
        {
            id: 'lab-management-guide',
            title: 'Understanding Lab Management: From Samples to Results',
            excerpt: 'A complete walkthrough of the laboratory workflow in modern hospitals and how digital systems are improving accuracy and turnaround times.',
            date: 'Dec 15, 2025',
            author: 'Dr. Alice Njeri',
            readTime: '9 min read',
            image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=300&fit=crop',
            category: 'Education',
            content: `
The laboratory is often called the "engine room" of a hospital. Accurate and timely lab results are essential for diagnosis and treatment. Understanding the lab workflow helps improve overall healthcare delivery.

## The Lab Workflow

**1. Test Ordering**
The journey begins when a doctor orders a lab test. In a digital system, this order is instantly visible to the lab team.

**2. Sample Collection**
A phlebotomist or nurse collects the required sample. Proper labeling and handling are critical for accurate results.

**3. Sample Registration**
The sample is logged into the lab information system with a unique identifier, linking it to the patient and ordered tests.

**4. Processing**
The sample is analyzed using appropriate equipment and techniques. Quality control measures ensure accuracy.

**5. Result Entry**
Results are entered into the system with reference ranges and any flags for abnormal values.

**6. Validation**
A qualified lab scientist reviews and validates results before release.

**7. Result Delivery**
Results are made available to the ordering doctor through the hospital information system.

## Digital Transformation in Labs

Modern lab management systems offer:
- Barcoded sample tracking for error prevention
- Interface with analyzers for automatic result capture
- Built-in reference ranges and critical value alerts
- Historical result comparison for trend analysis
- Digital signatures for result validation

## ViJoMedix Lab Module

Our lab module supports over 500 preconfigured tests and integrates seamlessly with the rest of the hospital workflow. From order to result, every step is tracked and timestamped for complete audit trails.
            `
        }
    ];

    const handleReadMore = (postId) => {
        setActivePost(postId);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        setActivePost(null);
    };

    const currentPost = posts.find(p => p.id === activePost);

    return (
        <div className="blog-page">
            {/* Hero Section */}
            <section className="blog-hero">
                <div className="container">
                    <div className="nextvijo-hero-content">
                        <h1><span className="text-gradient">NexVijo</span> Blog</h1>
                        <div className="nextvijo-about">
                            <p>
                                <strong>NexVijo</strong> is a digital solutions and technology company based in Kenya. We specialize in software development, web design, mobile application development, and digital marketing. Our goal is to help businesses grow by providing innovative digital products and technical expertise.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Blog Content */}
            <section className="blog-content">
                <div className="container">
                    {activePost && currentPost ? (
                        // Single Post View
                        <div className="blog-post-view">
                            <button className="blog-back-btn" onClick={handleBack}>
                                <LuArrowLeft size={18} /> Back to Blog
                            </button>

                            <div className="blog-post-header">
                                <span className="blog-post-category">{currentPost.category}</span>
                                <h1>{currentPost.title}</h1>
                                <div className="blog-post-meta">
                                    <span><LuUser size={16} /> {currentPost.author}</span>
                                    <span><LuCalendar size={16} /> {currentPost.date}</span>
                                    <span><LuClock size={16} /> {currentPost.readTime}</span>
                                </div>
                            </div>

                            <div className="blog-post-image">
                                <img src={currentPost.image} alt={currentPost.title} />
                            </div>

                            <div className="blog-post-content">
                                {currentPost.content.split('\n').map((line, i) => {
                                    if (line.startsWith('## ')) {
                                        return <h2 key={i}>{line.replace('## ', '')}</h2>;
                                    } else if (line.startsWith('**') && line.endsWith('**')) {
                                        return <h3 key={i}>{line.replace(/\*\*/g, '')}</h3>;
                                    } else if (line.startsWith('- ')) {
                                        return <li key={i}>{line.replace('- ', '')}</li>;
                                    } else if (line.trim()) {
                                        return <p key={i}>{line}</p>;
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    ) : (
                        // Blog Grid
                        <div className="blog-grid">
                            {posts.map((post) => (
                                <article key={post.id} className="blog-card" onClick={() => handleReadMore(post.id)}>
                                    <div className="blog-image">
                                        <img src={post.image} alt={post.title} />
                                        <span className="blog-category">{post.category}</span>
                                    </div>
                                    <div className="blog-body">
                                        <h3>{post.title}</h3>
                                        <p>{post.excerpt}</p>
                                        <div className="blog-footer">
                                            <span className="blog-date">{post.date}</span>
                                            <span className="blog-read-more">
                                                Read More <LuArrowRight size={14} />
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Blog;
