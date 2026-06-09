import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="flex h-screen bg-surface text-on-surface font-body-md overflow-hidden">
      <Sidebar />
      <Header />
      <main className="ml-[280px] mt-16 p-margin-desktop h-[calc(100vh-64px)] overflow-y-auto w-full">
        <div className="max-w-max-width mx-auto pb-xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
