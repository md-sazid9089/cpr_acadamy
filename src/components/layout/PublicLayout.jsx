import { Outlet, ScrollRestoration } from 'react-router-dom';
import AnnouncementStrip from './AnnouncementStrip.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import ChatBubble from './ChatBubble.jsx';

/** Shell for every public marketing/course/auth page. */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-surface-dark">
      <AnnouncementStrip />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatBubble />
      <ScrollRestoration />
    </div>
  );
}
