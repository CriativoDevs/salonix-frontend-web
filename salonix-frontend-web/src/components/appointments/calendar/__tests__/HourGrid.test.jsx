import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HourGrid from '../HourGrid';

const rangeProps = { rangeStartMinutes: 9 * 60, rangeEndMinutes: 18 * 60 };

describe('HourGrid', () => {
  it('renders one column per entry with its label', () => {
    render(
      <HourGrid
        {...rangeProps}
        columns={[
          { key: 'mon', label: 'Segunda', events: [] },
          { key: 'tue', label: 'Terça', events: [] },
        ]}
        renderEvent={() => null}
      />
    );

    expect(screen.getByText('Segunda')).toBeInTheDocument();
    expect(screen.getByText('Terça')).toBeInTheDocument();
  });

  it('renders hour labels for the visible range', () => {
    render(
      <HourGrid {...rangeProps} columns={[]} renderEvent={() => null} />
    );

    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('17:00')).toBeInTheDocument();
    expect(screen.queryByText('18:00')).not.toBeInTheDocument();
  });

  it('renders one block per event using renderEvent and calls onEventClick', () => {
    const onEventClick = jest.fn();
    const event = { id: 42, startMinutes: 600, endMinutes: 660, raw: { id: 42 } };

    render(
      <HourGrid
        {...rangeProps}
        columns={[{ key: 'mon', label: 'Segunda', events: [event] }]}
        renderEvent={(e) => `Evento ${e.raw.id}`}
        onEventClick={onEventClick}
      />
    );

    const block = screen.getByText('Evento 42');
    expect(block).toBeInTheDocument();
    fireEvent.click(block);
    expect(onEventClick).toHaveBeenCalledWith(event.raw);
  });
});
