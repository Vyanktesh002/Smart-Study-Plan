// Fetches Firebase web config from the Flask backend (values come from .env)
let _configCache = null;

export async function getFirebaseConfig() {
  if (_configCache) return _configCache;
  const res = await fetch('/api/firebase-web-config');
  _configCache = await res.json();
  return _configCache;
}
