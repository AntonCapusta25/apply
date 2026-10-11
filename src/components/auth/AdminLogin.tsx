import React, { useState } from 'react';
import { Lock, Mail, KeyRound, AlertCircle, ShieldCheck, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { signInWithEmailPassword, AuthSession } from '../../services/authService';
import { CRM_TEAM_USERS } from '../../types/onboarding';

interface AdminLoginProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your staff or admin email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await signInWithEmailPassword(email.trim(), password.trim());
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelectMember = (memberEmail: string) => {
    setEmail(memberEmail);
    setPassword('spoonfull2026');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF8F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 12px 36px rgba(74, 46, 27, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Top Header Badge */}
        <div
          style={{
            background: 'var(--portal-brown, #4A2E1B)',
            padding: '2rem 1.75rem',
            textAlign: 'center',
            color: '#FFFFFF',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <img
              src="/spoonfull-logo.png"
              alt="Spoonfull Logo"
              style={{
                height: '76px',
                width: 'auto',
                borderRadius: '12px',
                objectFit: 'contain',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              }}
            />
          </div>
          <h2
            className="font-display"
            style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.25rem 0', letterSpacing: '-0.02em' }}
          >
            Spoonfull Staff Portal
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#EEDFD5', opacity: 0.9 }}>
            Internal CRM Authentication • Admin &amp; Sales Pipeline
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '2rem 1.75rem' }}>
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.825rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.4rem',
                }}
              >
                Work Email Address
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FAF8F5',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  gap: '0.65rem',
                }}
              >
                <Mail size={16} color="#94A3B8" />
                <input
                  type="email"
                  required
                  placeholder="e.g. bangalexf@gmail.com or lucas@spoonfull.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.9rem',
                    color: '#0F172A',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.4rem',
                }}
              >
                Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FAF8F5',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  gap: '0.65rem',
                }}
              >
                <KeyRound size={16} color="#94A3B8" />
                <input
                  type="password"
                  placeholder="Enter your security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.9rem',
                    color: '#0F172A',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="portal-btn-brown"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isLoading ? (
                'Verifying Credentials...'
              ) : (
                <>
                  <span>Sign In to CRM</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Roster Selector */}
          <div style={{ marginTop: '1.75rem', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.65rem',
                textAlign: 'center',
              }}
            >
              Quick Team Access
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {CRM_TEAM_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickSelectMember(user.email)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: email === user.email ? '1.5px solid var(--portal-brown)' : '1px solid #E2E8F0',
                    background: email === user.email ? '#FDF3EE' : '#FAF8F5',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{user.name}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>({user.email})</span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: user.role === 'admin' ? 'var(--portal-brown)' : '#059669',
                      color: '#FFFFFF',
                    }}
                  >
                    {user.role === 'admin' ? 'ADMIN' : 'SALES'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
