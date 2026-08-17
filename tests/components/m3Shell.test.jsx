import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CaseHeader from '@/components/m3/CaseHeader';
import M3NavBar from '@/components/m3/M3NavBar';
import AppLayout from '@/components/layout/AppLayout';
import { I18nProvider } from '@/i18n/i18nContext';

describe('CaseHeader', () => {
  it('renders nothing without case data', () => {
    const { container } = render(<CaseHeader />);
    expect(container.firstChild).toBeNull();
  });

  it('shows shared-by banner and document counts', () => {
    render(
      <CaseHeader
        sharedBy="Anna"
        documents={[{ id: '1' }]}
        persons={[{ id: 'p1' }, { id: 'p2' }]}
        redFlags={[{ id: 'r1' }]}
        contradictions={[]}
      />
    );
    expect(screen.getByTestId('case-header')).toBeInTheDocument();
    expect(screen.getByText(/Anna/)).toBeInTheDocument();
    expect(screen.getByText(/1 dok/)).toBeInTheDocument();
    expect(screen.getByText(/2 osôb/)).toBeInTheDocument();
    expect(screen.getByText(/1 varovaní/)).toBeInTheDocument();
  });
});

describe('M3NavBar', () => {
  it('calls onTabChange for archive and onSherlock for sherlock', () => {
    const onTabChange = vi.fn();
    const onSherlock = vi.fn();
    render(
      <I18nProvider>
        <M3NavBar activeView="graph" onTabChange={onTabChange} onSherlock={onSherlock} />
      </I18nProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Spis/i }));
    expect(onTabChange).toHaveBeenCalledWith('archive');
    fireEvent.click(screen.getByRole('button', { name: /Sherlock/i }));
    expect(onSherlock).toHaveBeenCalled();
  });
});

describe('AppLayout', () => {
  it('places camera dead zone above the touch column', () => {
    render(
      <AppLayout appBar={<div>bar</div>} nav={<nav>nav</nav>}>
        <p>content</p>
      </AppLayout>
    );
    const layout = screen.getByTestId('app-layout');
    const dead = screen.getByTestId('camera-dead-zone');
    expect(layout.firstChild).toBe(dead);
    expect(screen.getByText('bar')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
