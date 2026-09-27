import React from 'react';
import { UserRole, IUser } from '../../types/db';
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  MapPin,
  Flame,
  Users,
  Settings,
  Activity,
  Home,
  CheckSquare,
  Navigation,
  User,
  HelpCircle,
  BarChart3,
  Layers,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface RoleSidebarProps {
  profile: IUser;
  currentPath?: string;
}

export function RoleSidebar({ profile, currentPath = '/dashboard' }: RoleSidebarProps) {
  const getNavItems = (role: UserRole): NavItem[] => {
    switch (role) {
      case 'citizen':
        return [
          { label: 'Dashboard', href: '/dashboard/citizen', icon: Home },
          { label: 'Report Incident', href: '/dashboard/citizen/report', icon: AlertTriangle, badge: 'Quick' },
          { label: 'My Reports', href: '/dashboard/citizen/my-reports', icon: FileText },
          { label: 'Alerts', href: '/dashboard/citizen/alerts', icon: ShieldAlert },
          { label: 'Safety Guide', href: '/dashboard/citizen/safety', icon: HelpCircle },
          { label: 'Profile', href: '/dashboard/profile', icon: User },
        ];

      case 'officer':
        return [
          { label: 'Dashboard', href: '/dashboard/officer', icon: Home },
          { label: 'Incident Queue', href: '/dashboard/officer/incidents', icon: Flame, badge: '5' },
          { label: 'Verifications', href: '/dashboard/officer/verifications', icon: CheckSquare, badge: '12' },
          { label: 'Roads', href: '/dashboard/officer/roads', icon: Navigation },
          { label: 'Risk Map', href: '/dashboard/officer/risk-map', icon: MapPin },
          { label: 'Alerts', href: '/dashboard/officer/alerts', icon: ShieldAlert },
          { label: 'District Reports', href: '/dashboard/officer/district-reports', icon: FileText },
          { label: 'Profile', href: '/dashboard/profile', icon: User },
        ];

      case 'admin':
        return [
          { label: 'Dashboard', href: '/dashboard/admin', icon: Home },
          { label: 'Users', href: '/dashboard/admin/users', icon: Users },
          { label: 'Districts', href: '/dashboard/admin/districts', icon: Layers },
          { label: 'Incidents', href: '/dashboard/admin/incidents', icon: Flame },
          { label: 'Alerts', href: '/dashboard/admin/alerts', icon: ShieldAlert },
          { label: 'Risk Analytics', href: '/dashboard/admin/risk-analytics', icon: BarChart3 },
          { label: 'Sync Monitor', href: '/dashboard/admin/sync-monitor', icon: Activity },
          { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems(profile.role);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'citizen':
        return { bg: '#dcfce7', text: '#15803d', label: 'Citizen Portal' };
      case 'officer':
        return { bg: '#dbeafe', text: '#1e40af', label: 'Field Officer' };
      case 'admin':
        return { bg: '#fef3c7', text: '#b45309', label: 'System Admin' };
    }
  };

  const badgeStyle = getRoleBadgeColor(profile.role);

  return (
    <aside
      style={{
        width: '260px',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1e293b',
        boxSizing: 'border-box',
      }}
    >
      {/* Brand & Platform Header */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#fff',
            }}
          >
            P
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>PARVAAH</h2>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Landslide Warning System</span>
          </div>
        </div>

        {/* User Role Pill */}
        <div
          style={{
            marginTop: '14px',
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: badgeStyle.bg,
            color: badgeStyle.text,
            fontSize: '12px',
            fontWeight: 600,
            display: 'inline-block',
          }}
        >
          {badgeStyle.label}
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px', paddingLeft: '8px' }}>
          Navigation
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
            return (
              <li key={item.href} style={{ marginBottom: '4px' }}>
                <a
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    backgroundColor: isActive ? '#1e293b' : 'transparent',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} color={isActive ? '#38bdf8' : '#64748b'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '9999px',
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer Profile Summary */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #1e293b',
          backgroundColor: '#020617',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#334155',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          {profile.fullName?.charAt(0) || 'U'}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {profile.fullName}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{profile.phone}</div>
        </div>
      </div>
    </aside>
  );
}
