/**
 * DM Auto — Public Layout
 *
 * Single source of truth for the public site chrome.
 * Every public route renders inside this layout, which mounts
 * the Figma `Header1` + `Footer1` once via `<DmAutoHeader />` / `<DmAutoFooter />`.
 *
 * Pages MUST NOT render their own header / footer — there is one,
 * unified design across the entire public site.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { DmAutoHeader, DmAutoFooter } from './DmAutoPublicLayout';

const PublicLayout = () => (
  <div className="public-theme bibi-about min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
    <DmAutoHeader />
    <main className="flex-grow bibi-about__main">
      <Outlet />
    </main>
    <DmAutoFooter />
  </div>
);

export default PublicLayout;
