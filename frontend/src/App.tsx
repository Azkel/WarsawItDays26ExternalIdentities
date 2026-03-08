import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { useState } from 'react';
import { getApiScopes } from './authConfig';

const API_BASE = '/api';

async function callApi(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export default function App() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const [listResult, setListResult] = useState<string | null>(null);
  const [meResult, setMeResult] = useState<string | null>(null);
  const [createResult, setCreateResult] = useState<string | null>(null);
  const [createName, setCreateName] = useState('My thing');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearResults = () => {
    setListResult(null);
    setMeResult(null);
    setCreateResult(null);
    setError(null);
  };

  const acquireToken = async () => {
    const scopes = getApiScopes().map((s) => s.trim());
    const request = { scopes, account: accounts[0]! };
    const response = await instance.acquireTokenSilent(request).catch(() =>
      instance.acquireTokenPopup(request)
    );
    return response.accessToken;
  };

  const handleList = async () => {
    setLoading('list');
    setError(null);
    setListResult(null);
    try {
      const token = await acquireToken();
      const res = await callApi('/things', token);
      const data = await res.json();
      setListResult(JSON.stringify(data, null, 2));
      if (!res.ok) setError(res.statusText);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  };

  const handleMe = async () => {
    setLoading('me');
    setError(null);
    setMeResult(null);
    try {
      const token = await acquireToken();
      const res = await callApi('/things/me', token);
      const data = await res.json();
      setMeResult(JSON.stringify(data, null, 2));
      if (!res.ok) setError(res.statusText);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  };

  const handleCreate = async () => {
    setLoading('create');
    setError(null);
    setCreateResult(null);
    try {
      const token = await acquireToken();
      const res = await callApi('/things', token, {
        method: 'POST',
        body: JSON.stringify({ name: createName }),
      });
      const data = await res.json();
      setCreateResult(JSON.stringify(data, null, 2));
      if (!res.ok) setError(res.statusText);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  };

  const handleLogin = () => {
    clearResults();
    instance.loginPopup({ scopes: ['openid', 'profile', ...getApiScopes()] });
  };

  const handleLogout = () => {
    clearResults();
    instance.logoutPopup();
  };

  if (!isAuthenticated || accounts.length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '32rem', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Entra External ID – Demo</h1>
        <p style={{ color: '#8b949e', marginBottom: '1.5rem' }}>
          Sign in to see scopes and shared identity between frontend and API.
        </p>
        <button type="button" className="primary" onClick={handleLogin}>
          Sign in with Microsoft Entra
        </button>
      </div>
    );
  }

  const account = accounts[0]!;
  const apiScopes = getApiScopes();

  return (
    <div style={{ padding: '2rem', maxWidth: '56rem', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Entra External ID – Scopes &amp; shared identity</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>
            {account.name ?? account.username}
          </span>
          <button type="button" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      {error && (
        <div className="card error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <section className="card">
        <h3>Requested API scopes</h3>
        <p style={{ color: '#8b949e', marginBottom: '0.5rem' }}>
          These scopes are requested at login and sent in the access token to the API.
        </p>
        <pre>{apiScopes.join('\n')}</pre>
      </section>

      <section className="card">
        <h3>Shared identity (backend sees same user)</h3>
        <p style={{ color: '#8b949e', marginBottom: '0.75rem' }}>
          Call the API with your token. The backend validates the token and returns the same identity (sub, oid, name) so you can see identity is shared.
        </p>
        <button
          type="button"
          onClick={handleMe}
          disabled={loading !== null}
        >
          {loading === 'me' ? 'Loading…' : 'GET /api/things/me'}
        </button>
        {meResult && (
          <pre style={{ marginTop: '1rem' }}>{meResult}</pre>
        )}
      </section>

      <section className="card">
        <h3>Scope: Things.Read</h3>
        <p style={{ color: '#8b949e', marginBottom: '0.75rem' }}>
          Requires <code>Things.Read</code> in the token.
        </p>
        <button
          type="button"
          onClick={handleList}
          disabled={loading !== null}
        >
          {loading === 'list' ? 'Loading…' : 'GET /api/things'}
        </button>
        {listResult && (
          <pre style={{ marginTop: '1rem' }}>{listResult}</pre>
        )}
      </section>

      <section className="card">
        <h3>Scope: Things.Write</h3>
        <p style={{ color: '#8b949e', marginBottom: '0.75rem' }}>
          Requires <code>Things.Write</code> in the token.
        </p>
        <input
          type="text"
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          placeholder="Thing name"
        />
        <button
          type="button"
          style={{ marginLeft: '0.5rem' }}
          onClick={handleCreate}
          disabled={loading !== null}
        >
          {loading === 'create' ? 'Creating…' : 'POST /api/things'}
        </button>
        {createResult && (
          <pre style={{ marginTop: '1rem' }}>{createResult}</pre>
        )}
      </section>
    </div>
  );
}
