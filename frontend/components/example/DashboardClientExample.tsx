import React, { useState, useEffect } from 'react';
import { DashboardSummaryResponse, CreateReportInput } from '../../types/db';

export function DashboardClientExample() {
  const [districtId] = useState<string>('KAMRUP_METRO');
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Form State for Citizen Report
  const [reportTitle, setReportTitle] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [longitude, setLongitude] = useState<number>(91.9782);
  const [latitude, setLatitude] = useState<number>(26.1174);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  // Fetch Dashboard Summary from API Endpoint
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/dashboard/summary?districtId=${encodeURIComponent(districtId)}`);
      const result = await res.json();

      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error fetching dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [districtId]);

  // Handle Online & Offline Citizen Report Submission
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('Submitting report...');

    const reportPayload: CreateReportInput = {
      reporterId: '65f1a2b3c4d5e6f7a8b9c0d1', // Example citizen ObjectId
      districtId: dashboardData?.district?._id?.toString() || '65f1a2b3c4d5e6f7a8b9c0d2',
      title: reportTitle,
      description: reportDescription,
      longitude,
      latitude,
      clientTempId: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      offlineCreatedAt: new Date().toISOString(),
    };

    if (!navigator.onLine) {
      // Save to Offline LocalStorage Queue when network is unavailable
      const offlineQueue = JSON.parse(localStorage.getItem('parvaah_offline_reports') || '[]');
      offlineQueue.push(reportPayload);
      localStorage.setItem('parvaah_offline_reports', JSON.stringify(offlineQueue));
      setSubmitStatus('📲 Network offline. Report stored safely on device! Will auto-sync when online.');
      setReportTitle('');
      setReportDescription('');
      return;
    }

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportPayload),
      });

      const result = await res.json();
      if (result.success) {
        setSubmitStatus(
          result.isDuplicate
            ? 'ℹ️ Report was already received (Deduplicated).'
            : '✅ Citizen Report successfully recorded and verified!'
        );
        setReportTitle('');
        setReportDescription('');
        fetchDashboard(); // Refresh UI data
      } else {
        setSubmitStatus(`❌ Error: ${result.error}`);
      }
    } catch (err: unknown) {
      setSubmitStatus(`❌ Network error submitting report: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  // Process Offline Queue when reconnected
  const syncOfflineQueue = async () => {
    const rawQueue = localStorage.getItem('parvaah_offline_reports');
    if (!rawQueue) return;

    const offlineQueue: CreateReportInput[] = JSON.parse(rawQueue);
    if (offlineQueue.length === 0) return;

    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offlineQueue),
      });
      const result = await res.json();
      if (result.success) {
        localStorage.removeItem('parvaah_offline_reports');
        console.log(`Synced ${result.syncedCount} offline reports safely!`);
        fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to sync offline queue:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync listener on online event
  useEffect(() => {
    const handleOnline = () => syncOfflineQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#0f172a' }}>PARVAAH Landslide Monitoring Platform</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>
            District: <strong>{dashboardData?.district?.name || districtId}</strong> ({dashboardData?.district?.stateName || 'Assam'})
          </p>
        </div>
        <button
          onClick={syncOfflineQueue}
          disabled={isSyncing}
          style={{
            padding: '8px 16px',
            backgroundColor: isSyncing ? '#94a3b8' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
          }}
        >
          {isSyncing ? 'Syncing...' : 'Sync Offline Reports'}
        </button>
      </header>

      {loading && <div style={{ padding: '20px', background: '#f1f5f9', borderRadius: '8px' }}>Loading real-time data...</div>}
      {error && <div style={{ padding: '20px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px' }}>Error: {error}</div>}

      {dashboardData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Active Emergency Alerts Card */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ color: '#991b1b', marginTop: 0 }}>🚨 Active Alerts ({dashboardData.activeAlertsCount})</h2>
            {dashboardData.activeAlerts.map((alert) => (
              <div key={alert._id?.toString()} style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                <strong style={{ color: '#991b1b' }}>{alert.title}</strong>
                <p style={{ fontSize: '14px', margin: '4px 0 0 0', color: '#7f1d1d' }}>{alert.message}</p>
              </div>
            ))}
          </div>

          {/* Risk & Weather Overview */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ color: '#1e293b', marginTop: 0 }}>🌧 Weather & Risk Status</h2>
            <p><strong>Rainfall (24h):</strong> {dashboardData.latestWeather?.rainfallMm ?? 'N/A'} mm</p>
            <p><strong>Soil Moisture:</strong> {dashboardData.latestWeather?.soilMoisture ?? 'N/A'} %</p>
            <p><strong>Risk Score:</strong> <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{dashboardData.latestRiskAssessment?.riskScore ?? 'N/A'} / 100</span></p>
            <p><strong>Risk Level:</strong> {dashboardData.latestRiskAssessment?.riskLevel?.toUpperCase() ?? 'N/A'}</p>
          </div>

          {/* Citizen Report Form */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ marginTop: 0, color: '#0f172a' }}>📢 Submit Landslide Report</h2>
            <form onSubmit={handleSubmitReport}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>Title</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  required
                  placeholder="e.g. Rockfall blocking lane"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>Description</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  required
                  placeholder="Provide details..."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px' }}>Longitude</label>
                  <input type="number" step="0.0001" value={longitude} onChange={(e) => setLongitude(parseFloat(e.target.value))} style={{ width: '100%', padding: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px' }}>Latitude</label>
                  <input type="number" step="0.0001" value={latitude} onChange={(e) => setLatitude(parseFloat(e.target.value))} style={{ width: '100%', padding: '6px' }} />
                </div>
              </div>
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                Submit Citizen Report
              </button>
            </form>
            {submitStatus && <p style={{ marginTop: '12px', fontSize: '14px', fontWeight: 500 }}>{submitStatus}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
