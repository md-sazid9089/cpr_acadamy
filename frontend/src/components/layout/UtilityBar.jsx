import { FaHeadset, FaFacebookF, FaWhatsapp } from 'react-icons/fa6';
import { CONTACT } from '@/constants';

const SOCIAL_LINKS = [
  { label: 'Page', href: CONTACT.facebookPage, icon: FaFacebookF },
  { label: 'Group', href: CONTACT.facebookGroup, icon: FaFacebookF },
  { label: 'WhatsApp', href: `https://wa.me/${CONTACT.whatsapp}`, icon: FaWhatsapp },
];

/** Slim contact/social bar above the navbar on every public page. */
export default function UtilityBar() {
  return (
    <div className="bg-brand-800 text-white dark:bg-brand-950">
      <div className="container-page flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs sm:text-sm">
        <a
          href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
          className="flex items-center gap-2 font-medium transition-colors hover:text-brand-200"
        >
          <FaHeadset aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {CONTACT.phone}
        </a>

        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-medium transition-colors hover:text-brand-200"
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
