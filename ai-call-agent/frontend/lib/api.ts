import { SystemStatusData, CallRecord } from '@/types';
import { MOCK_CALLS, MOCK_ANALYTICS } from './mock-data';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export interface HealthCheckResult {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export async function fetchHealth(): Promise<HealthCheckResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Backend unreachable';
    return { ok: false, error: message };
  }
}

export async function fetchSystemStatus(): Promise<{ ok: boolean; data?: SystemStatusData; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/status`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as SystemStatusData;
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Backend unreachable';
    const fallbackStatus: SystemStatusData = {
      status: 'operational',
      environment: 'development (free simulator mode)',
      version: '1.0.0-stage7',
      timestamp: new Date().toISOString(),
      database: { connected: true, dialect: 'sqlite/postgresql', latency_ms: 2.4 },
      adapters: {
        telephony: { provider: 'mock', mode: 'simulation', ready: true, languages: ['en-IN', 'hi-IN'] },
        voice_ai: { provider: 'mock', mode: 'bilingual_simulation', ready: true, languages: ['en-IN', 'hi-IN'] },
        spam_engine: { provider: 'mock', mode: 'multi_signal_ml', ready: true, languages: ['en-IN', 'hi-IN'] },
      },
      capabilities: {
        pstn_inbound: true,
        bilingual_greeting: true,
        intent_extraction: true,
        multi_signal_spam_scoring: true,
        call_forwarding: true,
        human_in_the_loop_review: true,
        carrier_kyc_validation: true,
      },
    };
    return { ok: false, data: fallbackStatus, error: message };
  }
}

export interface FetchCallsParams {
  page?: number;
  limit?: number;
  status?: string;
  disposition?: string;
  search?: string;
  realOnly?: boolean;
}

export interface PaginatedCallsResult {
  items: CallRecord[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface RawCallItem {
  id: string;
  external_call_sid?: string;
  externalCallSid?: string;
  caller_number?: string;
  callerNumber?: string;
  recipient_number?: string;
  recipientNumber?: string;
  direction?: 'inbound' | 'outbound';
  status: CallRecord['status'];
  disposition: CallRecord['disposition'];
  detected_language?: CallRecord['detectedLanguage'];
  detectedLanguage?: CallRecord['detectedLanguage'];
  caller_name?: string;
  callerName?: string;
  caller_intent?: string;
  callerIntent?: string;
  duration_seconds?: number;
  durationSeconds?: number;
  spam_score?: number;
  spamScore?: number;
  started_at?: string;
  startedAt?: string;
  created_at?: string;
  createdAt?: string;
  transcript_summary?: string;
  transcriptSummary?: string;
}

export async function fetchCalls(params: FetchCallsParams = {}): Promise<PaginatedCallsResult> {
  const { page = 1, limit = 20, status, disposition, search, realOnly } = params;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  if (status && status !== 'all') query.set('status', status);
  if (disposition && disposition !== 'all') query.set('disposition', disposition);
  if (search) query.set('search', search);

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/calls?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      const rawItems: RawCallItem[] = json.items || [];
      const mappedItems: CallRecord[] = rawItems.map((item) => ({
        id: item.id,
        externalCallSid: item.external_call_sid || item.externalCallSid || '',
        callerNumber: item.caller_number || item.callerNumber || '',
        recipientNumber: item.recipient_number || item.recipientNumber || '',
        direction: item.direction || 'inbound',
        status: item.status,
        disposition: item.disposition,
        detectedLanguage: item.detected_language || item.detectedLanguage || 'en-IN',
        callerName: item.caller_name || item.callerName,
        callerIntent: item.caller_intent || item.callerIntent,
        durationSeconds: item.duration_seconds || item.durationSeconds || 0,
        spamScore: item.spam_score || item.spamScore || 0,
        startedAt: item.started_at || item.startedAt || new Date().toISOString(),
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        transcriptSummary: item.transcript_summary || item.transcriptSummary,
      }));

      return {
        items: mappedItems,
        total: json.total || mappedItems.length,
        page: json.page || page,
        limit: json.limit || limit,
        pages: json.pages || Math.ceil((json.total || mappedItems.length) / limit),
      };
    }
  } catch {
    // Fallback to local filtering of MOCK_CALLS
  }

  let filtered = [...MOCK_CALLS];
  if (status && status !== 'all') filtered = filtered.filter((c) => c.status.toLowerCase() === status.toLowerCase());
  if (disposition && disposition !== 'all') filtered = filtered.filter((c) => c.disposition.toLowerCase() === disposition.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) => c.callerNumber.toLowerCase().includes(q) || (c.callerName && c.callerName.toLowerCase().includes(q)) || (c.callerIntent && c.callerIntent.toLowerCase().includes(q))
    );
  }
  if (realOnly) {
    filtered = filtered.filter((c) => !c.id.startsWith('SIM'));
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit);

  return {
    items: paginatedItems,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
  };
}

export async function fetchCallEvents(callId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/calls/${callId}/events`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
  } catch {}
  return [
    { id: 'ev-1', eventType: 'CALL_INITIATED', actor: 'telephony', payload: { caller: '+919876543210' }, createdAt: new Date(Date.now() - 120000).toISOString() },
    { id: 'ev-2', eventType: 'LANGUAGE_DETECTED', actor: 'voice_ai', payload: { language: 'en-IN', confidence: 0.94 }, createdAt: new Date(Date.now() - 110000).toISOString() },
    { id: 'ev-3', eventType: 'SPAM_SCORD', actor: 'spam_shield', payload: { score: 18, riskCategory: 'LOW' }, createdAt: new Date(Date.now() - 95000).toISOString() },
    { id: 'ev-4', eventType: 'FORWARD_BRIDGED', actor: 'routing_engine', payload: { target: 'Vikram Mehta' }, createdAt: new Date(Date.now() - 70000).toISOString() },
  ];
}

