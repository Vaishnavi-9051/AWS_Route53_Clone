import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between bg-header-bg text-header-text h-12 px-4">
      <div className="flex items-center space-x-4">
        <button onClick={toggleSidebar} className="text-header-text hover:text-white">
          ☰
        </button>
        <Link href="/">
          <a className="font-bold text-lg">AWS</a>
        </Link>
        <span className="ml-2">Route 53</span>
        {/* Placeholder for search */}
        <input
          type="text"
          placeholder="Search"
          className="ml-8 px-2 py-1 rounded bg-white text-black focus:outline-none"
        />
      </div>
      <div className="flex items-center space-x-4">
        <span>{user?.username ?? 'Guest'}</span>
        {user && (
          <button onClick={logout} className="bg-primary hover:bg-primary-hover text-white px-2 py-1 rounded">
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
