import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { UserRole } from '../../types/db';

interface AccessDeniedProps {
  requiredRole?: UserRole | UserRole[];
  currentRole?: UserRole;
  message?: string;
}

export function AccessDenied({
  requiredRole = 'officer',
  currentRole = 'citizen',
  message = 'You do not have administrative or field officer permission to access this section.',
}: AccessDeniedProps) {
  const getRoleRedirect = (role: UserRole) => {
    switch (role) {
      case 'citizen':
        return '/dashboard/citizen';
      case 'officer':
        return '/dashboard/officer';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/dashboard';
    }
  };

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #fee2e2',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.1)',
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <h1 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 700, color: '#991b1b' }}>
          403 - Access Denied
        </h1>

        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
          {message}
        </p>

        {/* Security Audit Detail Box */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            fontSize: '12px',
            textAlign: 'left',
            color: '#334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '6px' }}>
            <Lock size={14} color="#64748b" /> Security Context:
          </div>
          <div>Your Active Role: <strong style={{ textTransform: 'uppercase', color: '#0284c7' }}>{currentRole}</strong></div>
          <div>Required Permission: <strong style={{ textTransform: 'uppercase', color: '#dc2626' }}>{Array.isArray(requiredRole) ? requiredRole.join(' | ') : requiredRole}</strong></div>
        </div>

        <a
          href={getRoleRedirect(currentRole)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '12px 20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        >
          <ArrowLeft size={16} /> Return to My Authorized Dashboard
        </a>
      </div>
    </div>
  );
}
