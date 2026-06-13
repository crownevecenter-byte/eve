import React from 'react';
import { Link } from 'react-router-dom';
import PublicFooter from '../../components/public/PublicFooter';
import './Legal.css';

const SECTIONS = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'data-we-collect', title: '2. Data We Collect' },
  { id: 'how-we-use', title: '3. How We Use Data' },
  { id: 'legal-basis', title: '4. Legal Basis' },
  { id: 'sharing', title: '5. Data Sharing' },
  { id: 'cookies', title: '6. Cookies & Tracking' },
  { id: 'security', title: '7. Data Security' },
  { id: 'retention', title: '8. Data Retention' },
  { id: 'your-rights', title: '9. Your Rights' },
  { id: 'children', title: '10. Children\'s Privacy' },
  { id: 'international', title: '11. International Transfers' },
  { id: 'changes', title: '12. Policy Updates' },
  { id: 'contact', title: '13. Contact Us' },
];

const PrivacyPolicy = () => (
  <div className="legal-page">
    <header className="legal-hero">
      <span className="legal-hero-badge">Legal</span>
      <h1>Privacy Policy</h1>
      <p className="legal-hero-meta">
        This Privacy Policy explains how Crown Eve Center collects, uses, stores, and protects your
        personal information when you use our website, online shop, and customer services.
        <br />
        <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Last updated: May 26, 2026</strong>
      </p>
    </header>

    <div className="legal-layout">
      <aside className="legal-nav" aria-label="Table of contents">
        <h3>On this page</h3>
        <ul>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ul>
      </aside>

      <article className="legal-body">
        <div className="legal-highlight">
          Crown Eve Center (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting
          your privacy. This policy applies to all personal data processed through{' '}
          <strong>crownevcenter.com</strong>, our customer portal, and related branch operations.
          By using our services, you acknowledge the practices described below.
        </div>

        <section id="introduction">
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy describes how we handle personal information when you visit our website,
            create an account, place orders, book services, visit our branches, or otherwise interact
            with Crown Eve Bikes. We process data in accordance with applicable Pakistani data protection
            principles and industry best practices.
          </p>
          <p>
            This policy should be read together with our <Link to="/terms">Terms of Service</Link>.
            For account-specific data handled by staff in our internal management system, additional
            internal policies apply to authorized personnel only.
          </p>
        </section>

        <section id="data-we-collect">
          <h2>2. Data We Collect</h2>
          <h3>Information You Provide</h3>
          <ul>
            <li><strong>Account data:</strong> name, email address, phone number, city, and password (stored in encrypted form)</li>
            <li><strong>Order data:</strong> delivery address, product selections, payment method, transaction references, and order notes</li>
            <li><strong>Service booking data:</strong> preferred branch, appointment date/time, bike details, and service notes</li>
            <li><strong>Walk-in / POS data:</strong> name, CNIC, phone, WhatsApp, and address when recorded at branch for sales or credit accounts</li>
            <li><strong>Communications:</strong> messages sent through our contact forms, email, or customer support channels</li>
          </ul>
          <h3>Information Collected Automatically</h3>
          <ul>
            <li><strong>Device &amp; usage data:</strong> browser type, IP address, pages visited, and session activity</li>
            <li><strong>Authentication data:</strong> login timestamps and session tokens used to keep you signed in securely</li>
            <li><strong>Performance data:</strong> anonymized analytics to improve site speed and user experience (e.g., Vercel Speed Insights)</li>
          </ul>
          <h3>Payment Information</h3>
          <p>
            We do not store full credit or debit card numbers on our servers. Bank transfer orders may
            include transaction IDs or payment screenshots that you voluntarily submit for verification.
            Payment processing at branches is handled according to branch procedures and applicable
            financial regulations.
          </p>
        </section>

        <section id="how-we-use">
          <h2>3. How We Use Your Data</h2>
          <p>We use your personal information to:</p>
          <ul>
            <li>Create and manage your customer account and verify your email address</li>
            <li>Process, fulfill, and track orders across our branch network</li>
            <li>Schedule and manage service appointments and maintenance bookings</li>
            <li>Communicate order updates, appointment confirmations, and support responses</li>
            <li>Send OTP codes for registration, email verification, and password reset</li>
            <li>Prevent fraud, abuse, and unauthorized access to our platform</li>
            <li>Improve our website, product catalog, and customer experience</li>
            <li>Comply with legal obligations, tax requirements, and warranty record-keeping</li>
            <li>Send promotional communications where you have opted in (you may opt out at any time)</li>
          </ul>
        </section>

        <section id="legal-basis">
          <h2>4. Legal Basis for Processing</h2>
          <p>We process your personal data based on one or more of the following grounds:</p>
          <ul>
            <li><strong>Contract performance:</strong> to fulfill orders, bookings, and account services you request</li>
            <li><strong>Consent:</strong> for marketing communications and optional data you choose to provide</li>
            <li><strong>Legitimate interests:</strong> to secure our platform, prevent fraud, and improve our services</li>
            <li><strong>Legal obligation:</strong> to maintain records required by tax, consumer, or regulatory law</li>
          </ul>
        </section>

        <section id="sharing">
          <h2>5. Data Sharing &amp; Third Parties</h2>
          <p>We do not sell your personal information. We may share data with trusted third parties only where necessary:</p>
          <ul>
            <li><strong>Cloud infrastructure:</strong> hosting providers (Vercel, Hostinger) to serve our website and API</li>
            <li><strong>Database services:</strong> secure PostgreSQL hosting (Neon) for account and order data storage</li>
            <li><strong>Media storage:</strong> Cloudflare R2 for product images and uploaded content</li>
            <li><strong>Email services:</strong> SMTP providers to deliver OTP codes and transactional emails</li>
            <li><strong>Branch staff:</strong> authorized employees at the branch fulfilling your order or service</li>
            <li><strong>Legal authorities:</strong> when required by law, court order, or to protect our legal rights</li>
          </ul>
          <p>
            All third-party service providers are required to handle your data securely and only for the
            purposes we specify. We do not authorize them to use your data for their own marketing.
          </p>
        </section>

        <section id="cookies">
          <h2>6. Cookies &amp; Tracking Technologies</h2>
          <p>Our website uses cookies and similar technologies to:</p>
          <ul>
            <li>Keep you signed in to your account (authentication cookies and local storage tokens)</li>
            <li>Remember items in your shopping cart between sessions</li>
            <li>Maintain session security and prevent unauthorized access</li>
            <li>Analyze site performance and improve loading speed</li>
          </ul>
          <h3>Types of Cookies We Use</h3>
          <ul>
            <li><strong>Essential cookies:</strong> required for login, cart, and core site functionality</li>
            <li><strong>Performance cookies:</strong> help us understand how visitors use the site (anonymized where possible)</li>
          </ul>
          <p>
            You can control cookies through your browser settings. Disabling essential cookies may
            prevent you from logging in or completing purchases.
          </p>
        </section>

        <section id="security">
          <h2>7. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your personal information,
            including:
          </p>
          <ul>
            <li>Encrypted password storage using bcrypt hashing</li>
            <li>JWT-based authentication with secure, HttpOnly session cookies</li>
            <li>HTTPS encryption for all data transmitted between your browser and our servers</li>
            <li>Role-based access controls limiting staff access to authorized data only</li>
            <li>Rate limiting and login attempt protection against brute-force attacks</li>
            <li>Regular security reviews of our platform and infrastructure</li>
          </ul>
          <p>
            While we take reasonable steps to protect your data, no method of transmission over the
            internet is 100% secure. We encourage you to use a strong, unique password and keep your
            login credentials confidential.
          </p>
        </section>

        <section id="retention">
          <h2>8. Data Retention</h2>
          <p>We retain your personal data for as long as necessary to:</p>
          <ul>
            <li>Maintain your active account and provide ongoing services</li>
            <li>Fulfill legal, tax, and warranty record-keeping obligations (typically up to 7 years for financial records)</li>
            <li>Resolve disputes and enforce our agreements</li>
          </ul>
          <p>
            When you request account deletion, we will remove or anonymize your personal data within a
            reasonable timeframe, except where retention is required by law or legitimate business needs
            (such as completed order records).
          </p>
        </section>

        <section id="your-rights">
          <h2>9. Your Rights</h2>
          <p>Depending on applicable law, you may have the right to:</p>
          <ul>
            <li><strong>Access:</strong> request a copy of the personal data we hold about you</li>
            <li><strong>Correction:</strong> update inaccurate or incomplete information via your profile or by contacting us</li>
            <li><strong>Deletion:</strong> request deletion of your account and associated personal data</li>
            <li><strong>Withdraw consent:</strong> opt out of marketing communications at any time</li>
            <li><strong>Object:</strong> object to certain processing based on legitimate interests</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:info@crownelectricmobility.com">info@crownelectricmobility.com</a>.
            We will respond within a reasonable timeframe, typically within 30 days.
          </p>
        </section>

        <section id="children">
          <h2>10. Children&apos;s Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 18. We do not knowingly collect
            personal information from children. If you believe a child has provided us with personal data,
            please contact us and we will promptly delete such information.
          </p>
        </section>

        <section id="international">
          <h2>11. International Data Transfers</h2>
          <p>
            Your data may be processed on servers located outside Pakistan, including cloud infrastructure
            in the United States and Europe, operated by our service providers. Where data is transferred
            internationally, we ensure appropriate safeguards are in place to protect your information
            in line with this Privacy Policy.
          </p>
        </section>

        <section id="changes">
          <h2>12. Policy Updates</h2>
          <p>
            We may update this Privacy Policy to reflect changes in our practices, technology, or legal
            requirements. The updated version will be posted on this page with a revised &quot;Last updated&quot;
            date. Significant changes may also be communicated via email or a notice on our website.
          </p>
        </section>

        <section id="contact">
          <h2>13. Contact Us</h2>
          <p>For privacy-related questions, data access requests, or concerns, contact our team:</p>
          <div className="legal-contact-card">
            <h3>Crown Eve Center — Privacy Officer</h3>
            <p><strong>Email:</strong>{' '}<a href="mailto:info@crownelectricmobility.com">info@crownelectricmobility.com</a></p>
            <p><strong>Phone:</strong> 0300 698 3345 / 0300 449 4545</p>
            <p><strong>Address:</strong> Hadi EV Center, Bahawalnagar Road, Chishtian, Pakistan</p>
            <p><strong>Website:</strong>{' '}<a href="https://www.crownevcenter.com">www.crownevcenter.com</a></p>
          </div>
        </section>

        <div className="legal-related">
          <Link to="/terms" className="legal-related-link">
            <span>Related document</span>
            <strong>Terms of Service →</strong>
          </Link>
          <Link to="/contact" className="legal-related-link">
            <span>Questions?</span>
            <strong>Contact Us →</strong>
          </Link>
        </div>
      </article>
    </div>

    <PublicFooter />
  </div>
);

export default PrivacyPolicy;
