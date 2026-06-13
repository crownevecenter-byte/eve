// frontend/src/pages/dashboards/customer/Profile.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import CustomerPageHeader from "../../../components/customer/CustomerPageHeader";
import { CustomerAlert } from "../../../components/customer/CustomerUI";
import api from "../../../services/api";
import PasswordStrength, { validatePassword, validatePhone } from "../../../components/PasswordStrength";

const Profile = () => {
  const { user } = useAuth();
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handlePasswordChange = async () => {
    setPassError("");
    setPassSuccess("");
    if (!currentPass) { setPassError("Current password is required."); return; }
    const pwdErr = validatePassword(pass);
    if (pwdErr) { setPassError(pwdErr); return; }
    if (pass !== confirmPass) { setPassError("New passwords do not match."); return; }
    try {
      await api.put("/auth/change-password", { currentPassword: currentPass, newPassword: pass });
      setPassSuccess("Password changed successfully.");
      setCurrentPass(""); setPass(""); setConfirmPass("");
    } catch (err) {
      setPassError(err.response?.data?.message || "Failed to change password.");
    }
  };

  const handleUpdate = async () => {
    const phoneErr = validatePhone(phone);
    if (phoneErr) { setStatus({ error: phoneErr }); return; }
    setStatus({ loading: true, error: "", success: "" });
    try {
      await api.put("/auth/profile", { name, phone });
      setStatus({ loading: false, error: "", success: "Profile updated successfully!" });
    } catch (e) {
      setStatus({ loading: false, error: e.response?.data?.message || "Update failed", success: "" });
    }
  };

  const initial = user?.name ? user.name[0].toUpperCase() : "C";

  return (
    <div className="ce-page">
      <CustomerPageHeader
        eyebrow="Account"
        title="My Profile"
        subtitle="Manage your account settings, security and preferences."
      />

      <div className="g73">
        <div>
          <div className="card ce-card-accent" style={{ marginBottom: 24 }}>
            <div className="ch"><div className="ct">Personal Information</div></div>
            <div className="fgrid">
              <div className="fg">
                <label>Full Name</label>
                <input className="fi" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="fg">
                <label>Email Address</label>
                <input className="fi" defaultValue={user?.email} disabled />
              </div>
            </div>
            <div className="fgrid">
              <div className="fg">
                <label>Phone Number</label>
                <input className="fi" value={phone} onChange={e => setPhone(e.target.value)} onBlur={e => setPhoneError(validatePhone(e.target.value) || "")} placeholder="+92 300 0000000" />
                {phoneError && <p style={{color:"#ef4444",fontSize:11,marginTop:4}}>{phoneError}</p>}
              </div>
              <div className="fg">
                <label>City</label>
                <select className="fs" defaultValue="Lahore">
                  <option>Lahore</option>
                  <option>Karachi</option>
                  <option>Islamabad</option>
                </select>
              </div>
            </div>
            {status.error && <CustomerAlert type="error">{status.error}</CustomerAlert>}
            {status.success && <CustomerAlert type="success">{status.success}</CustomerAlert>}
            <button type="button" className="btn btn-primary" onClick={handleUpdate} disabled={status.loading} style={{ marginTop: 16 }}>
              {status.loading ? "Updating…" : "Update Profile"}
            </button>
          </div>

          <div className="card">
            <div className="ch"><div className="ct">Security & Password</div></div>
            <div className="fg">
              <label>Current Password</label>
              <input className="fi" type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="fgrid">
              <div className="fg">
                <label>New Password</label>
                <input className="fi" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
                <PasswordStrength password={pass} />
              </div>
              <div className="fg">
                <label>Confirm New Password</label>
                <input className="fi" type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••" />
                {confirmPass && (
                  <p style={{fontSize:11,marginTop:4,color: pass===confirmPass ? "#22c55e" : "#ef4444"}}>
                    {pass===confirmPass ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>
            </div>
            {passError && <p style={{color:"#ef4444",fontSize:12,marginTop:8}}>{passError}</p>}
            {passSuccess && <p style={{color:"#22c55e",fontSize:12,marginTop:8}}>{passSuccess}</p>}
            <button type="button" className="btn btn-ghost" style={{ marginTop: 16 }} onClick={handlePasswordChange}>Change Password</button>
          </div>
        </div>

        <div>
          <div className="card ce-profile-hero">
            <div className="ce-profile-avatar">{initial}</div>
            <div className="ce-profile-name">{user?.name || "Customer"}</div>
            <div className="ce-profile-since">Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="trow" style={{ background: "rgba(232,71,10,0.06)", padding: 14, borderRadius: 8, border: "1px solid rgba(232,71,10,0.12)" }}>
                <span className="ce-meta-label">Loyalty Tier</span>
                <span className="badge bg-o">Gold Member</span>
              </div>
              <div className="trow" style={{ padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
                <span className="ce-meta-label">Crown Points</span>
                <span className="ce-order-total" style={{ fontSize: 22 }}>1,240</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="ch"><div className="ct">Preferences</div></div>
            {[
              { label: "Email Notifications", on: true },
              { label: "Order SMS Updates", on: true },
              { label: "Marketing Alerts", on: false },
            ].map((pref) => (
              <div key={pref.label} className="trow">
                <span style={{ fontSize: 14, fontWeight: 500 }}>{pref.label}</span>
                <button type="button" className={`ce-toggle${pref.on ? " is-on" : ""}`} aria-label={pref.label} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
