import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MonthGrid from '../MonthGrid';

describe('MonthGrid', () => {
  const days = [
    {
      key: '2026-07-01',
      dayNumber: 1,
      inCurrentMonth: true,
      isToday: false,
      dots: [{ id: 'p1', className: 'bg-violet-500' }],
    },
    {
      key: '2026-07-02',
      dayNumber: 2,
      inCurrentMonth: true,
      isToday: true,
      dots: [],
    },
    {
      key: '2026-06-30',
      dayNumber: 30,
      inCurrentMonth: false,
      isToday: false,
      dots: [],
    },
  ];

  it('renders each day number', () => {
    render(<MonthGrid days={days} onSelectDay={jest.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('dims days outside the current month', () => {
    render(<MonthGrid days={days} onSelectDay={jest.fn()} />);
    const outsideDay = screen.getByText('30').closest('button');
    expect(outsideDay).toHaveClass('opacity-40');
  });

  it('calls onSelectDay with the day key when clicked', () => {
    const onSelectDay = jest.fn();
    render(<MonthGrid days={days} onSelectDay={onSelectDay} />);
    fireEvent.click(screen.getByText('1').closest('button'));
    expect(onSelectDay).toHaveBeenCalledWith('2026-07-01');
  });
});
