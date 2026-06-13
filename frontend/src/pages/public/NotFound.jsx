import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const shopPath = user?.role === 'CUSTOMER' ? '/my/shop' : '/shop';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Outfit:wght@500;600;700;800&display=swap');
        .notfound-wrap * { box-sizing: border-box; margin: 0; padding: 0; }
        .notfound-wrap {
          min-height: 100vh;
          background: #080809;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .notfound-road {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 110px;
          background: #111113;
        }
        .notfound-road::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 3px;
          background: repeating-linear-gradient(90deg, #FF4D00 0, #FF4D00 40px, transparent 40px, transparent 80px);
          opacity: .35;
        }
        .notfound-skid {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 44px;
        }
        .skid-l, .skid-r {
          width: 18px;
          height: 100px;
          background: repeating-linear-gradient(to top, #222 0, #222 6px, transparent 6px, transparent 10px);
          border-radius: 3px 3px 0 0;
          opacity: .85;
        }
        .skid-l { transform: rotate(-4deg) translateX(-6px); }
        .skid-r { transform: rotate(4deg) translateX(6px); }
        .notfound-num {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(120px, 25vw, 220px);
          color: #FF4D00;
          line-height: .88;
          letter-spacing: .02em;
          position: relative;
          z-index: 2;
          text-shadow: 0 0 60px rgba(255, 77, 0, 0.15);
        }
        .notfound-num::after {
          content: '404';
          position: absolute;
          inset: 0;
          color: transparent;
          -webkit-text-stroke: 1px rgba(255, 77, 0, .18);
          z-index: -1;
          transform: translate(3px, 4px);
        }
        .notfound-badge {
          background: rgba(255, 77, 0, .1);
          border: 1px solid rgba(255, 77, 0, .25);
          color: #FF4D00;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .2em;
          text-transform: uppercase;
          padding: 6px 18px;
          border-radius: 20px;
          margin-bottom: 24px;
        }
        .notfound-headline {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(28px, 5vw, 42px);
          color: #F0EFE9;
          letter-spacing: .02em;
          margin-bottom: 12px;
          margin-top: 10px;
          font-weight: 500;
        }
        .notfound-sub {
          font-size: 15px;
          color: #7A7977;
          line-height: 1.6;
          text-align: center;
          max-width: 320px;
          margin-bottom: 40px;
        }
        .notfound-btns {
          display: flex;
          gap: 12px;
          position: relative;
          z-index: 2;
        }
        .notfound-btn-p {
          background: transparent;
          color: #F0EFE9;
          border: 1px solid rgba(255, 255, 255, .1);
          padding: 12px 24px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .notfound-btn-g {
          background: transparent;
          color: #F0EFE9;
          border: 1px solid rgba(255, 255, 255, .1);
          padding: 12px 24px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .notfound-btn-p:hover { background: rgba(255, 255, 255, .04); border-color: rgba(255, 255, 255, .2); }
        .notfound-btn-g:hover { background: rgba(255, 255, 255, .04); border-color: rgba(255, 255, 255, .2); }
        .notfound-bike {
          width: 90px;
          height: 50px;
          margin-bottom: 24px;
          position: relative;
          z-index: 2;
        }
        .notfound-cloud {
          position: absolute;
          right: 15%;
          top: 25%;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 77, 0, .35);
          animation: notfound-puff 1.4s ease-out forwards;
        }
        .notfound-cloud:nth-child(2) { right: 14%; top: 33%; width: 5px; height: 5px; animation-delay: .12s; }
        .notfound-cloud:nth-child(3) { right: 16%; top: 29%; width: 4px; height: 4px; animation-delay: .22s; }
        @keyframes notfound-puff {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(4) translateX(14px); }
        }
      `}</style>

      <div className="notfound-wrap">
        <div className="notfound-cloud"></div>
        <div className="notfound-cloud"></div>
        <div className="notfound-cloud"></div>

        <svg className="notfound-bike" viewBox="0 0 72 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="28" r="10" stroke="#FF4D00" strokeWidth="2" fill="none"/>
          <circle cx="14" cy="28" r="3" fill="#FF4D00"/>
          <circle cx="58" cy="28" r="10" stroke="#FF4D00" strokeWidth="2" fill="none"/>
          <circle cx="58" cy="28" r="3" fill="#FF4D00"/>
          <path d="M14 28L26 14H42L52 28" stroke="#FF4D00" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <path d="M26 14L30 6H40" stroke="#FF4D00" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <path d="M40 6L52 28" stroke="#FF4D00" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M34 14L30 6" stroke="#FF4D00" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <ellipse cx="44" cy="8" rx="5" ry="4" fill="rgba(255,77,0,.15)" stroke="#FF4D00" strokeWidth="1"/>
        </svg>

        <div className="notfound-badge">WRONG LANE</div>
        <div className="notfound-num">404</div>
        <div className="notfound-headline">You rode off the map.</div>
        <div className="notfound-sub">This page doesn't exist. Even the best riders miss an exit sometimes.</div>

        <div className="notfound-btns">
          <button className="notfound-btn-p" onClick={() => navigate(-1)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Ride Home
          </button>
          <button className="notfound-btn-g" onClick={() => navigate(shopPath)}>
            Browse Shop
          </button>
        </div>

        <div className="notfound-road">
          <div className="notfound-skid">
            <div className="skid-l"></div>
            <div className="skid-r"></div>
          </div>
        </div>
      </div>
    </>
  );
}
