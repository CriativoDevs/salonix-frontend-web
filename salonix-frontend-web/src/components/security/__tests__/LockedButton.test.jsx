import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LockedButton from '../LockedButton';
import useFeatureLock from '../../../hooks/useFeatureLock';

const mockShowUpgrade = jest.fn();

jest.mock('../../../hooks/useFeatureLock');

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LockedButton Component', () => {
  beforeEach(() => {
    mockShowUpgrade.mockClear();
    jest.clearAllMocks();
  });

  it('renders unlocked button normally', () => {
    useFeatureLock.mockReturnValue({
      isLocked: false,
      showUpgrade: mockShowUpgrade,
    });

    const handleClick = jest.fn();
    renderWithRouter(
      <LockedButton featureKey="enableReports" onClick={handleClick}>
        Acessar Relatórios
      </LockedButton>
    );

    const button = screen.getByRole('button', { name: /acessar relatórios/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveClass('cursor-not-allowed');

    // Não deve ter ícone de cadeado
    const lockIcon = button.querySelector('svg');
    expect(lockIcon).not.toBeInTheDocument();
  });

  it('renders locked button with lock icon', () => {
    useFeatureLock.mockReturnValue({
      isLocked: true,
      showUpgrade: mockShowUpgrade,
    });

    renderWithRouter(
      <LockedButton featureKey="enableReports" onClick={jest.fn()}>
        Acessar Relatórios
      </LockedButton>
    );

    const button = screen.getByRole('button', { name: /acessar relatórios/i });
    expect(button).toHaveClass('cursor-not-allowed');

    // Deve ter ícone de cadeado
    const lockIcon = button.querySelector('svg');
    expect(lockIcon).toBeInTheDocument();
  });

  it('calls onClick when unlocked', () => {
    useFeatureLock.mockReturnValue({
      isLocked: false,
      showUpgrade: mockShowUpgrade,
    });

    const handleClick = jest.fn();
    renderWithRouter(
      <LockedButton featureKey="enableReports" onClick={handleClick}>
        Acessar Relatórios
      </LockedButton>
    );

    const button = screen.getByRole('button', { name: /acessar relatórios/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(mockShowUpgrade).not.toHaveBeenCalled();
  });

  it('calls showUpgrade when locked and clicked', () => {
    useFeatureLock.mockReturnValue({
      isLocked: true,
      showUpgrade: mockShowUpgrade,
    });

    renderWithRouter(
      <LockedButton featureKey="enableReports" onClick={jest.fn()}>
        Acessar Relatórios
      </LockedButton>
    );

    const button = screen.getByRole('button', { name: /acessar relatórios/i });
    fireEvent.click(button);

    expect(mockShowUpgrade).toHaveBeenCalledTimes(1);
  });

  it('shows tooltip on hover when locked', () => {
    useFeatureLock.mockReturnValue({
      isLocked: true,
      showUpgrade: mockShowUpgrade,
    });

    renderWithRouter(
      <LockedButton
        featureKey="enableReports"
        tooltip="Disponível no plano Pro"
        onClick={jest.fn()}
      >
        Acessar Relatórios
      </LockedButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Disponível no plano Pro');

    // Tooltip existe no DOM mas invisível
    const tooltip = screen.getByText('Disponível no plano Pro');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveClass('opacity-0');
  });

  it('applies variant classes correctly', () => {
    useFeatureLock.mockReturnValue({
      isLocked: false,
      showUpgrade: mockShowUpgrade,
    });

    const { rerender } = renderWithRouter(
      <LockedButton
        featureKey="enableReports"
        variant="primary"
        onClick={jest.fn()}
      >
        Primary
      </LockedButton>
    );

    let button = screen.getByRole('button', { name: /primary/i });
    expect(button).toHaveClass('bg-brand-primary');

    rerender(
      <BrowserRouter>
        <LockedButton
          featureKey="enableReports"
          variant="secondary"
          onClick={jest.fn()}
        >
          Secondary
        </LockedButton>
      </BrowserRouter>
    );

    button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-brand-secondary');

    rerender(
      <BrowserRouter>
        <LockedButton
          featureKey="enableReports"
          variant="outline"
          onClick={jest.fn()}
        >
          Outline
        </LockedButton>
      </BrowserRouter>
    );

    button = screen.getByRole('button', { name: /outline/i });
    expect(button).toHaveClass('border-2');
  });

  it('applies size classes correctly', () => {
    useFeatureLock.mockReturnValue({
      isLocked: false,
      showUpgrade: mockShowUpgrade,
    });

    const { rerender } = renderWithRouter(
      <LockedButton featureKey="enableReports" size="sm" onClick={jest.fn()}>
        Small
      </LockedButton>
    );

    let button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(
      <BrowserRouter>
        <LockedButton featureKey="enableReports" size="lg" onClick={jest.fn()}>
          Large
        </LockedButton>
      </BrowserRouter>
    );

    button = screen.getByRole('button', { name: /large/i });
    expect(button).toHaveClass('px-6', 'py-3', 'text-base');
  });

  it('respects disabled prop even when unlocked', () => {
    useFeatureLock.mockReturnValue({
      isLocked: false,
      showUpgrade: mockShowUpgrade,
    });

    const handleClick = jest.fn();
    renderWithRouter(
      <LockedButton
        featureKey="enableReports"
        disabled={true}
        onClick={handleClick}
      >
        Disabled
      </LockedButton>
    );

    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    useFeatureLock.mockReturnValue({
      isLocked: false,
      showUpgrade: mockShowUpgrade,
    });

    renderWithRouter(
      <LockedButton
        featureKey="enableReports"
        className="custom-class"
        onClick={jest.fn()}
      >
        Custom
      </LockedButton>
    );

    const button = screen.getByRole('button', { name: /custom/i });
    expect(button).toHaveClass('custom-class');
  });
});
