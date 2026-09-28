'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Nav Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main App Content Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Pass down mobile nav trigger to children via clone element if needed or React context */}
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // inject onOpenMobileNav prop if child is a page expecting it
            return React.cloneElement(child as React.ReactElement<any>, {
              onOpenMobileNav: () => setMobileNavOpen(true),
            });
          }
          return child;
        })}
      </div>
    </div>
  );
}
