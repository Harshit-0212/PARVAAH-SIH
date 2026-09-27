import React from 'react';
import { getUserProfile } from '../../../lib/auth/roleGuards';
import dbConnect from '../../../lib/dbConnect';
import { User, Incident, Report, Alert, SyncQueue } from '../../../lib/models';
import { AccessDenied } from '../../../components/ui/AccessDenied';
import { Users, ShieldAlert, Activity, Flame, FileText, Radio } from 'lucide-react';

export default async function AdminDashboardPage() {
  const profile = await getUserProfile();

  if (!profile) {
    return <AccessDenied currentRole="admin" message="Please sign in to access system administration." />;
  }

  if (profile.role !== 'admin') {
    return (
      <AccessDenied
        requiredRole="admin"
        currentRole={profile.role}
        message="System Administration access is restricted exclusively to authorized platform architects and state emergency directors."
      />
    );
  }

  await dbConnect();

  const [totalUsers, totalOfficers, totalIncidents, totalReports, activeAlerts, syncLogs, recentUsers] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'officer' }),
    Incident.countDocuments({}),
    Report.countDocuments({}),
    Alert.find({ isActive: true }).lean(),
    SyncQueue.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    User.find({}).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '1200px' }}>
      {/* Admin Executive Command Header */}
      <div
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px',
          border: '1px solid #1e293b',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#f59e0b', fontWeight: 700 }}>
              State Disaster Management Command Center (MongoDB Engine)
            </span>
            <h2 style={{ margin: '4px 0 4px 0', fontSize: '24px', fontWeight: 800 }}>
              PARVAAH Platform Administration
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
              Supervising North Eastern Region Monitoring | Logged in as: <strong>{profile.fullName}</strong>
            </p>
          </div>

          <button
            style={{
              padding: '12px 20px',
              backgroundColor: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Radio size={18} /> Broadcast Regional Emergency Alert
          </button>
        </div>
      </div>

      {/* Top Level Metric Cards from MongoDB */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Total Registered Users</span>
            <Users size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>{totalUsers}</div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Active Field Officers</span>
            <ShieldAlert size={20} color="#059669" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>{totalOfficers}</div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>All-District Incidents</span>
            <Flame size={20} color="#dc2626" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>{totalIncidents}</div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Total Citizen Reports</span>
            <FileText size={20} color="#d97706" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>{totalReports}</div>
        </div>
      </div>

      {/* Grid Layout for Admin Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Widget 1: System Sync & Offline Engine Health from MongoDB */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Activity color="#2563eb" size={22} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Offline Sync Engine Health
            </h3>
          </div>

          {syncLogs.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#64748b' }}>No pending sync operations queued.</p>
          ) : (
            syncLogs.map((log) => (
              <div
                key={log._id?.toString()}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '13px',
                }}
              >
                <div>
                  <strong>{log.entityType} {log.actionType}</strong>
                  <span style={{ display: 'block', color: '#94a3b8', fontSize: '11px' }}>User ID: {log.userId?.toString()}</span>
                </div>
                <span style={{ color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>{log.syncStatus}</span>
              </div>
            ))
          )}
        </div>

        {/* Widget 2: Platform Users & Role Allocations from MongoDB */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Users color="#059669" size={22} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              User & Officer Roles Management
            </h3>
          </div>

          {recentUsers.map((user) => (
            <div
              key={user._id?.toString()}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '8px',
              }}
            >
              <div>
                <strong style={{ fontSize: '14px' }}>{user.fullName}</strong>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>{user.phone}</span>
              </div>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: user.role === 'admin' ? '#fef3c7' : user.role === 'officer' ? '#dbeafe' : '#dcfce7',
                  color: user.role === 'admin' ? '#b45309' : user.role === 'officer' ? '#1e40af' : '#15803d',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
