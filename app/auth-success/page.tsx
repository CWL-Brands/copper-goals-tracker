 'use client';

export const dynamic = 'force-dynamic';

export default function AuthSuccess() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      padding: '1rem'
    }}>
      <h1 style={{ color: '#93D500' }}>✓ Authentication Successful!</h1>
      <p>You can close this tab and return to Copper CRM.</p>
      <button
        onClick={() => window.close()}
        style={{
          marginTop: '1rem',
          padding: '10px 20px',
          backgroundColor: '#93D500',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Close Window
      </button>
    </div>
  );
}
