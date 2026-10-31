import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FloatingAIChat from '@/components/ai/FloatingAIChat';
import IOSBottomNav from '@/components/layout/IOSBottomNav';

export default function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const location = useLocation();

  // Automatically close mobile menu whenever navigation occurs
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar */}
      <Sidebar
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="main-content">
        <Header onToggleMobile={() => setMobileNavOpen(prev => !prev)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* Floating & Bottom-Sheet AI Copilot */}
      <FloatingAIChat
        externalOpen={aiChatOpen}
        onToggle={setAiChatOpen}
      />

      {/* Native iOS Bottom Tab Bar (Only visible on mobile screens) */}
      <IOSBottomNav
        onOpenAIChat={() => setAiChatOpen(prev => !prev)}
        onToggleMore={() => setMobileNavOpen(true)}
      />
    </div>
  );
}

