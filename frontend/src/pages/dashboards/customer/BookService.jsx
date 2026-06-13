// frontend/src/pages/dashboards/customer/BookService.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, MessageCircle } from 'lucide-react';
import api from '../../../services/api';
import publicApi from '../../../services/publicApi';
import CustomerPageHeader from '../../../components/customer/CustomerPageHeader';
import { CustomerLoading, CustomerAlert } from '../../../components/customer/CustomerUI';
import { validatePhone } from '../../../components/PasswordStrength';

const BookService = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [cellNumber, setCellNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [cellError, setCellError] = useState('');
  const [waError, setWaError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    publicApi
      .get('/branches')
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data ?? res.data ?? [];
        setBranches(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load branches. Please refresh and try again.');
          setBranches([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedBranch) { setError('Please select a branch.'); return; }
    const cellErr = validatePhone(cellNumber);
    if (!cellNumber.trim()) { setCellError('Cell number is required.'); return; }
    if (cellErr) { setCellError(cellErr); return; }
    const waErr = validatePhone(whatsappNumber);
    if (!whatsappNumber.trim()) { setWaError('WhatsApp number is required.'); return; }
    if (waErr) { setWaError(waErr); return; }
    setCellError(''); setWaError('');

    setSubmitting(true);
    setError('');
    try {
      await api.post('/bookings', {
        branchId: Number(selectedBranch),
        booking_date: new Date().toISOString(),
        booking_time: 'ASAP',
        customer_notes: `Cell: ${cellNumber.trim()} | WhatsApp: ${whatsappNumber.trim()}`,
        final_price: 0,
      });
      navigate('/my/bookings');
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ce-page ce-book-service">
      <CustomerPageHeader
        eyebrow="Book Service"
        title="Request a Service"
        subtitle="Choose your branch and share your contact details. Our team will reach out shortly."
      />

      {loading && <CustomerLoading message="Loading branches…" />}

      {!loading && error && !branches.length && (
        <CustomerAlert type="error">{error}</CustomerAlert>
      )}

      {!loading && (
        <form className="ce-book-service-form card" onSubmit={handleBooking}>
          {error && branches.length > 0 && (
            <CustomerAlert type="error">{error}</CustomerAlert>
          )}

          <div className="ce-form-block">
            <label className="ce-form-label" htmlFor="book-branch">
              <MapPin size={14} aria-hidden />
              Select branch
            </label>
            <select
              id="book-branch"
              className="fi ce-select"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              required
            >
              <option value="">Choose nearest branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}{b.city ? ` — ${b.city}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="ce-form-block">
            <label className="ce-form-label" htmlFor="book-cell">
              <Phone size={14} aria-hidden />
              Cell number
            </label>
            <input
              id="book-cell"
              type="tel"
              className="fi"
              placeholder="03XX XXXXXXX"
              value={cellNumber}
              onChange={(e) => setCellNumber(e.target.value)}
              onBlur={e => setCellError(validatePhone(e.target.value) || '')}
              required
            />
            {cellError && <p style={{color:'#ef4444',fontSize:11,marginTop:4}}>{cellError}</p>}
          </div>

          <div className="ce-form-block">
            <label className="ce-form-label" htmlFor="book-whatsapp">
              <MessageCircle size={14} aria-hidden />
              WhatsApp number
            </label>
            <input
              id="book-whatsapp"
              type="tel"
              className="fi"
              placeholder="03XX XXXXXXX"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              onBlur={e => setWaError(validatePhone(e.target.value) || '')}
              required
            />
            {waError && <p style={{color:'#ef4444',fontSize:11,marginTop:4}}>{waError}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={submitting || !branches.length}
          >
            {submitting ? 'Submitting…' : 'Submit service request'}
          </button>

          <p className="ce-book-service-note">
            After submitting, track status under{' '}
            <button type="button" className="ca" onClick={() => navigate('/my/bookings')}>
              My Bookings
            </button>
          </p>
        </form>
      )}
    </div>
  );
};

export default BookService;
