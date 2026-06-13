import { useState, useCallback, useMemo, memo } from "react";

/* ─────────────────────────────────────────────
   GLOBAL STYLES (injected once)
───────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@300;400;500;600&family=Bebas+Neue&family=JetBrains+Mono:wght@400;500&display=swap');
    :root {
      --orange:#FF4D00;--orange2:#FF6B2B;--og:rgba(255,77,0,0.12);
      --black:#0A0A0A;--black2:#111111;--black3:#161616;
      --card:#1A1A1A;--card2:#202020;
      --border:rgba(255,255,255,0.07);--border2:rgba(255,77,0,0.2);
      --muted:#666;--muted2:#888;
      --white:#F0EFE8;--white2:#B8B7B0;
      --green:#22C55E;--gbg:rgba(34,197,94,0.1);
      --red:#EF4444;--rbg:rgba(239,68,68,0.1);
      --blue:#3B82F6;--bbg:rgba(59,130,246,0.1);
      --amber:#F59E0B;--abg:rgba(245,158,11,0.1);
      --nav:64px;
    }
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:var(--black);color:var(--white);font-family:'Barlow',sans-serif;overflow-x:hidden}
    ::-webkit-scrollbar{width:3px;height:3px}
    ::-webkit-scrollbar-track{background:var(--black2)}
    ::-webkit-scrollbar-thumb{background:rgba(255,77,0,0.4)}
    input,select,textarea,button{font-family:'Barlow',sans-serif}
    button{cursor:pointer}

    /* NAV */
    .cnav{position:fixed;top:0;left:0;right:0;height:var(--nav);background:rgba(10,10,10,0.95);backdrop-filter:blur(18px);border-bottom:1px solid var(--border);z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 5vw}
    .cnav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;cursor:pointer}
    .logo-hex{width:32px;height:32px;background:var(--orange);clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:12px;color:#fff;flex-shrink:0}
    .logo-txt{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;letter-spacing:2px;text-transform:uppercase}
    .logo-txt em{color:var(--orange);font-style:normal}
    .cnav-links{display:flex;align-items:center;gap:4px}
    .cnl{padding:7px 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted2);background:transparent;border:none;border-radius:4px;cursor:pointer;transition:all .2s}
    .cnl:hover{color:var(--white);background:rgba(255,255,255,0.04)}
    .cnl.active{color:var(--orange);background:rgba(255,77,0,0.08)}
    .cnav-right{display:flex;align-items:center;gap:10px}
    .cart-btn{position:relative;display:flex;align-items:center;gap:7px;padding:7px 16px;background:rgba(255,77,0,0.1);border:1px solid var(--border2);border-radius:4px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--orange);cursor:pointer;transition:all .2s}
    .cart-btn:hover{background:rgba(255,77,0,0.18)}
    .cart-count{position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:var(--orange);border-radius:50%;font-size:10px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center}
    .user-pill{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;background:var(--card);border:1px solid var(--border);border-radius:99px;cursor:pointer;transition:border-color .2s}
    .user-pill:hover{border-color:var(--border2)}
    .ua{width:28px;height:28px;background:var(--orange);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;color:#fff}
    .user-name-pill{font-size:12px;font-weight:600}

    /* LAYOUT */
    .main-wrap{padding-top:var(--nav);min-height:100vh}
    .page-wrap{max-width:1280px;margin:0 auto;padding:32px 5vw}

    /* CARDS */
    .card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:22px}
    .card:hover{border-color:rgba(255,77,0,0.1)}
    .ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
    .ct{font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--white2)}
    .ca{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--orange);cursor:pointer;border:none;background:none}
    .ca:hover{opacity:.75}

    /* BUTTONS */
    .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border:none;transition:all .18s;border-radius:4px}
    .btn-primary{background:var(--orange);color:#fff}
    .btn-primary:hover{background:var(--orange2);transform:translateY(-1px)}
    .btn-ghost{background:transparent;color:var(--white2);border:1px solid var(--border)}
    .btn-ghost:hover{border-color:var(--border2);color:var(--white)}
    .btn-danger{background:var(--rbg);color:var(--red);border:1px solid rgba(239,68,68,0.2)}
    .btn-danger:hover{background:rgba(239,68,68,0.18)}
    .btn-sm{padding:6px 14px;font-size:11px}
    .btn-xs{padding:4px 10px;font-size:10px}

    /* BADGES */
    .badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase}
    .bg-g{background:var(--gbg);color:var(--green)}
    .bg-r{background:var(--rbg);color:var(--red)}
    .bg-a{background:var(--abg);color:var(--amber)}
    .bg-b{background:var(--bbg);color:var(--blue)}
    .bg-gray{background:rgba(255,255,255,0.07);color:var(--white2)}
    .bg-o{background:rgba(255,77,0,0.12);color:var(--orange)}

    /* FORMS */
    .fg{margin-bottom:14px}
    .fg label{display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted2);margin-bottom:7px}
    .fi{width:100%;background:var(--black3);border:1px solid var(--border);color:var(--white);padding:10px 13px;font-family:'Barlow',sans-serif;font-size:13px;outline:none;transition:border-color .2s;border-radius:4px}
    .fi:focus{border-color:var(--orange)}
    .fs{width:100%;background:var(--black3);border:1px solid var(--border);color:var(--white);padding:10px 13px;font-family:'Barlow',sans-serif;font-size:13px;outline:none;transition:border-color .2s;border-radius:4px;-webkit-appearance:none;cursor:pointer}
    .fs:focus{border-color:var(--orange)}
    .fs option{background:var(--black3)}
    .ft{width:100%;background:var(--black3);border:1px solid var(--border);color:var(--white);padding:10px 13px;font-family:'Barlow',sans-serif;font-size:13px;outline:none;transition:border-color .2s;border-radius:4px;resize:vertical;min-height:90px}
    .ft:focus{border-color:var(--orange)}
    .fgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .fhint{font-size:11px;color:var(--muted);margin-top:4px}

    /* TABLES */
    .tbl{width:100%;border-collapse:collapse}
    .tbl th{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);padding:0 14px 12px;text-align:left;border-bottom:1px solid var(--border)}
    .tbl td{padding:13px 14px;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.04);color:var(--white2);vertical-align:middle}
    .tbl tr:last-child td{border-bottom:none}
    .tbl tbody tr:hover td{background:rgba(255,255,255,0.018)}
    .tm{font-size:13px;font-weight:600;color:var(--white);margin-bottom:1px}
    .ts{font-size:11px;color:var(--muted2)}
    .mono{font-family:'JetBrains Mono',monospace;font-size:11px}

    /* STATS */
    .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
    .stat{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:20px 22px;position:relative;overflow:hidden;transition:border-color .25s}
    .stat:hover{border-color:rgba(255,77,0,0.18)}
    .stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--orange);transform:scaleX(0);transition:transform .3s;transform-origin:left}
    .stat:hover::before{transform:scaleX(1)}
    .sl{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted2);margin-bottom:10px}
    .sv{font-family:'Bebas Neue',sans-serif;font-size:40px;line-height:1;letter-spacing:-1px;margin-bottom:7px}
    .sc{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:3px 8px;border-radius:99px}
    .si{position:absolute;top:16px;right:16px;font-size:24px;opacity:.1}
    .up{background:var(--gbg);color:var(--green)}
    .neu{background:rgba(255,255,255,0.06);color:var(--white2)}

    /* GRIDS */
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
    .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
    .g73{display:grid;grid-template-columns:2fr 1fr;gap:16px}
    .g64{display:grid;grid-template-columns:1.5fr 1fr;gap:16px}

    /* FILTER BAR */
    .fbar{display:flex;align-items:center;gap:8px;margin-bottom:18px;flex-wrap:wrap}
    .fpill{padding:6px 14px;background:transparent;border:1px solid var(--border);border-radius:99px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted2);cursor:pointer;transition:all .18s;outline:none}
    .fpill:hover{border-color:var(--border2);color:var(--white)}
    .fpill.on{background:rgba(255,77,0,0.1);border-color:var(--orange);color:var(--orange)}
    .fsearch{display:flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--border);border-radius:5px;padding:0 12px;height:34px;margin-left:auto;transition:border-color .2s}
    .fsearch:focus-within{border-color:var(--border2)}
    .fsearch input{background:transparent;border:none;outline:none;color:var(--white);font-size:12px;width:160px}
    .fsearch input::placeholder{color:var(--muted)}

    /* TABS */
    .tabs{display:flex;border-bottom:1px solid var(--border);margin-bottom:22px}
    .tab{padding:11px 18px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;color:var(--muted2);border:none;background:none;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .2s}
    .tab:hover{color:var(--white)}
    .tab.on{color:var(--orange);border-bottom-color:var(--orange)}

    /* MODAL */
    .mov{position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);padding:20px}
    .modal{background:var(--card);border:1px solid var(--border);border-radius:9px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;position:relative}
    .modal-bar{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(to right,transparent,var(--orange),transparent);border-radius:9px 9px 0 0}
    .mhd{padding:22px 26px 0;display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
    .mt{font-family:'Barlow Condensed',sans-serif;font-size:21px;font-weight:700;letter-spacing:1px;text-transform:uppercase}
    .mx{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:var(--card2);border:1px solid var(--border);border-radius:4px;cursor:pointer;font-size:14px;color:var(--muted2);transition:all .2s;border:none}
    .mx:hover{color:var(--red)}
    .mbd{padding:0 26px 26px}

    /* ALERT */
    .alert{padding:11px 14px;border-radius:5px;font-size:12px;display:flex;align-items:center;gap:9px;margin-bottom:14px}
    .alert-w{background:var(--abg);border:1px solid rgba(245,158,11,0.22);color:var(--amber)}
    .alert-ok{background:var(--gbg);border:1px solid rgba(34,197,94,0.22);color:var(--green)}
    .alert-info{background:var(--bbg);border:1px solid rgba(59,130,246,0.22);color:var(--blue)}

    /* TRACKING TIMELINE */
    .timeline{display:flex;flex-direction:column;gap:0;position:relative}
    .tl-item{display:flex;gap:16px;position:relative;padding-bottom:24px}
    .tl-item:last-child{padding-bottom:0}
    .tl-left{display:flex;flex-direction:column;align-items:center;width:32px;flex-shrink:0}
    .tl-dot{width:12px;height:12px;border-radius:50%;border:2px solid var(--border);background:var(--card);flex-shrink:0;position:relative;z-index:1}
    .tl-dot.done{background:var(--orange);border-color:var(--orange)}
    .tl-dot.active{background:var(--orange);border-color:var(--orange);box-shadow:0 0 0 4px rgba(255,77,0,0.2)}
    .tl-line{flex:1;width:1px;background:var(--border);margin-top:3px}
    .tl-line.done{background:var(--orange)}
    .tl-content{flex:1;padding-top:0}
    .tl-title{font-size:13px;font-weight:600;color:var(--white);margin-bottom:2px}
    .tl-date{font-size:11px;color:var(--muted2)}

    /* PRODUCT CARD */
    .prod-card{background:var(--card);border:1px solid var(--border);border-radius:8px;overflow:hidden;transition:all .25s;cursor:pointer}
    .prod-card:hover{border-color:var(--border2);transform:translateY(-2px)}
    .prod-img{aspect-ratio:4/3;background:var(--black3);display:flex;align-items:center;justify-content:center;font-size:36px;position:relative;overflow:hidden}
    .prod-img::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(10,10,10,0.6),transparent);opacity:0;transition:opacity .3s}
    .prod-card:hover .prod-img::after{opacity:1}
    .prod-body{padding:16px}
    .prod-cat{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--orange);margin-bottom:6px}
    .prod-name{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;letter-spacing:.3px;margin-bottom:4px}
    .prod-spec{font-size:12px;color:var(--muted2);margin-bottom:12px}
    .prod-footer{display:flex;align-items:center;justify-content:space-between}
    .prod-price{font-family:'Bebas Neue',sans-serif;font-size:26px;color:var(--orange);letter-spacing:.5px}

    /* CART ITEM */
    .ci{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
    .ci:last-child{border-bottom:none}
    .ci-img{width:52px;height:52px;background:var(--black3);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
    .ci-name{font-size:13px;font-weight:600;color:var(--white)}
    .ci-sub{font-size:11px;color:var(--muted2);margin-top:1px}
    .qty-ctrl{display:flex;align-items:center;gap:8px;background:var(--card2);border:1px solid var(--border);border-radius:4px;padding:4px 10px}
    .qty-btn{background:none;border:none;color:var(--orange);font-size:16px;font-weight:700;cursor:pointer;padding:0 4px;line-height:1;transition:opacity .2s}
    .qty-btn:hover{opacity:.7}
    .qty-num{font-size:13px;font-weight:700;min-width:20px;text-align:center}

    /* SERVICE CARD */
    .svc-card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:20px;cursor:pointer;transition:all .2s}
    .svc-card:hover{border-color:var(--border2)}
    .svc-card.selected{border-color:var(--orange);background:rgba(255,77,0,0.05)}
    .svc-icon{font-size:26px;margin-bottom:12px}
    .svc-name{font-family:'Barlow Condensed',sans-serif;font-size:19px;font-weight:700;letter-spacing:.3px;margin-bottom:4px}
    .svc-desc{font-size:12px;color:var(--muted2);line-height:1.6;margin-bottom:12px}
    .svc-price{font-family:'Bebas Neue',sans-serif;font-size:24px;color:var(--orange)}
    .svc-dur{font-size:11px;color:var(--muted);margin-top:2px}

    /* DATE/TIME BUTTONS */
    .date-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:20px}
    .date-btn{padding:10px 6px;border:1px solid var(--border);border-radius:5px;text-align:center;cursor:pointer;transition:all .2s;background:transparent}
    .date-btn:hover,.date-btn.on{border-color:var(--orange);background:rgba(255,77,0,0.08)}
    .dn{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
    .dd{font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--white);line-height:1}
    .date-btn.on .dd{color:var(--orange)}
    .date-btn.disabled{opacity:.3;cursor:not-allowed}
    .time-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:20px}
    .time-btn{padding:10px 6px;border:1px solid var(--border);border-radius:4px;text-align:center;cursor:pointer;transition:all .2s;font-size:12px;font-weight:600;color:var(--white2);background:transparent}
    .time-btn:hover,.time-btn.on{border-color:var(--orange);background:rgba(255,77,0,0.08);color:var(--orange)}
    .time-btn.taken{opacity:.3;cursor:not-allowed;text-decoration:line-through}

    /* PROGRESS BAR */
    .pbar{height:5px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden;margin-top:8px}
    .pfill{height:100%;border-radius:99px;background:var(--orange);transition:width .5s}

    /* SECTION HEADER */
    .pg-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:14px}
    .pg-hd h1{font-family:'Bebas Neue',sans-serif;font-size:44px;line-height:1;letter-spacing:-1px;margin-bottom:3px}
    .pg-hd p{font-size:12px;color:var(--muted2)}
    .pg-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

    /* MISC */
    .empty-state{text-align:center;padding:60px 20px;color:var(--muted2)}
    .empty-state .ei{font-size:48px;margin-bottom:16px;opacity:.4}
    .empty-state h3{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:700;letter-spacing:1px;margin-bottom:8px;color:var(--white2)}
    .empty-state p{font-size:13px;line-height:1.6;max-width:280px;margin:0 auto 20px}
    .divider{height:1px;background:var(--border);margin:16px 0}
    .str-bar{height:4px;background:var(--black3);border-radius:99px;margin-top:7px;overflow:hidden}
    .str-fill{height:100%;border-radius:99px;transition:width .3s,background .3s}
    .tgl{width:40px;height:22px;background:rgba(255,255,255,0.1);border-radius:99px;position:relative;cursor:pointer;transition:background .2s;flex-shrink:0;border:none}
    .tgl.on{background:var(--orange)}
    .tgl::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;background:#fff;border-radius:50%;transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.3)}
    .tgl.on::after{transform:translateX(18px)}
    .trow{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
    .trow:last-child{border-bottom:none}
    .pag{display:flex;align-items:center;gap:5px;margin-top:18px;justify-content:flex-end}
    .pgb{width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:var(--card2);border:1px solid var(--border);border-radius:4px;cursor:pointer;font-size:11px;font-weight:700;color:var(--muted2);transition:all .18s}
    .pgb:hover,.pgb.on{background:rgba(255,77,0,0.1);border-color:var(--orange);color:var(--orange)}
    .step-bar{display:flex;align-items:center;gap:0;margin-bottom:32px}
    .step{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}
    .step.on{color:var(--orange)}
    .step.done{color:var(--white2)}
    .step-num{width:26px;height:26px;border:1px solid currentColor;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
    .step.on .step-num{background:var(--orange);border-color:var(--orange);color:#fff}
    .step.done .step-num{background:var(--green);border-color:var(--green);color:#fff}
    .step-conn{flex:1;height:1px;background:rgba(255,255,255,0.08);margin:0 8px;max-width:48px}

    @media(max-width:900px){
      .stats-row{grid-template-columns:repeat(2,1fr)}
      .g3,.g4{grid-template-columns:1fr 1fr}
      .g73,.g64{grid-template-columns:1fr}
      .fgrid{grid-template-columns:1fr}
      .cnav-links{display:none}
    }
  `}</style>
);

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const ORDERS = [
  { id: "CE-4821", date: "Apr 23, 2025", items: [{ name: "Chain 21sp", qty: 2, price: 2800 }, { name: "Brake Pads Pro", qty: 1, price: 1200 }], total: 6800, status: "Processing", type: "Online", branch: "Lahore — Gulberg", payment: "JazzCash" },
  { id: "CE-4790", date: "Apr 15, 2025", items: [{ name: "Crown GT 390", qty: 1, price: 485000 }], total: 485000, status: "Completed", type: "Online", branch: "Islamabad — Blue Area", payment: "Bank Transfer" },
  { id: "CE-4754", date: "Apr 2, 2025", items: [{ name: "Oil Filter 17mm", qty: 3, price: 450 }, { name: "Engine Oil 1L", qty: 2, price: 850 }], total: 3050, status: "Completed", type: "Online", branch: "Lahore — Gulberg", payment: "Cash" },
  { id: "CE-4710", date: "Mar 20, 2025", items: [{ name: "LED Headlight H4", qty: 1, price: 3500 }], total: 3500, status: "Cancelled", type: "Online", branch: "Karachi — Clifton", payment: "Card" },
];

const BOOKINGS = [
  { id: "BK-0042", service: "Full Tune-Up", branch: "Crown Eve Gulberg", date: "Apr 24, 2025", time: "10:00 AM", status: "Upcoming", tech: "Ahmed Kamran", price: 2500 },
  { id: "BK-0039", service: "Oil & Filter Change", branch: "Crown Eve Gulberg", date: "Apr 10, 2025", time: "09:00 AM", status: "Completed", tech: "Bilal Hassan", price: 800 },
  { id: "BK-0031", service: "Brake Overhaul", branch: "Crown Eve Islamabad", date: "Mar 28, 2025", time: "02:00 PM", status: "Completed", tech: "Umar Farooq", price: 3200 },
  { id: "BK-0025", service: "Engine Diagnostics", branch: "Crown Eve DHA", date: "Mar 15, 2025", time: "11:30 AM", status: "Cancelled", tech: "—", price: 1500 },
];

const PRODUCTS = [
  { id: 1, name: "Crown GT 390", cat: "Sport", spec: "450cc · Fuel Injected · ABS", price: 485000, stock: 6, emoji: "🏍️", badge: "In Stock" },
  { id: 2, name: "Crown Duke R", cat: "Naked", spec: "250cc · Street Fighter · LED", price: 310000, stock: 4, emoji: "🏍️", badge: "New Arrival" },
  { id: 3, name: "Crown Trail X", cat: "Adventure", spec: "650cc · Dual Sport · Long Range", price: 720000, stock: 2, emoji: "🏍️", badge: "Low Stock" },
  { id: 4, name: "Crown 125 Pro", cat: "Commuter", spec: "125cc · Commuter · Economy", price: 185000, stock: 12, emoji: "🛵", badge: "In Stock" },
  { id: 5, name: "Chain 21sp Heavy Duty", cat: "Drivetrain", spec: "Compatible: Duke, GT series", price: 2800, stock: 842, emoji: "🔗", badge: "In Stock" },
  { id: 6, name: "Brake Pads Pro", cat: "Brakes", spec: "Front & Rear — Universal", price: 1200, stock: 240, emoji: "🛞", badge: "In Stock" },
  { id: 7, name: "LED Headlight H4", cat: "Electrical", spec: "6000K · 35W · IP67", price: 3500, stock: 315, emoji: "💡", badge: "In Stock" },
  { id: 8, name: "Oil Filter 17mm", cat: "Engine", spec: "Universal fitment · OEM grade", price: 450, stock: 12, emoji: "🔩", badge: "Low Stock" },
];

const SERVICES = [
  { id: 1, name: "Full Tune-Up", icon: "🔧", desc: "Complete inspection, oil, filter, chain, brakes, tyres.", price: 2500, dur: "~2 hours" },
  { id: 2, name: "Oil & Filter Change", icon: "🛢", desc: "Engine oil drain + refill, oil filter replacement.", price: 800, dur: "~30 mins" },
  { id: 3, name: "Brake Overhaul", icon: "🛞", desc: "Full brake system — pads, bleeding, calibration.", price: 3200, dur: "~1.5 hours" },
  { id: 4, name: "Engine Diagnostics", icon: "🔍", desc: "Full scan, error codes, performance report.", price: 1500, dur: "~1 hour" },
  { id: 5, name: "Tyre Replacement", icon: "⚫", desc: "Remove, replace and balance front or rear tyre.", price: 600, dur: "~45 mins" },
  { id: 6, name: "Chain Service", icon: "🔗", desc: "Clean, lubricate, tension adjust + sprocket check.", price: 400, dur: "~20 mins" },
];

const DATES = [
  { day: "Mon", num: 28 }, { day: "Tue", num: 29 }, { day: "Wed", num: 30 },
  { day: "Thu", num: 1 }, { day: "Fri", num: 2 }, { day: "Sat", num: 3, disabled: true },
  { day: "Mon", num: 5 }, { day: "Tue", num: 6 }, { day: "Wed", num: 7 },
  { day: "Thu", num: 8 }, { day: "Fri", num: 9 },
];

const TIMES = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM",
];

const TAKEN = ["12:00 PM", "02:00 PM"];

const TRACKING_STEPS = [
  { label: "Order Placed", date: "Apr 23, 09:14 AM", done: true },
  { label: "Payment Confirmed", date: "Apr 23, 09:16 AM", done: true },
  { label: "Being Prepared", date: "Apr 23, 11:30 AM", done: true, active: true },
  { label: "Out for Delivery", date: "Expected by 3:00 PM", done: false },
  { label: "Delivered", date: "—", done: false },
];

/* ─────────────────────────────────────────────
   SMALL SHARED COMPONENTS
───────────────────────────────────────────── */
const Badge = ({ status }) => {
  const map = { Completed: "bg-g", Processing: "bg-b", Pending: "bg-a", Cancelled: "bg-r", Upcoming: "bg-o", "In Stock": "bg-g", "Low Stock": "bg-a", "New Arrival": "bg-o" };
  return <span className={`badge ${map[status] || "bg-gray"}`}>{status}</span>;
};

const Modal = memo(({ title, onClose, children }) => (
  <div className="mov" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-bar" />
      <div className="mhd">
        <div className="mt">{title}</div>
        <button className="mx" onClick={onClose}>✕</button>
      </div>
      <div className="mbd">{children}</div>
    </div>
  </div>
));

const PasswordStrength = ({ value }) => {
  const score = useMemo(() => {
    let s = 0;
    if (value.length >= 8) s++;
    if (/[A-Z]/.test(value)) s++;
    if (/[0-9]/.test(value)) s++;
    if (/[^A-Za-z0-9]/.test(value)) s++;
    return s;
  }, [value]);
  const colors = ["", "#EF4444", "#F59E0B", "#3B82F6", "#22C55E"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  if (!value) return null;
  return (
    <div>
      <div className="str-bar"><div className="str-fill" style={{ width: `${score * 25}%`, background: colors[score] }} /></div>
      <div className="fhint" style={{ color: colors[score] }}>Strength: {labels[score]}</div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PAGE: OVERVIEW
───────────────────────────────────────────── */
const PageOverview = ({ onNav, cartCount }) => (
  <div>
    {/* Welcome Banner */}
    <div style={{ background: "linear-gradient(135deg,var(--card) 0%,var(--black3) 100%)", border: "1px solid var(--border)", borderRadius: 8, padding: "28px 32px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(to right,transparent,var(--orange),transparent)" }} />
      <div style={{ position: "absolute", top: -40, right: -20, width: 200, height: 200, background: "radial-gradient(circle,rgba(255,77,0,0.08),transparent 70%)", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--orange)", marginBottom: 6 }}>Welcome back</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, lineHeight: 1, letterSpacing: -2, marginBottom: 8 }}>Ali Kamran</div>
          <div style={{ fontSize: 13, color: "var(--white2)" }}>Lahore, Pakistan · Customer since January 2024</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav("shop")}>Browse Shop</button>
          <button className="btn btn-primary btn-sm" onClick={() => onNav("booking")}>Book Service</button>
        </div>
      </div>
    </div>

    {/* Stats */}
    <div className="stats-row">
      <div className="stat"><div className="si">◫</div><div className="sl">Active Orders</div><div className="sv">1</div><span className="sc neu">CE-4821 · Processing</span></div>
      <div className="stat"><div className="si">📅</div><div className="sl">Upcoming Booking</div><div className="sv">1</div><span className="sc up">↑ Tomorrow 10:00 AM</span></div>
      <div className="stat"><div className="si">₨</div><div className="sl">Total Spent</div><div className="sv" style={{ color: "var(--orange)" }}>497K</div><span className="sc neu">4 orders lifetime</span></div>
      <div className="stat"><div className="si">🏍️</div><div className="sl">Services Done</div><div className="sv">3</div><span className="sc up">↑ Last: Apr 10</span></div>
    </div>

    {/* Active Order + Upcoming Booking */}
    <div className="g2" style={{ marginBottom: 20 }}>
      <div className="card">
        <div className="ch"><div className="ct">Active Order</div><button className="ca" onClick={() => onNav("orders")}>View all →</button></div>
        <div style={{ background: "var(--black3)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span className="mono" style={{ color: "var(--orange)", fontSize: 13 }}>#CE-4821</span>
            <Badge status="Processing" />
          </div>
          <div style={{ fontSize: 13, color: "var(--white2)", marginBottom: 12 }}>Chain 21sp (×2) + Brake Pads Pro (×1)</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700, color: "var(--orange)" }}>PKR 6,800</span>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav("track")}>Track Order →</button>
          </div>
        </div>
        {/* Mini Timeline */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {["Placed", "Confirmed", "Preparing", "Delivery", "Done"].map((s, i) => (
            <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                {i > 0 && <div style={{ flex: 1, height: 2, background: i < 3 ? "var(--orange)" : "var(--border)" }} />}
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: i < 3 ? "var(--orange)" : i === 3 ? "rgba(255,77,0,0.3)" : "var(--border)", flexShrink: 0 }} />
                {i < 4 && <div style={{ flex: 1, height: 2, background: i < 2 ? "var(--orange)" : "var(--border)" }} />}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: i < 3 ? "var(--orange)" : "var(--muted)", textAlign: "center" }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="ch"><div className="ct">Upcoming Booking</div><button className="ca" onClick={() => onNav("bookings")}>View all →</button></div>
        <div style={{ background: "var(--black3)", border: "1px solid rgba(255,77,0,0.15)", borderRadius: 6, padding: "18px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, background: "rgba(255,77,0,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔧</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>Full Tune-Up</div>
              <div style={{ fontSize: 12, color: "var(--muted2)" }}>Crown Eve Gulberg, Lahore</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ background: "var(--card2)", borderRadius: 4, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 3 }}>Date</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Apr 24, 2025</div>
            </div>
            <div style={{ background: "var(--card2)", borderRadius: 4, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 3 }}>Time</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--orange)" }}>10:00 AM</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 12 }}>Technician: <span style={{ color: "var(--white)" }}>Ahmed Kamran</span></div>
          <button className="btn btn-danger btn-sm" style={{ width: "100%" }}>Cancel Booking</button>
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="card">
      <div className="ch"><div className="ct">Quick Actions</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[{ ico: "🛒", label: "Browse Shop", page: "shop" }, { ico: "📋", label: "My Orders", page: "orders" }, { ico: "📅", label: "My Bookings", page: "bookings" }, { ico: "🔧", label: "Book Service", page: "booking" }].map(a => (
          <div key={a.label} onClick={() => onNav(a.page)} style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 7, padding: "18px 14px", textAlign: "center", cursor: "pointer", transition: "all .2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border2)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{a.ico}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>{a.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   PAGE: MY ORDERS
───────────────────────────────────────────── */
const PageOrders = ({ onNav, onTrack }) => {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Processing", "Completed", "Cancelled"];
  const filtered = filter === "All" ? ORDERS : ORDERS.filter(o => o.status === filter);
  return (
    <div>
      <div className="pg-hd">
        <div><h1>My Orders</h1><p>Your complete order history</p></div>
        <button className="btn btn-ghost btn-sm">⬇ Download History</button>
      </div>
      <div className="fbar">
        {filters.map(f => <button key={f} className={`fpill ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}
        <div className="fsearch"><span style={{ color: "var(--muted)" }}>⌕</span><input placeholder="Search order ID..." /></div>
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="ei">📦</div><h3>No orders found</h3><p>You have no {filter.toLowerCase()} orders yet.</p></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Order ID</th><th>Items</th><th>Total</th><th>Type</th><th>Branch</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id}>
                    <td><span className="mono" style={{ color: "var(--orange)", fontSize: 12 }}>#{o.id}</span></td>
                    <td>
                      <div className="tm">{o.items[0].name}{o.items.length > 1 && ` +${o.items.length - 1} more`}</div>
                      <div className="ts">{o.items.length} item{o.items.length > 1 ? "s" : ""}</div>
                    </td>
                    <td style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--orange)" }}>PKR {o.total.toLocaleString()}</td>
                    <td><span className="badge bg-b" style={{ fontSize: 9 }}>{o.type}</span></td>
                    <td className="ts">{o.branch}</td>
                    <td><Badge status={o.status} /></td>
                    <td className="ts">{o.date}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        {o.status === "Processing" && <button className="btn btn-primary btn-xs" onClick={() => onTrack(o.id)}>Track</button>}
                        <button className="btn btn-ghost btn-xs" onClick={() => onTrack(o.id)}>View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PAGE: ORDER TRACKING
───────────────────────────────────────────── */
const PageTrack = ({ orderId, onBack }) => {
  const order = ORDERS.find(o => o.id === orderId) || ORDERS[0];
  return (
    <div>
      <div className="pg-hd">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 10 }}>← Back to Orders</button>
          <h1>Track Order</h1>
          <p>Order <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "var(--orange)" }}>#{order.id}</span> · {order.date}</p>
        </div>
        <Badge status={order.status} />
      </div>
      <div className="g64">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><div className="ct">Tracking Timeline</div></div>
            <div className="timeline">
              {TRACKING_STEPS.map((step, i) => (
                <div className="tl-item" key={step.label}>
                  <div className="tl-left">
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: step.done ? "var(--orange)" : "var(--card2)", border: step.active ? "none" : "1.5px solid var(--border)", boxShadow: step.active ? "0 0 0 4px rgba(255,77,0,0.2)" : "none", flexShrink: 0, zIndex: 1, position: "relative" }} />
                    {i < TRACKING_STEPS.length - 1 && <div style={{ flex: 1, width: 1, background: step.done && !step.active ? "var(--orange)" : "var(--border)", marginTop: 3 }} />}
                  </div>
                  <div className="tl-content">
                    <div className="tl-title" style={{ color: step.done ? "var(--white)" : "var(--muted2)" }}>{step.label}</div>
                    <div className="tl-date" style={{ color: step.active ? "var(--orange)" : "var(--muted2)" }}>{step.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="ch"><div className="ct">Order Items</div></div>
            {order.items.map(item => (
              <div key={item.name} className="ci">
                <div className="ci-img">📦</div>
                <div style={{ flex: 1 }}>
                  <div className="ci-name">{item.name}</div>
                  <div className="ci-sub">Qty: {item.qty} · PKR {item.price.toLocaleString()} each</div>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--orange)" }}>PKR {(item.qty * item.price).toLocaleString()}</div>
              </div>
            ))}
            <div className="divider" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "var(--white2)" }}>Total</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: "var(--orange)" }}>PKR {order.total.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="ch"><div className="ct">Order Details</div></div>
            {[["Order ID", `#${order.id}`], ["Date", order.date], ["Branch", order.branch], ["Type", order.type], ["Payment", order.payment], ["Status", order.status]].map(([label, val]) => (
              <div key={label} className="trow">
                <span style={{ fontSize: 12, color: "var(--muted2)" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: label === "Status" ? "var(--orange)" : "var(--white)" }}>{val}</span>
              </div>
            ))}
          </div>
          {order.status === "Processing" && (
            <div className="card" style={{ borderColor: "rgba(239,68,68,0.15)" }}>
              <div className="ch"><div className="ct">Actions</div></div>
              <div style={{ fontSize: 12, color: "var(--muted2)", lineHeight: 1.7, marginBottom: 14 }}>You can cancel this order while it is still being prepared. Once dispatched, cancellation is not available.</div>
              <button className="btn btn-danger" style={{ width: "100%" }}>Cancel Order</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PAGE: MY BOOKINGS
───────────────────────────────────────────── */
const PageBookings = ({ onNav }) => {
  const [filter, setFilter] = useState("All");
  const [cancelId, setCancelId] = useState(null);
  const filters = ["All", "Upcoming", "Completed", "Cancelled"];
  const filtered = filter === "All" ? BOOKINGS : BOOKINGS.filter(b => b.status === filter);
  return (
    <div>
      <div className="pg-hd">
        <div><h1>My Bookings</h1><p>All your service appointments</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => onNav("booking")}>+ Book New Service</button>
      </div>
      <div className="fbar">
        {filters.map(f => <button key={f} className={`fpill ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="ei">📅</div><h3>No bookings yet</h3><p>You have no {filter.toLowerCase()} appointments.</p><button className="btn btn-primary btn-sm" onClick={() => onNav("booking")}>Book a Service</button></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(b => (
              <div key={b.id} style={{ background: "var(--black3)", border: `1px solid ${b.status === "Upcoming" ? "rgba(255,77,0,0.2)" : "var(--border)"}`, borderRadius: 7, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 46, height: 46, background: "rgba(255,77,0,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🔧</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>{b.service}</div>
                      <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 6 }}>{b.branch}</div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "var(--white2)" }}>📅 {b.date}</span>
                        <span style={{ fontSize: 12, color: "var(--orange)", fontWeight: 600 }}>🕐 {b.time}</span>
                        {b.tech !== "—" && <span style={{ fontSize: 12, color: "var(--white2)" }}>👨‍🔧 {b.tech}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <Badge status={b.status} />
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, color: "var(--orange)" }}>PKR {b.price.toLocaleString()}</div>
                    {b.status === "Upcoming" && (
                      <button className="btn btn-danger btn-xs" onClick={() => setCancelId(b.id)}>Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cancelId && (
        <Modal title="Cancel Booking" onClose={() => setCancelId(null)}>
          <div className="alert alert-w">⚠ Cancellations made less than 2 hours before the appointment may incur a fee.</div>
          <p style={{ fontSize: 13, color: "var(--white2)", lineHeight: 1.7, marginBottom: 20 }}>Are you sure you want to cancel this booking? Your slot will be released and you can rebook anytime.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => setCancelId(null)}>Yes, Cancel Booking</button>
            <button className="btn btn-ghost" onClick={() => setCancelId(null)}>Keep Booking</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   PAGE: BOOK SERVICE
───────────────────────────────────────────── */
const PageBooking = () => {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [form, setForm] = useState({ branch: "", bike: "", name: "", phone: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);

  const service = SERVICES.find(s => s.id === selected);

  if (submitted) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ width: 80, height: 80, background: "var(--gbg)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 24px" }}>✓</div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, letterSpacing: -1, marginBottom: 8 }}>Booking <span style={{ color: "var(--orange)" }}>Confirmed!</span></div>
      <div style={{ fontSize: 14, color: "var(--white2)", maxWidth: 420, margin: "0 auto 8px", lineHeight: 1.7 }}>Your {service?.name} appointment has been booked at {form.branch}.</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, color: "var(--orange)", margin: "16px 0 32px" }}>#BK-0048</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="btn btn-ghost" onClick={() => { setSubmitted(false); setStep(1); setSelected(null); }}>Book Another</button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="pg-hd"><div><h1>Book a Service</h1><p>Schedule your appointment in 4 easy steps</p></div></div>

      <div className="step-bar" style={{ marginBottom: 32 }}>
        {[{ n: 1, l: "Service" }, { n: 2, l: "Branch & Date" }, { n: 3, l: "Your Details" }, { n: 4, l: "Confirm" }].map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : 0 }}>
            <div className={`step ${step === s.n ? "on" : step > s.n ? "done" : ""}`}>
              <div className="step-num">{step > s.n ? "✓" : s.n}</div>
              {s.l}
            </div>
            {i < 3 && <div className="step-conn" />}
          </div>
        ))}
      </div>

      <div className="g73" style={{ alignItems: "start" }}>
        <div>
          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--white2)", marginBottom: 16 }}>Choose a Service</div>
              <div className="g2">
                {SERVICES.map(s => (
                  <div key={s.id} className={`svc-card ${selected === s.id ? "selected" : ""}`} onClick={() => setSelected(s.id)}>
                    <div className="svc-icon">{s.icon}</div>
                    <div className="svc-name">{s.name}</div>
                    <div className="svc-desc">{s.desc}</div>
                    <div className="svc-price">PKR {s.price.toLocaleString()}</div>
                    <div className="svc-dur">{s.dur}</div>
                    {selected === s.id && <div style={{ marginTop: 10, fontSize: 11, color: "var(--green)", fontWeight: 700 }}>✓ Selected</div>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <button className="btn btn-primary" disabled={!selected} onClick={() => setStep(2)} style={{ opacity: selected ? 1 : 0.4 }}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <div className="fg">
                <label>Select Branch</label>
                <select className="fs" value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}>
                  <option value="">Choose nearest branch</option>
                  <option>Crown Eve Gulberg — Lahore</option>
                  <option>Crown Eve DHA — Lahore</option>
                  <option>Crown Eve Clifton — Karachi</option>
                  <option>Crown Eve Blue Area — Islamabad</option>
                  <option>Crown Eve Canal Road — Faisalabad</option>
                </select>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--white2)", marginBottom: 14 }}>Select Date</div>
              <div className="date-grid">
                {DATES.map((d, i) => (
                  <div key={i} className={`date-btn ${d.disabled ? "disabled" : ""} ${selectedDate === i && !d.disabled ? "on" : ""}`} onClick={() => !d.disabled && setSelectedDate(i)}>
                    <div className="dn">{d.day}</div>
                    <div className="dd">{d.num}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--white2)", marginBottom: 14 }}>Select Time Slot</div>
              <div className="time-grid">
                {TIMES.map(t => (
                  <div key={t} className={`time-btn ${TAKEN.includes(t) ? "taken" : ""} ${selectedTime === t && !TAKEN.includes(t) ? "on" : ""}`} onClick={() => !TAKEN.includes(t) && setSelectedTime(t)}>
                    {t}{TAKEN.includes(t) ? " ✕" : ""}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" disabled={!form.branch || selectedDate === null || !selectedTime} onClick={() => setStep(3)} style={{ opacity: (form.branch && selectedDate !== null && selectedTime) ? 1 : 0.4 }}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <div className="fgrid">
                <div className="fg"><label>Your Name</label><input type="text" className="fi" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" /></div>
                <div className="fg"><label>Phone</label><input type="tel" className="fi" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+92 300 0000000" /></div>
              </div>
              <div className="fg"><label>Bike Model</label><input type="text" className="fi" value={form.bike} onChange={e => setForm(p => ({ ...p, bike: e.target.value }))} placeholder="e.g. KTM Duke 390 2022" /></div>
              <div className="fg"><label>Additional Notes</label><textarea className="ft" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Specific issues, requests, or anything we should know..." /></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary" disabled={!form.name || !form.phone || !form.bike} onClick={() => setStep(4)} style={{ opacity: (form.name && form.phone && form.bike) ? 1 : 0.4 }}>Review Booking →</button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && service && (
            <div>
              <div className="alert alert-info" style={{ marginBottom: 16 }}>ℹ Review all details before confirming. Free cancellation up to 2 hours before appointment.</div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="ch"><div className="ct">Booking Summary</div></div>
                {[["Service", service.name], ["Branch", form.branch], ["Date", DATES[selectedDate] ? `Apr ${DATES[selectedDate].num}, 2025` : ""], ["Time", selectedTime], ["Duration", service.dur], ["Your Name", form.name], ["Phone", form.phone], ["Bike", form.bike]].map(([k, v]) => (
                  <div className="trow" key={k}>
                    <span style={{ fontSize: 12, color: "var(--muted2)" }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700 }}>Estimated Cost</span>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: "var(--orange)" }}>PKR {service.price.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setStep(3)}>← Edit Details</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setSubmitted(true)}>Confirm Booking ✓</button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="card" style={{ position: "sticky", top: 80 }}>
          <div className="ch"><div className="ct">Your Selection</div></div>
          {service ? (
            <>
              <div style={{ background: "var(--black3)", borderRadius: 6, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{service.icon}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{service.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>{service.desc}</div>
              </div>
              {[["Branch", form.branch || "—"], ["Date", selectedDate !== null ? `Apr ${DATES[selectedDate]?.num}, 2025` : "—"], ["Time", selectedTime || "—"], ["Duration", service.dur]].map(([k, v]) => (
                <div className="trow" key={k}>
                  <span style={{ fontSize: 11, color: "var(--muted2)" }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: v === "—" ? "var(--muted)" : "var(--white)" }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--white2)" }}>Estimate</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: "var(--orange)" }}>PKR {service.price.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 8, lineHeight: 1.6 }}>Final price confirmed at the branch after assessment.</div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "24px 12px", color: "var(--muted2)", fontSize: 13 }}>Select a service to see your booking summary here.</div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PAGE: SHOP
───────────────────────────────────────────── */
const PageShop = ({ onAddToCart, onViewProduct }) => {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const cats = ["All", "Sport", "Naked", "Adventure", "Commuter", "Drivetrain", "Brakes", "Engine", "Electrical"];
  const filtered = PRODUCTS.filter(p => {
    const matchCat = filter === "All" || p.cat === filter;
    const matchSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div className="pg-hd">
        <div><h1>Shop</h1><p>Browse premium bikes, parts, and accessories</p></div>
      </div>
      <div className="fbar">
        {cats.map(c => <button key={c} className={`fpill ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>{c}</button>)}
        <div className="fsearch"><span style={{ color: "var(--muted)" }}>⌕</span><input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="ei">🔍</div><h3>No results</h3><p>Try a different search or category filter.</p></div>
      ) : (
        <div className="g4">
          {filtered.map(p => (
            <div className="prod-card" key={p.id}>
              <div className="prod-img" onClick={() => onViewProduct(p.id)}>
                <span style={{ fontSize: 40 }}>{p.emoji}</span>
              </div>
              <div className="prod-body">
                <div className="prod-cat">{p.cat}</div>
                <div className="prod-name">{p.name}</div>
                <div className="prod-spec">{p.spec}</div>
                <div className="prod-footer">
                  <div className="prod-price">PKR {p.price.toLocaleString()}</div>
                  <Badge status={p.badge} />
                </div>
                <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={() => onAddToCart(p)}>Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   PAGE: PRODUCT DETAIL
───────────────────────────────────────────── */
const PageProductDetail = ({ productId, onBack, onAddToCart }) => {
  const p = PRODUCTS.find(pr => pr.id === productId) || PRODUCTS[0];
  const [qty, setQty] = useState(1);
  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 20 }}>← Back to Shop</button>
      <div className="g64">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ aspectRatio: "16/9", background: "var(--black3)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, marginBottom: 16 }}>{p.emoji}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ width: 60, height: 60, background: "var(--card2)", borderRadius: 5, border: i === 1 ? "1px solid var(--orange)" : "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, cursor: "pointer" }}>{p.emoji}</div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
            <Badge status={p.badge} />
            <span className="mono" style={{ color: "var(--muted2)", fontSize: 11 }}>#PT-{String(p.id).padStart(4, "0")}</span>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--orange)", marginBottom: 6 }}>{p.cat}</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, lineHeight: 0.95, letterSpacing: -1, marginBottom: 10 }}>{p.name}</div>
          <div style={{ fontSize: 14, color: "var(--white2)", marginBottom: 16, lineHeight: 1.6 }}>{p.spec}</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, color: "var(--orange)", letterSpacing: 1, marginBottom: 6 }}>PKR {p.price.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 24 }}>{p.stock} units in stock at Crown Eve Gulberg</div>
          <div className="divider" />
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 10 }}>Quantity</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="qty-ctrl">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="qty-num">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => Math.min(p.stock, q + 1))}>+</button>
              </div>
              <span style={{ fontSize: 12, color: "var(--muted2)" }}>Max: {p.stock}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onAddToCart(p, qty)}>Add {qty > 1 ? `${qty}x ` : ""}to Cart</button>
            <button className="btn btn-ghost">♡ Wishlist</button>
          </div>
          <div className="card" style={{ background: "var(--black3)" }}>
            <div className="ch"><div className="ct">Part Details</div></div>
            {[["Category", p.cat], ["Stock", `${p.stock} units`], ["Compatibility", "Universal / See description"], ["Warranty", "6 months Crown Eve warranty"]].map(([k, v]) => (
              <div className="trow" key={k}><span style={{ fontSize: 12, color: "var(--muted2)" }}>{k}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PAGE: CART
───────────────────────────────────────────── */
const PageCart = ({ cart, onUpdateQty, onRemove, onNav }) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (cart.length === 0) return (
    <div>
      <div className="pg-hd"><div><h1>My Cart</h1><p>Your selected items</p></div></div>
      <div className="empty-state"><div className="ei">🛒</div><h3>Your cart is empty</h3><p>Browse our shop and add items to your cart.</p><button className="btn btn-primary btn-sm" onClick={() => onNav("shop")}>Browse Shop</button></div>
    </div>
  );
  return (
    <div>
      <div className="pg-hd"><div><h1>My Cart</h1><p>{cart.length} item{cart.length > 1 ? "s" : ""} in your cart</p></div></div>
      <div className="g73" style={{ alignItems: "start" }}>
        <div className="card">
          <div className="ch"><div className="ct">Cart Items</div><button className="ca">Clear All</button></div>
          {cart.map(item => (
            <div className="ci" key={item.id}>
              <div className="ci-img">{item.emoji}</div>
              <div style={{ flex: 1 }}>
                <div className="ci-name">{item.name}</div>
                <div className="ci-sub">{item.cat} · PKR {item.price.toLocaleString()} each</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => onUpdateQty(item.id, item.qty - 1)}>−</button>
                  <span className="qty-num">{item.qty}</span>
                  <button className="qty-btn" onClick={() => onUpdateQty(item.id, item.qty + 1)}>+</button>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--orange)", minWidth: 80, textAlign: "right" }}>PKR {(item.price * item.qty).toLocaleString()}</div>
                <button style={{ background: "none", border: "none", color: "var(--muted2)", fontSize: 16, cursor: "pointer", padding: "0 4px" }} onClick={() => onRemove(item.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ position: "sticky", top: 80 }}>
          <div className="ch"><div className="ct">Order Summary</div></div>
          <div className="trow"><span style={{ fontSize: 12, color: "var(--muted2)" }}>Subtotal ({cart.length} items)</span><span style={{ fontSize: 14, fontWeight: 600 }}>PKR {subtotal.toLocaleString()}</span></div>
          <div className="trow"><span style={{ fontSize: 12, color: "var(--muted2)" }}>Shipping</span><span style={{ fontSize: 14, fontWeight: 600, color: "var(--green)" }}>Free</span></div>
          <div className="trow"><span style={{ fontSize: 12, color: "var(--muted2)" }}>Tax</span><span style={{ fontSize: 14, fontWeight: 600 }}>PKR 0</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid var(--border)", marginTop: 4 }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700 }}>Total</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, color: "var(--orange)" }}>PKR {subtotal.toLocaleString()}</span>
          </div>
          <div className="fg"><label>Promo Code</label><div style={{ display: "flex", gap: 0 }}><input type="text" className="fi" placeholder="Enter code" style={{ borderRadius: "4px 0 0 4px" }} /><button className="btn btn-ghost" style={{ borderRadius: "0 4px 4px 0", flexShrink: 0 }}>Apply</button></div></div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 4 }} onClick={() => onNav("checkout")}>Proceed to Checkout →</button>
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => onNav("shop")}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PAGE: CHECKOUT
───────────────────────────────────────────── */
const PageCheckout = ({ cart, onNav }) => {
  const [step, setStep] = useState(1);
  const [addr, setAddr] = useState({ name: "", phone: "", address: "", city: "", zip: "" });
  const [payment, setPayment] = useState("jazzcash");
  const [placed, setPlaced] = useState(false);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  if (placed) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ width: 80, height: 80, background: "var(--gbg)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 24px" }}>✓</div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, letterSpacing: -1, marginBottom: 8 }}>Order <span style={{ color: "var(--orange)" }}>Placed!</span></div>
      <div style={{ fontSize: 14, color: "var(--white2)", maxWidth: 380, margin: "0 auto 8px", lineHeight: 1.7 }}>Your order has been confirmed. We'll notify you when it's on its way.</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, color: "var(--orange)", margin: "16px 0 32px" }}>#CE-4822</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="btn btn-ghost" onClick={() => onNav("orders")}>View My Orders</button>
        <button className="btn btn-primary" onClick={() => onNav("shop")}>Shop More</button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="pg-hd"><div><h1>Checkout</h1><p>Complete your order</p></div></div>
      <div className="step-bar" style={{ marginBottom: 28 }}>
        {[{ n: 1, l: "Address" }, { n: 2, l: "Payment" }, { n: 3, l: "Confirm" }].map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : 0 }}>
            <div className={`step ${step === s.n ? "on" : step > s.n ? "done" : ""}`}>
              <div className="step-num">{step > s.n ? "✓" : s.n}</div>{s.l}
            </div>
            {i < 2 && <div className="step-conn" />}
          </div>
        ))}
      </div>
      <div className="g64" style={{ alignItems: "start" }}>
        <div>
          {step === 1 && (
            <div className="card">
              <div className="ch"><div className="ct">Delivery Address</div></div>
              <div className="fgrid">
                <div className="fg"><label>Full Name</label><input className="fi" value={addr.name} onChange={e => setAddr(p => ({ ...p, name: e.target.value }))} placeholder="Your name" /></div>
                <div className="fg"><label>Phone</label><input className="fi" value={addr.phone} onChange={e => setAddr(p => ({ ...p, phone: e.target.value }))} placeholder="+92 300 0000000" /></div>
              </div>
              <div className="fg"><label>Street Address</label><input className="fi" value={addr.address} onChange={e => setAddr(p => ({ ...p, address: e.target.value }))} placeholder="Street, block, area" /></div>
              <div className="fgrid">
                <div className="fg"><label>City</label><select className="fs" value={addr.city} onChange={e => setAddr(p => ({ ...p, city: e.target.value }))}><option value="">Select city</option><option>Lahore</option><option>Karachi</option><option>Islamabad</option><option>Faisalabad</option></select></div>
                <div className="fg"><label>Branch for Pickup</label><select className="fs"><option>Home Delivery</option><option>Crown Eve Gulberg</option><option>Crown Eve DHA</option></select></div>
              </div>
              <button className="btn btn-primary" disabled={!addr.name || !addr.phone || !addr.address || !addr.city} style={{ opacity: (addr.name && addr.phone && addr.address && addr.city) ? 1 : 0.4 }} onClick={() => setStep(2)}>Continue to Payment →</button>
            </div>
          )}
          {step === 2 && (
            <div className="card">
              <div className="ch"><div className="ct">Payment Method</div></div>
              {[{ id: "jazzcash", label: "JazzCash", icon: "📱" }, { id: "easypaisa", label: "EasyPaisa", icon: "📱" }, { id: "card", label: "Debit / Credit Card", icon: "💳" }, { id: "bank", label: "Bank Transfer", icon: "🏦" }, { id: "cod", label: "Cash on Delivery", icon: "💵" }].map(m => (
                <div key={m.id} onClick={() => setPayment(m.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: payment === m.id ? "rgba(255,77,0,0.06)" : "var(--black3)", border: `1px solid ${payment === m.id ? "var(--orange)" : "var(--border)"}`, borderRadius: 6, marginBottom: 8, cursor: "pointer", transition: "all .2s" }}>
                  <span style={{ fontSize: 22 }}>{m.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: payment === m.id ? "var(--white)" : "var(--white2)" }}>{m.label}</span>
                  {payment === m.id && <span style={{ marginLeft: "auto", color: "var(--orange)", fontSize: 16 }}>✓</span>}
                </div>
              ))}
              {payment === "card" && (
                <div style={{ marginTop: 14, padding: "16px", background: "var(--black3)", border: "1px solid var(--border)", borderRadius: 6 }}>
                  <div className="fg" style={{ marginBottom: 10 }}><label>Card Number</label><input className="fi" placeholder="0000 0000 0000 0000" /></div>
                  <div className="fgrid">
                    <div className="fg" style={{ marginBottom: 0 }}><label>Expiry</label><input className="fi" placeholder="MM / YY" /></div>
                    <div className="fg" style={{ marginBottom: 0 }}><label>CVV</label><input className="fi" placeholder="•••" type="password" /></div>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>Review Order →</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="card">
              <div className="ch"><div className="ct">Confirm Order</div></div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 10 }}>Items</div>
              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--white2)" }}>{item.name} ×{item.qty}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>PKR {(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="divider" />
              <div className="trow"><span style={{ fontSize: 12, color: "var(--muted2)" }}>Delivery To</span><span style={{ fontSize: 12, fontWeight: 600 }}>{addr.address}, {addr.city}</span></div>
              <div className="trow"><span style={{ fontSize: 12, color: "var(--muted2)" }}>Payment</span><span style={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>{payment}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700 }}>Total</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: "var(--orange)" }}>PKR {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setPlaced(true)}>Place Order ✓</button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="card" style={{ position: "sticky", top: 80 }}>
          <div className="ch"><div className="ct">Order Summary</div></div>
          {cart.map(item => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--white2)" }}>{item.name} ×{item.qty}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>PKR {(item.price * item.qty).toLocaleString()}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="trow"><span style={{ fontSize: 12, color: "var(--muted2)" }}>Subtotal</span><span style={{ fontSize: 13, fontWeight: 600 }}>PKR {subtotal.toLocaleString()}</span></div>
          <div className="trow"><span style={{ fontSize: 12, color: "var(--muted2)" }}>Shipping</span><span style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>Free</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700 }}>Total</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: "var(--orange)" }}>PKR {subtotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PAGE: PROFILE
───────────────────────────────────────────── */
const PageProfile = () => {
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState({ first: "Ali", last: "Kamran", email: "ali.kamran@email.com", phone: "+92 300 1234567", city: "Lahore", bike: "KTM Duke 390 2022" });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState({ orders: true, bookings: true, promo: false, sms: true });
  const tabs = [{ id: "info", label: "Personal Info" }, { id: "password", label: "Change Password" }, { id: "addresses", label: "Addresses" }, { id: "notifications", label: "Notifications" }, { id: "sessions", label: "Sessions" }];

  return (
    <div>
      <div className="pg-hd"><div><h1>My Profile</h1><p>Manage your account, preferences and security</p></div></div>

      {/* Profile Header */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "28px 32px", marginBottom: 24, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(to right,transparent,var(--orange),transparent)" }} />
        <div style={{ width: 68, height: 68, background: "var(--orange)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: "#fff", flexShrink: 0, position: "relative" }}>
          AK
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, background: "var(--black2)", border: "2px solid var(--orange)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, cursor: "pointer" }}>✎</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: ".5px", marginBottom: 3 }}>Ali Kamran</div>
          <div style={{ fontSize: 12, color: "var(--muted2)" }}>ali.kamran@email.com · +92 300 1234567</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span className="badge bg-o">Customer</span>
            <span className="badge bg-g">Verified</span>
            <span className="badge bg-b">2FA On</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 3 }}>Member since</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, color: "var(--orange)" }}>January 2024</div>
          <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 6 }}>Last login: Today, 9:14 AM</div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => <button key={t.id} className={`tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {/* PERSONAL INFO */}
      {tab === "info" && (
        <div className="card">
          <div className="ch"><div className="ct">Personal Information</div></div>
          {saved && <div className="alert alert-ok" style={{ marginBottom: 16 }}>✓ Profile updated successfully</div>}
          <div className="fgrid">
            <div className="fg"><label>First Name</label><input className="fi" value={form.first} onChange={e => setForm(p => ({ ...p, first: e.target.value }))} /></div>
            <div className="fg"><label>Last Name</label><input className="fi" value={form.last} onChange={e => setForm(p => ({ ...p, last: e.target.value }))} /></div>
            <div className="fg"><label>Email Address</label><input type="email" className="fi" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="fg"><label>Phone Number</label><input type="tel" className="fi" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div className="fg"><label>City</label><select className="fs" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}><option>Lahore</option><option>Karachi</option><option>Islamabad</option><option>Faisalabad</option></select></div>
            <div className="fg"><label>My Bike Model</label><input className="fi" value={form.bike} onChange={e => setForm(p => ({ ...p, bike: e.target.value }))} placeholder="e.g. KTM Duke 390 2022" /></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>Save Changes</button>
            <button className="btn btn-ghost">Discard</button>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD */}
      {tab === "password" && (
        <div className="card">
          <div className="ch"><div className="ct">Change Password</div></div>
          <div className="alert alert-w" style={{ marginBottom: 18 }}>⚠ Use at least 8 characters with numbers and symbols.</div>
          <div style={{ maxWidth: 440 }}>
            <div className="fg"><label>Current Password</label><input type="password" className="fi" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} placeholder="Enter current password" /></div>
            <div className="fg">
              <label>New Password</label>
              <input type="password" className="fi" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} placeholder="Enter new password" />
              <PasswordStrength value={pw.next} />
            </div>
            <div className="fg">
              <label>Confirm New Password</label>
              <input type="password" className="fi" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} placeholder="Confirm new password" />
              {pw.confirm && <div className="fhint" style={{ color: pw.confirm === pw.next ? "var(--green)" : "var(--red)" }}>{pw.confirm === pw.next ? "✓ Passwords match" : "✗ Does not match"}</div>}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" disabled={!pw.current || !pw.next || pw.next !== pw.confirm} style={{ opacity: (pw.current && pw.next && pw.next === pw.confirm) ? 1 : 0.4 }}>Update Password</button>
              <button className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ADDRESSES */}
      {tab === "addresses" && (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
            {[{ label: "Home", addr: "House 12, Street 4, Gulberg III, Lahore", def: true }, { label: "Office", addr: "3rd Floor, Tech Tower, MM Alam Road, Lahore", def: false }].map(a => (
              <div key={a.label} style={{ background: "var(--card)", border: `1px solid ${a.def ? "var(--orange)" : "var(--border)"}`, borderRadius: 7, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, background: "rgba(255,77,0,0.1)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏠</div>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--white)" }}>{a.label}</div>
                      {a.def && <span className="badge bg-o" style={{ fontSize: 9 }}>Default</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted2)" }}>{a.addr}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {!a.def && <button className="btn btn-ghost btn-xs">Set Default</button>}
                  <button className="btn btn-ghost btn-xs">Edit</button>
                  <button className="btn btn-danger btn-xs">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm">+ Add New Address</button>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {tab === "notifications" && (
        <div className="card">
          <div className="ch"><div className="ct">Notification Preferences</div></div>
          {[{ key: "orders", label: "Order Updates", desc: "Shipping confirmations, status changes, delivery alerts" }, { key: "bookings", label: "Booking Reminders", desc: "Appointment confirmations and 1-hour reminders" }, { key: "promo", label: "Promotions & Offers", desc: "Sales, discounts, and new arrivals from Crown Eve" }, { key: "sms", label: "SMS Notifications", desc: "Critical alerts sent via SMS to your registered number" }].map(n => (
            <div className="trow" key={n.key}>
              <div><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{n.label}</div><div style={{ fontSize: 11, color: "var(--muted2)" }}>{n.desc}</div></div>
              <button className={`tgl ${notifs[n.key] ? "on" : ""}`} onClick={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))} />
            </div>
          ))}
          <button className="btn btn-primary" style={{ marginTop: 16 }}>Save Preferences</button>
        </div>
      )}

      {/* SESSIONS */}
      {tab === "sessions" && (
        <div className="card">
          <div className="ch"><div className="ct">Active Sessions</div><button className="btn btn-danger btn-sm">Revoke All Others</button></div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Device</th><th>Location</th><th>IP Address</th><th>Last Active</th><th>Status</th><th></th></tr></thead>
              <tbody>
                <tr><td><div className="tm">Chrome — Windows 11</div><div className="ts">Desktop Browser</div></td><td>Lahore, PK</td><td><span className="mono">103.42.81.xx</span></td><td style={{ color: "var(--green)", fontSize: 12 }}>Now</td><td><span className="badge bg-g">Current</span></td><td>—</td></tr>
                <tr><td><div className="tm">Safari — iPhone 15</div><div className="ts">Mobile Browser</div></td><td>Lahore, PK</td><td><span className="mono">103.42.81.xx</span></td><td className="ts">3 hours ago</td><td><span className="badge bg-gray">Active</span></td><td><button className="btn btn-danger btn-xs">Revoke</button></td></tr>
              </tbody>
            </table>
          </div>
          <div className="divider" />
          <div style={{ background: "var(--rbg)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 6, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--red)", marginBottom: 3 }}>Close Account</div><div style={{ fontSize: 11, color: "var(--muted2)" }}>Submit a deletion request — this cannot be undone</div></div>
            <button className="btn btn-danger btn-sm">Request Deletion</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
export default function CustomerDashboard() {
  const [page, setPage] = useState("overview");
  const [cart, setCart] = useState([]);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [viewedProduct, setViewedProduct] = useState(null);

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const navigate = useCallback((p) => setPage(p), []);

  const addToCart = useCallback((product, qty = 1) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...product, qty }];
    });
    setPage("cart");
  }, []);

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) { setCart(prev => prev.filter(i => i.id !== id)); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }, []);

  const removeItem = useCallback((id) => setCart(prev => prev.filter(i => i.id !== id)), []);

  const trackOrder = useCallback((id) => { setTrackedOrder(id); setPage("track"); }, []);
  const viewProduct = useCallback((id) => { setViewedProduct(id); setPage("product"); }, []);

  const NAV_ITEMS = [
    { id: "overview", label: "Overview" },
    { id: "shop", label: "Shop" },
    { id: "orders", label: "My Orders" },
    { id: "bookings", label: "My Bookings" },
    { id: "booking", label: "Book Service" },
    { id: "profile", label: "Profile" },
  ];

  const renderPage = () => {
    switch (page) {
      case "overview": return <PageOverview onNav={navigate} cartCount={cartCount} />;
      case "orders": return <PageOrders onNav={navigate} onTrack={trackOrder} />;
      case "track": return <PageTrack orderId={trackedOrder} onBack={() => setPage("orders")} />;
      case "bookings": return <PageBookings onNav={navigate} />;
      case "booking": return <PageBooking />;
      case "shop": return <PageShop onAddToCart={addToCart} onViewProduct={viewProduct} />;
      case "product": return <PageProductDetail productId={viewedProduct} onBack={() => setPage("shop")} onAddToCart={addToCart} />;
      case "cart": return <PageCart cart={cart} onUpdateQty={updateQty} onRemove={removeItem} onNav={navigate} />;
      case "checkout": return <PageCheckout cart={cart} onNav={navigate} />;
      case "profile": return <PageProfile />;
      default: return <PageOverview onNav={navigate} />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <nav className="cnav">
        <div className="cnav-logo" onClick={() => navigate("overview")}>
          <div className="logo-hex">CE</div>
          <span className="logo-txt">Crown <em>Eve</em></span>
        </div>
        <div className="cnav-links">
          {NAV_ITEMS.map(n => (
            <button key={n.id} className={`cnl ${page === n.id || (page === "track" && n.id === "orders") || (page === "product" && n.id === "shop") ? "active" : ""}`} onClick={() => navigate(n.id)}>{n.label}</button>
          ))}
        </div>
        <div className="cnav-right">
          <button className="cart-btn" onClick={() => navigate("cart")}>
            🛒 Cart
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
          <div className="user-pill" onClick={() => navigate("profile")}>
            <div className="ua">AK</div>
            <span className="user-name-pill">Ali Kamran</span>
          </div>
        </div>
      </nav>
      <div className="main-wrap">
        <div className="page-wrap">{renderPage()}</div>
      </div>
    </>
  );
}
