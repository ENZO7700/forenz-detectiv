import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatsBar from '@/components/forenz/StatsBar';

describe('StatsBar floating drawer', () => {
  const props = {
    documents: [{ status: 'done' }, { status: 'error' }],
    persons: [{ id: 1 }],
    relationships: [],
    redFlags: [{ id: 'rf1' }],
    flaggedPassages: [],
  };

  it('renders FAB toggle while collapsed and expands metrics on click', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<StatsBar {...props} open={false} onOpenChange={onOpenChange} />);

    expect(screen.getByTestId('stats-drawer-toggle')).toBeInTheDocument();
    expect(screen.queryByTestId('stats-drawer')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('stats-drawer-toggle'));
    expect(onOpenChange).toHaveBeenCalledWith(true);

    rerender(<StatsBar {...props} open onOpenChange={onOpenChange} />);
    expect(screen.getByTestId('stats-drawer')).toBeInTheDocument();
    expect(screen.getByText('Dokumenty')).toBeInTheDocument();
    expect(screen.getByText('Úspešnosť')).toBeInTheDocument();
  });
});
