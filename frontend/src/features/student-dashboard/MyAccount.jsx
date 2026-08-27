import { useState } from 'react';
import { FaUser, FaMobileScreen, FaShieldHalved } from 'react-icons/fa6';
import DashboardPageHeader from './components/DashboardPageHeader.jsx';
import DashboardTabs from './components/DashboardTabs.jsx';
import ProfileTab from './components/account/ProfileTab.jsx';
import DeviceTab from './components/account/DeviceTab.jsx';
import SecurityTab from './components/account/SecurityTab.jsx';

const TABS = [
  { id: 'profile', label: 'My Profile', icon: FaUser, iconColor: 'text-[#1c4d96]' },
  { id: 'device', label: 'My Device', icon: FaMobileScreen, iconColor: 'text-[#1c4d96]' },
  { id: 'security', label: 'Security', icon: FaShieldHalved, iconColor: 'text-[#1c4d96]' },
];

const PANELS = { profile: ProfileTab, device: DeviceTab, security: SecurityTab };

/** /dashboard/account — profile, bound devices and password, across three tabs. */
export default function MyAccount() {
  const [activeTab, setActiveTab] = useState('profile');
  const Panel = PANELS[activeTab];

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="My Account" backTo="/dashboard" />

      <DashboardTabs tabs={TABS} value={activeTab} onChange={setActiveTab} />

      <div className="overflow-hidden rounded-2xl border border-blue-400 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-surface-dark-subtle">
        <Panel />
      </div>
    </div>
  );
}
