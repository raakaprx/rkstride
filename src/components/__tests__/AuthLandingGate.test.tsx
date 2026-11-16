import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import axe from 'axe-core';
import { AuthLandingGate } from '../AuthLandingGate';
import { OdooSprintDocsModal } from '../OdooSprintDocsModal';

describe('AuthLandingGate & OdooSprintDocsModal - Finding #1 Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders value proposition, ACWR explanation, and registration form on first visit', () => {
    render(
      <AuthLandingGate
        onAuthenticated={vi.fn()}
        onOpenOdooModal={vi.fn()}
        onOpenAboutModal={vi.fn()}
      />
    );

    expect(screen.getByText(/SATU MESIN BEBAN UNTUK/i)).toBeInTheDocument();
    expect(screen.getByText(/Cara Kerja Penjaga Beban RKStride \(ACWR\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Buat Profil Atlet Hibrida Baru/i)).toBeInTheDocument();
  });

  it('shows validation error when submitting empty registration form', () => {
    render(
      <AuthLandingGate
        onAuthenticated={vi.fn()}
        onOpenOdooModal={vi.fn()}
        onOpenAboutModal={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Buat Akun & Masuk ke Dasbor/i });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/Harap isi nama panggilan atlet Anda/i);
  });

  it('registers a new athlete with chosen experience level and calls onAuthenticated', () => {
    const onAuth = vi.fn();
    render(
      <AuthLandingGate
        onAuthenticated={onAuth}
        onOpenOdooModal={vi.fn()}
        onOpenAboutModal={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/Nama Panggilan Atlet/i), {
      target: { value: 'Raka' },
    });
    fireEvent.change(screen.getByLabelText(/Email \/ ID Lokal/i), {
      target: { value: 'raka@rkstride.local' },
    });
    fireEvent.change(screen.getByLabelText(/PIN Akses Lokal/i), {
      target: { value: '1234' },
    });

    // Select Menengah level
    fireEvent.click(screen.getByRole('button', { name: 'Menengah' }));

    // Check non-medical disclaimer
    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.click(screen.getByRole('button', { name: /Buat Akun & Masuk ke Dasbor/i }));

    expect(onAuth).toHaveBeenCalledTimes(1);
    expect(onAuth.mock.calls[0][0]).toMatchObject({
      athleteName: 'Raka',
      email: 'raka@rkstride.local',
      experienceLevel: 'intermediate',
    });
  });

  it('allows quick login evaluation from Login tab', () => {
    const onAuth = vi.fn();
    render(
      <AuthLandingGate
        onAuthenticated={onAuth}
        onOpenOdooModal={vi.fn()}
        onOpenAboutModal={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Masuk Akun/i }));
    fireEvent.click(screen.getByRole('button', { name: /Masuk Cepat sebagai Atlet/i }));

    expect(onAuth).toHaveBeenCalledTimes(1);
  });

  it('renders OdooSprintDocsModal with Sprint tasks and passes axe accessibility check', async () => {
    const { container } = render(
      <OdooSprintDocsModal isOpen={true} onClose={vi.fn()} />
    );

    expect(screen.getByText(/Papan Sprint Odoo & Dokumentasi Arsitektur RKStride/i)).toBeInTheDocument();
    expect(screen.getByText(/ODOO-101/i)).toBeInTheDocument();
    expect(screen.getByText(/ODOO-102/i)).toBeInTheDocument();

    const results = await axe.run(container);
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toHaveLength(0);
  });
});
