import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  collapsed: boolean;
  toggle: () => void;
}

const items = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Hosted zones', href: '/hosted-zones' },
  { name: 'Traffic policies', href: '/traffic-policies' },
  { name: 'Health checks', href: '/health-checks' },
  { name: 'Resolver', href: '/resolver' },
  { name: 'Profiles', href: '/profiles' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggle }) => {
  const pathname = usePathname();

  return (
    <aside
      className={`bg-sidebar-bg text-sidebar-text transition-width duration-200 ${collapsed ? 'w-16' : 'w-64'} flex flex-col`}
    >
      <button
        onClick={toggle}
        className="p-2 hover:bg-sidebar-border"
        aria-label="Toggle sidebar"
      >
        {collapsed ? '▶' : '◀'}
      </button>
      <nav className="flex-1 mt-4">
        {items.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={`flex items-center px-4 py-2 hover:bg-sidebar-border transition-colors ${isActive ? 'bg-sidebar-border text-sidebar-active' : ''}`}
              >
                <span className={collapsed ? 'hidden' : 'block'}>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
