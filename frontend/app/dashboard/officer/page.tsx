import React from 'react';
import { getUserProfile } from '../../../lib/auth/roleGuards';
import { getDashboardSummary } from '../../../lib/services/dashboardService';
import { AccessDenied } from '../../../components/ui/AccessDenied';
import { CheckSquare, Flame, Navigation, CheckCircle2, XCircle } from 'lucide-react';

export default async function OfficerDashboardPage() {
  const profile = await getUserProfile();

  if (!profile) {
    return <AccessDenied currentRole="officer" message="Please sign in to access officer field verification tools." />;
  }

  if (profile.role !== 'officer' && profile.role !== 'admin') {
    return (
      <AccessDenied
        requiredRole={['officer', 'admin']}
        currentRole={profile.role}
        message="Only designated district field officers and emergency responders can access verification tools."
      />
    );
  }

  const districtCode = 'KAMRUP_METRO';
  const data = await getDashboardSummary(districtCode);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '1200px' }}>
      {/* Officer Header Banner with MongoDB District Scoping */}
      <div
        style={{
          backgroundColor: '#0284c7',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#bae6fd', fontWeight: 700 }}>
            Field Operations & Verification Command (MongoDB Engine)
          </div>
          <h2 style={{ margin: '4px 0 4px 0', fontSize: '24px', fontWeight: 800 }}>
            District Operations: {data.district?.name || 'Kamrup Metropolitan'}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#e0f2fe' }}>
            Assigned Officer: <strong>{profile.fullName}</strong> | District Code: <strong>{districtCode}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '12px 18px', borderRadius: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#e0f2fe' }}>Active Incidents</span>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{data.recentIncidentsCount}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '12px 18px', borderRadius: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#e0f2fe' }}>High Risk Roads</span>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{data.highRiskRoadsCount}</div>
          </div>
        </div>
      </div>

      {/* Grid Layout for Officer Operational Tools */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Widget 1: District Road Connectivity Status from MongoDB */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Navigation color="#2563eb" size={22} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              District Road Network Status
            </h3>
          </div>

          {data.roads.map((road) => (
            <div
              key={road._id?.toString()}
              style={{
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>{road.roadName}</strong>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>Risk: {road.riskLevel.toUpperCase()}</span>
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: road.status === 'blocked' ? '#fee2e2' : road.status === 'at_risk' ? '#fef3c7' : '#dcfce7',
                  color: road.status === 'blocked' ? '#dc2626' : road.status === 'at_risk' ? '#b45309' : '#15803d',
                }}
              >
                {road.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Widget 2: Live Incident Field Task Queue from MongoDB */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Flame color="#dc2626" size={22} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Live Incident Field Task Queue
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px' }}>Type</th>
                <th style={{ padding: '10px' }}>Description</th>
                <th style={{ padding: '10px' }}>Severity</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.recentIncidents.map((inc) => (
                <tr key={inc._id?.toString()} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{inc.incidentType}</td>
                  <td style={{ padding: '10px' }}>{inc.description}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>{inc.severity}</span>
                  </td>
                  <td style={{ padding: '10px' }}>{inc.status}</td>
                  <td style={{ padding: '10px' }}>
                    <button style={{ padding: '6px 12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                      Dispatch Response
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
