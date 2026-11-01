
import { useState, useEffect, useRef } from 'react'
import {
    LuUsers, LuClipboardList, LuActivity, LuStethoscope, LuPill, LuFlaskConical,
    LuCreditCard, LuSmartphone, LuAmbulance, LuArrowRightLeft, LuHeart, LuCalendar,
    LuPackage, LuUserCheck, LuLayoutDashboard, LuShield, LuSettings, LuFileText,
    LuScan, LuWifi, LuCheck, LuMail, LuPhone, LuMapPin
} from 'react-icons/lu'

const Home = () => {
    const [currentSlide, setCurrentSlide] = useState(2)
    const featuresContainerRef = useRef(null)
    const [isPaused, setIsPaused] = useState(false)

    // Contact Form State
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [formError, setFormError] = useState('')
    const [bookingDate, setBookingDate] = useState('')
    const [bookingTime, setBookingTime] = useState('')
    const [facilityType, setFacilityType] = useState('')
    const [employeeCount, setEmployeeCount] = useState('')

    // Facility Types
    const facilityTypes = [
        { value: '', label: 'Select Facility Type' },
        { value: 'hospital', label: 'Hospital (Full System)' },
        { value: 'clinic', label: 'Clinic' },
        { value: 'pharmacy', label: 'Pharmacy' },
        { value: 'laboratory', label: 'Laboratory' },
        { value: 'diagnostic', label: 'Diagnostic Center' },
        { value: 'maternity', label: 'Maternity Center' },
        { value: 'specialized', label: 'Specialized Clinic (Dental, Eye, etc.)' }
    ]

    // Dynamic Hero Text
    const heroWords = ['Hospital', 'Clinic', 'Pharmacy', 'Lab', 'Facility']
    const [heroTextIndex, setHeroTextIndex] = useState(0)
    const [fadeText, setFadeText] = useState(true)

    useEffect(() => {
        const interval = setInterval(() => {
            setFadeText(false) // Start fade out
            setTimeout(() => {
                setHeroTextIndex((prev) => (prev + 1) % heroWords.length)
                setFadeText(true) // Start fade in
            }, 500) // Wait for fade out to complete
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    // Carousel images
    const carouselImages = [
        { src: '/logo.png', alt: 'ViJoMedix Logo', isLogo: true },
        { src: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=500&fit=crop', alt: 'Modern Hospital' },
        { src: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=500&fit=crop', alt: 'Healthcare Technology' },
        { src: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=500&fit=crop', alt: 'Medical Team' },
        { src: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=500&fit=crop', alt: 'Patient Care' }
    ]



    const handleContactSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setFormError('')

        const formData = new FormData(e.target)
        formData.append('access_key', import.meta.env.VITE_WEB3FORMS_ACCESS_KEY)
        formData.append('subject', `Demo Request - ${facilityType || 'Healthcare Facility'}`)
        formData.append('from_name', 'ViJoMedix Demo Request')

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()

            if (result.success) {
                setEmailSent(true)
                e.target.reset()
                setFacilityType('')
                setEmployeeCount('')
                setBookingDate('')
                setBookingTime('')
            } else {
                setFormError('Something went wrong. Please try again.')
            }
        } catch (error) {
            setFormError('Failed to submit form. Please check your connection.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Features auto-scroll animation
    useEffect(() => {
        const container = featuresContainerRef.current
        if (!container) return

        let animationId
        const scrollSpeed = 0.5

        const animate = () => {
            if (!isPaused && container) {
                if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 1) {
                    container.scrollLeft = 0
                } else {
                    container.scrollLeft += scrollSpeed
                }
            }
            animationId = requestAnimationFrame(animate)
        }

        animationId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationId)
    }, [isPaused])

    // Auto-rotate carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [carouselImages.length])

    const getPositionClass = (index) => {
        const diff = (index - currentSlide + carouselImages.length) % carouselImages.length
        if (diff === 0) return 'position-2'
        if (diff === 1) return 'position-3'
        if (diff === 2) return 'position-4'
        if (diff === carouselImages.length - 1) return 'position-1'
        if (diff === carouselImages.length - 2) return 'position-0'
        return 'position-0'
    }

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    // Handle hash scroll on mount
    useEffect(() => {
        if (window.location.hash) {
            const id = window.location.hash.replace('#', '')
            setTimeout(() => scrollToSection(id), 100)
        }
    }, [])

    const features = [
        { icon: <LuUsers size={32} />, title: 'Patient Management', description: 'Complete patient registration and records for facilities of all levels, from dispensaries to referral hospitals.' },
        { icon: <LuClipboardList size={32} />, title: 'Queue Management', description: 'Smart patient flow between departments - Nurse, Doctor, Lab, Pharmacy, and Billing with real-time status updates.' },
        { icon: <LuActivity size={32} />, title: 'Vitals Recording', description: 'Track blood pressure, temperature, pulse, respiratory rate, weight, height, blood sugar, SpO2, and BMI history.' },
        { icon: <LuStethoscope size={32} />, title: 'Doctor Consultations', description: 'Full consultation workflow with diagnosis entry, prescription creation, lab test ordering, and referral management.' },
        { icon: <LuPill size={32} />, title: 'Pharmacy & Prescriptions', description: 'Prescription dispensing, stock management, barcode scanning, and over-the-counter direct sales.' },
        { icon: <LuFlaskConical size={32} />, title: 'Laboratory Management', description: 'Lab test catalog, parametric testing, order processing, sample collection tracking, and digital results entry.' },
        { icon: <LuCreditCard size={32} />, title: 'Billing & Payments', description: 'Consolidated billing per visit including consultation, lab, and pharmacy fees with multiple payment methods.' },
        { icon: <LuSmartphone size={32} />, title: 'M-Pesa Integration', description: 'Seamless mobile money payments via Safaricom M-Pesa STK Push with real-time transaction status.' },
        { icon: <LuAmbulance size={32} />, title: 'Ambulance Management', description: 'Fleet management, dispatch control, and ambulance request handling with priority levels.' },
        { icon: <LuArrowRightLeft size={32} />, title: 'Referrals System', description: 'Patient referrals to/from other facilities with clinical summaries, diagnosis, and condition tracking.' },
        { icon: <LuHeart size={32} />, title: 'Chronic Care Module', description: 'Long-term care management for Diabetes, Hypertension, HIV, TB, ANC, PNC, and specialized clinics.' },
        { icon: <LuCalendar size={32} />, title: 'Follow-Up Appointments', description: 'Schedule tracking, calendar views, defaulter identification, and automatic missed appointment marking.' },
        { icon: <LuPackage size={32} />, title: 'Inventory Management', description: 'Medicine and equipment tracking with stock levels, expiry dates, barcode support, and low stock alerts.' },
        { icon: <LuUserCheck size={32} />, title: 'Staff Attendance', description: 'Employee check-in/check-out recording, present/absent/late tracking, and comprehensive attendance reports.' },
        { icon: <LuLayoutDashboard size={32} />, title: 'Admin Dashboard', description: 'System-wide overview with revenue statistics, patient stats, staff management, and administrative controls.' },
        { icon: <LuShield size={32} />, title: 'Role-Based Access', description: 'Secure roles (Admin, Doctor, Nurse, Lab, Pharmacy, etc.) with dedicated permissions for every staff member.' },
        { icon: <LuSettings size={32} />, title: 'System Settings', description: 'Configure consultation fees, system preferences, and organizational settings with centralized management.' },
        { icon: <LuFileText size={32} />, title: 'Audit Trail', description: 'Comprehensive activity logging for compliance, security monitoring, and operational transparency.' },
        { icon: <LuScan size={32} />, title: 'IoT & Biometrics', description: 'Integration with biometric scanners for patient/staff ID and IoT devices for automated vitals collection.' },
        { icon: <LuShield size={32} />, title: 'Insurance & NHIF', description: 'Complete insurance management with NHIF/SHA integration, claims processing, and pre-authorization workflows.' },
        { icon: <LuScan size={32} />, title: 'Radiology Module', description: 'Digital imaging management with X-ray, ultrasound, and scan ordering, results entry, and image storage.' },
        { icon: <LuLayoutDashboard size={32} />, title: 'Multi-Facility Management', description: 'Super Admin dashboard for managing multiple facilities, centralized reporting, and cross-facility analytics.' }
    ]

    const workflows = [
        { icon: <LuActivity size={40} />, title: 'Patient Visit', description: 'Registration → Vitals → Consultation → Lab Tests → Pharmacy → Billing → Payment' },
        { icon: <LuHeart size={40} />, title: 'Chronic Care', description: 'Enrollment → Scheduled Visit → Nurse Records → Doctor Review → Follow-up' },
        { icon: <LuFlaskConical size={40} />, title: 'Lab Orders', description: 'Doctor Orders → Lab Receives → Sample Collection → Processing → Results' },
        { icon: <LuPill size={40} />, title: 'Prescription', description: 'Doctor Prescribes → Pharmacy Queue → Stock Check → Dispensing → Receipt' },
        { icon: <LuAmbulance size={40} />, title: 'Ambulance', description: 'Request → Approval → Assigned → Dispatch → Pickup → Completion' },
        { icon: <LuArrowRightLeft size={40} />, title: 'Referral', description: 'Doctor Creates → Documentation → Transfer → Follow-up → Completion' }
    ]

    const testimonials = [
        { text: 'ViJoMedix has transformed our hospital operations. The queue management system alone has reduced patient wait times by 40%. Highly recommend!', name: 'Dr. Sarah Kimani', role: 'Medical Director, City Hospital', initials: 'SK' },
        { text: 'The M-Pesa integration is seamless. Our billing department processes payments 3x faster now. The system is intuitive and easy to use.', name: 'James Ochieng', role: 'Hospital Administrator', initials: 'JO' },
        { text: 'Managing our chronic care patients has never been easier. The follow-up reminders and defaulter tracking have improved patient outcomes significantly.', name: 'Nurse Mary Wanjiku', role: 'Chronic Care Coordinator', initials: 'MW' }
    ]

    return (
        <>
            {/* Hero Section */}
            <section id="hero" className="hero">
                <div className="hero-background-mobile">
                    {carouselImages.map((img, idx) => (
                        <div key={idx} className={`hero-bg-slide ${currentSlide === idx ? 'active' : ''}`} style={{ backgroundImage: `url(${img.src})` }} />
                    ))}
                    <div className="hero-bg-overlay"></div>
                </div>

                <div className="container">
                    <div className="hero-content">
                        <h1>Transform Your <span className={`dynamic-word ${fadeText ? 'visible' : 'hidden'}`}>{heroWords[heroTextIndex]}</span> with <span className="text-gradient">ViJoMedix</span></h1>
                        <p>A comprehensive Hospital Management System designed to streamline patient care for <strong>health facilities of all levels</strong> — from clinics and dispensaries to Level 6 referral hospitals.</p>
                        <div className="hero-buttons">
                            <button onClick={() => scrollToSection('contact')} className="btn btn-primary">Request Demo</button>
                            <button onClick={() => scrollToSection('features')} className="btn btn-secondary">Explore Features</button>
                        </div>
                        <div className="hero-stats">
                            <div className="stat-item"><div className="number">18+</div><div className="label">Core Modules</div></div>
                            <div className="stat-item"><div className="number">7</div><div className="label">User Roles</div></div>
                            <div className="stat-item"><div className="number">24/7</div><div className="label">Support</div></div>
                        </div>
                    </div>
                    <div className="hero-carousel">
                        <div className="carousel-container">
                            <div className="carousel-track">
                                {carouselImages.map((image, index) => (
                                    <div key={index} className={`carousel-slide ${getPositionClass(index)} ${image.isLogo ? 'logo-slide' : ''}`} onClick={() => setCurrentSlide(index)}>
                                        <img src={image.src} alt={image.alt} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="carousel-dots">
                            {carouselImages.map((_, index) => (
                                <button key={index} className={`carousel-dot ${currentSlide === index ? 'active' : ''}`} onClick={() => setCurrentSlide(index)} aria-label={`Go to slide ${index + 1}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="section features">
                <div className="container">
                    <div className="section-header">
                        <h2>Powerful <span className="text-gradient">Features</span></h2>
                        <p>Everything you need to manage your healthcare facility efficiently, from patient registration to billing and beyond.</p>
                    </div>
                    <div className="features-grid" ref={featuresContainerRef} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}>
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="section about">
                <div className="container">
                    <div className="about-image">
                        <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=500&fit=crop" alt="Healthcare Technology" />
                    </div>
                    <div className="about-content">
                        <h2>Why Choose <span className="text-gradient">ViJoMedix?</span></h2>
                        <p>Built by healthcare professionals, ViJoMedix is scalable to support <strong>all types of health facilities</strong>, ensuring robust performance whether you run a small clinic or a major hospital.</p>
                        <p>Our system seamlessly integrates all aspects of hospital operations, from front desk to pharmacy, ensuring efficient patient care and streamlined administrative processes.</p>
                        <ul className="about-list">
                            <li><span className="check-icon"><LuCheck /></span><span>Desktop & web-based access for flexibility</span></li>
                            <li><span className="check-icon"><LuCheck /></span><span>Electron-based desktop app for offline capability</span></li>
                            <li><span className="check-icon"><LuWifi /></span><span>IoT & Biometric Device Integration</span></li>
                            <li><span className="check-icon"><LuCheck /></span><span>Comprehensive reporting and analytics</span></li>
                            <li><span className="check-icon"><LuCheck /></span><span>Multi-role access with secure authentication</span></li>
                        </ul>
                        <button onClick={() => scrollToSection('contact')} className="btn btn-primary">Learn More</button>
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section id="workflow" className="section workflow">
                <div className="container">
                    <div className="section-header">
                        <h2>Streamlined <span className="text-gradient">Workflows</span></h2>
                        <p>Optimized processes designed to reduce wait times, eliminate bottlenecks, and improve patient outcomes.</p>
                    </div>
                    <div className="workflow-grid">
                        {workflows.map((workflow, index) => (
                            <div key={index} className="workflow-card">
                                <div className="workflow-icon">{workflow.icon}</div>
                                <h3>{workflow.title}</h3>
                                <p>{workflow.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stats-item"><div className="number">25+</div><div className="label">Database Tables</div></div>
                        <div className="stats-item"><div className="number">50+</div><div className="label">API Endpoints</div></div>
                        <div className="stats-item"><div className="number">15+</div><div className="label">Printable Reports</div></div>
                        <div className="stats-item"><div className="number">99.9%</div><div className="label">Uptime</div></div>
                    </div>
                </div>
            </section>

            {/* Modular System Section */}
            <section id="modules" className="section modules">
                <div className="container">
                    <div className="section-header">
                        <h2>Flexible <span className="text-gradient">Modular System</span></h2>
                        <p>ViJoMedix isn't just for hospitals. Configure and activate only the modules you need for your specific facility type.</p>
                    </div>
                    <div className="modules-grid">
                        <div className="module-card">
                            <div className="module-icon"><LuPill size={40} /></div>
                            <h3>Pharmacy Only</h3>
                            <p>Perfect for standalone pharmacies. Get inventory management, direct sales, barcode scanning, and M-Pesa integration.</p>
                            <ul className="module-features">
                                <li><LuCheck size={16} /> Inventory Management</li>
                                <li><LuCheck size={16} /> Point of Sale</li>
                                <li><LuCheck size={16} /> M-Pesa Payments</li>
                                <li><LuCheck size={16} /> Stock Alerts</li>
                            </ul>
                        </div>
                        <div className="module-card">
                            <div className="module-icon"><LuFlaskConical size={40} /></div>
                            <h3>Laboratory Only</h3>
                            <p>Ideal for diagnostic labs. Manage test orders, sample collection, results entry, and client billing.</p>
                            <ul className="module-features">
                                <li><LuCheck size={16} /> Test Catalog</li>
                                <li><LuCheck size={16} /> Sample Tracking</li>
                                <li><LuCheck size={16} /> Digital Results</li>
                                <li><LuCheck size={16} /> Client Management</li>
                            </ul>
                        </div>
                        <div className="module-card">
                            <div className="module-icon"><LuStethoscope size={40} /></div>
                            <h3>Clinic Mode</h3>
                            <p>Streamlined for small clinics. Patient registration, consultations, prescriptions, and basic billing.</p>
                            <ul className="module-features">
                                <li><LuCheck size={16} /> Patient Records</li>
                                <li><LuCheck size={16} /> Consultations</li>
                                <li><LuCheck size={16} /> Prescriptions</li>
                                <li><LuCheck size={16} /> Simple Billing</li>
                            </ul>
                        </div>
                        <div className="module-card featured">
                            <div className="module-icon"><LuLayoutDashboard size={40} /></div>
                            <h3>Full Hospital System</h3>
                            <p>Complete HMIS with all modules activated. Perfect for hospitals of any level.</p>
                            <ul className="module-features">
                                <li><LuCheck size={16} /> All 22+ Modules</li>
                                <li><LuCheck size={16} /> Insurance/NHIF</li>
                                <li><LuCheck size={16} /> Multi-Department</li>
                                <li><LuCheck size={16} /> Advanced Analytics</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="section testimonials">
                <div className="container">
                    <div className="section-header">
                        <h2>What Our <span className="text-gradient">Clients Say</span></h2>
                        <p>Healthcare professionals trust ViJoMedix to power their operations.</p>
                    </div>
                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="testimonial-card">
                                <p>"{testimonial.text}"</p>
                                <div className="testimonial-author">
                                    <div className="testimonial-avatar">{testimonial.initials}</div>
                                    <div className="testimonial-info"><h4>{testimonial.name}</h4><span>{testimonial.role}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="section contact">
                <div className="container">
                    <div className="contact-info">
                        <h2>Get Started with <span className="text-gradient">ViJoMedix</span></h2>
                        <p>Ready to transform your healthcare facility? Contact us today for a personalized demo.</p>
                        <div className="contact-details">
                            <div className="contact-item"><div className="contact-item-icon"><LuMail /></div><div className="contact-item-content"><h4>Email Us</h4><p>info@nexvijo.com</p></div></div>
                            <div className="contact-item"><div className="contact-item-icon"><LuPhone /></div><div className="contact-item-content"><h4>Call Us</h4><p>+254 729 507 962</p></div></div>
                            <div className="contact-item"><div className="contact-item-icon"><LuMapPin /></div><div className="contact-item-content"><h4>Visit Us</h4><p>Nairobi, Kenya</p></div></div>
                        </div>
                    </div>
                    {emailSent ? (
                        <div className="form-success-wrapper animate-fade-in">
                            <div className="success-icon"><LuCheck size={64} /></div>
                            <h3>Demo Request Sent!</h3>
                            <p>Thank you for your interest. Your demo request for <strong>{bookingDate || 'soon'}</strong> has been submitted successfully.</p>
                            <p>Our team will contact you shortly to confirm.</p>
                            <button className="btn btn-secondary" onClick={() => setEmailSent(false)} style={{ marginTop: '20px' }}>Send Another Request</button>
                        </div>
                    ) : (
                        <form className="contact-form" onSubmit={handleContactSubmit}>
                            {formError && <div className="form-error" style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{formError}</div>}
                            <div className="form-row">
                                <div className="form-group"><label htmlFor="name">Full Name</label><input type="text" id="name" name="name" placeholder="John Doe" required /></div>
                                <div className="form-group"><label htmlFor="email">Email Address</label><input type="email" id="email" name="email" placeholder="john@example.com" required /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label htmlFor="phone">Phone Number</label><input type="tel" id="phone" name="phone" placeholder="+254 729 507 962" required /></div>
                                <div className="form-group"><label htmlFor="facility">Facility Name</label><input type="text" id="facility" name="facility" placeholder="City Hospital" /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="facility-type">Facility Type</label>
                                    <select
                                        id="facility-type"
                                        name="facility_type"
                                        value={facilityType}
                                        onChange={(e) => setFacilityType(e.target.value)}
                                        required
                                        className="form-select"
                                    >
                                        {facilityTypes.map((type) => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="employee-count">Number of Employees</label>
                                    <select
                                        id="employee-count"
                                        name="employee_count"
                                        value={employeeCount}
                                        onChange={(e) => setEmployeeCount(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">Select Range</option>
                                        <option value="1-10">1-10 employees</option>
                                        <option value="11-50">11-50 employees</option>
                                        <option value="51-100">51-100 employees</option>
                                        <option value="100+">100+ employees</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="demo-date">Preferred Date</label>
                                    <input
                                        type="date"
                                        id="demo-date"
                                        name="demo_date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={bookingDate}
                                        onChange={(e) => setBookingDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="demo-time">Preferred Time</label>
                                    <input
                                        type="time"
                                        id="demo-time"
                                        name="demo_time"
                                        value={bookingTime}
                                        onChange={(e) => setBookingTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group"><label htmlFor="message">Message</label><textarea id="message" name="message" placeholder="Tell us about your requirements..." rows="4"></textarea></div>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Request Demo'}</button>
                        </form>
                    )}
                </div>
            </section>
        </>
    )
}

export default Home
