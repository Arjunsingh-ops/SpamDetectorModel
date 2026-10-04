'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

export interface LiveCallSession {
  id: string;
  callerNumber: string;
  callerName?: string;
  recipientNumber?: string;
  status: 'RINGING' | 'IN_PROGRESS' | 'TRANSFERRING' | 'USER_RINGING' | 'CONNECTED_TO_USER' | 'SAFE_TO_FORWARD' | 'AI_HANDLED' | 'AI_RESUMED' | 'COMPLETED' | 'FLAGGED' | (string & {});
  detectedLanguage: 'en-IN' | 'hi-IN' | 'mixed';
  disposition: 'legitimate' | 'spam' | 'uncertain';
  durationSeconds: number;
  spamScore: number;
  aiState: 'GREETING' | 'INTENT_LISTENING' | 'SCREENING_CHALLENGE' | 'TRANSFER_BRIDGED' | 'COMPLETED';
  startedAt: string;
  transcript: { sender: 'caller' | 'ai'; text: string; timestamp: string }[];
  events: { id: string; eventType: string; actor: string; payload: any; createdAt: string }[];
}

export interface NotificationItem {
  id: string;
  type: 'incoming_call' | 'transfer_request' | 'missed_call' | 'new_voicemail' | 'callback_assigned' | 'spam_alert' | 'system_error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  isPolling: boolean;
  activeCalls: LiveCallSession[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  triggerSimulatedCall: (params?: { callerNumber?: string; callerName?: string; intent?: string; spamScore?: number }) => void;
  endCallSession: (callId: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  isPolling: true,
  activeCalls: [],
  notifications: [],
  unreadNotificationCount: 0,
  markNotificationRead: () => {},
  clearAllNotifications: () => {},
  triggerSimulatedCall: () => {},
  endCallSession: () => {},
});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [activeCalls, setActiveCalls] = useState<LiveCallSession[]>([
    {
      id: 'SIM-CALL-8821',
      callerNumber: '+919876543210',
      callerName: 'Rohan Sharma',
      recipientNumber: '+911145678900',
      status: 'IN_PROGRESS',
      detectedLanguage: 'hi-IN',
      disposition: 'legitimate',
      durationSeconds: 42,
      spamScore: 12,
      aiState: 'INTENT_LISTENING',
      startedAt: new Date(Date.now() - 42000).toISOString(),
      transcript: [
        { sender: 'ai', text: 'नमस्ते! AI Call Agent में आपका स्वागत है। मैं आपकी क्या सहायता कर सकता हूँ?', timestamp: '00:02' },
        { sender: 'caller', text: 'नमस्ते, मुझे सेल्स डायरेक्टर विक्रम मेहता जी से बात करनी है।', timestamp: '00:08' },
        { sender: 'ai', text: 'जी अवश्य, मैं आपकी कॉल सेल्स विभाग में ट्रांसफर कर रहा हूँ। कृपया प्रतीक्षा करें।', timestamp: '00:15' },
      ],
      events: [
        { id: 'ev-1', eventType: 'CALL_INITIATED', actor: 'telephony', payload: { caller: '+919876543210' }, createdAt: new Date(Date.now() - 42000).toISOString() },
        { id: 'ev-2', eventType: 'LANGUAGE_DETECTED', actor: 'voice_ai', payload: { language: 'hi-IN' }, createdAt: new Date(Date.now() - 40000).toISOString() },
        { id: 'ev-3', eventType: 'SPAM_CHECK_PASSED', actor: 'spam_shield', payload: { score: 12 }, createdAt: new Date(Date.now() - 35000).toISOString() },
      ],
    },
    {
      id: 'SIM-CALL-9104',
      callerNumber: '+919898989898',
      callerName: 'Unverified CLI',
      recipientNumber: '+911145678900',
      status: 'FLAGGED',
      detectedLanguage: 'en-IN',
      disposition: 'spam',
      durationSeconds: 18,
      spamScore: 88,
      aiState: 'SCREENING_CHALLENGE',
      startedAt: new Date(Date.now() - 18000).toISOString(),
      transcript: [
        { sender: 'ai', text: 'Hello! You have reached AI Receptionist. Please state your name and call purpose.', timestamp: '00:02' },
        { sender: 'caller', text: 'Urgent electricity bill disconnection. Give me your OTP immediately.', timestamp: '00:07' },
        { sender: 'ai', text: 'Security Notice: Credential request flagged as high risk. Screening human review.', timestamp: '00:12' },
      ],
      events: [
        { id: 'ev-101', eventType: 'CALL_INITIATED', actor: 'telephony', payload: { caller: '+919898989898' }, createdAt: new Date(Date.now() - 18000).toISOString() },
        { id: 'ev-102', eventType: 'SPAM_TRIGGERED', actor: 'spam_shield', payload: { score: 88, trigger: 'OTP Phishing' }, createdAt: new Date(Date.now() - 10000).toISOString() },
      ],
    },
  ]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'spam_alert',
      title: 'High Risk Call Intercepted',
      message: 'Call from +919898989898 flagged for human review (Spam Score 88/100).',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      isRead: false,
      actionUrl: '/spam-review',
    },
    {
      id: 'notif-2',
      type: 'transfer_request',
      title: 'Warm Transfer Requested',
      message: 'Inbound call from Rohan Sharma requested Sales Director Vikram Mehta.',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      isRead: false,
      actionUrl: '/call-routing',
    },
    {
      id: 'notif-3',
      type: 'new_voicemail',
      title: 'New Voicemail Received',
      message: 'Suresh Kumar (+919810098100) left a 24s voicemail regarding API licenses.',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      isRead: true,
      actionUrl: '/voicemail',
    },
  ]);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000')
      .replace(/^http/, 'ws') + '/api/v1/voice/simulate';

    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setIsPolling(false);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'call_event' || data.event === 'call_start') {
            // handle real websocket call event
          }
        } catch {}
      };

      socket.onerror = () => {
        setIsConnected(false);
        setIsPolling(true);
      };

      socket.onclose = () => {
        setIsConnected(false);
        setIsPolling(true);
      };
    } catch {
      setIsConnected(false);
      setIsPolling(true);
    }

    return () => {
      if (socket) socket.close();
    };
  }, []);

  // Increment duration timer for active calls
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCalls((prev) =>
        prev.map((call) =>
          call.status === 'IN_PROGRESS' || call.status === 'FLAGGED'
            ? { ...call, durationSeconds: call.durationSeconds + 1 }
            : call
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const triggerSimulatedCall = useCallback(
    (params?: { callerNumber?: string; callerName?: string; intent?: string; spamScore?: number }) => {
      const callId = `SIM-CALL-${Math.floor(1000 + Math.random() * 9000)}`;
      const caller = params?.callerNumber || `+91${Math.floor(7000000000 + Math.random() * 2999999999)}`;
      const name = params?.callerName || 'Simulated PSTN Caller';
      const spamScore = params?.spamScore !== undefined ? params.spamScore : Math.floor(Math.random() * 30);
      const isSpam = spamScore >= 70;

      const newSession: LiveCallSession = {
        id: callId,
        callerNumber: caller,
        callerName: name,
        recipientNumber: '+911145678900',
        status: isSpam ? 'FLAGGED' : 'IN_PROGRESS',
        detectedLanguage: Math.random() > 0.5 ? 'en-IN' : 'hi-IN',
        disposition: isSpam ? 'spam' : 'legitimate',
        durationSeconds: 1,
        spamScore,
        aiState: isSpam ? 'SCREENING_CHALLENGE' : 'INTENT_LISTENING',
        startedAt: new Date().toISOString(),
        transcript: [
          { sender: 'ai', text: 'Namaste! Welcome to AI Virtual Receptionist. How may I help you today?', timestamp: '00:01' },
          { sender: 'caller', text: params?.intent || 'Hi, I need assistance connecting with customer support.', timestamp: '00:03' },
        ],
        events: [
          { id: `ev-${Date.now()}-1`, eventType: 'CALL_INITIATED', actor: 'telephony_simulator', payload: { caller }, createdAt: new Date().toISOString() },
          { id: `ev-${Date.now()}-2`, eventType: 'SPAM_CHECK', actor: 'spam_engine', payload: { score: spamScore }, createdAt: new Date().toISOString() },
        ],
      };

      setActiveCalls((prev) => [newSession, ...prev]);

      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        type: isSpam ? 'spam_alert' : 'incoming_call',
        title: isSpam ? 'Spam Call Flagged' : 'New Inbound Call',
        message: `${name} (${caller}) initiated call. Spam score: ${spamScore}/100.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        actionUrl: isSpam ? '/spam-review' : '/live-calls',
      };

      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  const endCallSession = (callId: string) => {
    setActiveCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, status: 'COMPLETED', aiState: 'COMPLETED' } : c))
    );
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        isPolling,
        activeCalls,
        notifications,
        unreadNotificationCount,
        markNotificationRead,
        clearAllNotifications,
        triggerSimulatedCall,
        endCallSession,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
