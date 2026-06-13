// frontend/src/pages/dashboards/customer/Bookings.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Wrench } from "lucide-react";
import CustomerPageHeader from "../../../components/customer/CustomerPageHeader";
import FilterRadioGroup from "../../../components/FilterRadioGroup";
import { CustomerLoading, CustomerEmpty, CustomerMeta } from "../../../components/customer/CustomerUI";
import { Badge } from "../../../components/customer/CustomerShared";
import api from "../../../services/api";

const normalizeStatus = (s = "") => {
  const m = {
    scheduled: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled",
    pending: "Upcoming",
    in_progress: "In Progress",
  };
  return m[s.toLowerCase()] || s;
};

const Bookings = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("All");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/bookings")
      .then(res => { const d = res?.data?.data ?? res?.data; setBookings(Array.isArray(d) ? d : []); })
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = (Array.isArray(bookings) ? bookings : []).filter(b => {
    if (!b) return false;
    const status = normalizeStatus(b.status);
    return tab === "All" || status === tab;
  });

  return (
    <div className="ce-page">
      <CustomerPageHeader
        eyebrow="Services"
        title="My Bookings"
        subtitle="View and manage your service appointments."
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate("/my/book-service")}>
            Book New Service
          </button>
        }
      />

      <FilterRadioGroup
        name="customer-bookings-tab"
        value={tab}
        onChange={setTab}
        compact
        wrap
        options={["All", "Upcoming", "In Progress", "Completed", "Cancelled"]}
        style={{ marginBottom: 20 }}
      />

      {loading && <div className="card"><CustomerLoading message="Loading bookings…" /></div>}
      {error && <div className="card"><div className="ce-alert ce-alert--error">{error}</div></div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="card">
          <CustomerEmpty
            icon={CalendarDays}
            title="No bookings found"
            description={`You don't have any ${tab.toLowerCase()} appointments at the moment.`}
            actionLabel="Book Your First Service"
            onAction={() => navigate("/my/book-service")}
          />
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="g2">
          {filtered.map(b => {
            const status = normalizeStatus(b.status);
            const serviceName = b.service?.name || "Service";
            const branchName = b.branch?.name || "—";
            const bookingDate = b.booking_date ? new Date(b.booking_date) : null;
            const dateStr = bookingDate ? bookingDate.toLocaleDateString("en-PK", { dateStyle: "medium" }) : "—";
            const timeStr = b.booking_time || "—";

            return (
              <div key={b.id} className="card ce-booking-card">
                <Badge status={status} />
                <div className="ce-booking-head">
                  <div className="ce-booking-icon">
                    <Wrench size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="ce-booking-id">Booking #{String(b.id).slice(0, 8).toUpperCase()}</div>
                    <div className="ce-booking-title">{serviceName}</div>
                    <div className="ce-booking-sub">{branchName}</div>
                  </div>
                </div>

                <div className="g2" style={{ marginBottom: 20 }}>
                  <CustomerMeta label="Date & Time" value={`${dateStr} · ${timeStr}`} />
                  <CustomerMeta label="Status" value={status} highlight />
                </div>

                {status === "Upcoming" && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-ghost btn-sm">Reschedule</button>
                    <button type="button" className="btn btn-danger btn-sm">Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bookings;
