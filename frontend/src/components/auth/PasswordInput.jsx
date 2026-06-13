import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const LockIcon = () => (
  <svg className="auth-field-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zm-6 9a2 2 0 110-4 2 2 0 010 4zm3-9H9V6a3 3 0 016 0v2z" />
  </svg>
);

const PasswordInput = ({
  value,
  onChange,
  placeholder = '••••••••',
  id,
  name,
  required = false,
  minLength,
  variant = 'plain',
}) => {
  const [show, setShow] = useState(false);

  const toggle = (
    <button
      type="button"
      className="auth-password-toggle"
      onClick={() => setShow((visible) => !visible)}
      aria-label={show ? 'Hide password' : 'Show password'}
      tabIndex={-1}
    >
      {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
    </button>
  );

  const input = (
    <input
      id={id}
      name={name}
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      minLength={minLength}
      className={variant === 'field' ? 'auth-input' : undefined}
    />
  );

  if (variant === 'field') {
    return (
      <div className="auth-field auth-field--password">
        <LockIcon />
        {input}
        {toggle}
      </div>
    );
  }

  return (
    <div className="auth-password-wrap">
      {input}
      {toggle}
    </div>
  );
};

export default PasswordInput;
