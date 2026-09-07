import React, { useState } from 'react';
import Navbar from '@/components/TopNavBar';
import Sidebar from '@/components/Sidebar';
import '@/app/globals.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-body-bg">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="p-6 overflow-auto bg-content-bg">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