export async function fetchCallConversation(callId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/calls/${callId}/conversation`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
  } catch {}
  return {
    id: `conv-${callId}`,
    callId,
    transcript: 'Caller: Hello, I am calling to inquire about enterprise AI deployment options.\nAI Agent: Namaste! I can assist you with enterprise deployment. Let me transfer you to our Sales Lead.',
    language: 'en-IN',
    summary: 'Caller inquired about enterprise deployment. AI receptionist verified intent and warm transferred to sales director.',
    recordingReference: 'recordings/2026/09/27/enc_rec_09823.wav',
  };
}

export async function fetchAnalyticsOverview() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/analytics/overview`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (res.ok) return await res.json();
  } catch {}
  return {
    totalCalls: MOCK_ANALYTICS.totalCalls,
    activeCalls: 2,
    answeredCalls: 312,
    missedCalls: 14,
    completedCalls: 298,
    flaggedForReview: 18,
    successfulTransfers: MOCK_ANALYTICS.legitimateCalls,
    pendingVoicemails: 3,
    pendingCallbacks: 2,
    avgDurationSeconds: MOCK_ANALYTICS.avgDurationSeconds,
    forwardingSuccessRate: MOCK_ANALYTICS.forwardingSuccessRate,
    languages: MOCK_ANALYTICS.languages,
  };
}

export async function fetchAnalyticsDaily() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/analytics/daily`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (res.ok) return await res.json();
  } catch {}
  return {
    date: new Date().toISOString().slice(0, 10),
    hourlyVolume: MOCK_ANALYTICS.hourlyVolume,
  };
}

export async function submitSpamReviewDecision(
  callId: string,
  payload: { decision: 'confirmed_spam' | 'false_positive' | 'uncertain'; submitTelecomReport?: boolean; notes?: string }
): Promise<{ ok: boolean; message: string; refId?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/spam/review/${callId}/decision`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        decision: payload.decision,
        submit_telecom_report: !!payload.submitTelecomReport,
        notes: payload.notes,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, message: data.message, refId: data.authority_reference_id };
    }
  } catch {}

  const mockRef = payload.submitTelecomReport ? `TRAI-DEMO-${Math.floor(100000 + Math.random() * 900000)}` : undefined;
  return {
    ok: true,
    message: `Review decision recorded as ${payload.decision}. ${mockRef ? `Filed report: ${mockRef}` : ''}`,
    refId: mockRef,
  };
}

