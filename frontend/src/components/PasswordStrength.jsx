import React from 'react';

const RULES = [
  { id: 'len',     label: 'At least 8 characters',         test: p => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter (A–Z)',     test: p => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'One lowercase letter (a–z)',     test: p => /[a-z]/.test(p) },
  { id: 'number',  label: 'One number (0–9)',               test: p => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$%…)', test: p => /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(p) },
];

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const passed = RULES.filter(r => r.test(password)).length;
  const color = passed <= 2 ? '#ef4444' : passed <= 4 ? '#f97316' : '#22c55e';

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= passed ? color : 'rgba(255,255,255,0.1)',
            transition: 'background 0.2s'
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {RULES.map(rule => {
          const ok = rule.test(password);
          return (
            <span key={rule.id} style={{
              fontSize: 11,
              color: ok ? '#22c55e' : 'rgba(255,255,255,0.4)',
              transition: 'color 0.2s'
            }}>
              {ok ? '✓' : '○'} {rule.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const validatePassword = (password) => {
  if (!password || password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(password)) return 'Password must contain at least one special character.';
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (!/^(\+92|0092|03)[0-9]{9,10}$/.test(cleaned)) {
    return 'Enter a valid Pakistani number (03XXXXXXXXX or +92XXXXXXXXXX)';
  }
  return null;
};

export default PasswordStrength;
