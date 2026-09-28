export type CallStatus = 'initiated' | 'ringing' | 'in_progress' | 'completed' | 'blocked' | 'transferred' | 'failed';

export type CallDisposition = 'legitimate' | 'spam' | 'uncertain' | 'missed';

export type DetectedLanguage = 'en-IN' | 'hi-IN' | 'mixed' | 'bilingual';

export type UserRole = 'admin' | 'operator' | 'receptionist' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface CallRecord {
  id: string;
  externalCallSid: string;
  callerNumber: string;
  recipientNumber: string;
  direction: 'inbound' | 'outbound';
  status: CallStatus;
  disposition: CallDisposition;
  detectedLanguage: DetectedLanguage;
  callerName?: string;
  callerIntent?: string;
  durationSeconds: number;
  spamScore: number;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  transcriptSummary?: string;
  recordingUrl?: string;
}

export interface SpamAssessment {
  callId: string;
  compositeScore: number;
  reputationScore: number;
  semanticScore: number;
  behavioralScore: number;
  classification: 'legitimate' | 'uncertain' | 'spam';
  confidence: number;
  detectedTriggers: string[];
  aiRationale: string;
}

export interface SystemStatusData {
  status: string;
  environment: string;
  version: string;
  timestamp: string;
  database: {
    connected: boolean;
    dialect: string;
    latency_ms: number;
  };
  adapters: {
    telephony: {
      provider: string;
      mode: string;
      ready: boolean;
      languages: string[];
    };
    voice_ai: {
      provider: string;
      mode: string;
      ready: boolean;
      languages: string[];
    };
    spam_engine: {
      provider: string;
      mode: string;
      ready: boolean;
      languages: string[];
    };
  };
  capabilities: Record<string, boolean>;
}

export interface AnalyticsSummary {
  totalCalls: number;
  legitimateCalls: number;
  spamCallsBlocked: number;
  uncertainScreened: number;
  avgDurationSeconds: number;
  forwardingSuccessRate: number;
  languages: {
    english: number;
    hindi: number;
    hinglish: number;
  };
  hourlyVolume: { hour: string; legitimate: number; spam: number }[];
}
