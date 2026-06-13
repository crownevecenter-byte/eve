import React from 'react';
import { Link } from 'react-router-dom';
import PublicFooter from '../../components/public/PublicFooter';
import './Legal.css';

const SECTIONS = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'services', title: '2. Our Services' },
  { id: 'accounts', title: '3. User Accounts' },
  { id: 'orders', title: '4. Orders & Payments' },
  { id: 'products', title: '5. Products & Pricing' },
  { id: 'services-booking', title: '6. Service Appointments' },
  { id: 'warranty', title: '7. Warranty & Returns' },
  { id: 'conduct', title: '8. Acceptable Use' },
  { id: 'ip', title: '9. Intellectual Property' },
  { id: 'liability', title: '10. Limitation of Liability' },
  { id: 'law', title: '11. Governing Law' },
  { id: 'changes', title: '12. Changes to Terms' },
  { id: 'contact', title: '13. Contact Us' },
];

const TermsOfService = () => (
  <div className="legal-page">
    <header className="legal-hero">
      <span className="legal-hero-badge">Legal</span>
      <h1>Terms of Service</h1>
      <p className="legal-hero-meta">
        These terms govern your use of the Crown Eve Bikes website, online shop, customer portal,
        and related services operated by Crown Eve Center (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
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
          By accessing or using <strong>crownevcenter.com</strong>, creating an account, placing an order,
          or booking a service, you agree to these Terms of Service and our{' '}
          <Link to="/privacy">Privacy Policy</Link>. If you do not agree, please do not use our platform.
        </div>

        <section id="acceptance">
          <h2>1. Acceptance of Terms</h2>
          <p>
            These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you
            and Crown Eve Center, a premium electric mobility retailer operating multiple branches across
            Pakistan. These Terms apply to all visitors, registered customers, and authorized staff users
            who access our website, mobile-responsive platform, or related digital services.
          </p>
          <p>
            We may update these Terms from time to time. Material changes will be posted on this page with
            an updated effective date. Your continued use of our services after changes are published
            constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section id="services">
          <h2>2. Our Services</h2>
          <p>Crown Eve Bikes provides, through its digital platform and branch network:</p>
          <ul>
            <li>Online browsing and purchase of electric bikes, spare parts, and accessories</li>
            <li>Customer account management, order tracking, and booking history</li>
            <li>Service and maintenance appointment scheduling</li>
            <li>Online appointment booking for service and maintenance</li>
            <li>In-branch point-of-sale and after-sales support at authorized locations</li>
          </ul>
          <p>
            We reserve the right to modify, suspend, or discontinue any feature or service at any time,
            with or without notice, where necessary for maintenance, security, or business operations.
          </p>
        </section>

        <section id="accounts">
          <h2>3. User Accounts</h2>
          <h3>Registration</h3>
          <p>
            To access certain features — including checkout, order tracking, and service bookings — you
            must create an account with accurate and complete information. You must be at least 18 years
            of age, or have parental or guardian consent, to register and purchase.
          </p>
          <h3>Account Security</h3>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials and for all
            activity that occurs under your account. Notify us immediately at{' '}
            <a href="mailto:info@crownelectricmobility.com">info@crownelectricmobility.com</a> if you
            suspect unauthorized access.
          </p>
          <h3>Email Verification</h3>
          <p>
            Customer accounts require email verification via a one-time password (OTP) before full access
            is granted. We may suspend or terminate accounts that provide false information or violate
            these Terms.
          </p>
          <h3>Staff Accounts</h3>
          <p>
            Branch staff, managers, and owner-level accounts are created by authorized administrators only.
            Staff users must use the platform solely for legitimate business purposes related to their role.
          </p>
        </section>

        <section id="orders">
          <h2>4. Orders &amp; Payments</h2>
          <h3>Order Placement</h3>
          <p>
            When you submit an order through our online shop or customer portal, you are making an offer
            to purchase the listed products subject to availability. An order is confirmed only when you
            receive an order confirmation and we begin processing it.
          </p>
          <h3>Payment Methods</h3>
          <p>
            We accept payment by cash and bank transfer as displayed at checkout and during the order
            process. Payment confirmation may require a transaction reference submitted through your
            order dashboard. For bank transfer orders, you may also be required to provide a payment
            screenshot for verification.
          </p>
          <h3>Pricing &amp; Taxes</h3>
          <p>
            All prices are displayed in Pakistani Rupees (PKR) unless otherwise stated. Prices are subject
            to change without notice. Applicable taxes, delivery charges, or branch-specific fees will be
            communicated before you complete your purchase.
          </p>
          <h3>Order Cancellation</h3>
          <p>
            We reserve the right to cancel or refuse any order due to stock unavailability, pricing errors,
            suspected fraud, or failure to verify payment. If your order is cancelled after payment, a
            refund will be processed through the original payment method where applicable.
          </p>
        </section>

        <section id="products">
          <h2>5. Products &amp; Pricing</h2>
          <p>
            Product descriptions, specifications, images, and availability are provided for informational
            purposes. While we strive for accuracy, minor variations in color, specifications, or branch
            stock levels may occur. Product images are representative; actual items may vary slightly.
          </p>
          <p>
            Electric bike specifications — including battery capacity, range, motor output, and charging
            time — are manufacturer estimates and may vary based on riding conditions, load, terrain,
            and maintenance. Please consult our branch staff for detailed guidance before purchase.
          </p>
        </section>

        <section id="services-booking">
          <h2>6. Service Appointments</h2>
          <p>
            Service bookings made through our platform are subject to branch availability and technician
            scheduling. Bookings made through the platform require a registered customer account.
            Appointment slots are subject to branch owner confirmation. Appointment times are estimates;
            we will notify you of any changes. Cancellation or rescheduling policies may apply and will
            be communicated at the time of booking.
          </p>
          <p>
            Service pricing displayed online represents base rates. Final charges may vary depending on
            parts required, labor complexity, and diagnostic findings, which will be communicated before
            work proceeds where possible.
          </p>
        </section>

        <section id="warranty">
          <h2>7. Warranty &amp; Returns</h2>
          <p>
            Electric bikes and eligible components may be covered by manufacturer or dealer warranty as
            specified at the time of purchase. Warranty terms vary by product and are subject to proper
            use, maintenance, and authorized service conditions.
          </p>
          <ul>
            <li>Warranty claims must be submitted through an authorized Crown Eve branch</li>
            <li>Proof of purchase (invoice or order reference) is required</li>
            <li>Damage caused by misuse, unauthorized modification, or accidents is not covered</li>
            <li>Spare parts and accessories may have separate return policies based on condition and packaging</li>
            <li>Battery warranty claims require the original battery unit and purchase documentation from an authorized Crown Eve branch</li>
          </ul>
          <p>
            For warranty inquiries, returns, or exchanges, please contact your nearest branch or visit
            our <Link to="/contact">Contact page</Link>.
          </p>
        </section>

        <section id="conduct">
          <h2>8. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the platform for any unlawful, fraudulent, or harmful purpose</li>
            <li>Attempt to gain unauthorized access to accounts, systems, or data</li>
            <li>Interfere with the proper functioning of the website or API</li>
            <li>Scrape, copy, or redistribute content without written permission</li>
            <li>Submit false orders, fake payment proofs, or misleading information</li>
            <li>Harass staff, other customers, or submit abusive content through any channel</li>
          </ul>
          <p>
            Violation of these rules may result in immediate account suspension, order cancellation,
            and where appropriate, referral to law enforcement authorities.
          </p>
        </section>

        <section id="ip">
          <h2>9. Intellectual Property</h2>
          <p>
            All content on this website — including logos, text, graphics, product photography, videos,
            software, and design elements — is owned by or licensed to Crown Eve Center and protected
            under applicable intellectual property laws. You may not reproduce, distribute, or create
            derivative works without our prior written consent.
          </p>
          <p>
            The &quot;Crown Eve,&quot; &quot;Crown Eve Bikes,&quot; and related brand names and logos are
            trademarks of Crown Eve Center. Unauthorized use is strictly prohibited.
          </p>
        </section>

        <section id="liability">
          <h2>10. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, Crown Eve Center shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages arising from your use
            of our platform or products, including but not limited to loss of profits, data, or business
            opportunity.
          </p>
          <p>
            Our total liability for any claim arising from these Terms or your use of our services shall
            not exceed the amount you paid to us for the specific product or service giving rise to the
            claim in the twelve (12) months preceding the event.
          </p>
          <p>
            Nothing in these Terms excludes or limits liability that cannot be excluded or limited under
            Pakistani law, including liability for death or personal injury caused by negligence or fraud.
          </p>
        </section>

        <section id="law">
          <h2>11. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the Islamic Republic
            of Pakistan. Any disputes arising from or relating to these Terms or your use of our services
            shall be subject to the exclusive jurisdiction of the competent courts in Punjab, Pakistan,
            unless otherwise required by mandatory consumer protection law.
          </p>
        </section>

        <section id="changes">
          <h2>12. Changes to Terms</h2>
          <p>
            We may revise these Terms periodically to reflect changes in our services, legal requirements,
            or business practices. The &quot;Last updated&quot; date at the top of this page indicates when
            the Terms were most recently amended. We encourage you to review this page regularly.
          </p>
        </section>

        <section id="contact">
          <h2>13. Contact Us</h2>
          <p>If you have questions about these Terms, please contact us:</p>
          <div className="legal-contact-card">
            <h3>Crown Eve Center — Legal &amp; Support</h3>
            <p><strong>Email:</strong>{' '}<a href="mailto:info@crownelectricmobility.com">info@crownelectricmobility.com</a></p>
            <p><strong>Phone:</strong> 0300 698 3345 / 0300 449 4545</p>
            <p><strong>Address:</strong> Hadi EV Center, Bahawalnagar Road, Chishtian, Pakistan</p>
            <p><strong>Website:</strong>{' '}<a href="https://www.crownevcenter.com">www.crownevcenter.com</a></p>
          </div>
        </section>

        <div className="legal-related">
          <Link to="/privacy" className="legal-related-link">
            <span>Related document</span>
            <strong>Privacy Policy →</strong>
          </Link>
          <Link to="/contact" className="legal-related-link">
            <span>Need help?</span>
            <strong>Contact Support →</strong>
          </Link>
        </div>
      </article>
    </div>

    <PublicFooter />
  </div>
);

export default TermsOfService;
