import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { getPublicAssetUrl } from '../../utils/imgUrl';

const Contact = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Default Head Office Info
  const headOffice = {
    name: "Hadi Ev Center",
    phone: "0300 698 3345, 0300 449 4545",
    email: "info@crownelectricmobility.com",
    address: "Hadi Ev Center, Bahawalnagar road Chishtian",
    timings: "Mon-Sat, 9:00 AM - 8:00 PM"
  };

  useEffect(() => {
    api.get("/branches")
      .then(res => {
        const branchList = res.data?.data || res.data || [];
        const parsedBranches = Array.isArray(branchList) ? branchList : [];
        setBranches(parsedBranches);
        if (parsedBranches.length > 0) {
          setSelectedBranch(parsedBranches[0]);
        }
      })
      .catch(err => console.error("Error fetching branches:", err));
  }, []);

  const currentInfo = selectedBranch ? {
    name: selectedBranch.name,
    phone: selectedBranch.phone || headOffice.phone,
    email: selectedBranch.email || headOffice.email,
    address: selectedBranch.location || headOffice.address,
    timings: headOffice.timings
  } : headOffice;

  return (
    <div id="page-contact" className="page">
      {/* HERO SECTION — same structure as Home */}
      <section className="full-screen-hero page-hero page-hero--contact">
        <div className="hero-slideshow">
          <div
            className="hero-slide active"
            style={{ backgroundImage: `url('${getPublicAssetUrl('hero-2')}')` }}
          />
          <div className="hero-overlay" />
        </div>
        <div className="contact-hero-content hero-content full-width">
          <h1>Contact Us</h1>
          <p className="hero-sub">Reach our team at any Crown Eve branch — we're here to help with sales, service, and support.</p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="contact-main">
        <div className="contact-left">
          <div className="branch-selector-wrapper">
            <span className="selector-label">Select Your Nearest Branch</span>
            <select 
              className="branch-selector-premium"
              value={selectedBranch ? selectedBranch.id : ""}
              onChange={(e) => {
                const branch = branches.find(b => String(b.id) === e.target.value);
                setSelectedBranch(branch || null);
              }}
            >
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <h2>Get In Touch With Our Team.</h2>
          <p className="sub">
            Whether you have questions about our products, need support, or want to become a dealer – our team is ready to assist you.
          </p>

          <div className="info-grid">
            <div className="info-block">
              <h4>Phone Number</h4>
              <div className="info-item">
                <span>📞</span>
                <div>
                  {currentInfo.phone.split(',').map((p, i) => (
                    <React.Fragment key={i}>{p.trim()}<br /></React.Fragment>
                  ))}
                </div>
              </div>
              <p className="time-note">{currentInfo.timings || "Mon-Sat, 9:00 AM - 6:00 PM"}</p>
            </div>

            <div className="info-block">
              <h4>Our Location</h4>
              <div className="info-item">
                <span>📍</span>
                <div>
                  <p>{currentInfo.address?.split('|')[0]}</p>
                  {currentInfo.address?.includes('|') && (
                    <a 
                      href={currentInfo.address.split('|')[1]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ display: 'inline-block', marginTop: '5px', color: 'var(--orange)', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}
                    >
                      Open in Google Maps ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="info-block">
              <h4>Email</h4>
              <div className="info-item">
                <span>✉️</span>
                <p>{currentInfo.email}</p>
              </div>
            </div>

            <div className="info-block">
              <h4>Social Network</h4>
              <div className="social-links">
                <a href="https://web.facebook.com/hadievcenter/?_rdc=1&_rdr" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                </a>
                <a href="https://www.instagram.com/hadievcenter?hl=af" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                </a>
                <a href="https://wa.me/923219240325" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="visit-us-block">
            <span className="visit-us-label">Visit Us</span>
            <h3>Open Daily · 10:00 AM – 8:00 PM</h3>
            <p>Chishtian Main Branch &amp; all other branches</p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Contact;
