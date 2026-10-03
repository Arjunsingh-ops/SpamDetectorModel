'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Mail,
  Shield,
  Trash2,
  Play,
  Eye,
} from 'lucide-react';
import { fetchReports, generateReportApi, downloadReportApi, fetchReportSchedules, createReportScheduleApi, deleteReportScheduleApi } from '@/lib/api';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function ReportsPage({ onOpenMobileNav }: PageProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [reportType, setReportType] = useState('daily');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [customTitle, setCustomTitle] = useState('');

  // Schedule modal / form states
  const [schedTitle, setSchedTitle] = useState('');
  const [schedFreq, setSchedFreq] = useState('daily');
  const [schedFormat, setSchedFormat] = useState('pdf');
  const [schedEmails, setSchedEmails] = useState('');
  const [schedTime, setSchedTime] = useState('08:00');
  const [isSchedOpen, setIsSchedOpen] = useState(false);

  // Preview Modal
  const [previewReport, setPreviewReport] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [repsData, schedsData] = await Promise.all([
        fetchReports(),
        fetchReportSchedules(),
      ]);
      setReports(repsData);
      setSchedules(schedsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load report center data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    try {
      await generateReportApi({
        report_type: reportType,
        export_format: exportFormat,
        time_zone: timeZone,
        title: customTitle.trim() || undefined,
      });
      setCustomTitle('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId: string, filename: string) => {
    try {
      await downloadReportApi(reportId, filename);
    } catch (err: any) {
      alert('Download failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedTitle || !schedEmails) {
      alert('Please fill in schedule title and recipient emails.');
      return;
    }
    try {
      await createReportScheduleApi({
        title: schedTitle,
        report_type: schedFreq,
        frequency: schedFreq,
        export_format: schedFormat,
        time_zone: timeZone,
        delivery_time_utc: schedTime,
        recipient_emails: schedEmails,
      });
      setIsSchedOpen(false);
      setSchedTitle('');
      setSchedEmails('');
      await loadData();
    } catch (err: any) {
      alert('Failed to create schedule: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await deleteReportScheduleApi(id);
      await loadData();
    } catch (err: any) {
      alert('Failed to delete schedule: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      <Header
        title="Report Center & Automated Delivery"
        subtitle="Generate instant executive reports, download PDF/XLSX analytics, and configure automated scheduled delivery."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-[var(--status-danger-bg)] border border-[var(--status-danger)]/30 text-[var(--status-danger)] text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Generator & Fast Export Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--accent-primary)]" />
              Generate New Report
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Custom Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Executive Performance Summary"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded-md border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Report Scope / Period
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border rounded-md border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="daily">Daily Report (Today)</option>
                    <option value="weekly">Weekly Report (Last 7 Days)</option>
                    <option value="monthly">Monthly Report (Last 30 Days)</option>
                    <option value="previous_month">Previous Month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Export Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border rounded-md border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="xlsx">Excel Workbook (.xlsx)</option>
                    <option value="csv">Structured CSV (.csv)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Target Time Zone
                  </label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border rounded-md border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md bg-[var(--accent-primary)] hover:opacity-90 text-white transition shadow-sm disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Generate Report Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info Box */}
          <div className="bg-[var(--accent-primary-subtle)] border border-[var(--accent-primary)]/30 rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <h3 className="text-sm font-semibold text-[var(--accent-primary)] flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4" />
                Verified Metric Definitions
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                All generated reports calculate metrics directly from raw PostgreSQL database records. Formula injection protection and caller PII masking are automatically enforced on exported documents.
              </p>
            </div>
            <button
              onClick={() => setIsSchedOpen(true)}
              className="w-full py-2 px-3 text-xs font-medium rounded-md bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--border-color)] transition flex items-center justify-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Configure Recurring Schedule
            </button>
          </div>
        </div>

        {/* Report History Table */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--accent-primary)]" />
              Generated Reports History
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] border border-[var(--border-color)]">
              {reports.length} Total Reports
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[var(--text-muted)] text-xs">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--accent-primary)]" />
              Loading report records...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-muted)] text-xs">
              No reports generated yet. Click "Generate Report Now" above to create your first report.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[var(--text-secondary)]">
                <thead className="bg-[var(--bg-surface-secondary)] text-[11px] font-semibold uppercase text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-4 py-3">Report Title & Type</th>
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Time Zone</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Generated At</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-[var(--bg-app)] transition">
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                        <div>{r.title}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-normal uppercase tracking-wider">{r.report_type}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] uppercase">
                          {r.export_format}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{r.time_zone}</td>
                      <td className="px-4 py-3">
                        {r.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success)]/30">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        ) : r.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger)]/30">
                            <AlertCircle className="h-3 w-3" />
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning)]/30">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Generating
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => setPreviewReport(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--border-color)]"
                        >
                          <Eye className="h-3 w-3" />
                          Preview
                        </button>

                        {r.status === 'completed' && (
                          <button
                            onClick={() => handleDownload(r.id, `${r.title}.${r.export_format}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)] hover:text-white transition"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recurring Schedules Section */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--accent-primary)]" />
              Configured Report Schedules
            </h2>
            <button
              onClick={() => setIsSchedOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--accent-primary)] text-white hover:opacity-90 transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Schedule
            </button>
          </div>

          {schedules.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-4 text-center">
              No active schedules configured. Add a schedule to automatically dispatch report summaries via email.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className="p-4 border rounded-md border-[var(--border-color)] bg-[var(--bg-app)] flex items-start justify-between text-xs"
                >
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)]">{s.title}</h4>
                    <div className="text-xs text-[var(--text-muted)] mt-1 space-y-0.5">
                      <div>Frequency: <span className="font-semibold text-[var(--accent-primary)] uppercase">{s.frequency}</span> ({s.export_format.toUpperCase()})</div>
                      <div>Recipients: <span className="font-mono text-[var(--text-primary)]">{s.recipient_emails}</span></div>
                      <div>Delivery Time: <span className="font-mono">{s.delivery_time_utc} UTC</span></div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSchedule(s.id)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--status-danger)] transition"
                    title="Delete Schedule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Modal */}
        {isSchedOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Mail className="h-4 w-4 text-[var(--accent-primary)]" />
                New Report Schedule
              </h3>
              <form onSubmit={handleCreateSchedule} className="space-y-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">Schedule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Daily Operations Summary"
                    value={schedTitle}
                    onChange={(e) => setSchedTitle(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-md border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] mb-1">Frequency</label>
                    <select
                      value={schedFreq}
                      onChange={(e) => setSchedFreq(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-md border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] mb-1">Format</label>
                    <select
                      value={schedFormat}
                      onChange={(e) => setSchedFormat(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-md border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    >
                      <option value="pdf">PDF</option>
                      <option value="xlsx">Excel (XLSX)</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Recipient Emails (Comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="admin@company.com, ops@company.com"
                    value={schedEmails}
                    onChange={(e) => setSchedEmails(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-md border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsSchedOpen(false)}
                    className="px-3 py-1.5 border rounded-md text-[var(--text-secondary)] border-[var(--border-color)] bg-[var(--bg-surface-secondary)] hover:bg-[var(--border-color)] font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[var(--accent-primary)] hover:opacity-90 text-white font-medium rounded-md transition shadow-sm"
                  >
                    Save Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewReport && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-3 border-[var(--border-color)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[var(--accent-primary)]" />
                  Report Preview
                </h3>
                <button
                  onClick={() => setPreviewReport(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-[var(--text-muted)]">Title:</span>
                  <div className="font-semibold text-[var(--text-primary)]">{previewReport.title}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Scope: <span className="font-semibold uppercase">{previewReport.report_type}</span></div>
                  <div>Format: <span className="font-semibold uppercase">{previewReport.export_format}</span></div>
                  <div>Time Zone: <span className="font-mono">{previewReport.time_zone}</span></div>
                  <div>Status: <span className="font-semibold text-[var(--status-success)] uppercase">{previewReport.status}</span></div>
                </div>

                {previewReport.metrics_summary_json && (
                  <div className="mt-4 p-3 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md text-xs space-y-1 font-mono">
                    <div className="font-semibold text-[var(--text-primary)] font-sans text-xs mb-2">Metrics Summary Preview:</div>
                    <pre className="overflow-x-auto text-[var(--text-secondary)]">
                      {JSON.stringify(JSON.parse(previewReport.metrics_summary_json), null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setPreviewReport(null)}
                  className="px-3 py-1.5 bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] font-medium rounded-md hover:bg-[var(--border-color)]"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
