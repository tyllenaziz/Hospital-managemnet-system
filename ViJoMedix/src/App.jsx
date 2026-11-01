
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom'
import { LuArrowUp, LuFacebook, LuTwitter, LuLinkedin, LuInstagram } from 'react-icons/lu'
import { FaWhatsapp, FaTiktok } from 'react-icons/fa'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import Updates from './pages/Updates'
import Documentation from './pages/Documentation'
import Blog from './pages/Blog'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import './index.css'

// Scroll Handler Component to handle hash scrolling and scroll-to-top
const ScrollHandler = ({ setIsScrolled, setShowScrollTop, setIsSubPage }) => {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        // Check if we're on a sub-page (not home)
        const isOnSubPage = pathname !== '/' && pathname !== '';
        setIsSubPage(isOnSubPage);

        // Reset scroll on route change unless hash is present
        if (!hash) {
            window.scrollTo(0, 0);
        } else {
            const id = hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [pathname, hash, setIsSubPage]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
            setShowScrollTop(window.scrollY > 500)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [setIsScrolled, setShowScrollTop])

    return null;
}

function App() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [showScrollTop, setShowScrollTop] = useState(false)
    const [isSubPage, setIsSubPage] = useState(false)

    // Helper to close menu on click
    const handleNavClick = () => setIsMobileMenuOpen(false)

    return (
        <Router>
            <ScrollHandler setIsScrolled={setIsScrolled} setShowScrollTop={setShowScrollTop} setIsSubPage={setIsSubPage} />

            {/* Navigation */}
            <nav className={`navbar ${isScrolled || isSubPage ? 'scrolled' : ''}`}>
                <div className="container">
                    <Link to="/" className="nav-logo" onClick={() => { window.scrollTo(0, 0); handleNavClick(); }}>
                        <img src="/logo.png" alt="ViJoMedix" />
                        <span className="nav-logo-text">ViJoMedix</span>
                    </Link>

                    <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
                        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-active' : ''} onClick={handleNavClick}>Home</NavLink>
                        <Link to="/#about" onClick={handleNavClick}>About</Link>
                        <Link to="/#features" onClick={handleNavClick}>Features</Link>
                        <NavLink to="/pricing" className={({ isActive }) => isActive ? 'nav-active' : ''} onClick={handleNavClick}>Pricing</NavLink>
                        <NavLink to="/documentation" className={({ isActive }) => isActive ? 'nav-active' : ''} onClick={handleNavClick}>Docs</NavLink>
                        <NavLink to="/updates" className={({ isActive }) => isActive ? 'nav-active' : ''} onClick={handleNavClick}>Updates</NavLink>
                        <NavLink to="/blog" className={({ isActive }) => isActive ? 'nav-active' : ''} onClick={handleNavClick}>Blog</NavLink>
                        <Link to="/#contact" className="nav-cta" onClick={handleNavClick}>Get Started</Link>
                    </div>

                    <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/updates" element={<Updates />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
            </Routes>

            {/* Floating UI */}
            <div className="floating-container">
                <button
                    className={`float-btn btn-scroll-top ${showScrollTop ? 'visible' : ''}`}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="Scroll to top"
                >
                    <LuArrowUp />
                </button>
                <a
                    href="https://wa.me/254729507962"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="float-btn btn-whatsapp"
                    aria-label="Chat on WhatsApp"
                >
                    <FaWhatsapp />
                </a>
            </div>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <img src="/logo.png" alt="ViJoMedix" />
                            <p>Empowering healthcare facilities with comprehensive management solutions for better patient care and operational efficiency.</p>
                            <div className="footer-social">
                                <a href="https://www.tiktok.com/@nextvijo" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><FaTiktok /></a>
                                <a href="https://www.instagram.com/nexvijo" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><LuInstagram /></a>
                                <a href="#" aria-label="Facebook"><LuFacebook /></a>
                                <a href="#" aria-label="Twitter"><LuTwitter /></a>
                                <a href="#" aria-label="LinkedIn"><LuLinkedin /></a>
                            </div>
                        </div>
                        <div className="footer-column">
                            <h4>Product</h4>
                            <ul>
                                <li><Link to="/#features">Features</Link></li>
                                <li><Link to="/#workflow">Workflows</Link></li>
                                <li><Link to="/pricing">Pricing</Link></li>
                                <li><Link to="/updates">Updates</Link></li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h4>Company</h4>
                            <ul>
                                <li><Link to="/#about">About</Link></li>
                                <li><Link to="/blog">Blog</Link></li>
                                <li><Link to="/#contact">Contact</Link></li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h4>Support</h4>
                            <ul>
                                <li><Link to="/documentation">Documentation</Link></li>
                                <li><Link to="/#contact">Help Center</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© 2026 ViJoMedix Healthcare Platform. All rights reserved.</p>
                        <div className="footer-legal">
                            <Link to="/privacy-policy">Privacy Policy</Link>
                            <Link to="/terms-of-service">Terms of Service</Link>
                        </div>
                    </div>
                </div>
                <div className="footer-powered">
                    Powered by <a href="https://nexvijo.com" target="_blank" rel="noopener noreferrer">NexVijo</a>
                </div>
            </footer>
        </Router>
    )
}

export default App
