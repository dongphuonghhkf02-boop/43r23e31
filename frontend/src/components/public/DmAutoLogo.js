import React from 'react';
import { Link } from 'react-router-dom';

/**
 * DM AUTO logo — original brand PNG (integrated speed-streaks + "CARS" tag).
 * Uses image-rendering hints so browsers keep it crisp at common display sizes.
 */
export const DmAutoLogo = ({ height = 48, className = '', to = '/' }) => {
  const Wrapper = to ? Link : 'div';
  const props = to ? { to } : {};
  return (
    <Wrapper
      {...props}
      className={`inline-flex items-center ${className}`}
      data-testid="site-logo"
      aria-label="DM AUTO"
    >
      <img
        src="/dm-auto-logo.png"
        alt="DM AUTO"
        style={{
          height,
          width: 'auto',
          display: 'block',
          imageRendering: 'auto',
        }}
        draggable={false}
      />
    </Wrapper>
  );
};

export default DmAutoLogo;
