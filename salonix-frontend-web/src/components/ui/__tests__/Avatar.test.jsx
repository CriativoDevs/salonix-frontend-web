import React from 'react';
import { render, screen } from '@testing-library/react';
import Avatar from '../Avatar';

describe('Avatar', () => {
  it('normalizes backend media paths before rendering', () => {
    render(<Avatar src="/media/staff/avatar.png" alt="Foto da Alice" />);

    expect(screen.getByAltText('Foto da Alice')).toHaveAttribute(
      'src',
      'http://localhost:8000/media/staff/avatar.png'
    );
  });

  it('keeps absolute URLs unchanged', () => {
    render(
      <Avatar src="https://cdn.example.com/avatar.png" alt="Foto absoluta" />
    );

    expect(screen.getByAltText('Foto absoluta')).toHaveAttribute(
      'src',
      'https://cdn.example.com/avatar.png'
    );
  });
});
