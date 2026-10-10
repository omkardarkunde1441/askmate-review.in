import React, { useState, useEffect } from 'react';
import { CustomerReviewPage } from './components/CustomerReviewPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ThreeBackground } from './components/ThreeBackground';
import { BusinessConfig } from './types';
import { api } from './api';

const DEFAULT_FALLBACK_BUSINESS: BusinessConfig = {
  businessId: 'default',
  name: 'ASKMATE',
  category: 'Assignment Ordering Platform',
  welcomeMessage: 'Rate your recent assignment order, turnaround speed, and delivery quality. Your feedback helps us keep learning easy and effective!',
  googleReviewUrl: 'https://www.google.com/search?q=ASKMATE+reviews',
  brandColor: '#0f172a',
  logoUrl: '',
  positiveThreshold: 8,
  neutralThreshold: 5,
  updatedAt: new Date().toISOString(),
};

export default function App() {
  const [business, setBusiness] = useState<BusinessConfig>(DEFAULT_FALLBACK_BUSINESS);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'customer' | 'admin'>('customer');
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Initialize business config and check existing admin session
  useEffect(() => {
    const initApp = async () => {
      try {
        const config = await api.getBusinessConfig();
        setBusiness(config);
      } catch (err) {
        console.warn('Could not load remote business config, using defaults:', err);
      } finally {
        setIsLoadingConfig(false);
      }

      // Check stored admin session
      const storedToken = localStorage.getItem('askmate_admin_token');
      if (storedToken) {
        try {
          const auth = await api.checkAdminAuth(storedToken);
          if (auth.authenticated) {
            setAdminToken(storedToken);
            if (auth.business) setBusiness(auth.business);

            // If URL has ?admin=true, show dashboard immediately
            const params = new URLSearchParams(window.location.search);
            if (params.get('admin') === 'true') {
              setCurrentView('admin');
            }
          } else {
            localStorage.removeItem('askmate_admin_token');
          }
        } catch {
          localStorage.removeItem('askmate_admin_token');
        }
      } else {
        const params = new URLSearchParams(window.location.search);
        if (params.get('admin') === 'true') {
          setIsAdminLoginModalOpen(true);
        }
      }
    };

    initApp();
  }, []);

  const handleAdminLoginSuccess = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('askmate_admin_token', token);
    setCurrentView('admin');
  };

  const handleAdminLogout = async () => {
    if (adminToken) {
      await api.adminLogout(adminToken);
    }
    setAdminToken(null);
    localStorage.removeItem('askmate_admin_token');
    setCurrentView('customer');
  };

  if (isLoadingConfig) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-neutral-500 mt-3 font-display">
          Loading ASKMATE...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative font-sans">
      {/* 3D Animated Background with Movable Camera, Books, and Pens */}
      <ThreeBackground />

      {currentView === 'admin' && adminToken ? (
        <AdminDashboard
          token={adminToken}
          business={business}
          onLogout={handleAdminLogout}
          onViewCustomerPage={() => setCurrentView('customer')}
          onBusinessUpdated={setBusiness}
        />
      ) : (
        <CustomerReviewPage
          business={business}
          onOpenAdminLogin={() => {
            if (adminToken) {
              setCurrentView('admin');
            } else {
              setIsAdminLoginModalOpen(true);
            }
          }}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
