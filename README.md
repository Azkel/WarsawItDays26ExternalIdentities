# Entra External ID – Scopes & shared identity demo

A small showcase project for **Microsoft Entra ID** (and **Entra External ID for Customers**) with:

- **React** frontend using MSAL.js (login, scopes, token for API)
- **.NET 10** Web API (token validation, scope checks, same identity)

It demonstrates:

1. **Scopes** – The API defines `Things.Read` and `Things.Write`. The SPA requests these at login; the API validates them on each request.
2. **Shared identity** – The same access token (and thus the same user: `sub`, `oid`, `name`) is used by the frontend and the backend, so the API sees the same identity as the one who signed in.

---

## Prerequisites

- **.NET 10+ SDK**
- **Node.js 18+**
- **Microsoft Entra tenant** (or Entra External ID for Customers tenant)

---

## 1. Entra app registrations

You need **two** app registrations:

- **SPA (frontend)** – Single-page application that signs in users and calls the API.
- **API (backend)** – Web API that exposes scopes and validates tokens.

### Option A: Azure Portal (Entra ID or External ID)

**API app registration**

1. **Microsoft Entra ID** → **App registrations** → **New registration**  
   (For **Entra External ID for Customers**, use your External ID tenant and create an app there.)
2. Name: e.g. `EntraDemo-API`.
3. Supported account types: as needed (e.g. “Accounts in any organizational directory and personal Microsoft accounts” or “External ID” tenant only).
4. Leave redirect URI empty. Register.
5. **Expose an API**:
   - **Application ID URI**: Set to `api://<api-client-id>` (or accept the default).
   - **Add a scope**:
     - Scope name: `Things.Read`, who can consent: **Admins and users**, description: e.g. “Read things”.
     - Add another scope: `Things.Write`, who can consent: **Admins and users**, description: e.g. “Create/update things”.
6. Note the **Application (client) ID** — this is your *API* client ID.

**SPA app registration**

1. **New registration**.
2. Name: e.g. `EntraDemo-SPA`.
3. **Supported account types**: same as API (same tenant/directory).
4. **Redirect URI**:  
   - Platform: **Single-page application (SPA)**  
   - URI: `http://localhost:5173/` (and add production URL later if needed).
5. Register.
6. **API permissions** → **Add a permission** → **My APIs** → select **EntraDemo-API** (or your API app).
7. Select **Delegated permissions** and add **Things.Read** and **Things.Write**.
8. Grant admin consent if your tenant requires it.
9. Note the **Application (client) ID** — this is your *SPA* client ID.

### Option B: Entra External ID for Customers (CIAM)

For **Entra External ID for Customers**:

- Create the app registrations in the **External ID** tenant.
- Use the same pattern: one app for the API (with scopes), one for the SPA (with redirect URI and delegated permissions to the API scopes).
- Authority and token issuer will be that External ID tenant.

---

## 2. Backend configuration

1. Open `backend/appsettings.json` and set:

```json
"AzureAd": {
  "Instance": "https://login.microsoftonline.com/",
  "TenantId": "<your-tenant-id-or-common>",
  "ClientId": "<api-app-client-id>",
  "Audience": "api://<api-app-client-id>"
}
```

- **TenantId**: Your Entra (or External ID) tenant ID, or `common` for multi-tenant.
- **ClientId** and **Audience**: the *API* app’s client ID (same as in Application ID URI).

2. Optional: set **Frontend:Origin** if the SPA runs on a different origin (e.g. `http://localhost:5173` is already the default in code).

---

## 3. Frontend configuration

1. Copy the example env file:

```bash
cd frontend
cp .env.example .env
```

2. Edit `.env`:

```env
VITE_ENTRA_CLIENT_ID=<spa-app-client-id>
VITE_ENTRA_TENANT_ID=<your-tenant-id-or-common>
VITE_ENTRA_REDIRECT_URI=http://localhost:5173/

# Must match the API app’s Application ID URI + scope names
VITE_ENTRA_API_SCOPE=api://<api-app-client-id>/Things.Read api://<api-app-client-id>/Things.Write
```

Use the **same** `api://<api-app-client-id>` as in the API’s Application ID URI and in the backend config.

---

## 4. Run the project

**Terminal 1 – API**

```bash
cd backend
dotnet run
```

API runs at `http://localhost:5000` (or the URL in `launchSettings.json`).

**Terminal 2 – Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. The Vite proxy forwards `/api` to the backend.

---

## 5. What to try

1. **Sign in** – Use “Sign in with Microsoft Entra”. Consent to the requested scopes if prompted.
2. **Requested API scopes** – The first card shows the scopes the SPA requested (from `.env`).
3. **Shared identity** – Click **GET /api/things/me**. The response is the identity from the **same** access token (same `sub`/`oid`/`name`) the frontend sent. That’s the shared identity between frontend and backend.
4. **Things.Read** – Click **GET /api/things**. This endpoint requires the `Things.Read` scope; the API validates it and returns data plus the same identity.
5. **Things.Write** – Enter a name and click **POST /api/things**. This endpoint requires `Things.Write`; again the backend validates the token and scopes and returns the same identity.

If you remove one of the API scopes from the SPA’s permission (or from the token), the corresponding call will fail with 403, illustrating scope enforcement.

---

## Project layout

```
├── backend/                    # .NET 9+ Web API
│   ├── Controllers/
│   │   └── ThingsController.cs # Endpoints with [RequiredScope]
│   ├── Program.cs              # MSAL + scope policies + CORS
│   └── appsettings.json        # AzureAd + optional Frontend:Origin
├── frontend/                   # React + Vite + MSAL
│   ├── src/
│   │   ├── authConfig.ts       # MSAL config and API scopes
│   │   ├── App.tsx             # Login, API calls with Bearer token
│   │   └── main.tsx
│   └── .env.example
└── README.md
```

---

## Scopes and shared identity (short version)

- **Scopes** are defined on the API app and requested by the SPA at login. They appear in the access token (`scp` claim). The API uses `[RequiredScope("Things.Read")]` / `[RequiredScope("Things.Write")]` so only valid tokens with the right scope are accepted.
- **Shared identity** means the frontend sends the user’s access token to the API; the API validates it and reads the same user claims (`sub`, `oid`, `name`, etc.). No separate “backend identity” — the same user is recognized on both sides.

For **Entra External ID for Customers**, use the same pattern in your External ID tenant: one API app with scopes, one SPA app with redirect URI and delegated permissions to those scopes, and the same configuration in backend and frontend.
