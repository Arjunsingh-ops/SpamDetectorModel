'use client';

import React, { useState, useEffect } from 'react';
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

export default function ReportsPage() {
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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Report Center & Automated Delivery
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Generate instant executive reports, download PDF/XLSX analytics, and configure automated scheduled delivery.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Generator & Fast Export Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Generate New Report
          </h2>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Custom Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Weekly Executive Performance Summary"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Report Scope / Period
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="daily">Daily Report (Today)</option>
                  <option value="weekly">Weekly Report (Last 7 Days)</option>
                  <option value="monthly">Monthly Report (Last 30 Days)</option>
                  <option value="previous_month">Previous Month</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="xlsx">Excel Workbook (.xlsx)</option>
                  <option value="csv">Structured CSV (.csv)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Target Time Zone
                </label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    Generate Report Now
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" />
              Verified Metric Definitions
            </h3>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed mb-4">
              All generated reports calculate metrics directly from raw PostgreSQL database records. Formula injection protection and caller PII masking are automatically enforced on exported documents.
            </p>
          </div>
          <button
            onClick={() => setIsSchedOpen(true)}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Configure Recurring Schedule
          </button>
        </div>
      </div>

      {/* Report History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500" />
            Generated Reports History
          </h2>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {reports.length} Total Reports
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading report records...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            No reports generated yet. Click "Generate Report Now" above to create your first report.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Report Title & Type</th>
                  <th className="px-6 py-3">Format</th>
                  <th className="px-6 py-3">Time Zone</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Generated At</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      <div>{r.title}</div>
                      <div className="text-xs text-slate-400 font-normal uppercase tracking-wider">{r.report_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                        {r.export_format}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{r.time_zone}</td>
                    <td className="px-6 py-4">
                      {r.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Completed
                        </span>
                      ) : r.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Generating
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setPreviewReport(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </button>

                      {r.status === 'completed' && (
                        <button
                          onClick={() => handleDownload(r.id, `${r.title}.${r.export_format}`)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition"
                        >
                          <Download className="h-3.5 w-3.5" />
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-500" />
            Configured Report Schedules
          </h2>
          <button
            onClick={() => setIsSchedOpen(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add Schedule
          </button>
        </div>

        {schedules.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
            No active schedules configured. Add a schedule to automatically dispatch report summaries via email.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-start justify-between"
              >
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{s.title}</h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                    <div>Frequency: <span className="font-semibold text-indigo-600 uppercase">{s.frequency}</span> ({s.export_format.toUpperCase()})</div>
                    <div>Recipients: <span className="font-mono text-slate-700 dark:text-slate-300">{s.recipient_emails}</span></div>
                    <div>Delivery Time: <span className="font-mono">{s.delivery_time_utc} UTC</span></div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSchedule(s.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-500" />
              New Report Schedule
            </h3>
            <form onSubmit={handleCreateSchedule} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Schedule Name</label>
                <input
                  type="text"
                  required
                  placeholder="Daily Operations Summary"
                  value={schedTitle}
                  onChange={(e) => setSchedTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Frequency</label>
                  <select
                    value={schedFreq}
                    onChange={(e) => setSchedFreq(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Format</label>
                  <select
                    value={schedFormat}
                    onChange={(e) => setSchedFormat(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="pdf">PDF</option>
                    <option value="xlsx">Excel (XLSX)</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Recipient Emails (Comma-separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin@company.com, ops@company.com"
                  value={schedEmails}
                  onChange={(e) => setSchedEmails(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSchedOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-500" />
                Report Preview
              </h3>
              <button
                onClick={() => setPreviewReport(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500">Title:</span>
                <div className="font-semibold text-slate-900 dark:text-white">{previewReport.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Scope: <span className="font-semibold uppercase">{previewReport.report_type}</span></div>
                <div>Format: <span className="font-semibold uppercase">{previewReport.export_format}</span></div>
                <div>Time Zone: <span className="font-mono">{previewReport.time_zone}</span></div>
                <div>Status: <span className="font-semibold text-emerald-600 uppercase">{previewReport.status}</span></div>
              </div>

              {previewReport.metrics_summary_json && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1 font-mono">
                  <div className="font-bold text-slate-700 dark:text-slate-300 font-sans text-xs mb-2">Metrics Summary Preview:</div>
                  <pre className="overflow-x-auto text-slate-600 dark:text-slate-400">
                    {JSON.stringify(JSON.parse(previewReport.metrics_summary_json), null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewReport(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
