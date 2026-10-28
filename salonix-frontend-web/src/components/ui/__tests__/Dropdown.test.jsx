import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import Dropdown from '../Dropdown';

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

describe('Dropdown', () => {
  it('não lança erro ao desmontar logo após abrir um dropdown searchable', () => {
    jest.useFakeTimers();

    const items = [{ label: 'Item 1', onClick: jest.fn() }];

    const { getByText, unmount } = render(
      <Dropdown trigger={<button>Abrir</button>} items={items} searchable />
    );

    fireEvent.click(getByText('Abrir'));

    // Desmonta antes do setTimeout de foco (50ms) disparar.
    unmount();

    expect(() => {
      jest.advanceTimersByTime(100);
    }).not.toThrow();
  });
});
