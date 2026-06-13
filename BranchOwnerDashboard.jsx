/**
 * Crown Eve Center — Branch Owner Dashboard
 *
 * Role: BRANCH_OWNER
 * All endpoints extracted from the real backend routes/controllers.
 *
 * Screens:
 *  1. Dashboard       — live KPIs, today's appointments, recent orders, stock alerts
 *  2. Orders          — paginated order queue with status filter + inline status update
 *  3. Inventory       — stock cards with +/- quick-edit and alert threshold config
 *  4. Products        — product grid with full CRUD (name, price, parts composition)
 *  5. Services        — service protocols CRUD (name, description, price)
 *  6. Appointments    — list + mini calendar view, status update, tech assignment
 *  7. Suppliers       — supplier list CRUD + purchase order form
 *  8. Employees       — branch staff list pulled from /branches/:id, add/edit user
 *  9. Reports         — revenue summary, chart, sales breakdown for this branch
 *
 * ─── Setup ───
 * 1. Set API_BASE to your backend URL
 * 2. Login as BRANCH_OWNER — the dashboard reads branchId from the JWT /auth/me response
 * 3. Drop into App.jsx: <Route path="/branch/*" element={<BranchOwnerDashboard />} />
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE = "https://your-backend-url.vercel.app/api"; // ← change this
const TOKEN_KEY = "token";

// ─── API HELPER ──────────────────────────────────────────────────────────────
const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || `HTTP ${res.status}`);
  }
  return res.json();
};

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!path) return;
    setLoading(true); setError(null);
    try { setData(await apiFetch(path)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}

function useDebounce(val, ms = 400) {
  const [dv, setDv] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setDv(val), ms);
    return () => clearTimeout(t);
  }, [val, ms]);
  return dv;
}

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #07070A;
    --surf:      #0D0D12;
    --surf2:     #131318;
    --surf3:     #18181F;
    --border:    rgba(255,255,255,0.055);
    --border2:   rgba(255,255,255,0.10);
    --text:      #EEECEA;
    --muted:     #6B6A68;
    --acc:       #0EA5E9;   /* sky-500 — branch accent differs from owner orange */
    --acc2:      #38BDF8;
    --green:     #22C55E;
    --yellow:    #EAB308;
    --red:       #EF4444;
    --purple:    #A855F7;
    --orange:    #F97316;
    --r-sm:      8px;
    --r-md:      14px;
    --r-lg:      20px;
    --r-xl:      28px;
    --r-2xl:     36px;
    --font-d:    'Bebas Neue', sans-serif;
    --font-b:    'DM Sans', sans-serif;
    --font-m:    'JetBrains Mono', monospace;
    --sidebar-w: 230px;
  }

  html, body, #root { height:100%; background:var(--bg); color:var(--text); font-family:var(--font-b); }
  ::-webkit-scrollbar { width:3px; height:3px; }
  ::-webkit-scrollbar-thumb { background:var(--border2); border-radius:99px; }

  /* ── Shell ── */
  .shell { display:flex; height:100vh; overflow:hidden; }
  .main  { flex:1; overflow-y:auto; display:flex; flex-direction:column; }

  /* ── Sidebar ── */
  .sb {
    width:var(--sidebar-w); min-width:var(--sidebar-w);
    background:var(--surf); border-right:1px solid var(--border);
    display:flex; flex-direction:column; padding:22px 14px;
    overflow-y:auto; position:relative; z-index:10;
  }
  .sb-brand { display:flex; align-items:center; gap:10px; margin-bottom:28px; padding:0 6px; }
  .sb-mark  {
    width:36px; height:36px; background:var(--acc); border-radius:8px;
    display:flex; align-items:center; justify-content:center;
    font-family:var(--font-d); font-size:16px; color:#fff; flex-shrink:0;
  }
  .sb-name  { font-family:var(--font-d); font-size:20px; letter-spacing:.05em; line-height:1.1; }
  .sb-name span { color:var(--acc); }
  .sb-sub   { font-size:8px; font-weight:700; letter-spacing:.25em; color:var(--muted); text-transform:uppercase; }
  .sb-sec   { font-size:9px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); padding:0 6px; margin:18px 0 6px; }
  .sb-item  {
    display:flex; align-items:center; gap:10px; padding:9px 10px;
    border-radius:var(--r-sm); cursor:pointer; transition:all .15s;
    color:var(--muted); font-weight:500; font-size:13px;
    border:1px solid transparent;
  }
  .sb-item:hover  { background:rgba(255,255,255,0.04); color:var(--text); }
  .sb-item.active { background:var(--acc); color:#fff; }
  .sb-item svg    { width:16px; height:16px; flex-shrink:0; }
  .sb-user { display:flex; align-items:center; gap:10px; padding:10px; background:var(--surf2); border-radius:var(--r-md); border:1px solid var(--border); margin-top:16px; }
  .sb-avatar { width:30px; height:30px; border-radius:7px; background:var(--acc); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; color:#fff; flex-shrink:0; }
  .sb-uname { font-weight:600; font-size:12px; line-height:1.2; }
  .sb-urole { font-size:9px; color:var(--muted); text-transform:uppercase; letter-spacing:.1em; }

  /* ── Topbar ── */
  .topbar {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 28px; border-bottom:1px solid var(--border);
    background:var(--surf); position:sticky; top:0; z-index:5; flex-shrink:0;
  }
  .topbar-title { font-family:var(--font-d); font-size:22px; letter-spacing:.05em; }
  .topbar-right { display:flex; align-items:center; gap:10px; }
  .live-pill {
    display:flex; align-items:center; gap:7px; padding:5px 12px;
    background:var(--surf2); border:1px solid var(--border); border-radius:99px;
    font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
  }
  .live-dot { width:6px; height:6px; background:var(--green); border-radius:50%; animation:pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }

  /* ── Page ── */
  .page { padding:28px; flex:1; }
  .ph   { margin-bottom:24px; display:flex; align-items:flex-end; justify-content:space-between; gap:14px; flex-wrap:wrap; }
  .ph-l .eyebrow { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.2em; color:var(--acc); margin-bottom:5px; display:flex; align-items:center; gap:6px; }
  .ph-l .eyebrow::before { content:''; display:inline-block; width:18px; height:2px; background:var(--acc); }
  .ph-l .ptitle { font-family:var(--font-d); font-size:36px; letter-spacing:.04em; line-height:1; }
  .ph-l .psub   { color:var(--muted); font-size:13px; margin-top:3px; }
  .ph-r { display:flex; gap:8px; flex-shrink:0; }

  /* ── Buttons ── */
  .btn { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:var(--r-sm); font-weight:600; font-size:12px; cursor:pointer; transition:all .15s; border:1px solid transparent; white-space:nowrap; font-family:var(--font-b); }
  .btn svg { width:15px; height:15px; }
  .btn-p  { background:var(--acc); color:#fff; }
  .btn-p:hover  { background:var(--acc2); }
  .btn-s  { background:var(--surf2); border-color:var(--border2); color:var(--text); }
  .btn-s:hover  { border-color:rgba(255,255,255,.2); }
  .btn-g  { background:transparent; color:var(--muted); }
  .btn-g:hover  { color:var(--text); background:rgba(255,255,255,.04); }
  .btn-d  { background:rgba(239,68,68,.1); border-color:rgba(239,68,68,.3); color:var(--red); }
  .btn-d:hover  { background:var(--red); color:#fff; }
  .btn-sm { padding:6px 12px; font-size:11px; }
  .btn-ico { padding:7px; border-radius:var(--r-sm); background:var(--surf2); border:1px solid var(--border); color:var(--muted); cursor:pointer; transition:all .15s; display:inline-flex; align-items:center; }
  .btn-ico:hover        { color:var(--text); border-color:var(--border2); }
  .btn-ico.dng:hover    { color:var(--red); border-color:var(--red); }
  .btn-ico.act:hover    { color:var(--green); border-color:var(--green); }
  .btn[disabled], .btn-ico[disabled] { opacity:.35; cursor:not-allowed; }

  /* ── Cards ── */
  .card { background:var(--surf); border:1px solid var(--border); border-radius:var(--r-xl); }
  .ci   { padding:20px; }
  .sg   { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
  .sc   { background:var(--surf); border:1px solid var(--border); border-radius:var(--r-xl); padding:20px; position:relative; overflow:hidden; transition:border-color .2s; }
  .sc:hover { border-color:var(--border2); }
  .sc-icon  { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
  .sc-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.15em; color:var(--muted); margin-bottom:6px; }
  .sc-val   { font-family:var(--font-d); font-size:32px; letter-spacing:.02em; line-height:1; }
  .sc-trend { font-size:10px; font-weight:600; margin-top:5px; }
  .t-up  { color:var(--green); }
  .t-dn  { color:var(--red); }
  .sc-glow { position:absolute; bottom:-40px; right:-20px; width:90px; height:90px; border-radius:50%; opacity:.07; filter:blur(30px); }

  /* ── Table ── */
  .tw { background:var(--surf); border:1px solid var(--border); border-radius:var(--r-xl); overflow:hidden; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:var(--surf2); border-bottom:1px solid var(--border); }
  th { padding:12px 18px; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.15em; color:var(--muted); text-align:left; white-space:nowrap; }
  tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
  tbody tr:last-child { border-bottom:none; }
  tbody tr:hover { background:rgba(255,255,255,.02); }
  td { padding:12px 18px; font-size:13px; }
  .tda { display:flex; gap:5px; justify-content:flex-end; }

  /* ── Forms ── */
  .fg   { margin-bottom:16px; }
  label { display:block; font-size:11px; font-weight:600; color:var(--muted); margin-bottom:5px; text-transform:uppercase; letter-spacing:.1em; }
  input, select, textarea {
    width:100%; padding:9px 12px; background:var(--surf2); border:1px solid var(--border2);
    border-radius:var(--r-sm); color:var(--text); font-family:var(--font-b); font-size:13px;
    outline:none; transition:border-color .15s;
  }
  input:focus, select:focus, textarea:focus { border-color:var(--acc); }
  select option { background:var(--surf2); }
  textarea { resize:vertical; min-height:72px; }
  .fr { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .fr3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }

  /* ── Modal ── */
  .mbk {
    position:fixed; inset:0; background:rgba(0,0,0,.72); backdrop-filter:blur(6px);
    z-index:50; display:flex; align-items:center; justify-content:center; padding:18px;
    animation:fadeIn .15s;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal {
    background:var(--surf); border:1px solid var(--border2); border-radius:var(--r-2xl);
    width:100%; max-width:540px; max-height:90vh; overflow-y:auto;
    animation:slideUp .2s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes slideUp { from{opacity:0;transform:translateY(28px) scale(.95)} to{opacity:1;transform:none} }
  .mh { padding:22px 26px 0; display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; }
  .mt { font-family:var(--font-d); font-size:26px; letter-spacing:.04em; }
  .mb { padding:0 26px 26px; }
  .mf { padding:0 26px 26px; display:flex; justify-content:flex-end; gap:8px; }
  .modal.wide { max-width:680px; }

  /* ── Badges ── */
  .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:99px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; }
  .bg-g  { background:rgba(34,197,94,.1);  color:var(--green);  border:1px solid rgba(34,197,94,.2);  }
  .bg-r  { background:rgba(239,68,68,.1);  color:var(--red);    border:1px solid rgba(239,68,68,.2);  }
  .bg-y  { background:rgba(234,179,8,.1);  color:var(--yellow); border:1px solid rgba(234,179,8,.2);  }
  .bg-b  { background:rgba(14,165,233,.1); color:var(--acc);    border:1px solid rgba(14,165,233,.2); }
  .bg-p  { background:rgba(168,85,247,.1); color:var(--purple); border:1px solid rgba(168,85,247,.2); }
  .bg-o  { background:rgba(249,115,22,.1); color:var(--orange); border:1px solid rgba(249,115,22,.2); }

  /* ── Search bar ── */
  .fbar { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
  .sw   { flex:1; min-width:180px; position:relative; }
  .sw svg { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--muted); width:14px; height:14px; }
  .sw input { padding-left:32px; }

  /* ── Pagination ── */
  .pag { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-top:1px solid var(--border); }
  .pag-info { font-size:11px; color:var(--muted); }
  .pag-ctrl { display:flex; gap:4px; }
  .pb { padding:5px 12px; border-radius:var(--r-sm); background:var(--surf2); border:1px solid var(--border); font-size:11px; font-weight:600; cursor:pointer; color:var(--text); transition:all .15s; }
  .pb:hover:not([disabled]) { border-color:var(--border2); }
  .pb.act  { background:var(--acc); border-color:var(--acc); color:#fff; }
  .pb[disabled] { opacity:.3; cursor:not-allowed; }

  /* ── Skeleton ── */
  .sk { background:linear-gradient(90deg,var(--surf2) 25%,rgba(255,255,255,.04) 50%,var(--surf2) 75%); background-size:200% 100%; animation:sh 1.5s infinite; border-radius:var(--r-sm); }
  @keyframes sh { from{background-position:200% 0} to{background-position:-200% 0} }
  .sk-row { display:flex; gap:12px; margin-bottom:12px; }

  /* ── Empty ── */
  .empty { text-align:center; padding:48px 20px; color:var(--muted); }
  .empty svg { width:40px; height:40px; margin:0 auto 12px; opacity:.25; }
  .empty-t { font-weight:600; font-size:14px; margin-bottom:4px; }
  .empty-s { font-size:12px; }

  /* ── Toast ── */
  .toast-c { position:fixed; bottom:20px; right:20px; z-index:100; display:flex; flex-direction:column; gap:7px; pointer-events:none; }
  .toast   { padding:10px 16px; border-radius:var(--r-md); border:1px solid; font-size:12px; font-weight:600; display:flex; align-items:center; gap:8px; pointer-events:all; max-width:320px; animation:toastIn .3s cubic-bezier(.34,1.56,.64,1); }
  @keyframes toastIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:none} }
  .toast-s { background:rgba(34,197,94,.14);  border-color:rgba(34,197,94,.3);  color:var(--green); }
  .toast-e { background:rgba(239,68,68,.14);  border-color:rgba(239,68,68,.3);  color:var(--red);   }
  .toast-i { background:rgba(14,165,233,.14); border-color:rgba(14,165,233,.3); color:var(--acc);   }

  /* ── Charts ── */
  .bar-wrap { display:flex; align-items:flex-end; gap:6px; height:140px; }
  .bar-col  { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; }
  .bar-fill { width:100%; background:var(--acc); border-radius:5px 5px 0 0; min-height:3px; transition:height .5s cubic-bezier(.34,1.2,.64,1); }
  .bar-fill:hover { background:var(--acc2); }
  .bar-lb   { font-size:9px; color:var(--muted); white-space:nowrap; }
  .bar-vl   { font-size:8px; font-weight:700; color:var(--muted); }

  /* ── Inventory card grid ── */
  .inv-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:14px; }
  .inv-card { background:var(--surf); border:1px solid var(--border); border-radius:var(--r-xl); padding:18px; transition:all .2s; }
  .inv-card:hover { border-color:var(--border2); }
  .inv-card.alert { border-color:rgba(239,68,68,.35); box-shadow:0 0 20px rgba(239,68,68,.05); }
  .inv-ctrl { display:flex; align-items:center; gap:6px; }
  .inv-btn  { width:28px; height:28px; border-radius:6px; background:var(--surf2); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px; font-weight:700; color:var(--muted); transition:all .15s; }
  .inv-btn:hover { background:var(--acc); color:#fff; border-color:var(--acc); }

  /* ── Appointment calendar ── */
  .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
  .cal-day  { aspect-ratio:1; background:var(--surf2); border:1px solid var(--border); border-radius:var(--r-md); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; cursor:pointer; transition:all .15s; font-size:12px; font-weight:600; }
  .cal-day:hover { border-color:var(--border2); }
  .cal-day.today { border-color:var(--acc); color:var(--acc); }
  .cal-day .dot  { width:5px; height:5px; background:var(--acc); border-radius:50%; }

  /* ── Tabs ── */
  .tabs { display:flex; gap:3px; margin-bottom:20px; background:var(--surf2); border:1px solid var(--border); padding:3px; border-radius:var(--r-md); width:fit-content; }
  .tab  { padding:7px 16px; border-radius:9px; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; color:var(--muted); }
  .tab.active { background:var(--acc); color:#fff; }
  .tab:hover:not(.active) { color:var(--text); }

  /* ── Confirm ── */
  .conf-overlay { position:fixed; inset:0; background:rgba(0,0,0,.72); backdrop-filter:blur(4px); z-index:60; display:flex; align-items:center; justify-content:center; }
  .conf-box { background:var(--surf); border:1px solid var(--border2); border-radius:var(--r-xl); padding:28px; max-width:360px; width:100%; animation:slideUp .2s; }
  .conf-msg { font-size:14px; color:var(--muted); margin-bottom:20px; }
  .conf-ftr { display:flex; justify-content:flex-end; gap:8px; }

  /* ── Login ── */
  .login-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); padding:20px; }
  .login-card { background:var(--surf); border:1px solid var(--border2); border-radius:var(--r-2xl); padding:44px; width:100%; max-width:400px; }
  .login-err  { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3); color:var(--red); padding:10px 14px; border-radius:var(--r-sm); font-size:12px; margin-bottom:14px; }

  /* ── Responsive ── */
  @media(max-width:1024px) { .sg { grid-template-columns:repeat(2,1fr); } .sb { display:none; } }
  @media(max-width:640px)  { .sg { grid-template-columns:1fr; } .page { padding:16px; } .inv-grid { grid-template-columns:repeat(2,1fr); } }
`;

// ─── ICONS ───────────────────────────────────────────────────────────────────
const ICON_PATHS = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  orders: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0",
  inventory: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  products: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0",
  services: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  appointments: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M9 16l2 2 4-4",
  suppliers: "M1 3h15v13H1z M16 8l4 2v5h-4 M1 21h18 M5 18v3 M12 18v3",
  employees: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  reports: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  plus: "M12 5v14 M5 12h14",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  search: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  close: "M18 6 6 18 M6 6l12 12",
  check: "M20 6 9 17l-5-5",
  alert: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  dollar: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  arrow: "M5 12h14 M12 5l7 7-7 7",
  chevL: "M15 18l-6-6 6-6",
  chevR: "M9 18l6-6-6-6",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01",
  trend: "M23 6l-9.5 9.5-5-5L1 18",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  wrench: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M12 6v6l4 2",
  truck: "M1 3h15v13H1z M16 8l4 2v5h-4 M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
};

const Icon = ({ n, size = 16 }) => {
  const d = ICON_PATHS[n] || ICON_PATHS.dashboard;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((seg, i) => <path key={i} d={(i > 0 ? "M" : "") + seg} />)}
    </svg>
  );
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
let _toast;
const ToastContainer = () => {
  const [list, setList] = useState([]);
  _toast = useCallback((msg, type = "s") => {
    const id = Date.now();
    setList(l => [...l, { id, msg, type }]);
    setTimeout(() => setList(l => l.filter(x => x.id !== id)), 3500);
  }, []);
  return (
    <div className="toast-c">
      {list.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <Icon n={t.type === "e" ? "alert" : "check"} size={14} /> {t.msg}
        </div>
      ))}
    </div>
  );
};
const toast = (msg, type = "s") => _toast?.(msg, type);

// ─── MODAL ───────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, footer, wide }) => (
  <div className="mbk" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className={`modal${wide ? " wide" : ""}`}>
      <div className="mh">
        <div className="mt">{title}</div>
        <button className="btn-ico" onClick={onClose}><Icon n="close" /></button>
      </div>
      <div className="mb">{children}</div>
      {footer && <div className="mf">{footer}</div>}
    </div>
  </div>
);

// ─── CONFIRM ─────────────────────────────────────────────────────────────────
const Confirm = ({ msg, onYes, onNo }) => (
  <div className="conf-overlay" onClick={onNo}>
    <div className="conf-box" onClick={e => e.stopPropagation()}>
      <div className="mt" style={{ marginBottom: 12 }}>Confirm</div>
      <div className="conf-msg">{msg}</div>
      <div className="conf-ftr">
        <button className="btn btn-s btn-sm" onClick={onNo}>Cancel</button>
        <button className="btn btn-d btn-sm" onClick={onYes}>Delete</button>
      </div>
    </div>
  </div>
);

// ─── SKELETON ────────────────────────────────────────────────────────────────
const Sk = ({ w = "100%", h = 14, r = 5 }) => (
  <div className="sk" style={{ width: w, height: h, borderRadius: r }} />
);
const TblSk = ({ rows = 5 }) => (
  <div style={{ padding: 16 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="sk-row">
        {[40, "100%", 80, 70, 60].map((w, j) => <Sk key={j} w={w} h={12} />)}
      </div>
    ))}
  </div>
);

// ─── BADGE MAP ────────────────────────────────────────────────────────────────
const ORDER_BADGE = { PENDING: "bg-y", PROCESSING: "bg-b", COMPLETED: "bg-g", CANCELLED: "bg-r" };
const APPT_BADGE = { BOOKED: "bg-b", IN_PROGRESS: "bg-o", COMPLETED: "bg-g", CANCELLED: "bg-r" };
const ROLE_BADGE = { BRANCH_OWNER: "bg-b", EMPLOYEE: "bg-g", TECHNICIAN: "bg-p", CUSTOMER: "bg-y", MANAGER: "bg-o", COMPANY_OWNER: "bg-o" };

// ════════════════════════════════════════════════════════════════════════════
// 1 · DASHBOARD PAGE
// ════════════════════════════════════════════════════════════════════════════
const DashboardPage = ({ branchId, branchName }) => {
  const { data: revSummary } = useFetch(`/reports/revenue/summary?branchId=${branchId}`, [branchId]);
  const { data: pendingOrders } = useFetch(`/orders/count?branchId=${branchId}&status=PENDING`, [branchId]);
  const { data: todayAppts } = useFetch(`/appointments/today?branchId=${branchId}`, [branchId]);
  const { data: stockAlerts } = useFetch(`/inventory/alerts?branchId=${branchId}`, [branchId]);
  const { data: recentOrders } = useFetch(`/orders?branchId=${branchId}&limit=5&page=1`, [branchId]);
  const { data: chartData } = useFetch(`/reports/revenue/chart?branchId=${branchId}&period=7d`, [branchId]);

  const maxChart = chartData ? Math.max(...chartData.map(d => d.revenue || d._sum?.total || 0), 1) : 1;

  return (
    <div className="page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Branch Terminal</div>
          <div className="ptitle">{branchName || "LOCAL"} STATION</div>
          <div className="psub">Daily operations and branch monitoring</div>
        </div>
        <div className="live-pill"><span className="live-dot" />Station Active</div>
      </div>

      {/* KPI Cards */}
      <div className="sg">
        <div className="sc">
          <div className="sc-icon" style={{ background: "rgba(14,165,233,.12)", color: "var(--acc)" }}><Icon n="dollar" size={18} /></div>
          <div className="sc-label">Branch Revenue</div>
          <div className="sc-val">${((revSummary?.totalRevenue || 0) / 1000).toFixed(1)}K</div>
          <div className="sc-trend t-up">↑ All time</div>
          <div className="sc-glow" style={{ background: "var(--acc)" }} />
        </div>
        <div className="sc">
          <div className="sc-icon" style={{ background: "rgba(234,179,8,.12)", color: "var(--yellow)" }}><Icon n="clock" size={18} /></div>
          <div className="sc-label">Pending Orders</div>
          <div className="sc-val">{pendingOrders?.count ?? "—"}</div>
          <div className="sc-trend" style={{ color: "var(--yellow)" }}>Needs attention</div>
        </div>
        <div className="sc">
          <div className="sc-icon" style={{ background: "rgba(34,197,94,.12)", color: "var(--green)" }}><Icon n="appointments" size={18} /></div>
          <div className="sc-label">Today's Bookings</div>
          <div className="sc-val">{Array.isArray(todayAppts) ? todayAppts.length : "—"}</div>
          <div className="sc-trend t-up">Scheduled today</div>
        </div>
        <div className="sc">
          <div className="sc-icon" style={{ background: "rgba(239,68,68,.12)", color: "var(--red)" }}><Icon n="alert" size={18} /></div>
          <div className="sc-label">Low Stock Alerts</div>
          <div className="sc-val">{Array.isArray(stockAlerts) ? stockAlerts.length : "—"}</div>
          <div className="sc-trend t-dn">{Array.isArray(stockAlerts) && stockAlerts.length > 0 ? "Action required" : "Stock healthy"}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Revenue chart */}
        <div className="card ci">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
            <span>Revenue — Last 7 Days</span>
          </div>
          {!chartData ? <Sk h={140} r={8} /> : (
            <div className="bar-wrap">
              {chartData.map((d, i) => {
                const val = d.revenue || d._sum?.total || 0;
                const pct = (val / maxChart) * 100;
                return (
                  <div key={i} className="bar-col">
                    <div className="bar-vl">${(val / 1000).toFixed(1)}K</div>
                    <div className="bar-fill" style={{ height: `${Math.max(pct, 2)}%` }} />
                    <div className="bar-lb">{d.date ? new Date(d.date).toLocaleDateString("en", { weekday: "short" }) : `D${i + 1}`}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's appointments */}
        <div className="card ci">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Today's Appointments</div>
          {!todayAppts ? <TblSk rows={3} /> : Array.isArray(todayAppts) && todayAppts.length === 0
            ? <div className="empty"><Icon n="appointments" size={32} /><div className="empty-t">No bookings today</div></div>
            : (todayAppts || []).slice(0, 5).map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(14,165,233,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--acc)", flexShrink: 0 }}>
                  <Icon n="wrench" size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.service?.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{a.customer?.name} · {new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <span className={`badge ${APPT_BADGE[a.status] || "bg-b"}`}>{a.status}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Recent orders + Stock alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div style={{ padding: "18px 18px 0", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Recent Orders</div>
          {!recentOrders ? <TblSk rows={4} /> : (
            <table>
              <thead><tr><th>#</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {recentOrders?.data?.slice(0, 5).map(o => (
                  <tr key={o.id}>
                    <td><span style={{ fontFamily: "var(--font-m)", fontSize: 11, fontWeight: 700 }}>#{o.id}</span></td>
                    <td style={{ fontSize: 12 }}>{o.customer?.name || "—"}</td>
                    <td style={{ fontWeight: 700, color: "var(--acc)" }}>${o.total?.toFixed(2)}</td>
                    <td><span className={`badge ${ORDER_BADGE[o.status] || "bg-b"}`}>{o.status}</span></td>
                  </tr>
                ))}
                {recentOrders?.data?.length === 0 && <tr><td colSpan={4}><div className="empty"><Icon n="orders" /><div className="empty-t">No orders</div></div></td></tr>}
              </tbody>
            </table>
          )}
        </div>

        <div className="card ci">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Low Stock Alerts</div>
          {!stockAlerts ? <TblSk rows={3} /> : Array.isArray(stockAlerts) && stockAlerts.length === 0
            ? <div className="empty"><Icon n="check" size={32} /><div className="empty-t">All stock healthy</div></div>
            : (stockAlerts || []).slice(0, 6).map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.stock === 0 ? "var(--red)" : "var(--yellow)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.part?.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{item.part?.category}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-m)", fontSize: 14, fontWeight: 700, color: item.stock === 0 ? "var(--red)" : "var(--yellow)" }}>{item.stock}</div>
                  <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase" }}>alert ≤{item.alertAt}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 2 · ORDERS PAGE
// ════════════════════════════════════════════════════════════════════════════
const OrdersPage = ({ branchId }) => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const params = new URLSearchParams({ branchId, page, limit: 12, ...(status && { status }) }).toString();
  const { data, loading, refetch } = useFetch(`/orders?${params}`, [page, status, branchId]);
  const [updating, setUpdating] = useState(null);

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await apiFetch(`/orders/${id}/status`, { method: "PUT", body: { status: newStatus } });
      toast("Order status updated");
      refetch();
    } catch (e) { toast(e.message, "e"); }
    setUpdating(null);
  };

  const STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"];

  return (
    <div className="page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Operations</div>
          <div className="ptitle">ORDER QUEUE</div>
          <div className="psub">Live transaction stream · {data?.meta?.total || 0} total</div>
        </div>
        <div className="ph-r">
          <button className="btn btn-s btn-sm" onClick={() => window.location.reload()}><Icon n="refresh" /> Refresh</button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="tabs">
        {["", ...STATUSES].map(s => (
          <div key={s} className={`tab ${status === s ? "active" : ""}`} onClick={() => { setStatus(s); setPage(1); }}>
            {s || "All"}
          </div>
        ))}
      </div>

      <div className="tw">
        {loading ? <TblSk rows={8} /> : (
          <table>
            <thead><tr><th>Ref</th><th>Type</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th style={{ textAlign: "right" }}>Update</th></tr></thead>
            <tbody>
              {data?.data?.map(o => (
                <tr key={o.id}>
                  <td><span style={{ fontFamily: "var(--font-m)", fontSize: 11, fontWeight: 700 }}>#{o.id}</span></td>
                  <td><span className={`badge ${o.type === "ONLINE" ? "bg-b" : "bg-p"}`}>{o.type}</span></td>
                  <td style={{ fontSize: 12 }}>{o.customer?.name || "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--muted)" }}>{o.items?.length || 0} items</td>
                  <td style={{ fontWeight: 700, color: "var(--acc)" }}>${o.total?.toFixed(2)}</td>
                  <td><span className={`badge ${ORDER_BADGE[o.status] || "bg-b"}`}>{o.status}</span></td>
                  <td style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-m)" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="tda">
                      <select
                        value={o.status}
                        onChange={e => updateStatus(o.id, e.target.value)}
                        disabled={updating === o.id}
                        style={{ width: 130, padding: "5px 8px", fontSize: 11 }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {data?.data?.length === 0 && <tr><td colSpan={8}><div className="empty"><Icon n="orders" size={36} /><div className="empty-t">No orders found</div></div></td></tr>}
            </tbody>
          </table>
        )}
        <div className="pag">
          <div className="pag-info">Showing {data?.data?.length || 0} of {data?.meta?.total || 0}</div>
          <div className="pag-ctrl">
            <button className="pb" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="pb" disabled={page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 3 · INVENTORY PAGE
// ════════════════════════════════════════════════════════════════════════════
const InventoryPage = ({ branchId }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const ds = useDebounce(search);
  const params = new URLSearchParams({ branchId, page, limit: 20 }).toString();
  const { data, loading, refetch } = useFetch(`/inventory?${params}`, [page, branchId]);
  const [editing, setEditing] = useState(null); // { id, stock, alertAt }
  const [saving, setSaving] = useState(false);

  const filtered = (data?.data || []).filter(i =>
    !ds || i.part?.name?.toLowerCase().includes(ds.toLowerCase())
  );

  const quickEdit = async (id, delta) => {
    const item = (data?.data || []).find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock + delta);
    try {
      await apiFetch(`/inventory/${id}`, { method: "PUT", body: { stock: newStock, alertAt: item.alertAt } });
      toast(`Stock updated to ${newStock}`);
      refetch();
    } catch (e) { toast(e.message, "e"); }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiFetch(`/inventory/${editing.id}`, { method: "PUT", body: { stock: Number(editing.stock), alertAt: Number(editing.alertAt) } });
      toast("Inventory updated");
      setEditing(null); refetch();
    } catch (e) { toast(e.message, "e"); }
    setSaving(false);
  };

  return (
    <div className="page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Inventory</div>
          <div className="ptitle">STATION STOCK</div>
          <div className="psub">Local parts management · {data?.meta?.total || 0} SKUs tracked</div>
        </div>
        <div className="ph-r">
          <button className="btn btn-s btn-sm" onClick={refetch}><Icon n="refresh" /> Reconcile</button>
        </div>
      </div>

      <div className="fbar">
        <div className="sw"><Icon n="search" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search parts…" /></div>
      </div>

      {loading ? (
        <div className="inv-grid">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="sk" style={{ height: 160, borderRadius: 20 }} />)}</div>
      ) : (
        <div className="inv-grid">
          {filtered.map(item => (
            <div key={item.id} className={`inv-card ${item.stock <= item.alertAt ? "alert" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: item.stock <= item.alertAt ? "rgba(239,68,68,.12)" : "rgba(14,165,233,.08)", display: "flex", alignItems: "center", justifyContent: "center", color: item.stock <= item.alertAt ? "var(--red)" : "var(--acc)" }}>
                  <Icon n="inventory" size={14} />
                </div>
                {item.stock <= item.alertAt && <span className="badge bg-r" style={{ fontSize: 9 }}>LOW</span>}
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{item.part?.name}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>{item.part?.category}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>On Hand</div>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 26, lineHeight: 1, color: item.stock === 0 ? "var(--red)" : "inherit" }}>{item.stock}</div>
                </div>
                <div className="inv-ctrl">
                  <div className="inv-btn" onClick={() => quickEdit(item.id, -1)}>−</div>
                  <div className="inv-btn" onClick={() => quickEdit(item.id, +1)}>+</div>
                  <div className="inv-btn" onClick={() => setEditing({ id: item.id, stock: item.stock, alertAt: item.alertAt })} style={{ fontSize: 11 }}>⚙</div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 8 }}>Alert threshold: {item.alertAt}</div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty" style={{ gridColumn: "1/-1" }}><Icon n="inventory" size={36} /><div className="empty-t">No inventory records</div></div>}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div className="pag" style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)" }}>
          <div className="pag-info">Page {page} · {data?.meta?.total || 0} total items</div>
          <div className="pag-ctrl">
            <button className="pb" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="pb" disabled={page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {editing && (
        <Modal title="EDIT STOCK" onClose={() => setEditing(null)}
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-p btn-sm" onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </>}
        >
          <div className="fr">
            <div className="fg"><label>Current Stock</label><input type="number" min="0" value={editing.stock} onChange={e => setEditing(v => ({ ...v, stock: e.target.value }))} /></div>
            <div className="fg"><label>Alert Threshold</label><input type="number" min="0" value={editing.alertAt} onChange={e => setEditing(v => ({ ...v, alertAt: e.target.value }))} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 4 · PRODUCTS PAGE
// ════════════════════════════════════════════════════════════════════════════
const ProductsPage = ({ branchId }) => {
  const params = `branchId=${branchId}&limit=20&page=1`;
  const { data, loading, refetch } = useFetch(`/products?${params}`, [branchId]);
  const { data: partsData } = useFetch("/parts?limit=200");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", parts: [] });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm({ name: "", price: "", parts: [] }); setEditTarget(null); setShowModal(true); };
  const openEdit = p => { setForm({ name: p.name, price: p.price, parts: p.parts?.map(pp => ({ partId: pp.partId, quantity: pp.quantity })) || [] }); setEditTarget(p); setShowModal(true); };

  const addPart = () => setForm(f => ({ ...f, parts: [...f.parts, { partId: "", quantity: 1 }] }));
  const removePart = i => setForm(f => ({ ...f, parts: f.parts.filter((_, j) => j !== i) }));
  const updatePart = (i, key, val) => setForm(f => ({ ...f, parts: f.parts.map((p, j) => j === i ? { ...p, [key]: val } : p) }));

  const submit = async () => {
    if (!form.name || !form.price) return toast("Name and price required", "e");
    setSaving(true);
    try {
      const body = { name: form.name, price: parseFloat(form.price), branchId: Number(branchId), parts: form.parts.filter(p => p.partId).map(p => ({ partId: Number(p.partId), quantity: Number(p.quantity) || 1 })) };
      if (editTarget) { await apiFetch(`/products/${editTarget.id}`, { method: "PUT", body }); toast("Product updated"); }
      else { await apiFetch("/products", { method: "POST", body }); toast("Product created"); }
      setShowModal(false); refetch();
    } catch (e) { toast(e.message, "e"); }
    setSaving(false);
  };

  const remove = async id => {
    try { await apiFetch(`/products/${id}`, { method: "DELETE" }); toast("Product deleted"); refetch(); }
    catch (e) { toast(e.message, "e"); }
    setConfirmId(null);
  };

  return (
    <div className="page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Catalog</div>
          <div className="ptitle">MAINTENANCE KITS</div>
          <div className="psub">Branch products & spare bundles · {data?.meta?.total || 0} listed</div>
        </div>
        <div className="ph-r"><button className="btn btn-p" onClick={openAdd}><Icon n="plus" /> New Product</button></div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="sk" style={{ height: 200, borderRadius: 20 }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
          {(data?.data || []).map(p => (
            <div key={p.id} style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 20, transition: "all .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border2)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(14,165,233,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--acc)" }}>
                  <Icon n="tag" size={18} />
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button className="btn-ico" onClick={() => openEdit(p)}><Icon n="edit" size={13} /></button>
                  <button className="btn-ico dng" onClick={() => setConfirmId(p.id)}><Icon n="trash" size={13} /></button>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontFamily: "var(--font-d)", fontSize: 24, color: "var(--acc)", marginBottom: 8 }}>${parseFloat(p.price).toFixed(2)}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em" }}>{p.parts?.length || 0} component parts</div>
            </div>
          ))}
          {(data?.data || []).length === 0 && <div className="empty" style={{ gridColumn: "1/-1" }}><Icon n="products" size={36} /><div className="empty-t">No products yet</div><div className="empty-s">Create your first maintenance kit</div></div>}
        </div>
      )}

      {showModal && (
        <Modal title={editTarget ? "EDIT PRODUCT" : "NEW PRODUCT"} onClose={() => setShowModal(false)} wide
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-p btn-sm" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save Product"}</button>
          </>}
        >
          <div className="fr">
            <div className="fg"><label>Product Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Elite Road Bundle" /></div>
            <div className="fg"><label>Price (USD) *</label><input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" /></div>
          </div>
          <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)" }}>Component Parts</div>
          {form.parts.map((p, i) => (
            <div key={i} className="fr" style={{ marginBottom: 8, alignItems: "center" }}>
              <select value={p.partId} onChange={e => updatePart(i, "partId", e.target.value)}>
                <option value="">— Select Part —</option>
                {partsData?.data?.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="number" min="1" value={p.quantity} onChange={e => updatePart(i, "quantity", e.target.value)} placeholder="Qty" style={{ width: 70 }} />
                <button className="btn-ico dng" onClick={() => removePart(i)}><Icon n="trash" size={13} /></button>
              </div>
            </div>
          ))}
          <button className="btn btn-s btn-sm" style={{ marginTop: 6 }} onClick={addPart}><Icon n="plus" /> Add Part</button>
        </Modal>
      )}
      {confirmId && <Confirm msg="Delete this product?" onYes={() => remove(confirmId)} onNo={() => setConfirmId(null)} />}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 5 · SERVICES PAGE
