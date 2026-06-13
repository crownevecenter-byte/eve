import React from 'react';

const NeuCardMarquee = ({ words = [], className = '' }) => {
  const first = words[0] || 'Crown';
  const second = words[1] || words[0] || 'Eve';

  return (
    <div className={`ce-neu-marquee${className ? ` ${className}` : ''}`} aria-hidden="true">
      <div className="ce-neu-marquee-track">
        <span className="ce-neu-marquee-word">{first}</span>
        <span className="ce-neu-marquee-word">{second}</span>
        <span className="ce-neu-marquee-word">{first}</span>
      </div>
    </div>
  );
};

export default NeuCardMarquee;