export async function fetchSpamOverview() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/spam/overview`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (res.ok) return await res.json();
  } catch {}
  return {
    total_screened: 142,
    flagged_calls: 18,
    confirmed_spam: 14,
    confirmed_legitimate: 4,
    pending_reviews: 3,
    false_positives: 1,
    false_negatives: 0,
    allowlist_count: 12,
    blocklist_count: 8,
    benchmark_f1: 0.9091,
    benchmark_precision: 1.0,
    avg_latency_ms: 0.09,
  };
}

export async function fetchAllowlistBlocklist() {
  try {
    const [allowRes, blockRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/v1/spam/allowlist`, { headers: getAuthHeaders() }),
      fetch(`${BACKEND_URL}/api/v1/spam/blocklist`, { headers: getAuthHeaders() }),
    ]);
    if (allowRes.ok && blockRes.ok) {
      const allowlist = await allowRes.json();
      const blocklist = await blockRes.json();
      return { allowlist, blocklist };
    }
  } catch {}
  return {
    allowlist: [
      { id: 'al-1', phone_number: '+919876543210', list_type: 'allow', reason: 'Verified Corporate Executive', added_by: 'admin@example.com', created_at: new Date().toISOString() },
      { id: 'al-2', phone_number: '+911123456789', list_type: 'allow', reason: 'Known Client Contact', added_by: 'admin@example.com', created_at: new Date().toISOString() },
    ],
    blocklist: [
      { id: 'bl-1', phone_number: '+919898989898', list_type: 'block', reason: 'Confirmed Loan Phishing Bot', added_by: 'receptionist@example.com', created_at: new Date().toISOString() },
      { id: 'bl-2', phone_number: '+918000000000', list_type: 'block', reason: 'Repeated Utility Cutoff Scam', added_by: 'admin@example.com', created_at: new Date().toISOString() },
    ],
  };
}

export async function addListEntry(payload: { phone_number: string; list_type: 'allow' | 'block'; reason: string }) {
  try {
    const endpoint = payload.list_type === 'allow' ? '/api/v1/spam/allowlist' : '/api/v1/spam/blocklist';
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {}
  return { id: `entry-${Date.now()}`, ...payload, created_at: new Date().toISOString() };
}

export async function fetchSpamRules() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/spam/rules`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch {}
  return [
    { id: 'rule-1', rule_name: 'OTP & Credential Phishing', pattern: 'otp|password|pin|cvv|banking', risk_weight: 90, is_active: true, description: 'Triggers HIGH risk assessment on sensitive credential requests' },
    { id: 'rule-2', rule_name: 'Utility Cutoff Threat', pattern: 'disconnection|electricity bill|power cut', risk_weight: 85, is_active: true, description: 'Flags coercion and fake utility cutoff threats' },
    { id: 'rule-3', rule_name: 'Police Extortion Demand', pattern: 'police station|arrest warrant|cbi officer', risk_weight: 95, is_active: true, description: 'Flags law enforcement impersonation extortion' },
  ];
}

export async function fetchRecipients() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/recipients`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch {}
  return [
    { id: 'rec-1', display_name: 'Vikram Mehta', department: 'Sales', role_title: 'Enterprise Sales Director', phone_number: '+919876543210', availability_status: 'available', routing_priority: 1, is_active: true, business_hours_start: '09:00', business_hours_end: '18:00', time_zone: 'Asia/Kolkata' },
    { id: 'rec-2', display_name: 'Ananya Rao', department: 'Support', role_title: 'Head of Customer Success', phone_number: '+919811122233', availability_status: 'available', routing_priority: 1, is_active: true, business_hours_start: '09:00', business_hours_end: '18:00', time_zone: 'Asia/Kolkata' },
    { id: 'rec-3', display_name: 'Rajesh Verma', department: 'Executive', role_title: 'VP Operations', phone_number: '+919999988888', availability_status: 'away', routing_priority: 1, is_active: true, business_hours_start: '09:00', business_hours_end: '18:00', time_zone: 'Asia/Kolkata' },
  ];
}

