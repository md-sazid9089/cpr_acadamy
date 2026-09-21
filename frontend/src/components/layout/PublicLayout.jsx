import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import UtilityBar from './UtilityBar.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import ChatBubble from './ChatBubble.jsx';
import usePageTitle from '@/hooks/usePageTitle.js';
import { cn } from '@/lib/utils';
import './PublicLayout.css';

/**
 * Routes whose first section is a full-bleed hero. On these the navbar floats
 * over the page instead of sitting above it, so the hero's artwork runs all the
 * way up behind the transparent bar. The hero itself adds matching top padding
 * so its content still clears the navbar.
 */
const OVERLAY_NAV_ROUTES = ['/'];

/** Shell for every public marketing/course/auth page. */
export default function PublicLayout() {
  const { pathname } = useLocation();
  const overlayNav = OVERLAY_NAV_ROUTES.includes(pathname);
  usePageTitle();

  return (
    <div className={cn('flex min-h-screen flex-col bg-surface-light dark:bg-surface-dark', pathname === '/' && 'homepage-scale')}>
      <UtilityBar />
      <Navbar />
      {/* -mt-20 cancels the navbar's own height (h-20) so the next section
          starts underneath it. Applied only where a hero can absorb it —
          elsewhere it would slide headings under the bar. */}
      <main className={cn('flex-1', overlayNav && '-mt-20')}>
        <Outlet />
      </main>
      <Footer />
      <ChatBubble />
      <ScrollRestoration />
    </div>
  );
}
