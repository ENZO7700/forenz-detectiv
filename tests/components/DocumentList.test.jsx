import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentList from '@/components/forenz/DocumentList';

describe('DocumentList Component (Tree / Hierarchy / Page Chunking)', () => {
  const mockDocuments = [
    {
      id: 'doc-standalone-1',
      title: 'vypoved_svedka_1.jpg',
      status: 'done',
      source_kind: 'upload',
      person_count: 2,
      relationship_count: 3
    },
    {
      id: 'pdf-container-1',
      title: 'vysetrovaci_spis_2026.pdf (3 strany)',
      status: 'error',
      source_kind: 'pdf_container',
      page_count: 3
    },
    {
      id: 'pdf-page-1',
      title: 'vysetrovaci_spis_2026.pdf · s. 1/3',
      status: 'done',
      source_kind: 'pdf_page',
      parent_document_id: 'pdf-container-1',
      page_number: 1,
      page_count: 3,
      person_count: 1,
      relationship_count: 1
    },
    {
      id: 'pdf-page-2',
      title: 'vysetrovaci_spis_2026.pdf · s. 2/3',
      status: 'error',
      source_kind: 'pdf_page',
      parent_document_id: 'pdf-container-1',
      page_number: 2,
      page_count: 3,
      error: '429 Rate limit / timeout'
    },
    {
      id: 'pdf-page-3',
      title: 'vysetrovaci_spis_2026.pdf · s. 3/3',
      status: 'pending',
      source_kind: 'pdf_page',
      parent_document_id: 'pdf-container-1',
      page_number: 3,
      page_count: 3
    }
  ];

  it('zobrazí hierarchickú štruktúru: standalone položku a kontajner so zoznamom stránok', () => {
    render(<DocumentList documents={mockDocuments} selectedDocId={null} onSelect={vi.fn()} />);

    // Standalone
    expect(screen.getByText('vypoved_svedka_1.jpg')).toBeInTheDocument();
    expect(screen.getByText('2 osôb · 3 vzťahov')).toBeInTheDocument();

    // Container
    expect(screen.getByText('vysetrovaci_spis_2026.pdf (3 strany)')).toBeInTheDocument();
    expect(screen.getByText('1/3 strán')).toBeInTheDocument();

    // Child pages
    expect(screen.getByText('s. 1/3')).toBeInTheDocument();
    expect(screen.getByText('s. 2/3')).toBeInTheDocument();
    expect(screen.getByText('s. 3/3')).toBeInTheDocument();
  });

  it('umožňuje zbaliť a rozbaliť kontajner stránok kliknutím na Chevron', () => {
    render(<DocumentList documents={mockDocuments} selectedDocId={null} onSelect={vi.fn()} />);

    // Stránka je viditeľná
    expect(screen.getByText('s. 1/3')).toBeInTheDocument();

    // Kliknutie na toggle zbalenia
    const toggleBtn = screen.getByTitle('Zbaliť stránky');
    fireEvent.click(toggleBtn);

    // Po zbalení stránky nie sú v DOM
    expect(screen.queryByText('s. 1/3')).not.toBeInTheDocument();

    // Kliknutie na toggle rozbalenia
    const expandBtn = screen.getByTitle('Rozbaliť stránky');
    fireEvent.click(expandBtn);

    // Stránka je opäť viditeľná
    expect(screen.getByText('s. 1/3')).toBeInTheDocument();
  });

  it('ponúka akciu "Znovu analyzovať stranu" pre chybovú stranu a vyvolá onRetry', () => {
    const onRetry = vi.fn();
    render(<DocumentList documents={mockDocuments} selectedDocId={null} onSelect={vi.fn()} onRetry={onRetry} />);

    expect(screen.getByText('429 Rate limit / timeout')).toBeInTheDocument();

    const retryBtns = screen.getAllByTitle('Znovu analyzovať stranu');
    expect(retryBtns.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(retryBtns[0]);
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: 'pdf-page-2', page_number: 2 }));
  });

  it('podporuje výber konkrétnej strany a výber celého kontajnera', () => {
    const onSelect = vi.fn();
    render(<DocumentList documents={mockDocuments} selectedDocId="pdf-page-1" onSelect={onSelect} />);

    // Kliknutie na stranu 3
    fireEvent.click(screen.getByText('vysetrovaci_spis_2026.pdf · s. 3/3'));
    expect(onSelect).toHaveBeenCalledWith('pdf-page-3');

    // Kliknutie na "Všetky spisy"
    fireEvent.click(screen.getByText('🌐 Všetky spisy (kompletný pavúk)'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('vyvolá onDelete pri kliknutí na tlačidlo zmazania', () => {
    const onDelete = vi.fn();
    render(<DocumentList documents={mockDocuments} selectedDocId={null} onSelect={vi.fn()} onDelete={onDelete} />);

    const deleteBtns = screen.getAllByTitle('Zmazať výpoveď');
    expect(deleteBtns.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(deleteBtns[0]);
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'doc-standalone-1' }));
  });
});
