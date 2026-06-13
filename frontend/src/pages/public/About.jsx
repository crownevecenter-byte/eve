import React, { useState } from 'react';
import { getApiUrl } from '../../utils/apiUrl';
import { getPublicAssetUrl } from '../../utils/imgUrl';
import { ABOUT_PHILOSOPHY_VIDEO } from '../../constants/mediaDimensions';

const About = () => {
  const [successMsg, setSuccessMsg] = useState('');

  return (
    <div id="page-about" className="page">
      {/* HERO SECTION — same structure as Home */}
      <section className="full-screen-hero page-hero page-hero--about">
        <div className="hero-slideshow">
          <div
            className="hero-slide active"
            style={{ backgroundImage: `url('${getPublicAssetUrl('hero-1')}')` }}
          />
          <div className="hero-overlay" />
        </div>
        <div className="about-hero-content hero-content full-width">
          <h1>Redefining<br />The Ride.</h1>
          <p className="hero-sub">
            From our humble beginnings to becoming Pakistan's premium mobility destination with different branches, our journey has been fueled by one passion: the future of clean, electric transit.
          </p>
        </div>
      </section>

      {/* MISSION SECTION */}
      <section className="about-mission">
        <div className="mission-text">
          <h2>Our Legacy in Motion</h2>
          <p>
            Founded on the principles of engineering excellence and customer trust, Crown Hadi EV Center has evolved into Pakistan's premier electric mobility network. With different branches across the region, we are pioneering the shift to premium EV bikes powered by best-in-class lithium batteries.
          </p>
          <div className="mission-stats">
            <div className="stat-item">
              <h3>3+</h3>
              <p>Branches</p>
            </div>
            <div className="stat-item">
              <h3>1000+</h3>
              <p>Riders Served</p>
            </div>
            <div className="stat-item">
              <h3>100%</h3>
              <p>Lithium Quality</p>
            </div>
            <div className="stat-item">
              <h3>5★</h3>
              <p>Rated Service</p>
            </div>
          </div>
        </div>
        <div className="philosophy-image" style={{
          borderRadius: '12px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          display: 'flex'
        }}>
          <img
            src={getPublicAssetUrl('legacy-bike')}
            alt="Crown Eve Showroom"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </section>

      {/* LEADERSHIP SECTION */}
      <section className="about-founder-section">
        <div className="section-header" style={{ marginBottom: '80px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--black)', letterSpacing: '-2px' }}>
            Our <span style={{ color: 'var(--orange)' }}>Leadership.</span>
          </h2>
          <p style={{ maxWidth: '600px', margin: '20px auto 0', color: 'var(--muted)', fontWeight: 600, fontSize: '1.1rem' }}>
            The visionaries driving innovation, reliability, and trust at Crown Eve Center.
          </p>
        </div>

        {/* FOUNDER & CEO */}
        <div className="about-founder">
          <div className="founder-image-wrapper">
            <img src={getPublicAssetUrl('founder')} alt="Mohsin Ashraf Ch - Founder & CEO" />
            <div className="founder-badge">Founder & CEO</div>
          </div>
          <div className="founder-content">
            <h2>Mohsin Ashraf Ch</h2>
            <div className="founder-title">Founder & CEO, Crown Eve Center</div>

            <div className="founder-quote">
              "Our vision is to establish an ecosystem of unmatched trust and engineering excellence, ensuring every rider experiences ultimate safety, quality, and innovation on the road."
            </div>

            <div className="founder-text">
              <p style={{ marginBottom: '20px' }}>
                At Crown Eve Center, our journey is defined by a relentless passion for empowering lives through premium, reliable, and progressive mobility solutions. We established this organization not merely to provide transportation, but to build a seamless ecosystem of trust, outstanding service quality, and genuine automotive standards that redefine the journey for every rider in Pakistan.
              </p>
              <p>
                By integrating state-of-the-art diagnostic technologies, forward-thinking electric mobility solutions, and a comprehensive suite of best-in-class lithium-ion batteries and high-performance motors, we are raising the bar for automotive integrity. Our promise is to deliver robust, future-ready support that stands as a lifelong companion to your aspirations.
              </p>
            </div>

            <div className="founder-signature">Mohsin Ashraf</div>
          </div>
        </div>

        {/* CO-FOUNDER */}
        <div className="about-founder co-founder-row" style={{ marginTop: '120px' }}>
          <div className="founder-content">
            <h2>Sufi Muhammad Saleemullah</h2>
            <div className="founder-title">Co-Founder, Crown Eve Center</div>

            <div className="founder-quote">
              "True innovation lies in bridging advanced technology with local accessibility, creating pathways for a sustainable future."
            </div>

            <div className="founder-text">
              <p style={{ marginBottom: '20px' }}>
                At Crown Eve Center, we are driven by the vision of transforming Pakistan's urban transit landscape. As Co-Founder, my commitment is to pioneer advanced engineering, smart battery solutions, and smart electric vehicle platforms that empower the modern commuter. We are not just creating products; we are crafting the future of reliable, sustainable mobility.
              </p>
              <p>
                Through high-quality design, meticulous quality testing, and a dedicated EV battery and component support network, we ensure our riders receive world-class value. Together, we are building a safer, cleaner, and more progressive road ahead for everyone.
              </p>
            </div>

            <div className="founder-signature">Sufi Muhammad Saleemullah</div>
          </div>
          <div className="founder-image-wrapper">
            <img src={getPublicAssetUrl('cofounder')} alt="Sufi Muhammad Saleemullah - Co-Founder" />
            <div className="founder-badge" style={{ background: '#111' }}>Co-Founder</div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY SECTION */}
      <section className="about-philosophy">
        <div className="philosophy-grid">
          <div className="philosophy-video-wrapper" style={{
            borderRadius: '12px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            height: '600px'
          }}>
            <video
              src="/about-philosophy.webm"
              autoPlay
              loop
              muted
              playsInline
              width={ABOUT_PHILOSOPHY_VIDEO.width}
              height={ABOUT_PHILOSOPHY_VIDEO.height}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div className="philosophy-content">
            <h2>The Crown Philosophy</h2>
            <div className="value-grid">
              <div className="value-item">
                <h4>Uncompromising Quality</h4>
                <p>We source only the highest grade components and partner with global manufacturers to ensure every bike meets our rigorous standards.</p>
              </div>
              <div className="value-item">
                <h4>Innovation First</h4>
                <p>We stay ahead of the curve, embracing electric mobility and smart technologies to reshape the future of transportation in Pakistan.</p>
              </div>
              <div className="value-item">
                <h4>Rider Community</h4>
                <p>We're more than a dealership. We're a hub for enthusiasts, providing expert maintenance and a platform for riders to connect.</p>
              </div>
              <div className="value-item">
                <h4>Integrity & Trust</h4>
                <p>Transparent pricing, honest advice, and lifelong support. That's our promise to every customer who joins the Crown family.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SUMMARY SECTION */}
      <section className="about-services-summary">
        <div className="section-header about-services-header">
          <h2>What We<br /><span>Provide.</span></h2>
          <p>At Crown Eve, we don't just sell products; we deliver a complete ecosystem for the modern rider.</p>
        </div>

        <div className="services-paragraph-container">
          <p>
            <span className="services-brand">Crown Hadi EV Center</span> provides an all-in-one destination for electric mobility enthusiasts as Pakistan's premium mobility destination with different branches, delivering precision-engineered bikes that undergo a rigorous 50-point safety inspection before hitting the road. We provide complete lifecycle support, offering everything from advanced battery health diagnostics and motor tuning to an extensive range of high-performance electric motors, smart digital dashboards, and long-range lithium batteries. Our commitment to the rider community includes expert maintenance services available from <span className="services-hours">10:00 AM to 8:00 PM</span> and hassle-free warranty claims, ensuring that we provide the freedom to explore with total confidence and peace of mind.
          </p>
        </div>
      </section>

      {/* RATE US SECTION */}
      <section className="rate-us-section">
        <div className="rate-us-container">
          <div className="rate-us-header">
            <h2>Rate Your Experience</h2>
            <p>Your feedback helps us improve and serves our community of riders.</p>
          </div>

          <form className="rate-us-form" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
              name: formData.get('name'),
              role: formData.get('role'),
              stars: parseInt(formData.get('stars')),
              text: formData.get('text')
            };

            try {
              const res = await fetch(`${getApiUrl()}/testimonials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (res.ok) {
                setSuccessMsg('Thank you for your rating! Your feedback helps us serve riders better.');
                e.target.reset();
              } else {
                setSuccessMsg('');
                alert('Failed to submit rating. Please try again.');
              }
            } catch (err) {
              console.error(err);
              setSuccessMsg('');
              alert('Something went wrong.');
            }
          }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Your Name</label>
                <input type="text" name="name" required placeholder="e.g. Ali Kamran" />
              </div>
              <div className="form-group">
                <label>Your Bike/Role</label>
                <input type="text" name="role" placeholder="e.g. KTM Duke Owner" />
              </div>
            </div>

            <div className="form-group">
              <label>Rating</label>
              <select name="stars" required>
                <option value="5">5 Stars - Excellent</option>
                <option value="4">4 Stars - Very Good</option>
                <option value="3">3 Stars - Good</option>
                <option value="2">2 Stars - Fair</option>
                <option value="1">1 Star - Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label>Your Experience</label>
              <textarea name="text" required placeholder="Tell us about your journey with Crown Eve..." rows="4"></textarea>
            </div>

            <button type="submit" className="submit-rate-btn">Submit Rating</button>
            {successMsg && (
              <p className="rate-success-msg" role="status">{successMsg}</p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};

export default About;

