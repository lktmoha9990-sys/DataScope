# DataScope Frontend

React 19 dashboard for the DataScope Laravel API. The interface includes analytics, account settings, and account-scoped create, read, update, and delete workflows for store data.

See the [project README](../README.md) for the complete setup and API overview.

## Run locally

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

The default API URL is `http://127.0.0.1:8000/api`. Set `VITE_API_BASE_URL` in a local `.env` file to use another API origin. Requests include session cookies and CSRF headers.

Create an account from the login screen. The dashboard and store records are scoped to that account.
