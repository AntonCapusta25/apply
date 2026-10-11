import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, X, RefreshCw } from 'lucide-react';
import { checkSupabaseConnection, SupabaseHealth, SUPABASE_SQL_MIGRATION, isSupabaseConfigured, SUPABASE_URL } from '../../lib/supabaseClient';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: SupabaseHealth | null;
  onRefreshHealth: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  health,
  onRefreshHealth,
}) => {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePing = async () => {
    setChecking(true);
    await onRefreshHealth();
    setChecking(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="portal-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', width: '100%' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#E0F2FE',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={20} />
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
                Supabase Database Connection
              </h2>
              <p style={{ color: '#64748B', fontSize: '0.825rem' }}>
                Spoonfull Project:{' '}
                <code style={{ color: 'var(--portal-brown)', fontWeight: 700 }}>
                  {isSupabaseConfigured ? SUPABASE_URL : 'Brand New Project (Awaiting Credentials in .env)'}
                </code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FAF8F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status banner */}
        <div
          style={{
            background: health?.connected ? '#ECFDF5' : '#FEF3C7',
            border: `1px solid ${health?.connected ? '#A7F3D0' : '#FDE68A'}`,
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: health?.connected ? '#065F46' : '#92400E' }}>
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: health?.connected ? '#059669' : '#D97706',
                }}
              />
              <span>{health?.connected ? 'Supabase Endpoint Online' : 'Connecting to Supabase...'}</span>
            </div>
            <p style={{ color: '#4B5563', fontSize: '0.825rem', marginTop: '0.25rem' }}>
              {health?.message || 'Testing connection to Supabase database'}
            </p>
          </div>
          <button
            onClick={handlePing}
            disabled={checking}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
            Test Ping
          </button>
        </div>

        {/* SQL Setup instructions */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
              Supabase Migration: <code>20261008000001_spoonfull_initial_schema.sql</code>
            </span>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: copied ? '#059669' : 'var(--portal-brown)',
                background: '#FAF8F5',
                border: '1px solid #E2E8F0',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Migration SQL'}
            </button>
          </div>
          <p style={{ fontSize: '0.825rem', color: '#64748B', marginBottom: '0.65rem' }}>
            Available in your local repository at <code style={{ color: 'var(--portal-brown)' }}>supabase/migrations/20261008000001_spoonfull_initial_schema.sql</code>. Run this in your <strong>Supabase SQL Editor</strong> to create all tables (<code>restaurant_leads</code>, <code>dishes</code>, <code>merchants</code>, <code>call_logs</code>, <code>admin_notes</code>).
          </p>
          <pre
            style={{
              background: '#0F172A',
              padding: '1rem',
              borderRadius: '10px',
              fontSize: '0.78rem',
              color: '#CBD5E1',
              maxHeight: '200px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              lineHeight: 1.45,
            }}
          >
            {SUPABASE_SQL_MIGRATION}
          </pre>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <a
            href="https://supabase.com/dashboard/project/mnhtpdsgxlyqppzyevvl"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#475569',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              background: '#FAF8F5',
              border: '1px solid #E2E8F0',
            }}
          >
            Open Supabase Dashboard <ExternalLink size={14} />
          </a>
          <button
            onClick={onClose}
            className="portal-btn-brown"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