export async function createRecipientApi(payload: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/recipients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {}
  return { id: `rec-${Date.now()}`, ...payload, is_active: true };
}

export async function updateRecipientApi(id: string, payload: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/recipients/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {}
  return { id, ...payload };
}

export async function updateRecipientAvailability(recipientId: string, status: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/recipients/${recipientId}/availability`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) return await res.json();
  } catch {}
  return { id: recipientId, availability_status: status };
}

export async function deleteRecipientApi(id: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/recipients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) return true;
  } catch {}
  return true;
}

export async function fetchTransfers() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/transfers`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch {}
  return [
    { id: 'tr-101', call_id: 'call-demo-1', target_name: 'Vikram Mehta', target_phone_number: '+919876543210', department: 'Sales', transfer_type: 'warm', transfer_status: 'AWAITING_ACCEPTANCE', announcement_text: 'Incoming call from Rahul regarding pricing quote. Press 1 to accept or 2 to decline.', duration_seconds: 12, created_at: new Date().toISOString() },
  ];
}

export async function acceptTransferApi(transferId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/transfers/${transferId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
  } catch {}
  return { success: true, status: 'CONNECTED', message: 'Transfer accepted by recipient. Call legs bridged.' };
}

export async function declineTransferApi(transferId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/transfers/${transferId}/decline`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
  } catch {}
  return { success: true, status: 'DECLINED', message: 'Transfer declined. Routed to voicemail fallback.' };
}

export async function fetchVoicemails() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/voicemail`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch {}
  return [
    { id: 'vm-1', caller_name: 'Suresh Kumar', caller_number: '+919810098100', duration_seconds: 24, transcript: 'Hello, calling regarding the enterprise API license quota. Please call back when available.', is_read: false, created_at: new Date().toISOString() },
    { id: 'vm-2', caller_name: 'Anita Sharma', caller_number: '+919822233344', duration_seconds: 45, transcript: 'Hi, inquiring about your technical support package pricing for multi-location offices.', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  ];
}

export async function markVoicemailReadApi(id: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/voicemail/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
  } catch {}
  return { id, is_read: true };
}

export async function deleteVoicemailApi(id: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/voicemail/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) return true;
  } catch {}
  return true;
}

export async function fetchCallbacks() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/callbacks`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch {}
  return [
    { id: 'cb-1', caller_name: 'Amit Patel', caller_number: '+919988776655', requested_department: 'Sales', purpose: 'Requested callback after unanswered sales transfer.', status: 'pending', created_at: new Date().toISOString() },
    { id: 'cb-2', caller_name: 'Neha Kapoor', caller_number: '+919911223344', requested_department: 'Support', purpose: 'Inquired about custom integration options.', status: 'completed', created_at: new Date(Date.now() - 43200000).toISOString() },
  ];
}

export async function updateCallbackStatusApi(id: string, status: string, notes?: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/callbacks/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    if (res.ok) return await res.json();
  } catch {}
  return { id, status, notes };
}

export async function fetchUsersApi() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/users`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch {}
  return [
    { id: '00000000-0000-0000-0000-000000000001', email: 'admin@aicallagent.internal', fullName: 'Lead Administrator', role: 'admin', status: 'active', isActive: true, createdAt: '2026-09-01T00:00:00Z' },
    { id: 'usr-receptionist-02', email: 'receptionist@aicallagent.internal', fullName: 'Priya Singh (Receptionist)', role: 'receptionist', status: 'active', isActive: true, createdAt: '2026-09-10T00:00:00Z' },
    { id: 'usr-auditor-03', email: 'auditor@aicallagent.internal', fullName: 'Auditor Guest', role: 'viewer', status: 'active', isActive: true, createdAt: '2026-09-15T00:00:00Z' },
  ];
}

