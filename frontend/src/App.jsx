import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { EventDetailModal } from './components/EventDetailModal';
import { ScenarioModal } from './components/ScenarioModal';

import { OverviewDashboard } from './pages/OverviewDashboard';
import { TelecomTrafficPage } from './pages/TelecomTrafficPage';
import { DevSecOpsPipelinePage } from './pages/DevSecOpsPipelinePage';
import { AIThreatDetectionPage } from './pages/AIThreatDetectionPage';
import { RuntimeMonitoringPage } from './pages/RuntimeMonitoringPage';
import { AutomatedResponsePage } from './pages/AutomatedResponsePage';
import { SecurityReportsPage } from './pages/SecurityReportsPage';

import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [backendOnline, setBackendOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [devices, setDevices] = useState([]);

  // Modals
  const [inspectedEvent, setInspectedEvent] = useState(null);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);

  // Load Dashboard Summary and Fleet Devices
  const refreshState = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [summary, devs, health] = await Promise.all([
        api.getDashboardSummary(),
        api.getDevices().catch(() => []),
        api.getHealth()
      ]);
      setDashboardData(summary);
      setDevices(devs);
      setBackendOnline(health?.status === 'HEALTHY');
    } catch (err) {
      console.error('Failed to sync platform telemetry:', err);
      setBackendOnline(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshState();
    // Background polling every 12 seconds for live telemetry
    const interval = setInterval(refreshState, 12000);
    return () => clearInterval(interval);
  }, [refreshState]);

  // Reset to Baseline
  const handleResetToBaseline = async () => {
    try {
      setIsRefreshing(true);
      await api.resetToBaseline();
      await refreshState();
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Page Title & Breadcrumbs mapping
  const pageMeta = {
    overview: { title: 'System Overview & SOC Central', breadcrumbs: ['Overview'] },
    traffic: { title: 'Telecom Traffic & Signaling Ingress', breadcrumbs: ['Telecom Traffic'] },
    pipeline: { title: 'DevSecOps Pre-Deployment Security Pipeline', breadcrumbs: ['DevSecOps Pipeline'] },
    threats: { title: 'AI Anomaly & Threat Detection Engine', breadcrumbs: ['Threat Intelligence', 'AI Models'] },
    runtime: { title: 'Runtime Microservices & 5G SBA Mesh', breadcrumbs: ['Runtime Monitoring'] },
    response: { title: 'Automated Containment & Incident Response', breadcrumbs: ['Automated Response'] },
    reports: { title: 'Security Reports & Audit Trail', breadcrumbs: ['Security Reports', 'Audit Export'] },
  };

  const currentMeta = pageMeta[activeTab] || pageMeta.overview;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* 1. Persistent Dark Navy Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        backendOnline={backendOnline}
      />

      {/* 2. Main Application Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          pageTitle={currentMeta.title}
          breadcrumbs={currentMeta.breadcrumbs}
          systemStatus={dashboardData?.system_status || 'OPERATIONAL'}
          securityPosture={dashboardData?.security_posture || 'OPTIMAL'}
          postureScore={dashboardData?.posture_score || 94.2}
          lastUpdated={dashboardData?.last_updated}
          onReset={handleResetToBaseline}
          onOpenScenario={() => setIsScenarioModalOpen(true)}
          isRefreshing={isRefreshing}
        />

        {/* Scrollable Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto pb-10">
            {activeTab === 'overview' && (
              <OverviewDashboard
                data={dashboardData}
                onSelectEvent={setInspectedEvent}
                onOpenScenario={() => setIsScenarioModalOpen(true)}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'traffic' && (
              <TelecomTrafficPage
                onSelectEvent={setInspectedEvent}
                onTriggerScenarioRefresh={refreshState}
              />
            )}

            {activeTab === 'pipeline' && (
              <DevSecOpsPipelinePage
                onPipelineRunComplete={refreshState}
              />
            )}

            {activeTab === 'threats' && (
              <AIThreatDetectionPage />
            )}

            {activeTab === 'runtime' && (
              <RuntimeMonitoringPage />
            )}

            {activeTab === 'response' && (
              <AutomatedResponsePage
                onStateChanged={refreshState}
              />
            )}

            {activeTab === 'reports' && (
              <SecurityReportsPage />
            )}
          </div>
        </main>
      </div>

      {/* 3. Deep Event Inspection Drawer / Modal */}
      <EventDetailModal
        event={inspectedEvent}
        onClose={() => setInspectedEvent(null)}
      />

      {/* 4. Interactive Scenario Injection Modal */}
      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        devices={devices}
        onScenarioSuccess={refreshState}
      />
    </div>
  );
}
