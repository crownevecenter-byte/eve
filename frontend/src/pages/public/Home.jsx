import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getImgUrl, getPublicAssetUrl, getPublicVideoUrl } from '../../utils/imgUrl';
import { useHomeData } from '../../hooks/useHomeData';
import PageSkeleton from '../../components/ui/PageSkeleton';
import PublicFooter from '../../components/public/PublicFooter';
import CatalogProductImage from '../../components/catalog/CatalogProductImage';
import ProductGridSkeleton from '../../components/catalog/ProductGridSkeleton';
import { HERO_VIDEO } from '../../constants/mediaDimensions';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    services,
    products,
    branches,
    testimonials,
    isLoading,
    isProductsError,
    isProductsFetching,
    productsFromCache,
    refetchProducts,
    servicesLoading,
    testimonialsLoading,
  } = useHomeData();
  const [expandedTestimonial, setExpandedTestimonial] = useState(null);

  const toggleTestimonial = useCallback((id) => {
    setExpandedTestimonial((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isLoading, servicesLoading, testimonialsLoading, branches.length]);

  // Removed full-page skeleton to allow Hero section to render instantly
  return (
    <div id="page-home" className="page">
      {/* HERO */}
      <section id="hero" className="full-screen-hero">
        <div className="hero-video-wrapper">
          <video
            autoPlay
            muted
            loop
            playsInline
            width={HERO_VIDEO.width}
            height={HERO_VIDEO.height}
            className="hero-video-bg"
          >
            <source src={getPublicVideoUrl('hero-bg', 'mp4')} type="video/mp4" />
          </video>
          <div className="hero-overlay"></div>
        </div>

        <div className="hero-lines"></div>


        <div className="hero-content full-width">

          <p className="hero-sub">Crown Hadi EV Center delivers premium electric bikes, expert servicing, and best-in-class lithium batteries — engineered for the road, built for the rider.</p>
          <div className="hero-ctas">
            <Link to={user?.role === 'CUSTOMER' ? '/my/shop' : '/shop'} className="btn-primary">
              <span>Explore Bikes</span>
              <span className="arrow">→</span>
            </Link>
            {user && (
              <Link to={user?.role === 'CUSTOMER' ? '/my/book-service' : '/appointments'} className="btn-ghost">
                <span className="btn-ghost-line"></span>
                Book A Service
              </Link>
            )}
          </div>


        </div>


        <div className="scroll-indicator">
          <div className="scroll-line"></div>
          <span className="scroll-text">Scroll</span>
        </div>

        {/* MARQUEE */}
        <div className="marquee-section">
          <div className="marquee-track">
            <span className="marquee-item">
              <span style={{ color: '#FFFFFF' }}>Welcome to</span> <span className="highlight" style={{ margin: '0 8px', color: '#ff4500', textShadow: '0 0 10px rgba(255,69,0,0.6)' }}>Crown Hadi EV Center</span> <span style={{ color: '#E0E0E0' }}>— Pakistan's Premium Mobility Destination</span> <span className="marquee-sep" style={{ margin: '0 16px', color: '#555' }}>✦</span> <span style={{ color: '#00E5FF', textShadow: '0 0 10px rgba(0,229,255,0.4)' }}>Experience the Future with our High Performance Electric Bikes</span> <span className="marquee-sep" style={{ margin: '0 16px', color: '#555' }}>✦</span> <span style={{ color: '#FFD700', textShadow: '0 0 10px rgba(255,215,0,0.4)' }}>Equipped with the Best Lithium Batteries & Smart Digital Dashboards</span> <span className="marquee-sep" style={{ margin: '0 16px', color: '#555' }}>✦</span> <span style={{ color: '#00E676', textShadow: '0 0 10px rgba(0,230,118,0.4)' }}>Visit our Branches or Shop Online Today!</span>
            </span>
            <span className="marquee-item">
              <span style={{ color: '#FFFFFF' }}>Welcome to</span> <span className="highlight" style={{ margin: '0 8px', color: '#ff4500', textShadow: '0 0 10px rgba(255,69,0,0.6)' }}>Crown Hadi EV Center</span> <span style={{ color: '#E0E0E0' }}>— Pakistan's Premium Mobility Destination</span> <span className="marquee-sep" style={{ margin: '0 16px', color: '#555' }}>✦</span> <span style={{ color: '#00E5FF', textShadow: '0 0 10px rgba(0,229,255,0.4)' }}>Experience the Future with our High Performance Electric Bikes</span> <span className="marquee-sep" style={{ margin: '0 16px', color: '#555' }}>✦</span> <span style={{ color: '#FFD700', textShadow: '0 0 10px rgba(255,215,0,0.4)' }}>Equipped with the Best Lithium Batteries & Smart Digital Dashboards</span> <span className="marquee-sep" style={{ margin: '0 16px', color: '#555' }}>✦</span> <span style={{ color: '#00E676', textShadow: '0 0 10px rgba(0,230,118,0.4)' }}>Visit our Branches or Shop Online Today!</span>
            </span>
            <span className="marquee-item">
              <span style={{ color: '#FFFFFF' }}>Welcome to</span> <span className="highlight" style={{ margin: '0 8px', color: '#ff4500', textShadow: '0 0 10px rgba(255,69,0,0.6)' }}>Crown Hadi EV Center</span> <span style={{ color: '#E0E0E0' }}>— Pakistan's Premium Mobility Destination</span> <span className="marquee-sep" style={{ margin: '0 16px', color: '#555' }}>✦</span> <span style={{ color: '#00E5FF', textShadow: '0 0 10px rgba(0,229,255,0.4)' }}>Experience the Future with our High Performance Electric Bikes</span> <span className="marquee-sep" style={{ margin: '0 16px', color: '#555' }}>✦</span> <span style={{ color: '#FFD700', textShadow: '0 0 10px rgba(255,215,0,0.4)' }}>Equipped with the Best Lithium Batteries & Smart Digital Dashboards</span> <span className="marquee-sep" style={{ margin: '0 16px', color: '#555' }}>✦</span> <span style={{ color: '#00E676', textShadow: '0 0 10px rgba(0,230,118,0.4)' }}>Visit our Branches or Shop Online Today!</span>
            </span>
          </div>
        </div>
      </section>



      {/* FEATURED PRODUCTS */}
      <section id="products">
        <div className="products-header reveal">
          <div>
            <h2 className="section-title" style={{ color: 'var(--orange)' }}>Choose from<br /><span style={{ color: '#111111' }}>Our Best Models.</span></h2>
          </div>
          <Link to={user?.role === 'CUSTOMER' ? '/my/shop' : '/shop'} className="view-all">View all bikes →</Link>
        </div>
        {isLoading || (isProductsFetching && products.length === 0) ? (
          <ProductGridSkeleton count={6} className="products-grid three-cols products-grid--reserved products-grid--loading" />
        ) : (
        <div className="products-grid three-cols products-grid--reserved">
          {isProductsError && products.length === 0 ? (
            <div className="no-products" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
              <p>We could not load bikes right now (API busy or offline).</p>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: 16 }}
                disabled={isProductsFetching}
                onClick={() => refetchProducts()}
              >
                {isProductsFetching ? 'Retrying…' : 'Try again'}
              </button>
            </div>
          ) : products.length > 0 ? (
            products.slice(0, 6).map((p) => (
              <div key={p.id} className="product-card bike-card-new" onClick={() => navigate(`/product/${p.id}`)}>
                <div className="product-card-img">
                  <div className="bike-card-blob"></div>
                  {p.images && p.images.length > 0 ? (
                    <CatalogProductImage src={getImgUrl(p.images[0].url)} alt={p.name} />
                  ) : (
                    <div className="placeholder-img">[ {p.name} ]</div>
                  )}
                </div>
                <div className="product-card-body">
                  <h3 className="bike-name-new">{p.name}</h3>
                  <div className="bike-price-new">PKR {Number(p.price).toLocaleString()}</div>

                  <div className="bike-card-footer">
                    <span className="check-details">Check details</span>
                    <div className="arrow-circle">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-products">
              No bikes are listed on the shop yet. Add active bike products in the admin panel.
            </div>
          )}
          {productsFromCache && isProductsFetching && products.length > 0 && (
            <p style={{ gridColumn: '1 / -1', fontSize: 12, color: '#888', textAlign: 'center', marginTop: 8 }}>
              Showing saved bikes while we refresh…
            </p>
          )}
        </div>
        )}
      </section>

      {/* SERVICES */}
      <section id="services">
        <div className="section-label">
          <div className="section-label-line"></div>
          <span>What We Do</span>
        </div>
        <h2 className="section-title">Our<br /><span style={{ color: 'var(--orange)' }}>Services.</span></h2>
        <div className="services-layout reveal">
          <div className="services-list">
            <p className="services-paragraph-text">
              Book your service in advance — contact our branch, pick a time that works for you, show up on time, and our certified technicians will take care of everything professionally.
            </p>
          </div>
          <div className="services-cta-panel">
            <h3>Ready to<br /><span style={{ color: 'var(--orange)' }}>Ride</span><br />With Us?</h3>
            <p>Our certified technicians are ready to keep your ride in peak condition. Sign in to schedule online in under 2 minutes — choose your branch, pick a slot, and we handle the rest.</p>
            <Link to={user ? (user.role === 'CUSTOMER' ? '/my/book-service' : '/appointments') : '/login'} className="btn-primary">
              <span>{user ? "Book Now" : "Sign In to Book"}</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* BOOKING CTA BANNER */}
      <section id="booking" className="booking-cta">
        <div className="booking-media" aria-hidden="true">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="booking-video-bg"
          >
            <source src={getPublicVideoUrl('ride-bg', 'webm')} type="video/webm" />
            <source src={getPublicVideoUrl('ride-bg', 'mp4')} type="video/mp4" />
          </video>
        </div>
        <div className="booking-overlay" />

        <div className="booking-inner">
          <div className="booking-text">
            <h2>Ready to<br />Ride?</h2>
            <p>Browse our full catalog of premium EV bikes, long-range batteries, and smart digital dashboards. Find your next ride today.</p>
          </div>
          <Link to={user?.role === 'CUSTOMER' ? '/my/shop' : '/shop'} className="btn-booking">Shop The Collection →</Link>
        </div>
      </section>

      {branches.length > 0 && (
        <section id="branches">
          <div className="section-label">
            <div className="section-label-line"></div>
            <span>Find Us</span>
          </div>
          <h2 className="section-title">
            Our <span style={{ color: 'var(--orange)' }}>Branches.</span>
          </h2>
          <div className="branches-grid reveal">
            {branches.map((branch, index) => (
              <div key={branch.id} className="branch-card">
                <div className="branch-card-tag">{index === 0 ? 'Main Branch' : `Branch 0${index + 1}`}</div>
                <h3>{branch.name}</h3>
                <p>{branch.address || branch.location || branch.city}</p>
                <p className="branch-hours">
                  {branch.openTime && branch.closeTime
                    ? `${branch.openTime} – ${branch.closeTime}`
                    : 'Open Daily · 10:00 AM – 8:00 PM'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* WHY EVEE SECTION */}
      <section id="why-evee">
        <div className="why-evee-container reveal">
          <div className="why-evee-content">
            <h2 className="why-evee-title" style={{ color: 'var(--orange)' }}>WHY EVEE?</h2>
            <p className="why-evee-desc">
              Our high-quality, affordable rides empower you to reduce your carbon footprint while cruising in style and safety.
              Join us in transforming city travel, one electric ride at a time!
            </p>

            <div className="why-evee-features">
              <div className="why-evee-feat">
                <div className="feat-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <div className="feat-info">
                  <h4>Quality</h4>
                  <p>Durable Construction.</p>
                </div>
              </div>
              <div className="why-evee-feat">
                <div className="feat-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                </div>
                <div className="feat-info">
                  <h4>Warranty</h4>
                  <p>Stress Free Claims.</p>
                </div>
              </div>
              <div className="why-evee-feat">
                <div className="feat-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <div className="feat-info">
                  <h4>Service</h4>
                  <p>Door to Door Service.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="why-evee-visual">
            <div className="why-evee-img-wrapper">
              <img src={getPublicAssetUrl('1-3')} alt="Evee Electric Scooter" className="scooter-visual" loading="lazy" />
              <div className="evee-visual-overlay">
                <div className="evee-main-text-float">evee</div>
                <div className="evee-sub-text-float">I am Evee. Are you?</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials">
        <div className="section-label">
          <div className="section-label-line"></div>
          <span>What Riders Say</span>
        </div>
        <h2 className="section-title">Trusted by<br /><span style={{ color: 'var(--orange)' }}>Riders.</span></h2>
        <div className="testimonials-grid reveal">
          {testimonialsLoading ? (
            <div style={{ gridColumn: '1 / -1', padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : testimonials.length > 0 ? (
            testimonials.slice(0, 3).map((t, idx) => (
              <div key={t.id || idx} className="testimonial-card">
                <div className="stars">{'★'.repeat(t.stars)}{'☆'.repeat(5 - t.stars)}</div>
                <p
                  className={`testimonial-text ${expandedTestimonial === (t.id || idx) ? 'expanded' : ''}`}
                  onClick={() => toggleTestimonial(t.id || idx)}
                >
                  "{t.text}"
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.name ? t.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AK'}</div>
                  <div className="author-info">
                    <div className="author-name">{t.name}</div>
                    <div className="author-role">{t.role || 'Rider'}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="testimonial-card">
                <div className="stars">★★★★★</div>
                <p
                  className={`testimonial-text ${expandedTestimonial === 'fallback-1' ? 'expanded' : ''}`}
                  onClick={() => toggleTestimonial('fallback-1')}
                >
                  "Crown Eve is the only place I trust with my Duke. The technicians are certified, the parts are genuine, and the service is fast. Nothing compares."
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">AK</div>
                  <div className="author-info">
                    <div className="author-name">Ali Kamran</div>
                    <div className="author-role">KTM Duke Owner, Lahore</div>
                  </div>
                </div>
              </div>
              <div className="testimonial-card">
                <div className="stars">★★★★★</div>
                <p
                  className={`testimonial-text ${expandedTestimonial === 'fallback-2' ? 'expanded' : ''}`}
                  onClick={() => toggleTestimonial('fallback-2')}
                >
                  "Booked my full service online in 2 minutes. Got an update when the tech started and when it was done. This is how bike service should work."
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">SH</div>
                  <div className="author-info">
                    <div className="author-name">Sara Hussain</div>
                    <div className="author-role">Yamaha R15 Owner, Karachi</div>
                  </div>
                </div>
              </div>
              <div className="testimonial-card">
                <div className="stars">★★★★★</div>
                <p
                  className={`testimonial-text ${expandedTestimonial === 'fallback-3' ? 'expanded' : ''}`}
                  onClick={() => toggleTestimonial('fallback-3')}
                >
                  "Excellent battery backup and performance! The premium lithium-ion battery provides incredible long range, and the high-performance electric drive is extremely smooth."
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">MR</div>
                  <div className="author-info">
                    <div className="author-name">Muhammad Raza</div>
                    <div className="author-role">Crown EV Owner, Bahawalnagar</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Home;
