import React, { useId } from 'react';
import './SearchInput.css';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M10.979 16.8991C11.0591 17.4633 10.6657 17.9926 10.0959 17.9994C8.52021 18.0183 6.96549 17.5712 5.63246 16.7026C4.00976 15.6452 2.82575 14.035 2.30018 12.1709C1.77461 10.3068 1.94315 8.31525 2.77453 6.56596C3.60592 4.81667 5.04368 3.42838 6.82101 2.65875C8.59833 1.88911 10.5945 1.79039 12.4391 2.3809C14.2837 2.97141 15.8514 4.21105 16.8514 5.86977C17.8513 7.52849 18.2155 9.49365 17.8764 11.4005C17.5979 12.967 16.8603 14.4068 15.7684 15.543C15.3736 15.9539 14.7184 15.8787 14.3617 15.4343C14.0051 14.9899 14.0846 14.3455 14.4606 13.9173C15.1719 13.1073 15.6538 12.1134 15.8448 11.0393C16.0964 9.62426 15.8261 8.166 15.0841 6.93513C14.3421 5.70426 13.1788 4.78438 11.81 4.34618C10.4412 3.90799 8.95988 3.98125 7.641 4.55236C6.32213 5.12348 5.25522 6.15367 4.63828 7.45174C4.02135 8.74982 3.89628 10.2276 4.28629 11.6109C4.67629 12.9942 5.55489 14.1891 6.75903 14.9737C7.67308 15.5693 8.72759 15.8979 9.80504 15.9333C10.3746 15.952 10.8989 16.3349 10.979 16.8991Z"
    />
    <rect
      transform="rotate(-49.6812 12.2469 14.8859)"
      rx="1"
      height="10.1881"
      width="2"
      y="14.8859"
      x="12.2469"
      fill="currentColor"
    />
  </svg>
);

const SearchInput = ({
  value = '',
  onChange,
  label = 'Search...',
  id: idProp,
  className = '',
  variant = 'default',
  clearable = false,
  onClear,
  disabled = false,
  pill = false,
  style,
  ...rest
}) => {
  const autoId = useId();
  const id = idProp || autoId;
  const hasValue = String(value ?? '').length > 0;

  const variantClass = [
    variant === 'pos' ? 'search-field--pos' : '',
    variant === 'dark' ? 'search-field--dark' : '',
    variant === 'compact' ? 'search-field--compact' : '',
    pill ? 'search-field--pill' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }
    onChange?.({ target: { value: '' } });
  };

  return (
    <div
      className={`search-field${hasValue ? ' has-value' : ''}${variantClass ? ` ${variantClass}` : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={label}
        disabled={disabled}
        className="search-field-input"
        {...rest}
      />
      <label htmlFor={id} className="search-field-label">
        {label}
      </label>
      {clearable && hasValue && (
        <button type="button" className="search-field-clear" aria-label="Clear search" onClick={handleClear}>
          ✕
        </button>
      )}
      <div className="search-field-icon" aria-hidden="true">
        <SearchIcon />
      </div>
    </div>
  );
};

export default SearchInput;
