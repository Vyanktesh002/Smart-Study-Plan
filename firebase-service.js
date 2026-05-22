import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, doc, setDoc, updateDoc, collection, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js';
import { getFirebaseConfig } from './firebase-config.js';

export let db = null;
export let analytics = null;
export let sessionId = null;

function parseUserAgent(ua) {
  let browser = 'Unknown';
  let os = 'Unknown';

  if (/Edg\//.test(ua)) browser = 'Edge ' + (ua.match(/Edg\/([\d.]+)/) || [])[1];
  else if (/OPR\//.test(ua)) browser = 'Opera ' + (ua.match(/OPR\/([\d.]+)/) || [])[1];
  else if (/Chrome\//.test(ua)) browser = 'Chrome ' + (ua.match(/Chrome\/([\d.]+)/) || [])[1];
  else if (/Firefox\//.test(ua)) browser = 'Firefox ' + (ua.match(/Firefox\/([\d.]+)/) || [])[1];
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari ' + (ua.match(/Version\/([\d.]+)/) || [])[1];

  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'macOS ' + (ua.match(/Mac OS X ([\d_]+)/) || ['', ''])[1].replace(/_/g, '.');
  else if (/Android/.test(ua)) os = 'Android ' + (ua.match(/Android ([\d.]+)/) || ['', ''])[1];
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  return { browser, os };
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

async function init() {
  try {
    const config = await getFirebaseConfig();
    if (!config || !config.apiKey) return;

    const app = initializeApp(config);
    db = getFirestore(app);
    analytics = getAnalytics(app);

    // Reuse session across page navigations; new session per browser restart
    sessionId = sessionStorage.getItem('study_session_id');
    if (!sessionId) {
      sessionId = generateUUID();
      sessionStorage.setItem('study_session_id', sessionId);
    }

    const { browser, os } = parseUserAgent(navigator.userAgent);

    const sessionRef = doc(db, 'device_sessions', sessionId);
    await setDoc(sessionRef, {
      sessionId,
      userAgent: navigator.userAgent,
      browser,
      os,
      language: navigator.language || 'unknown',
      screenResolution: `${screen.width}x${screen.height}`,
      firstSeen: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isOnline: true,
      pageUrl: window.location.pathname,
    }, { merge: true });

    // Heartbeat every 30 seconds
    setInterval(async () => {
      try {
        await updateDoc(sessionRef, { lastSeen: serverTimestamp(), isOnline: true });
      } catch (_) {}
    }, 30_000);

    // Mark offline on page leave
    window.addEventListener('beforeunload', () => {
      navigator.sendBeacon('/api/device-offline', JSON.stringify({ sessionId }));
    });

    // Also mark offline via Firestore if page hidden for >5s (tab switching)
    document.addEventListener('visibilitychange', async () => {
      try {
        await updateDoc(sessionRef, {
          isOnline: !document.hidden,
          lastSeen: serverTimestamp(),
        });
      } catch (_) {}
    });

  } catch (err) {
    console.warn('Firebase service init failed:', err);
  }
}

init();