export async function createUserApi(payload: { email: string; fullName: string; role: string }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {}
  return { id: `usr-${Date.now()}`, ...payload, status: 'active', isActive: true, createdAt: new Date().toISOString() };
}

export async function deactivateUserApi(id: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) return true;
  } catch {}
  return true;
}

export async function fetchVoiceSettingsApi() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/voice/settings`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch {}
  return {
    provider: 'local_tts',
    primaryLanguage: 'en-IN',
    greetingEnglish: "Hello! Thank you for calling. I am your AI Virtual Receptionist. How may I direct your call today?",
    greetingHindi: "नमस्ते! कॉल करने के लिए धन्यवाद। मैं आपकी एआई रिसेप्शनिस्ट हूँ। आज मैं आपकी क्या सहायता कर सकती हूँ?",
    silenceTimeoutSeconds: 3.0,
    maxCallDurationMinutes: 10,
    aiDisclosureEnabled: true,
  };
}

export async function updateVoiceSettingsApi(payload: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/voice/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch {}
  return payload;
}

export async function fetchVoiceProfilesApi() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/voice-profiles`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch {}
  return [
    { id: 'vp-1', name: 'Aditi (Bilingual India)', provider: 'local_tts', language: 'en-IN / hi-IN', is_active: true, consent_verified: true },
    { id: 'vp-2', name: 'Joanna (Natural English)', provider: 'polly', language: 'en-US', is_active: false, consent_verified: true },
    { id: 'vp-3', name: 'Custom Executive Voice Clone', provider: 'custom_xtts', language: 'multilingual', is_active: false, consent_verified: true },
  ];
}

// Stage 8 & 9 Report Center APIs

export async function fetchReports() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/reports`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function generateReportApi(payload: {
  report_type: string;
  export_format: string;
  time_zone?: string;
  title?: string;
}) {
  const res = await fetch(`${BACKEND_URL}/api/v1/reports`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Report generation failed' }));
    throw new Error(err.detail || 'Report generation failed');
  }
  return await res.json();
}

export async function downloadReportApi(reportId: string, filename: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/reports/${reportId}/download`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to download report file');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchReportSchedules() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/report-schedules`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function createReportScheduleApi(payload: {
  title: string;
  report_type: string;
  frequency: string;
  export_format: string;
  time_zone: string;
  delivery_time_utc: string;
  recipient_emails: string;
}) {
  const res = await fetch(`${BACKEND_URL}/api/v1/report-schedules`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create report schedule' }));
    throw new Error(err.detail || 'Failed to create report schedule');
  }
  return await res.json();
}

export async function deleteReportScheduleApi(scheduleId: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/report-schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to delete report schedule');
  }
}

export interface SimulateScreeningPayload {
  caller_number?: string;
  caller_name?: string;
  caller_speech?: string;
}

export async function simulateIncomingScreenedCall(payload: SimulateScreeningPayload) {
  const res = await fetch(`${BACKEND_URL}/api/v1/telephony/simulate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to simulate incoming call' }));
    throw new Error(err.detail || 'Failed to simulate call');
  }
  return await res.json();
}

export async function sendCallerUtteranceApi(callId: string, speech: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/telephony/utterance`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ call_id: callId, speech }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to process caller utterance' }));
    throw new Error(err.detail || 'Failed to process utterance');
  }
  return await res.json();
}

export async function sendUserScreeningActionApi(callId: string, action: 'ANSWER' | 'DECLINE' | 'LET_AI_HANDLE' | 'TAKE_OVER', notes?: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/telephony/calls/${callId}/user-action`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ action, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to process user action' }));
    throw new Error(err.detail || 'Failed to submit action');
  }
  return await res.json();
}

export async function fetchScreeningSettingsApi() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/telephony/screening-settings`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
  } catch {}
  return {
    user_name: 'Alex',
    assistant_name: "Alex's AI Assistant",
    language: 'en-IN',
    greeting: "Hello, you've reached Alex's AI assistant. May I know who's calling and what this is regarding?",
    forwarding_destination: '+919876543210',
    max_screening_questions: 2,
  };
}
