// frontend/src/pages/dashboards/owner/Users.jsx
import React, { useState } from "react";
import { useFetch, api, toast, Icon, TableSk, Modal, Confirm } from "../../../components/owner/OwnerShared";
import PasswordStrength, { validatePassword } from "../../../components/PasswordStrength";
import SearchInput from "../../../components/SearchInput";

const UsersPage = () => {
  const { data: pageInit, loading, refetch } = useFetch("/users/page-init");
  const users = pageInit?.users;
  const branchData = pageInit?.branches;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "BRANCH_OWNER", branchId: "" });
  const [saving, setSaving] = useState(false);

  const roles = ["COMPANY_OWNER", "BRANCH_OWNER", "CUSTOMER"];
  const roleBadge = {
    COMPANY_OWNER: "badge-orange",
    BRANCH_OWNER: "badge-blue",
    BRANCH_MANAGER: "badge-red",
    EMPLOYEE: "badge-green",
    TECHNICIAN: "badge-purple",
    CUSTOMER: "badge-yellow",
  };

  const modalRoleOptions =
    editTarget && form.role && !roles.includes(form.role) ? [form.role, ...roles] : roles;

  const branches = branchData?.data || [];

  const branchLabel = (user) => {
    if (user.role === "CUSTOMER") return "—";
    if (user.branch?.name) return user.branch.name;
    if (user.role === "COMPANY_OWNER") return "Global";
    return "—";
  };

  const filtered = (users || []).filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesBranch =
      !branchFilter ||
      (branchFilter === "none"
        ? !u.branchId
        : Number(u.branchId) === Number(branchFilter));
    return matchesSearch && matchesRole && matchesBranch;
  });

  const openAdd = () => {
    setForm({ name: "", email: "", password: "", role: "BRANCH_OWNER", branchId: "" });
    setEditTarget(null);
    setShowModal(true);
  };

  const onRoleChange = (role) => {
    setForm((f) => ({
      ...f,
      role,
      branchId: role === "CUSTOMER" || role === "COMPANY_OWNER" ? "" : f.branchId,
    }));
  };
  const openEdit = u => { setForm({ name: u.name, email: u.email, password: "", role: u.role, branchId: u.branchId || "" }); setEditTarget(u); setShowModal(true); };

  const submit = async () => {
    if (!form.name || !form.email) return toast("Name and email required", "error");
    if (form.role === "BRANCH_OWNER" && !form.branchId) {
      return toast("Branch is required for Branch Owner", "error");
    }
    if (!editTarget) {
      if (!form.password) return toast("Password required for new user", "error");
      const pwdErr = validatePassword(form.password);
      if (pwdErr) return toast(pwdErr, "error");
    }
    setSaving(true);
    try {
      if (editTarget) {
        const body = { name: form.name, email: form.email, role: form.role, branchId: form.branchId ? Number(form.branchId) : null };
        await api(`/users/${editTarget.id}`, { method: "PUT", body });
        toast("User updated");
      } else {
        await api("/users", { method: "POST", body: { ...form, branchId: form.branchId ? Number(form.branchId) : null } });
        toast("User created");
      }
      setShowModal(false); refetch();
    } catch (e) { toast(e.message, "error"); }
    setSaving(false);
  };

  const remove = async id => {
    try { await api(`/users/${id}`, { method: "DELETE" }); toast("User removed"); refetch(); }
    catch (e) { toast(e.message, "error"); }
    setConfirmId(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Access Control</div>
          <div className="page-title">PERSONNEL HUB</div>
          <div className="page-sub">
            Manage all users, roles and branch assignments — {filtered.length} shown
            {(search || roleFilter || branchFilter) ? ` of ${(users || []).length}` : ` · ${(users || []).length} total`}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" /> Add User</button>
        </div>
      </div>

      <div className="filter-bar">
        <SearchInput
          className="search-wrap"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          label="Search name or email…"
        />
        <select style={{ width: 180 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
        </select>
        <select style={{ width: 220 }} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
          <option value="">All Branches</option>
          <option value="none">No Branch (Customers / Global)</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        {loading ? <TableSk rows={8} cols={5} /> : (
          <table>
            <thead><tr><th>Employee</th><th>Role</th><th>Branch</th><th>Joined</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar" style={{ background: `hsl(${u.id * 37 % 360},40%,25%)` }}>{u.name[0]?.toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${roleBadge[u.role] || "badge-blue"}`}>{u.role.replace(/_/g, " ")}</span></td>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>{branchLabel(u)}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td><div className="td-actions">
                    <button className="btn-icon" onClick={() => openEdit(u)}><Icon name="edit" size={14} /></button>
                    <button className="btn-icon danger" onClick={() => setConfirmId(u.id)}><Icon name="trash" size={14} /></button>
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5}><div className="empty"><Icon name="users" /><div className="empty-title">No users found</div></div></td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editTarget ? "EDIT USER" : "NEW USER"} onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save User"}</button>
          </>}
        >
          <div className="form-row">
            <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          {!editTarget && (
            <div className="form-group">
              <label>Password *</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              {form.password && <PasswordStrength password={form.password} />}
            </div>
          )}
          <div className="form-row">
            <div className="form-group"><label>Role *</label>
              <select value={form.role} onChange={e => onRoleChange(e.target.value)}>
                {modalRoleOptions.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Branch</label>
              <select
                value={form.branchId}
                onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                disabled={form.role === "CUSTOMER" || form.role === "COMPANY_OWNER"}
              >
                <option value="">{form.role === "BRANCH_OWNER" ? "Select branch *" : "None / Global"}</option>
                {branchData?.data?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
      {confirmId && <Confirm msg="Remove this user from the system?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  );
};

export default UsersPage;
