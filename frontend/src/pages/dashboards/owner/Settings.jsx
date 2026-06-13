// frontend/src/pages/dashboards/owner/Settings.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Icon } from "../../../components/owner/OwnerShared";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import PasswordStrength, { validatePassword } from "../../../components/PasswordStrength";
import { getApiUrl } from "../../../utils/apiUrl";

const SectionCard = ({ eyebrow, title, desc, danger, children }) => (
  <div
    style={{
      background: danger ? "rgba(220,38,38,0.04)" : "var(--surface2)",
      border: "1px solid var(--border)",
      borderLeft: danger ? "3px solid var(--red)" : undefined,
      borderRadius: "var(--r-lg)",
      padding: 28,
    }}
  >
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: danger ? "var(--red)" : "var(--accent)",
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: desc ? 8 : 0 }}>{title}</div>
      {desc && <div style={{ fontSize: 13, color: "var(--muted)", maxWidth: 560 }}>{desc}</div>}
    </div>
    {children}
  </div>
);

const InfoTile = ({ label, value }) => (
  <div
    style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-md)",
      padding: "16px 18px",
    }}
  >
    <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
      {label}
    </div>
    <div style={{ fontWeight: 700, fontSize: 14, wordBreak: "break-all" }}>{value ?? "—"}</div>
  </div>
);

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState({ name: "", phone: "", city: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [passError, setPassError] = useState("");

  const [exporting, setExporting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setForm({ name: user.name || "", phone: user.phone || "", city: user.city || "" });
    }
  }, [user]);

  const saveProfile = async () => {
    if (!form.name.trim()) return toast("Name is required", "e");
    setSavingProfile(true);
    try {
      const res = await api.put("/auth/profile", {
        name: form.name.trim(),
        phone: form.phone || null,
        city: form.city || null,
      });
      const updated = res.data?.user;
      if (updated) {
        const cached = JSON.parse(localStorage.getItem("crowneve_user") || "{}");
        const next = { ...cached, name: updated.name, phone: updated.phone, city: updated.city };
        localStorage.setItem("crowneve_user", JSON.stringify(next));
        setProfile((p) => ({ ...p, ...next }));
        setForm({ name: updated.name || "", phone: updated.phone || "", city: updated.city || "" });
      }
      toast("Profile updated successfully");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to update profile", "e");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    setPassError("");
    if (!currentPass) return toast("Current password required", "e");
    const err = validatePassword(newPass);
    if (err) return toast(err, "e");
    if (newPass !== confirmPass) return toast("Passwords do not match", "e");

    setSavingPass(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: currentPass,
        newPassword: newPass,
      });
      toast("Password changed successfully");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to change password.";
      setPassError(msg);
      toast(msg, "e");
    } finally {
      setSavingPass(false);
    }
  };

  const signOutAllDevices = async () => {
    if (!window.confirm("Sign out on all devices? You will need to log in again.")) return;
    setSigningOut(true);
    try {
      await logout();
    } catch {
      localStorage.removeItem("crowneve_token");
      localStorage.removeItem("crowneve_user");
      localStorage.removeItem("crowneve_last_active");
      sessionStorage.clear();
      navigate("/login");
    } finally {
      setSigningOut(false);
    }
  };

  const exportOrdersCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get("/orders/export-csv", { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "crown-eve-orders.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast("Orders exported successfully");
    } catch (err) {
      const status = err.response?.status;
      const msg =
        status === 429
          ? "Server is busy. Please wait a minute and try again."
          : err.response?.data?.message || "Failed to export orders";
      toast(msg, "e");
    } finally {
      setExporting(false);
    }
  };

  const isOAuth = Boolean(profile?.googleId);
  const passwordsMatch = confirmPass.length > 0 && newPass === confirmPass;
  const passwordsMismatch = confirmPass.length > 0 && newPass !== confirmPass;

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <div className="page-eyebrow">Account</div>
          <div className="page-title">SETTINGS</div>
          <div className="page-sub">Manage your profile, security and account information</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* SECTION 1: Company Profile */}
        <SectionCard
          eyebrow="Account"
          title="Company Profile"
          desc="Update your name, phone and city. Email cannot be changed."
        >
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                readOnly
                value={profile?.email || user?.email || ""}
                style={{ opacity: 0.5, cursor: "not-allowed" }}
              />
              <small style={{ display: "block", marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
                Email cannot be changed
              </small>
            </div>
          </div>
          <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </SectionCard>

        {/* SECTION 2: Change Password */}
        <SectionCard eyebrow="Security" title="Change Password">
          {isOAuth ? (
            <div
              style={{
                padding: 16,
                background: "var(--surface)",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--border)",
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              Your account uses Google Sign-In. Password cannot be changed here.
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  autoComplete="new-password"
                />
                <PasswordStrength password={newPass} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  autoComplete="new-password"
                />
                {passwordsMatch && (
                  <small style={{ display: "block", marginTop: 6, fontSize: 11, color: "#22c55e" }}>
                    ✓ Passwords match
                  </small>
                )}
                {passwordsMismatch && (
                  <small style={{ display: "block", marginTop: 6, fontSize: 11, color: "var(--red)" }}>
                    Passwords do not match
                  </small>
                )}
              </div>
              {passError && (
                <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 12 }}>{passError}</div>
              )}
              <button className="btn btn-primary" onClick={changePassword} disabled={savingPass}>
                {savingPass ? "Updating…" : "Change Password"}
              </button>
            </>
          )}
        </SectionCard>

        {/* SECTION 3: System Info */}
        <SectionCard eyebrow="Info" title="System Information">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            <InfoTile label="Role" value={profile?.role || user?.role} />
            <InfoTile
              label="Member Since"
              value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
            />
            <InfoTile
              label="Account Status"
              value={profile?.isVerified ? "✓ Verified" : "⚠ Unverified"}
            />
            <InfoTile label="API Endpoint" value={getApiUrl()} />
            <InfoTile label="Environment" value={import.meta.env.MODE} />
          </div>
        </SectionCard>

        {/* SECTION 4: Danger Zone */}
        <SectionCard eyebrow="⚠ Warning" title="Danger Zone" danger>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Sign Out All Devices</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                Clears your session on this device. You will need to log in again.
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={signOutAllDevices}
                disabled={signingOut}
                style={{ border: "1px solid rgba(239,68,68,0.4)" }}
              >
                {signingOut ? "Signing out…" : "Sign Out All Devices"}
              </button>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Export My Data (CSV)</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                Download your order records as a CSV file.
              </div>
              <button
                className="btn btn-sm"
                onClick={exportOrdersCsv}
                disabled={exporting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid rgba(255,77,0,0.4)",
                  color: "var(--accent)",
                  background: "transparent",
                }}
              >
                <Icon name="download" size={14} />
                {exporting ? "Exporting…" : "Export Orders CSV"}
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default SettingsPage;
