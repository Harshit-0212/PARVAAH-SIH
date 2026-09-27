import React from 'react';
import { getUserProfile } from '../../../lib/auth/roleGuards';
import { getDashboardSummary } from '../../../lib/services/dashboardService';
import { AccessDenied } from '../../../components/ui/AccessDenied';
import { AlertTriangle, ShieldAlert, FileText, Navigation, HelpCircle, CheckCircle, Clock } from 'lucide-react';

export default async function CitizenDashboardPage() {
  const profile = await getUserProfile();

  if (!profile) {
    return <AccessDenied currentRole="citizen" message="Please log in to view your citizen dashboard." />;
  }

  if (profile.role !== 'citizen' && profile.role !== 'admin') {
    return <AccessDenied requiredRole="citizen" currentRole={profile.role} message="This portal is designed specifically for citizens." />;
  }

  // Fetch real-time data from MongoDB via dashboardService
  const dashboardData = await getDashboardSummary('KAMRUP_METRO');

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '1000px' }}>
      {/* Welcome & Quick Action Card (Mobile Optimized) */}
      <div
        style={{
          background: 'linear-[#1e293b]',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: '0 10px 20px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8', fontWeight: 700 }}>
              Citizen Emergency Portal (MongoDB Engine)
            </span>
            <h2 style={{ margin: '4px 0 8px 0', fontSize: '24px', fontWeight: 800 }}>
              Namaste, {profile.fullName}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
              Report landslides, mudslides, or highway blockages instantly. Works even with low connectivity.
            </p>
          </div>

          <a
            href="/dashboard/citizen/report"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              padding: '14px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '15px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            }}
          >
            <AlertTriangle size={20} /> Report Incident Now
          </a>
        </div>
      </div>

      {/* Grid Layout for Citizen Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Widget 1: Nearby Emergency Alerts from MongoDB */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldAlert color="#dc2626" size={22} />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#991b1b' }}>
              Nearby Emergency Alerts ({dashboardData.activeAlertsCount})
            </h3>
          </div>

          {dashboardData.activeAlerts.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#64748b' }}>No active emergency alerts in your vicinity.</p>
          ) : (
            dashboardData.activeAlerts.map((alert) => (
              <div
                key={alert._id?.toString()}
                style={{
                  backgroundColor: '#fef2f2',
                  borderLeft: '4px solid #dc2626',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  marginBottom: '12px',
                }}
              >
                <strong style={{ color: '#991b1b', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                  {alert.title}
                </strong>
                <p style={{ margin: 0, fontSize: '13px', color: '#7f1d1d', lineHeight: '1.4' }}>
                  {alert.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Widget 2: Nearest Risky Roads from MongoDB */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Navigation color="#d97706" size={22} />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              High-Risk Road Stretches
            </h3>
          </div>

          {dashboardData.roads.map((road) => (
            <div
              key={road._id?.toString()}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '8px',
                marginBottom: '8px',
              }}
            >
              <div>
                <strong style={{ fontSize: '14px', color: '#92400e' }}>{road.roadName}</strong>
                <span style={{ display: 'block', fontSize: '12px', color: '#b45309' }}>Code: {road.roadCode || 'NH-27'}</span>
              </div>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {road.riskLevel}
              </span>
            </div>
          ))}
        </div>

        {/* Widget 3: Recent Incidents from MongoDB */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <FileText color="#2563eb" size={22} />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Recent District Incidents ({dashboardData.recentIncidentsCount})
            </h3>
          </div>

          {dashboardData.recentIncidents.map((incident) => (
            <div
              key={incident._id?.toString()}
              style={{
                padding: '12px',
                border: '1px solid #f1f5f9',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>{incident.incidentType}</strong>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                  }}
                >
                  {incident.status.replace('_', ' ')}
                </span>
              </div>
              <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b' }}>{incident.description}</p>
            </div>
          ))}
        </div>

        {/* Widget 4: Preparedness & Safety Advice */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <HelpCircle color="#059669" size={22} />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Monsoon Safety Tips
            </h3>
          </div>
          <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
            <li>Avoid mountain highways during active heavy rainfall alerts.</li>
            <li>Look for warning signs: tilting trees, muddy runoff, or sudden trickle of rocks.</li>
            <li>Save emergency helpline 1077 (Assam State Disaster Management Authority).</li>
            <li>Reports stored while offline auto-sync to MongoDB when signal returns.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
