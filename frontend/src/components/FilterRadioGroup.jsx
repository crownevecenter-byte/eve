import React, { useId } from 'react';
import './FilterRadioGroup.css';

const normalizeOption = (option) => {
  if (typeof option === 'string') {
    return { value: option, label: option };
  }
  return { value: option.value, label: option.label ?? option.value };
};

const FilterRadioGroup = ({
  name: nameProp,
  value,
  onChange,
  options = [],
  className = '',
  compact = false,
  wrap = false,
  style,
}) => {
  const autoName = useId();
  const name = nameProp || autoName;

  return (
    <div
      className={`filter-radio-input${compact ? ' filter-radio-input--compact' : ''}${wrap ? ' filter-radio-input--wrap' : ''}${className ? ` ${className}` : ''}`}
      role="radiogroup"
      style={style}
    >
      {options.map((raw) => {
        const { value: optValue, label: optLabel } = normalizeOption(raw);
        const id = `${name}-${String(optValue).replace(/[^a-zA-Z0-9_-]/g, '-')}`;

        return (
          <label key={String(optValue)} className="filter-radio-label" htmlFor={id}>
            <input
              id={id}
              type="radio"
              name={name}
              value={optValue}
              checked={value === optValue}
              onChange={() => onChange(optValue)}
            />
            <span className="filter-radio-text">{optLabel}</span>
          </label>
        );
      })}
    </div>
  );
};

export default FilterRadioGroup;