// ════════════════════════════════════════════════════════════════════════════
const ServicesPage = ({ branchId }) => {
  const { data: services, loading, refetch } = useFetch(`/services?branchId=${branchId}`, [branchId]);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", branchId: "" });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm({ name: "", description: "", price: "", branchId }); setEditTarget(null); setShowModal(true); };
  const openEdit = s => { setForm({ name: s.name, description: s.description || "", price: s.price, branchId }); setEditTarget(s); setShowModal(true); };

  const submit = async () => {
    if (!form.name || !form.price) return toast("Name and price required", "e");
    setSaving(true);
    try {
      const body = { name: form.name, description: form.description, price: parseFloat(form.price), branchId: Number(branchId) };
      if (editTarget) { await apiFetch(`/services/${editTarget.id}`, { method: "PUT", body }); toast("Service updated"); }
      else { await apiFetch("/services", { method: "POST", body }); toast("Service created"); }
      setShowModal(false); refetch();
    } catch (e) { toast(e.message, "e"); }
    setSaving(false);
  };

  const remove = async id => {
    try { await apiFetch(`/services/${id}`, { method: "DELETE" }); toast("Service deleted"); refetch(); }
    catch (e) { toast(e.message, "e"); }
    setConfirmId(null);
  };

  return (
    <div className="page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Service Bay</div>
          <div className="ptitle">SERVICE PROTOCOLS</div>
          <div className="psub">Maintenance packages offered at this branch</div>
        </div>
        <div className="ph-r"><button className="btn btn-p" onClick={openAdd}><Icon n="plus" /> New Service</button></div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="sk" style={{ height: 160, borderRadius: 20 }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {(Array.isArray(services) ? services : []).map(s => (
            <div key={s.id} style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 22, transition: "all .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--acc)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(14,165,233,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--acc)" }}>
                  <Icon n="wrench" size={18} />
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button className="btn-ico" onClick={() => openEdit(s)}><Icon n="edit" size={13} /></button>
                  <button className="btn-ico dng" onClick={() => setConfirmId(s.id)}><Icon n="trash" size={13} /></button>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.name}</div>
              {s.description && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>{s.description}</div>}
              <div style={{ fontFamily: "var(--font-d)", fontSize: 28, color: "var(--green)" }}>${parseFloat(s.price).toFixed(2)}</div>
              <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".15em", marginTop: 6 }}>Standard turnaround: 24h</div>
            </div>
          ))}
          {(Array.isArray(services) ? services : []).length === 0 && <div className="empty" style={{ gridColumn: "1/-1" }}><Icon n="wrench" size={36} /><div className="empty-t">No services defined</div></div>}
        </div>
      )}

      {showModal && (
        <Modal title={editTarget ? "EDIT SERVICE" : "NEW SERVICE"} onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-p btn-sm" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save Service"}</button>
          </>}
        >
          <div className="fg"><label>Service Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Full Service Tune-Up" /></div>
          <div className="fg"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this service include?" /></div>
          <div className="fg"><label>Price (USD) *</label><input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" /></div>
        </Modal>
      )}
      {confirmId && <Confirm msg="Remove this service protocol?" onYes={() => remove(confirmId)} onNo={() => setConfirmId(null)} />}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 6 · APPOINTMENTS PAGE
