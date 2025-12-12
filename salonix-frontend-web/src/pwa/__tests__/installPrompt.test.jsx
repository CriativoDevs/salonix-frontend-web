import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../../pages/Landing.jsx';

describe('PWA install prompt on Landing', () => {
  it('calls beforeinstallprompt.prompt when event is available', async () => {
    const prompt = jest.fn().mockResolvedValue(undefined);
    const evt = new Event('beforeinstallprompt');
    Object.defineProperty(evt, 'prompt', { value: prompt });
    Object.defineProperty(evt, 'userChoice', {
      value: Promise.resolve({ outcome: 'accepted' }),
    });

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    window.dispatchEvent(evt);

    await new Promise((r) => setTimeout(r, 0));
    const btn = screen.getAllByText(/Instalar/i)[0];
    fireEvent.click(btn);

    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
  });

  it('opens help modal when event is not available', async () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const btn = screen.getAllByText(/Instalar/i)[0];
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText('Instalar aplicação')).toBeInTheDocument();
    });
  });
});
