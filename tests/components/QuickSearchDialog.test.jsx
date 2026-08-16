import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import QuickSearchDialog from '@/components/forenz/QuickSearchDialog';

describe('QuickSearchDialog accessibility', () => {
  it('prepojí dialóg s existujúcim názvom a popisom', () => {
    render(<QuickSearchDialog open onOpenChange={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: 'Rýchle vyhľadávanie v prípade' });
    const titleId = dialog.getAttribute('aria-labelledby');
    const descriptionId = dialog.getAttribute('aria-describedby');

    expect(titleId).toBeTruthy();
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(titleId)).toHaveTextContent('Rýchle vyhľadávanie v prípade');
    expect(document.getElementById(descriptionId)).toHaveTextContent('Vyhľadajte osoby, dokumenty, udalosti a rozpory');
  });
});
