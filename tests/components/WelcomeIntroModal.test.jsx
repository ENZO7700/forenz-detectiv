import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WelcomeIntroModal from '@/components/forenz/WelcomeIntroModal';
import { I18nProvider } from '@/i18n/i18nContext';

describe('WelcomeIntroModal (3x Welcome Onboarding)', () => {
  it('zobrazí sprievodcu s možnosťou pokračovať', () => {
    const handleClose = vi.fn();
    render(
      <I18nProvider>
        <WelcomeIntroModal open={true} onClose={handleClose} />
      </I18nProvider>
    );

    // Titulok a funkcie
    expect(screen.getByText(/Odhaľte rozpory a nemožné alibi za minúty/i)).toBeInTheDocument();
    expect(screen.getByText(/AI extrakcia výpovedí/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Detekcia rozporov/i })).toBeInTheDocument();
    expect(screen.getByText(/Alibi mapa/i)).toBeInTheDocument();

    // Klik na tlačidlo "Pokračovať — nahrať spis"
    const continueBtn = screen.getByRole('button', { name: /Pokračovať|welcome\.continue/i });
    fireEvent.click(continueBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('nezobrazí modal, keď je open=false', () => {
    const { container } = render(
      <I18nProvider>
        <WelcomeIntroModal open={false} onClose={() => {}} />
      </I18nProvider>
    );
    expect(container.firstChild).toBeNull();
  });
});