// ════════════════════════════════════════════════════════════════════════════
const AppointmentsPage = ({ branchId }) => {
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);
  const [statusF, setStatusF] = useState("");
  const params = new URLSearchParams({ branchId, page, limit: 12, ...(statusF && { status: statusF }) }).toString();
  const { data, loading, refetch } = useFetch(`/appointments?${params}`, [page, statusF, branchId]);
  const { data: employees } = useFetch(`/branches/${branchId}`, [branchId]);
  const [editAppt, setEditAppt] = useState(null);
  const [saving, setSaving] = useState(false);

  const technicianList = (employees?.users || []).filter(u => u.role === "TECHNICIAN");
  const APPT_STATUSES = ["BOOKED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  const updateAppt = async () => {
    if (!editAppt) return;
    setSaving(true);
    try {
      await apiFetch(`/appointments/${editAppt.id}`, { method: "PUT", body: { status: editAppt.status, techId: editAppt.techId ? Number(editAppt.techId) : undefined } });
      toast("Appointment updated");
      setEditAppt(null); refetch();
    } catch (e) { toast(e.message, "e"); }
    setSaving(false);
  };

  // Build a mini calendar day-dot map from current data
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const apptDays = new Set((data?.data || []).map(a => new Date(a.scheduledAt).getDate()));

  return (
    <div className="page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Bookings</div>
          <div className="ptitle">SERVICE BAY</div>
          <div className="psub">Managing technical appointments · {data?.meta?.total || 0} total</div>
        </div>
        <div className="ph-r">
          <div className="tabs" style={{ marginBottom: 0 }}>
            {["list", "calendar"].map(v => <div key={v} className={`tab ${view === v ? "active" : ""}`} onClick={() => setView(v)}>{v === "list" ? "List" : "Calendar"}</div>)}
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div className="fbar">
        {["", ...APPT_STATUSES].map(s => (
          <button key={s} className={`btn btn-sm ${statusF === s ? "btn-p" : "btn-s"}`} onClick={() => { setStatusF(s); setPage(1); }}>
            {s || "All"}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <div className="tw">
          {loading ? <TblSk rows={8} /> : (
            <table>
              <thead><tr><th>Service</th><th>Customer</th><th>Technician</th><th>Scheduled</th><th>Status</th><th style={{ textAlign: "right" }}>Manage</th></tr></thead>
              <tbody>
                {data?.data?.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.service?.name}</td>
                    <td style={{ fontSize: 12 }}>{a.customer?.name}</td>
                    <td style={{ fontSize: 12, color: a.technician ? "inherit" : "var(--muted)" }}>{a.technician?.name || "Unassigned"}</td>
                    <td style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-m)" }}>
                      {new Date(a.scheduledAt).toLocaleDateString()} {new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td><span className={`badge ${APPT_BADGE[a.status] || "bg-b"}`}>{a.status}</span></td>
                    <td>
                      <div className="tda">
                        <button className="btn-ico act" onClick={() => setEditAppt({ id: a.id, status: a.status, techId: a.techId || "" })}><Icon n="edit" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && <tr><td colSpan={6}><div className="empty"><Icon n="appointments" size={36} /><div className="empty-t">No appointments</div></div></td></tr>}
              </tbody>
            </table>
          )}
          <div className="pag">
            <div className="pag-info">Showing {data?.data?.length || 0} of {data?.meta?.total || 0}</div>
            <div className="pag-ctrl">
              <button className="pb" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="pb" disabled={page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card ci">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--font-d)", fontSize: 28, letterSpacing: ".05em" }}>
              {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em" }}>{d}</div>
            ))}
          </div>
          <div className="cal-grid">
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate();
              const hasAppt = apptDays.has(day);
              return (
                <div key={day} className={`cal-day ${isToday ? "today" : ""}`}>
                  {day}
                  {hasAppt && <div className="dot" />}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, background: "var(--acc)", borderRadius: "50%" }} /> Blue dots indicate appointment days
          </div>
        </div>
      )}

      {editAppt && (
        <Modal title="UPDATE APPOINTMENT" onClose={() => setEditAppt(null)}
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setEditAppt(null)}>Cancel</button>
            <button className="btn btn-p btn-sm" onClick={updateAppt} disabled={saving}>{saving ? "Saving…" : "Update"}</button>
          </>}
        >
          <div className="fg"><label>Status</label>
            <select value={editAppt.status} onChange={e => setEditAppt(v => ({ ...v, status: e.target.value }))}>
              {APPT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="fg"><label>Assign Technician</label>
            <select value={editAppt.techId} onChange={e => setEditAppt(v => ({ ...v, techId: e.target.value }))}>
              <option value="">— Unassigned —</option>
              {technicianList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 7 · SUPPLIERS PAGE
// ════════════════════════════════════════════════════════════════════════════
const SuppliersPage = ({ branchId }) => {
  const { data: suppliers, loading, refetch } = useFetch("/suppliers");
  const { data: partsData } = useFetch("/parts?limit=200");
  const [showSupModal, setShowSupModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(null); // supplier object
  const [supForm, setSupForm] = useState({ name: "", contact: "" });
  const [poForm, setPoForm] = useState({ items: [{ partId: "", quantity: 1, cost: "" }] });
  const [saving, setSaving] = useState(false);

  const submitSupplier = async () => {
    if (!supForm.name || !supForm.contact) return toast("Name and contact required", "e");
    setSaving(true);
    try {
      await apiFetch("/suppliers", { method: "POST", body: supForm });
      toast("Supplier registered");
      setShowSupModal(false); refetch();
    } catch (e) { toast(e.message, "e"); }
    setSaving(false);
  };

  const addPOItem = () => setPoForm(f => ({ ...f, items: [...f.items, { partId: "", quantity: 1, cost: "" }] }));
  const removePOItem = i => setPoForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }));
  const updatePOItem = (i, key, val) => setPoForm(f => ({ ...f, items: f.items.map((it, j) => j === i ? { ...it, [key]: val } : it) }));

  const submitPO = async () => {
    const items = poForm.items.filter(i => i.partId && i.cost);
    if (!items.length) return toast("Add at least one item", "e");
    setSaving(true);
    try {
      const total = items.reduce((acc, i) => acc + parseFloat(i.cost) * parseInt(i.quantity || 1), 0);
      await apiFetch("/purchases", {
        method: "POST", body: {
          supplierId: showPOModal.id,
          branchId: Number(branchId),
          total,
          items: items.map(i => ({ partId: Number(i.partId), quantity: Number(i.quantity) || 1, cost: parseFloat(i.cost) }))
        }
      });
      toast("Purchase order created");
      setShowPOModal(null);
    } catch (e) { toast(e.message, "e"); }
    setSaving(false);
  };

  return (
    <div className="page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Supply Chain</div>
          <div className="ptitle">SUPPLIERS</div>
          <div className="psub">Authorized part providers · {(Array.isArray(suppliers) ? suppliers : []).length} registered</div>
        </div>
        <div className="ph-r"><button className="btn btn-p" onClick={() => setShowSupModal(true)}><Icon n="plus" /> Register Supplier</button></div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="sk" style={{ height: 160, borderRadius: 20 }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {(Array.isArray(suppliers) ? suppliers : []).map(s => (
            <div key={s.id} style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 22, transition: "border-color .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border2)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(234,179,8,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--yellow)", marginBottom: 14 }}>
                <Icon n="truck" size={18} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>{s.contact}</div>
              <button className="btn btn-s btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => { setPoForm({ items: [{ partId: "", quantity: 1, cost: "" }] }); setShowPOModal(s); }}>
                <Icon n="truck" /> Create Purchase Order
              </button>
            </div>
          ))}
          {(Array.isArray(suppliers) ? suppliers : []).length === 0 && (
            <div className="empty" style={{ gridColumn: "1/-1" }}><Icon n="truck" size={36} /><div className="empty-t">No suppliers registered</div></div>
          )}
        </div>
      )}

      {showSupModal && (
        <Modal title="REGISTER SUPPLIER" onClose={() => setShowSupModal(false)}
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setShowSupModal(false)}>Cancel</button>
            <button className="btn btn-p btn-sm" onClick={submitSupplier} disabled={saving}>{saving ? "Saving…" : "Register"}</button>
          </>}
        >
          <div className="fg"><label>Company Name *</label><input value={supForm.name} onChange={e => setSupForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. ProCycle Parts Ltd." /></div>
          <div className="fg"><label>Contact (Phone / Email) *</label><input value={supForm.contact} onChange={e => setSupForm(f => ({ ...f, contact: e.target.value }))} placeholder="e.g. +1 555 0123" /></div>
        </Modal>
      )}

      {showPOModal && (
        <Modal title={`PURCHASE ORDER — ${showPOModal.name}`} onClose={() => setShowPOModal(null)} wide
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setShowPOModal(null)}>Cancel</button>
            <button className="btn btn-p btn-sm" onClick={submitPO} disabled={saving}>{saving ? "Creating…" : "Create PO"}</button>
          </>}
        >
          <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)" }}>Order Items</div>
          {poForm.items.map((item, i) => (
            <div key={i} className="fr3" style={{ marginBottom: 8, alignItems: "center" }}>
              <select value={item.partId} onChange={e => updatePOItem(i, "partId", e.target.value)}>
                <option value="">— Part —</option>
                {partsData?.data?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" min="1" value={item.quantity} onChange={e => updatePOItem(i, "quantity", e.target.value)} placeholder="Qty" />
              <div style={{ display: "flex", gap: 6 }}>
                <input type="number" min="0" step="0.01" value={item.cost} onChange={e => updatePOItem(i, "cost", e.target.value)} placeholder="Unit cost" />
                <button className="btn-ico dng" onClick={() => removePOItem(i)}><Icon n="trash" size={13} /></button>
              </div>
            </div>
          ))}
          <button className="btn btn-s btn-sm" style={{ marginTop: 6 }} onClick={addPOItem}><Icon n="plus" /> Add Item</button>
          {poForm.items.some(i => i.cost && i.quantity) && (
            <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--surf2)", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700 }}>
              Total: ${poForm.items.reduce((acc, i) => acc + (parseFloat(i.cost) || 0) * (parseInt(i.quantity) || 1), 0).toFixed(2)}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 8 · EMPLOYEES PAGE
// ════════════════════════════════════════════════════════════════════════════
const EmployeesPage = ({ branchId }) => {
  const { data: branchDetail, loading, refetch: refetchBranch } = useFetch(`/branches/${branchId}`, [branchId]);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const employees = (branchDetail?.users || []).filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm({ name: "", email: "", password: "", role: "EMPLOYEE" }); setEditTarget(null); setShowModal(true); };
  const openEdit = u => { setForm({ name: u.name, email: u.email || "", password: "", role: u.role }); setEditTarget(u); setShowModal(true); };

  const submit = async () => {
    if (!form.name || !form.email) return toast("Name and email required", "e");
    if (!editTarget && !form.password) return toast("Password required", "e");
    setSaving(true);
    try {
      if (editTarget) {
        await apiFetch(`/users/${editTarget.id}`, { method: "PUT", body: { name: form.name, email: form.email, role: form.role, branchId: Number(branchId) } });
        toast("Employee updated");
      } else {
        await apiFetch("/users", { method: "POST", body: { name: form.name, email: form.email, password: form.password, role: form.role, branchId: Number(branchId) } });
        toast("Employee added");
      }
      setShowModal(false); refetchBranch();
    } catch (e) { toast(e.message, "e"); }
    setSaving(false);
  };

  const remove = async id => {
    try { await apiFetch(`/users/${id}`, { method: "DELETE" }); toast("Employee removed"); refetchBranch(); }
    catch (e) { toast(e.message, "e"); }
    setConfirmId(null);
  };

  const ROLES = ["EMPLOYEE", "TECHNICIAN", "MANAGER"];

  return (
    <div className="page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Personnel</div>
          <div className="ptitle">LOCAL STAFF</div>
          <div className="psub">Branch employees and technicians · {(branchDetail?.users || []).length} total</div>
        </div>
        <div className="ph-r"><button className="btn btn-p" onClick={openAdd}><Icon n="plus" /> Onboard Staff</button></div>
      </div>

      <div className="fbar">
        <div className="sw"><Icon n="search" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or role…" /></div>
      </div>

      <div className="tw">
        {loading ? <TblSk rows={6} /> : (
          <table>
            <thead><tr><th>Employee</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              {employees.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `hsl(${u.id * 47 % 360},35%,20%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${ROLE_BADGE[u.role] || "bg-b"}`}>{u.role.replace("_", " ")}</span></td>
                  <td>
                    <div className="tda">
                      <button className="btn-ico" onClick={() => openEdit(u)}><Icon n="edit" size={13} /></button>
                      <button className="btn-ico dng" onClick={() => setConfirmId(u.id)}><Icon n="trash" size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && <tr><td colSpan={3}><div className="empty"><Icon n="employees" size={36} /><div className="empty-t">No staff found</div></div></td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editTarget ? "EDIT EMPLOYEE" : "ONBOARD STAFF"} onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-p btn-sm" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </>}
        >
          <div className="fr">
            <div className="fg"><label>Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="fg"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          {!editTarget && <div className="fg"><label>Password *</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>}
          <div className="fg"><label>Role *</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </Modal>
      )}
      {confirmId && <Confirm msg="Remove this employee from the branch?" onYes={() => remove(confirmId)} onNo={() => setConfirmId(null)} />}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 9 · REPORTS PAGE
// ════════════════════════════════════════════════════════════════════════════
const ReportsPage = ({ branchId }) => {
  const [period, setPeriod] = useState("7d");
  const { data: summary, loading: sl } = useFetch(`/reports/revenue/summary?branchId=${branchId}`, [branchId]);
  const { data: chart } = useFetch(`/reports/revenue/chart?branchId=${branchId}&period=${period}`, [branchId, period]);
  const { data: branchReport } = useFetch(`/reports/branch/${branchId}`, [branchId]);
  const { data: sales } = useFetch(`/reports/sales/${branchId}`, [branchId]);

  const maxChart = chart ? Math.max(...chart.map(d => d.revenue || d._sum?.total || 0), 1) : 1;

  return (
    <div className="page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Analytics</div>
          <div className="ptitle">LOCAL INTEL</div>
          <div className="psub">Performance metrics and sales breakdown for this branch</div>
        </div>
        <div className="ph-r">
          <div className="tabs" style={{ marginBottom: 0 }}>
            {["7d", "30d"].map(p => <div key={p} className={`tab ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>{p === "7d" ? "7 Days" : "30 Days"}</div>)}
          </div>
          <button className="btn btn-s btn-sm"><Icon n="download" /> Export</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="sg" style={{ marginBottom: 20 }}>
        <div className="sc">
          <div className="sc-label">Total Revenue</div>
          <div className="sc-val">{sl ? "—" : `$${((summary?.totalRevenue || 0) / 1000).toFixed(1)}K`}</div>
          <div className="sc-trend t-up">All time</div>
        </div>
        <div className="sc">
          <div className="sc-label">Total Orders</div>
          <div className="sc-val">{sl ? "—" : summary?.totalOrders || 0}</div>
        </div>
        <div className="sc">
          <div className="sc-label">Avg Order Value</div>
          <div className="sc-val">{sl ? "—" : `$${(summary?.avgOrderValue || 0).toFixed(0)}`}</div>
        </div>
        <div className="sc">
          <div className="sc-label">Completed</div>
          <div className="sc-val">{sl ? "—" : summary?.completedOrders || 0}</div>
          <div className="sc-trend t-up">Fulfilled</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Revenue chart */}
        <div className="card ci">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
            <span>Revenue Trend ({period})</span>
          </div>
          {!chart ? <Sk h={140} r={8} /> : (
            <div className="bar-wrap">
              {chart.map((d, i) => {
                const val = d.revenue || d._sum?.total || 0;
                const pct = (val / maxChart) * 100;
                return (
                  <div key={i} className="bar-col">
                    <div className="bar-vl">${(val / 1000).toFixed(1)}K</div>
                    <div className="bar-fill" style={{ height: `${Math.max(pct, 2)}%` }} />
                    <div className="bar-lb">{d.date ? new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" }) : `D${i + 1}`}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Branch report stats */}
        <div className="card ci">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Branch Breakdown</div>
          {!branchReport ? <Sk h={140} r={8} /> : (
            <div>
              {[
                { label: "Total Orders", val: branchReport.totalOrders || 0 },
                { label: "Completed Orders", val: branchReport.completedOrders || 0 },
                { label: "Pending Orders", val: branchReport.pendingOrders || 0 },
                { label: "Revenue", val: `$${(branchReport.revenue || 0).toFixed(2)}` },
                { label: "Appointments", val: branchReport.totalAppointments || 0 },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--acc)" }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sales table */}
      {sales && (
        <div className="card">
          <div style={{ padding: "18px 18px 0", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Sales Breakdown</div>
          <table>
            <thead><tr><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {(Array.isArray(sales) ? sales : []).map((s, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{s.productName || s.name || `Item ${i + 1}`}</td>
                  <td style={{ fontFamily: "var(--font-m)", fontSize: 12 }}>{s.quantity || s.units || "—"}</td>
                  <td style={{ fontWeight: 700, color: "var(--acc)" }}>${(s.revenue || s.total || 0).toFixed(2)}</td>
                </tr>
              ))}
              {(Array.isArray(sales) ? sales : []).length === 0 && (
                <tr><td colSpan={3}><div className="empty"><Icon n="reports" size={32} /><div className="empty-t">No sales data</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};



// ════════════════════════════════════════════════════════════════════════════
// SIDEBAR NAV CONFIG
// ════════════════════════════════════════════════════════════════════════════
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", section: "Overview" },
  { id: "orders", label: "Order Queue", icon: "orders", section: "Operations" },
  { id: "inventory", label: "Inventory", icon: "inventory", section: "Operations" },
  { id: "products", label: "Products", icon: "products", section: "Operations" },
  { id: "services", label: "Services", icon: "services", section: "Service Bay" },
  { id: "appointments", label: "Appointments", icon: "appointments", section: "Service Bay" },
  { id: "suppliers", label: "Suppliers", icon: "suppliers", section: "Procurement" },
  { id: "employees", label: "Staff", icon: "employees", section: "Admin" },
  { id: "reports", label: "Reports", icon: "reports", section: "Admin" },
];

// ════════════════════════════════════════════════════════════════════════════
// APP SHELL
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      apiFetch("/auth/me")
        .then(r => setUser(r.user))
        .catch(() => localStorage.removeItem(TOKEN_KEY))
        .finally(() => setChecked(true));
    } else {
      setChecked(true);
    }
  }, []);

  const logout = () => { localStorage.removeItem(TOKEN_KEY); setUser(null); };

  // Loading spinner
  if (!checked) return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--acc)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      </div>
    </>
  );

  // Login wall
  if (!user) return (
    <>
      <style>{STYLES}</style>
      <LoginPage onLogin={u => { setUser(u); setPage("dashboard"); }} />
      <ToastContainer />
    </>
  );

  const branchId = user.branchId;
  const branchName = user.branchName || `Branch #${branchId}`;
  const sections = [...new Set(NAV.map(n => n.section))];
  const current = NAV.find(n => n.id === page);

  const PAGES = {
    dashboard: <DashboardPage branchId={branchId} branchName={branchName} />,
    orders: <OrdersPage branchId={branchId} />,
    inventory: <InventoryPage branchId={branchId} />,
    products: <ProductsPage branchId={branchId} />,
    services: <ServicesPage branchId={branchId} />,
    appointments: <AppointmentsPage branchId={branchId} />,
    suppliers: <SuppliersPage branchId={branchId} />,
    employees: <EmployeesPage branchId={branchId} />,
    reports: <ReportsPage branchId={branchId} />,
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="shell">

        {/* ── Sidebar ── */}
        <aside className="sb">
          <div className="sb-brand">
            <div className="sb-mark">CE</div>
            <div>
              <div className="sb-name">CROWN <span>EVE</span></div>
              <div className="sb-sub">Branch Portal</div>
            </div>
          </div>

          <nav style={{ flex: 1 }}>
            {sections.map(sec => (
              <div key={sec}>
                <div className="sb-sec">{sec}</div>
                {NAV.filter(n => n.section === sec).map(n => (
                  <div key={n.id} className={`sb-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
                    <Icon n={n.icon} size={16} />
                    <span>{n.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </nav>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div className="sb-user">
              <div className="sb-avatar">{user.name?.[0]?.toUpperCase()}</div>
              <div>
                <div className="sb-uname">{user.name}</div>
                <div className="sb-urole">Branch Owner</div>
              </div>
            </div>
            <div className="sb-item" style={{ color: "var(--red)", marginTop: 6 }} onClick={logout}>
              <Icon n="logout" size={15} /><span>Logout</span>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main">
          <div className="topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="topbar-title">{current?.label?.toUpperCase()}</div>
              {branchName && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".15em", paddingLeft: 10, borderLeft: "1px solid var(--border)" }}>
                  {branchName}
                </span>
              )}
            </div>
            <div className="topbar-right">
              <div className="live-pill"><span className="live-dot" />Live</div>
            </div>
          </div>

          {PAGES[page] || <DashboardPage branchId={branchId} branchName={branchName} />}
        </main>

      </div>
      <ToastContainer />
    </>
  );
}
