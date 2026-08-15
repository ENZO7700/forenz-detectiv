import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WelcomeIntroModal from '@/components/forenz/WelcomeIntroModal';

describe('WelcomeIntroModal (3x Welcome Onboarding)', () => {
  it('zobrazí prvý krok sprievodcu s možnosťou prejsť ďalej', () => {
    const handleClose = vi.fn();
    render(<WelcomeIntroModal open={true} onClose={handleClose} />);

    // Krok 1 text
    expect(screen.getByText(/Sprievodca systémom/i)).toBeInTheDocument();
    expect(screen.getByText(/Skenovanie a extrakcia slovenských výpovedí/i)).toBeInTheDocument();

    // Klik na tlačidlo "Ďalej"
    const nextBtn = screen.getByRole('button', { name: /Ďalej/i });
    fireEvent.click(nextBtn);

    // Krok 2 text v hlavičke
    expect(screen.getByText(/Krok 2 zo 3/i)).toBeInTheDocument();
  });

  it('nezobrazí modal, keď je open=false', () => {
    const { container } = render(<WelcomeIntroModal open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
