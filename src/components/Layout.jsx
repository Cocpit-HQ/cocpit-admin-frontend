import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface text-on-surface font-body-md overflow-hidden relative">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main className="flex-1 md:ml-[80px] mt-16 p-4 md:p-margin-desktop h-[calc(100vh-64px)] overflow-y-auto w-full transition-all duration-300">
        <div className="max-w-max-width mx-auto pb-xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
