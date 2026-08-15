import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EventTimeline from '@/components/forenz/EventTimeline';

describe('EventTimeline Komponent', () => {
  const mockEvents = [
    {
      id: 'e1',
      title: 'Stretnutie v kaviarni',
      date: '2026-08-15',
      time: '14:30',
      description: 'Rozhovor svedka s podozrivým',
      document_title: 'Výpoveď 1'
    },
    {
      id: 'e2',
      title: 'Odchod vozidla',
      date: '2026-08-15',
      time: '15:15',
      description: 'Čierne SUV opustilo parkovisko',
      document_title: 'Výpoveď 2'
    }
  ];

  it('vyrenderuje zoznam udalostí a ich časy', () => {
    render(<EventTimeline events={mockEvents} />);

    expect(screen.getByText('Stretnutie v kaviarni')).toBeInTheDocument();
    expect(screen.getByText('Odchod vozidla')).toBeInTheDocument();
    expect(screen.getByText('14:30')).toBeInTheDocument();
    expect(screen.getByText('15:15')).toBeInTheDocument();
  });

  it('zobrazí prázdny stav, keď nie sú žiadne udalosti', () => {
    render(<EventTimeline events={[]} />);
    expect(screen.getByText(/Žiadne udalosti nezodpovedajú/i)).toBeInTheDocument();
  });
});
