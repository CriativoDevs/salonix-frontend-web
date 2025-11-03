import React from 'react';
import { render } from '@testing-library/react';
import TableLoadingSpinner from '../TableLoadingSpinner';

describe('TableLoadingSpinner', () => {
  it('renderiza spinner com número padrão de linhas', () => {
    const { container } = render(<TableLoadingSpinner />);
    
    // Verifica se há 5 linhas por padrão (skeleton rows)
    const skeletonRows = container.querySelectorAll('.space-y-3 > div');
    expect(skeletonRows).toHaveLength(5);
  });

  it('renderiza spinner com número personalizado de linhas', () => {
    const { container } = render(<TableLoadingSpinner rows={3} />);
    
    const skeletonRows = container.querySelectorAll('.space-y-3 > div');
    expect(skeletonRows).toHaveLength(3);
  });

  it('renderiza com número mínimo de linhas', () => {
    const { container } = render(<TableLoadingSpinner rows={1} />);
    
    const skeletonRows = container.querySelectorAll('.space-y-3 > div');
    expect(skeletonRows).toHaveLength(1);
  });

  it('aplica classes CSS corretas', () => {
    const { container } = render(<TableLoadingSpinner />);
    
    const skeletonCells = container.querySelectorAll('.animate-pulse');
    expect(skeletonCells.length).toBeGreaterThan(0);
  });

  it('renderiza células skeleton em cada linha', () => {
    const { container } = render(<TableLoadingSpinner rows={2} columns={4} />);
    
    // Verifica se há células skeleton (divs com background cinza)
    const skeletonCells = container.querySelectorAll('.h-4.bg-brand-surfaceForeground\\/10');
    expect(skeletonCells).toHaveLength(8); // 2 rows * 4 columns = 8 cells
  });

  it('renderiza com número personalizado de colunas', () => {
    const { container } = render(<TableLoadingSpinner rows={1} columns={5} />);
    
    const skeletonCells = container.querySelectorAll('.h-4.bg-brand-surfaceForeground\\/10');
    expect(skeletonCells).toHaveLength(5); // 1 row * 5 columns = 5 cells
  });
});