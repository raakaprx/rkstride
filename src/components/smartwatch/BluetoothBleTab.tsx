import React from 'react';
import { Bluetooth } from 'lucide-react';

interface BluetoothBleTabProps {
  connecting: boolean;
  btStatus: string | null;
  onConnectBt: () => void;
}

export const BluetoothBleTab: React.FC<BluetoothBleTabProps> = ({
  connecting,
  btStatus,
  onConnectBt,
}) => {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <Bluetooth size={22} style={{ color: 'var(--color-info)' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Direct Web Bluetooth GATT Stream
        </h3>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
        Pair with any smartwatch or chest strap broadcasting standard Bluetooth Heart Rate (Service 0x180D), including Garmin Forerunner, Apple Watch, Xiaomi Band, Polar, and Coros.
      </p>

      <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Pairing Instructions:
        </h4>
        <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
          <li>Ensure Bluetooth is enabled on your host computer/laptop.</li>
          <li>On your watch, enable Heart Rate Broadcasting / pairing mode (e.g., Garmin: <em>Settings &gt; Sensors &gt; Broadcast Heart Rate</em>, or Xiaomi/Apple: open workout heart rate monitor).</li>
          <li>Click the button below and select your device from the browser permission popup.</li>
        </ol>
      </div>

      {btStatus && (
        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: '0.8rem', marginBottom: '1rem' }}>
          {btStatus}
        </div>
      )}

      <button
        onClick={onConnectBt}
        disabled={connecting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-info)',
          color: 'var(--text-inverse)',
          fontWeight: 800,
          fontSize: '0.9rem',
          border: 'none',
          cursor: connecting ? 'not-allowed' : 'pointer',
        }}
      >
        <Bluetooth size={18} />
        {connecting ? 'Scanning for Smartwatch...' : 'Scan & Connect Smartwatch via Bluetooth'}
      </button>
    </div>
  );
};
