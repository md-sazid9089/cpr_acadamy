import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaFacebookF,
  FaWhatsapp,
  FaYoutube,
  FaTelegram,
  FaPhone,
} from 'react-icons/fa6';
import Logo from './Logo.jsx';
import { CONTACT } from '@/constants';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="relative border-t border-slate-800 bg-[#0c0d28] text-white">
      {/* ── Main 4-Column Footer Content ── */}
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* ── Column 1: Brand & Contact Info ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Logo compact className="h-10 w-10" />
            <span className="text-lg font-bold text-white tracking-wide">
              CPR Academy
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-300">
            CPR Academy is Bangladesh's premier medical education platform for
            FCPS Part-1, BCS (Health), Residency, and MBBS examination
            preparation.
          </p>

          <p className="text-xs leading-relaxed text-slate-400">
            {CONTACT.address || 'House-32, Road-07, GEC Circle, Chattogram - 4000'}
          </p>

          <div className="space-y-1 text-xs">
            <p className="text-slate-300">
              <strong className="text-white">Helpline:</strong>{' '}
              <a
                href="tel:+8801329672052"
                className="transition-colors hover:text-blue-400"
              >
                +88 01329 672052
              </a>
            </p>
            <p className="text-slate-300">
              <strong className="text-white">Email:</strong>{' '}
              <a
                href={`mailto:${CONTACT.email || 'support@cpr.academy'}`}
                className="transition-colors hover:text-blue-400"
              >
                {CONTACT.email || 'support@cpr.academy'}
              </a>
            </p>
          </div>
        </div>

        {/* ── Column 2: Useful Links ── */}
        <div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Useful Links
            </h3>
            <div className="mt-1.5 h-0.5 w-10 rounded bg-blue-500" />
          </div>

          <ul className="mt-5 space-y-3 text-xs text-slate-300">
            <li>
              <Link to="/about" className="transition-colors hover:text-blue-400">
                About us
              </Link>
            </li>
            <li>
              <a
                href="https://bcps.edu.bd"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-blue-400"
              >
                BCPS Link
              </a>
            </li>
            <li>
              <a
                href="https://bpsc.gov.bd"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-blue-400"
              >
                BPSC Link
              </a>
            </li>
            <li>
              <Link to="/faq" className="transition-colors hover:text-blue-400">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* ── Column 3: Our Company ── */}
        <div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Our Company
            </h3>
            <div className="mt-1.5 h-0.5 w-10 rounded bg-blue-500" />
          </div>

          <ul className="mt-5 space-y-3 text-xs text-slate-300">
            <li>
              <Link to="/faq" className="transition-colors hover:text-blue-400">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link to="/faq" className="transition-colors hover:text-blue-400">
                Refund Policy
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition-colors hover:text-blue-400">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/batches" className="transition-colors hover:text-blue-400">
                All Batches
              </Link>
            </li>
          </ul>
        </div>

        {/* ── Column 4: Newsletter SignUp & Social Links ── */}
        <div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Newsletter SignUp!
            </h3>
            <div className="mt-1.5 h-0.5 w-10 rounded bg-blue-500" />
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-300">
            Subscribe to our YouTube channel and newsletter for the latest videos
            and updates.
          </p>

          {/* Email Subscription Form */}
          <form onSubmit={handleSubscribe} className="mt-4">
            <div className="flex items-center rounded-full bg-[#16193d] p-1 border border-slate-700/70 focus-within:border-blue-500">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Type your email add"
                required
                className="w-full bg-transparent px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-[#1d63d3] px-4 py-1.5 text-xs font-bold text-white shadow transition hover:bg-blue-600"
              >
                {subscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </div>
          </form>

          {/* Follow Us */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-300">Follow Us:</p>
            <div className="mt-2.5 flex items-center gap-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-[#1877f2] hover:text-white"
              >
                <FaFacebookF className="h-3.5 w-3.5" />
              </a>

              <a
                href="https://wa.me/8801329672052"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-[#25d366] hover:text-white"
              >
                <FaWhatsapp className="h-4 w-4" />
              </a>

              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-[#ff0000] hover:text-white"
              >
                <FaYoutube className="h-4 w-4" />
              </a>

              <a
                href="https://telegram.org"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-[#229ed9] hover:text-white"
              >
                <FaTelegram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Copyright Bar ── */}
      <div className="border-t border-slate-800/80 bg-[#08091d]">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-center text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} CPR Academy. All Rights Reserved.</p>
          <p className="flex gap-4 text-slate-400">
            <Link to="/faq" className="hover:text-blue-400">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/faq" className="hover:text-blue-400">
              Terms &amp; Conditions
            </Link>
          </p>
        </div>
      </div>

      {/* ── Floating WhatsApp / Helpline Call Button ── */}
      <a
        href="tel:+8801329672052"
        aria-label="Call helpline"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-400/50"
      >
        <FaPhone className="h-5 w-5" />
      </a>
    </footer>
  );
}
