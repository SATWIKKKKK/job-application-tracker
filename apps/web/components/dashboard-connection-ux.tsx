'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, MailCheck } from 'lucide-react';
import type { User } from '../lib/types';
import { API_URL } from '../lib/config';
import { getOAuthReturnTo } from '../lib/oauth';

type ScanStatus = {
  initial_scan_completed: boolean;
  initial_scan_found_count: number;
  gmail_connected: boolean;
};

function getBrowserAuthHeaders() {
  const token = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('jt_token='))
    ?.split('=')[1];
  return token ? { authorization: `Bearer ${decodeURIComponent(token)}` } : undefined;
}

export function DashboardConnectionUX({ user, oauthJustCompleted }: { user: User; oauthJustCompleted: boolean }) {
  const [gmailConnected, setGmailConnected] = useState(user.gmail_connected);
  const [sheetId, setSheetId] = useState(user.google_sheet_id);
  const [scanCompleted, setScanCompleted] = useState(user.initial_scan_completed);
  const [foundCount, setFoundCount] = useState(user.initial_scan_found_count);
  const [showSuccessModal, setShowSuccessModal] = useState(oauthJustCompleted && !user.gmail_connected);
  const [isScanning, setIsScanning] = useState(oauthJustCompleted && user.gmail_connected && !user.initial_scan_completed);
  const [scanFinishedMessage, setScanFinishedMessage] = useState(false);
  const [sheetError, setSheetError] = useState('');

  useEffect(() => {
    if (!isScanning || scanCompleted) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`${API_URL}/api/applications/scan-status`, {
        credentials: 'include',
        headers: getBrowserAuthHeaders(),
      });
      if (!response.ok) return;
      const status = (await response.json()) as ScanStatus;
      setGmailConnected(status.gmail_connected);
      setScanCompleted(status.initial_scan_completed);
      setFoundCount(status.initial_scan_found_count);
      if (status.initial_scan_completed) {
        setIsScanning(false);
        setScanFinishedMessage(true);
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [isScanning, scanCompleted]);

  const banner = useMemo(() => {
    if (!gmailConnected) {
      return {
        tone: 'border-amber-500 bg-amber-50 text-amber-950',
        dot: 'bg-amber-500',
        text: 'Gmail not connected yet - click here to connect',
        subtext: 'Connect with the same email you use on job portals so JobTrackr can track confirmations automatically.',
      };
    }
    return {
      tone: 'border-primary bg-surface-container-low text-on-surface',
      dot: 'bg-emerald-500',
      text: 'JobTrackr is actively watching your inbox for job confirmation emails - details are extracted and logged to your Google Sheet automatically.',
      subtext: 'Also monitoring: Google Forms and Google Docs application submissions sent to your registered email.',
    };
  }, [gmailConnected]);

  async function acknowledgeConnection() {
    const response = await fetch(`${API_URL}/api/gmail/acknowledge-connected`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json', ...getBrowserAuthHeaders() },
    });
    if (!response.ok) return;
    setGmailConnected(true);
    setShowSuccessModal(false);
    setIsScanning(true);
  }

  function connectGmail() {
    const returnTo = getOAuthReturnTo();
    window.location.href = `${API_URL}/api/auth/google?return_to=${encodeURIComponent(returnTo)}`;
  }

  async function openSheet() {
    setSheetError('');
    const sheetTab = window.open('', '_blank');
    try {
      const response = await fetch(`${API_URL}/api/user/sheet-url`, {
        credentials: 'include',
        headers: getBrowserAuthHeaders(),
      });
      const data = (await response.json()) as {
        sheet_id: string | null;
        sheet_url: string | null;
        requires_reconnect?: boolean;
        reason?: string;
      };
      if (!response.ok) {
        sheetTab?.close();
        if (data.requires_reconnect) {
          connectGmail();
          return;
        }
        setSheetError('Could not open your Google Sheet. Please try again.');
        return;
      }
      if (!data.sheet_url) {
        sheetTab?.close();
        if (data.requires_reconnect) {
          connectGmail();
          return;
        }
        setSheetError('Sheet is not ready yet. Reconnect Gmail once to generate it.');
        return;
      }
      setSheetId(data.sheet_id);
      if (sheetTab) sheetTab.location.href = data.sheet_url;
      else window.open(data.sheet_url, '_blank', 'noopener,noreferrer');
    } catch {
      sheetTab?.close();
      connectGmail();
    }
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <button
          type="button"
          onClick={!gmailConnected ? connectGmail : undefined}
          className={`shadow-ambient w-full rounded-lg border-l-4 p-5 text-left ${banner.tone}`}
        >
          <div className="flex items-start gap-3">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${banner.dot} ${gmailConnected ? 'animate-pulse' : ''}`} />
            <div>
              <p className="font-headline text-base font-bold leading-6">{banner.text}</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{banner.subtext}</p>
              {isScanning ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" /> Scanning your inbox for past applications...
                </p>
              ) : null}
              {scanCompleted && foundCount > 0 ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <MailCheck className="h-4 w-4" /> Found {foundCount} past applications logged to your Sheet
                </p>
              ) : null}
            </div>
          </div>
        </button>

        <button
          type="button"
          aria-disabled={!sheetId}
          title={sheetId ? 'Open your JobTrackr Google Sheet' : 'Reconnect Gmail to generate your sheet'}
          onClick={sheetId ? openSheet : connectGmail}
          className={`shadow-ambient flex min-h-[104px] items-center justify-center gap-3 rounded-lg px-5 py-4 font-headline text-base font-bold transition-all ${
            sheetId
              ? 'hero-gradient text-on-primary hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,73,197,0.14)]'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <GoogleSheetsIcon />
          <span>Open My Google Sheet</span>
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
      {sheetError ? (
        <p className="mt-2 rounded-DEFAULT bg-surface-container px-3 py-2 text-sm text-on-surface-variant">
          {sheetError}
        </p>
      ) : null}

      {showSuccessModal ? (
        <GmailSuccessModal
          title="Gmail Successfully Connected"
          body="JobTrackr is now watching your inbox for job confirmation emails from LinkedIn, Naukri, Internshala, Unstop, Indeed, Wellfound, Glassdoor, and others. You can close this tab and forget about it."
          actionLabel="Got it"
          onAction={acknowledgeConnection}
        />
      ) : null}

      {scanFinishedMessage ? (
        <GmailSuccessModal
          title="Initial Scan Complete"
          body={`JobTrackr found ${foundCount} existing application ${foundCount === 1 ? 'email' : 'emails'} and logged the confident matches to your tracker.`}
          actionLabel="Got it"
          onAction={() => setScanFinishedMessage(false)}
        />
      ) : null}
    </>
  );
}

function GoogleSheetsIcon() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white shadow-sm" aria-hidden="true">
      <svg className="h-6 w-6" viewBox="0 0 24 24" role="img">
        <path fill="#0F9D58" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path fill="#87CEAC" d="M14 2v6h6z" />
        <path fill="#fff" d="M7 11h10v7H7zm1.5 1.5V14h2.75v-1.5zm4.25 0V14h2.75v-1.5zM8.5 15.5V17h2.75v-1.5zm4.25 0V17h2.75v-1.5z" />
      </svg>
    </span>
  );
}

function GmailSuccessModal({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm">
      <div className="shadow-[0_10px_40px_rgba(25,28,32,0.06),0_4px_20px_rgba(0,73,197,0.04)] flex w-full max-w-[440px] flex-col gap-8 rounded-lg bg-surface-container-lowest p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-[#34a853]">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">{title}</h2>
          <p className="text-sm leading-6 text-on-surface-variant">{body}</p>
        </div>
        <div className="flex flex-col gap-4 rounded-DEFAULT bg-surface-container-low p-6">
          {['Watching inbox for job confirmation emails', 'Google Sheet created in your Drive', 'Google Docs job forms being monitored'].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#34a853]" />
              <p className="font-medium leading-relaxed text-on-surface-variant">{item}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onAction}
          className="hero-gradient w-full rounded-full px-6 py-4 font-headline text-base font-bold text-on-primary shadow-[0_4px_20px_rgba(0,73,197,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_25px_rgba(0,73,197,0.15)] active:scale-95"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
