import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { format, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import DatePickerDropdown from '../components/DatePickerDropdown';
import PlatformGrowthChart from '../components/PlatformGrowthChart';
import RecentActivity from '../components/RecentActivity';
import PeakEngagementHeatmap from '../components/PeakEngagementHeatmap';
import KPICard from '../components/KPICard';

export default function Dashboard() {
  const { role, accessToken } = useAuth();
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    rangeLabel: 'Last 30 Days',
    key: 'selection'
  });

  const [metrics, setMetrics] = useState({
    totalUsers: '...',
    activeUsers: '...',
    suspendedUsers: '...',
    userGrowth: '...',
    totalThoughts: '...',
    totalOrgs: '...',
    suspendedOrgs: '...',
    orgGrowth: '...',
    hasPrevData: true,
    chartData: []
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const queryParams = new URLSearchParams({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
          isCustom: dateRange.rangeLabel === 'Custom'
        });
        
        const res = await fetch(`/api/admin/dashboard/metrics?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-environment': localStorage.getItem('admin_environment') || 'staging'
          }
        });
        if (res.ok) {
          const data = await res.json();
          const formatNumber = (num) => {
            if (num == null || isNaN(Number(num))) return '0';
            const n = Number(num);
            if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
            if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
            return n.toString();
          };
          setMetrics({
            totalUsers: formatNumber(data.totalUsers),
            activeUsers: formatNumber(data.activeUsers),
            suspendedUsers: formatNumber(data.suspendedUsers),
            userGrowth: ((data.userGrowth || 0) > 0 ? '+' : '') + (data.userGrowth || 0) + '%',
            totalThoughts: formatNumber(data.totalThoughts),
            totalOrgs: formatNumber(data.totalOrgs),
            suspendedOrgs: formatNumber(data.suspendedOrgs),
            orgGrowth: ((data.orgGrowth || 0) > 0 ? '+' : '') + (data.orgGrowth || 0) + '%',
            hasPrevData: true,
            chartData: data.chartData || []
          });
        } else {
          console.error('Failed to fetch metrics: status', res.status);
        }
      } catch (err) {
        console.error('Error fetching metrics', err);
      }
    };
    if (accessToken) {
      fetchMetrics();
    }
  }, [accessToken, dateRange.startDate, dateRange.endDate]);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');

  const today = new Date().toISOString().split('T')[0];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const reportDateRange = `${format(dateRange.startDate, 'MMM dd, yyyy')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}`;
      
      const summaryRows = [
        ['Active Users', metrics.activeUsers, metrics.userGrowth],
        ['Deactivated Users', metrics.suspendedUsers, 'Suspended'],
        ['Total Organisations', metrics.totalOrgs, metrics.orgGrowth],
        ['Deactivated Organisations', metrics.suspendedOrgs, 'Suspended'],
      ];

      const chartRows = (metrics.chartData || []).map(d => [
        d.date || 'N/A', 
        (d.newUsers || 0).toString(), 
        (d.newOrganizations || 0).toString()
      ]);

      if (exportFormat === 'excel') {
        const wb = XLSX.utils.book_new();
        
        // Sheet 1: Summary
        const summaryData = [
          ["System Overview Report"],
          [`Date Range: ${reportDateRange}`],
          [],
          ["Metric", "Value", "Status/Growth"],
          ...summaryRows
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
        
        // Sheet 2: Platform Growth
        const growthData = [
          ["Daily Platform Growth"],
          [],
          ["Date", "New Users", "New Organisations"],
          ...chartRows
        ];
        const wsGrowth = XLSX.utils.aoa_to_sheet(growthData);
        wsGrowth['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsGrowth, "Platform Growth");
        
        XLSX.writeFile(wb, `cocpit_dashboard_report_${today}.xlsx`);
      } else if (exportFormat === 'pdf') {
        const doc = new jsPDF();
        
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("COCPIT Admin Dashboard", 14, 20);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`System Overview Report: ${reportDateRange}`, 14, 30);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Executive Summary", 14, 52);
        
        autoTable(doc, {
          startY: 58,
          head: [['Metric', 'Value', 'Status / Growth']],
          body: summaryRows,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' }
        });
        
        let finalY = doc.lastAutoTable.finalY || 100;
        doc.setFontSize(14);
        doc.text("Daily Platform Growth", 14, finalY + 14);
        
        autoTable(doc, {
          startY: finalY + 20,
          head: [['Date', 'New Users', 'New Organisations']],
          body: chartRows,
          theme: 'grid',
          headStyles: { fillColor: [55, 65, 81], textColor: 255 }
        });
        
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`, 14, 285);
        }
        
        doc.save(`cocpit_dashboard_report_${today}.pdf`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export report. See console for details.");
    } finally {
      setIsExporting(false);
      setIsExportModalOpen(false);
    }
  };

  const [selectedSignupDate, setSelectedSignupDate] = useState(null);
  const [dailySignupsData, setDailySignupsData] = useState({ date: '', count: 0, users: [] });
  const [loadingDailySignups, setLoadingDailySignups] = useState(false);
  const [isSignupsModalOpen, setIsSignupsModalOpen] = useState(false);

  const handleDateSelect = async (selectedPoint) => {
    if (!selectedPoint || !selectedPoint.date) return;
    
    // Determine the query date. If label is like 'Oct 01', parse date relative to dateRange
    let dateStr = selectedPoint.date;
    setSelectedSignupDate(dateStr);
    setIsSignupsModalOpen(true);
    setLoadingDailySignups(true);

    try {
      // Calculate target date ISO string if possible
      let targetDateParam = '';
      if (selectedPoint.date !== 'Start' && selectedPoint.date !== 'End') {
        const parsed = new Date(selectedPoint.date);
        if (!isNaN(parsed.getTime())) {
          targetDateParam = parsed.toISOString().split('T')[0];
        }
      }

      const res = await fetch(`/api/admin/dashboard/daily-signups?date=${encodeURIComponent(targetDateParam)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDailySignupsData(data);
      }
    } catch (err) {
      console.error('Error fetching daily signups:', err);
    } finally {
      setLoadingDailySignups(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 shrink-0 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-on-surface hover:bg-slate-50 transition-colors shadow-sm self-start mt-1"
            title="Go Back"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h3 className="font-display-lg text-display-lg text-on-background">System Overview</h3>
            <p className="text-body-lg text-on-surface-variant">Real-time performance metrics and ecosystem health.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-sm md:gap-md w-full md:w-auto">
          {/* Date Picker Modal Trigger */}
          <div className="flex items-center relative z-20">
            <DatePickerDropdown
              onRangeChange={(range) => setDateRange(range)}
              initialRangeLabel="Last 30 Days"
            />
          </div>

          {role === 'admin' && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className={`relative overflow-hidden bg-primary text-on-primary px-lg py-2.5 rounded-xl flex items-center gap-sm font-label-md text-label-md shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-95`}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Report
            </button>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-lg">
        <KPICard
          title="Active Users"
          value={metrics.activeUsers}
          growth={metrics.userGrowth}
          growthIcon="trending_up"
          icon="group"
          colorVariant="primary"
          progressWidth={70}
          onClick={() => navigate('/users')}
        />
        <KPICard
          title="Deactivated Users"
          value={metrics.suspendedUsers}
          growth="Suspended"
          growthIcon="block"
          icon="person_off"
          colorVariant="secondary"
          progressWidth={45}
          onClick={() => navigate('/users?status=Suspended')}
        />
        <KPICard
          title="Total Organisations"
          value={metrics.totalOrgs}
          growth={metrics.orgGrowth}
          growthIcon="trending_up"
          icon="domain"
          colorVariant="primary"
          progressWidth={60}
          onClick={() => navigate('/organizations')}
        />
        <KPICard
          title="Deactivated Organisations"
          value={metrics.suspendedOrgs}
          growth="Suspended"
          growthIcon="block"
          icon="domain_disabled"
          colorVariant="secondary"
          progressWidth={80}
          onClick={() => navigate('/organizations?status=Suspended')}
        />
        <KPICard
          title="Total Thoughts"
          value={metrics.totalThoughts}
          growth="All-time"
          growthIcon="chat_bubble"
          icon="forum"
          colorVariant="primary"
          progressWidth={100}
          onClick={() => navigate('/thoughts')}
        />
      </div>

      {/* Bento Layout Main */}
      <div className="grid grid-cols-12 gap-lg pb-xl">
        {/* Platform Growth Chart */}
        <div className="col-span-12 lg:col-span-8 bg-surface border border-outline-variant rounded-xl p-lg flex flex-col">
          <div className="flex justify-between items-center mb-xl">
            <div>
              <h5 className="font-headline-sm text-headline-sm font-bold">Platform Growth</h5>
              <p className="text-body-sm text-on-surface-variant">Click any date point on the chart to see joined users</p>
            </div>
            <div className="flex gap-md">
              <div className="flex items-center gap-xs">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-body-sm">New Users</span>
              </div>
              <div className="flex items-center gap-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }}></span>
                <span className="text-body-sm">New Organisations</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[320px] relative mt-auto -ml-4">
            <PlatformGrowthChart data={metrics.chartData || []} onDateSelect={handleDateSelect} />
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="col-span-12 lg:col-span-4">
          <RecentActivity />
        </div>

        {/* Peak Engagement Heatmap */}
        <div className="col-span-12 lg:col-span-12 mt-lg">
          <PeakEngagementHeatmap />
        </div>

      </div>

      {/* Daily Signups Modal */}
      {isSignupsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-outline-variant w-[550px] max-w-[95vw] rounded-2xl shadow-2xl p-6 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
              <div>
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">group_add</span>
                  Signups on {selectedSignupDate}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Detailed view of accounts created on this date
                </p>
              </div>
              <button 
                onClick={() => setIsSignupsModalOpen(false)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {loadingDailySignups ? (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-2">sync</span>
                  <p className="text-sm">Fetching user signups...</p>
                </div>
              ) : dailySignupsData.users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">person_off</span>
                  <p className="text-sm font-medium">No users joined on this date.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-1">
                    Total Registrations: <span className="text-primary font-bold">{dailySignupsData.count}</span>
                  </div>
                  {dailySignupsData.users.map((u) => {
                    const initials = u.name ? u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
                    const joinedTime = new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-outline-variant bg-surface-container/40 hover:bg-surface-container transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface leading-tight">{u.name || 'Unnamed User'}</p>
                            <p className="text-xs text-on-surface-variant">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {u.role}
                            </span>
                            <p className="text-[11px] text-on-surface-variant mt-1">{joinedTime}</p>
                          </div>
                          <button
                            onClick={() => {
                              setIsSignupsModalOpen(false);
                              navigate(`/users/${u.id}`);
                            }}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                            title="View Profile"
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-outline-variant flex justify-end">
              <button 
                onClick={() => setIsSignupsModalOpen(false)} 
                className="px-4 py-2 rounded-xl text-sm font-medium bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-outline-variant w-[400px] max-w-[90vw] rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-on-surface">Export Data</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</button>
            </div>

            <p className="text-sm text-on-surface-variant mb-6">Select format to download the dashboard metrics.</p>

            <div className="flex flex-col gap-3 mb-6">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors">
                <input type="radio" name="format" value="excel" checked={exportFormat === 'excel'} onChange={() => setExportFormat('excel')} className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Excel (.xlsx) Format</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors">
                <input type="radio" name="format" value="pdf" checked={exportFormat === 'pdf'} onChange={() => setExportFormat('pdf')} className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">PDF Format</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isExporting ? <span className="material-symbols-outlined text-[16px] animate-spin">sync</span> : null}
                {isExporting ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

