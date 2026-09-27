import React from 'react';
import { getUserProfile } from '../../lib/auth/roleGuards';
import { RoleSidebar } from '../../components/navigation/RoleSidebar';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile();

  if (!profile) {
    // Redirect to login if user session does not exist
    redirect('/login?redirectTo=/dashboard');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Role-Based Dynamic Navigation Sidebar */}
      <RoleSidebar profile={profile} />

      {/* Main Dashboard Content Viewport */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', boxSizing: 'border-box' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              PARVAAH Platform Dashboard
            </h1>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Real-time Landslide Early Warning & Emergency Response
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                fontSize: '13px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontWeight: 600,
              }}
            >
              Role: <span style={{ color: '#2563eb', textTransform: 'uppercase' }}>{profile.role}</span>
            </div>
            <a
              href="/logout"
              style={{
                fontSize: '13px',
                color: '#ef4444',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Sign Out
            </a>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
