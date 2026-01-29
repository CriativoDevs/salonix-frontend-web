import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import UpgradePrompt from '../UpgradePrompt';
import i18n from '../../../i18n';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>{component}</I18nextProvider>
    </BrowserRouter>
  );
};

describe('UpgradePrompt Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders with default props', () => {
    renderWithProviders(<UpgradePrompt />);

    expect(screen.getByText(/feature bloqueada/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ver planos/i })
    ).toBeInTheDocument();
  });

  it('renders with custom title and description', () => {
    renderWithProviders(
      <UpgradePrompt
        title="Relatórios Avançados"
        description="Analise seu negócio com insights detalhados"
        requiredPlan="Pro"
      />
    );

    expect(screen.getByText('Relatórios Avançados')).toBeInTheDocument();
    expect(screen.getByText(/analise seu negócio/i)).toBeInTheDocument();
  });

  it('renders inline variant by default', () => {
    const { container } = renderWithProviders(<UpgradePrompt />);

    expect(
      container.querySelector('.upgrade-prompt--inline')
    ).toBeInTheDocument();
  });

  it('renders modal variant correctly', () => {
    const { container } = renderWithProviders(
      <UpgradePrompt variant="modal" />
    );

    expect(
      container.querySelector('.upgrade-prompt--modal')
    ).toBeInTheDocument();
  });

  it('renders tooltip variant correctly', () => {
    const { container } = renderWithProviders(
      <UpgradePrompt variant="tooltip" />
    );

    expect(
      container.querySelector('.upgrade-prompt--tooltip')
    ).toBeInTheDocument();
  });

  it('navigates to plans page on CTA click', () => {
    renderWithProviders(
      <UpgradePrompt featureKey="enableReports" requiredPlan="Pro" />
    );

    const ctaButton = screen.getByRole('button', { name: /ver planos/i });
    fireEvent.click(ctaButton);

    expect(mockNavigate).toHaveBeenCalledWith('/plans', {
      state: {
        highlightPlan: 'Pro',
        fromFeature: 'enableReports',
      },
    });
  });

  it('renders custom CTA text', () => {
    renderWithProviders(<UpgradePrompt ctaText="Upgrade para Pro" />);

    expect(
      screen.getByRole('button', { name: /upgrade para pro/i })
    ).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = () => <svg data-testid="test-icon" />;

    renderWithProviders(<UpgradePrompt icon={<TestIcon />} />);

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <UpgradePrompt className="custom-class" />
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('includes ArrowRight icon in CTA button', () => {
    renderWithProviders(<UpgradePrompt />);

    const button = screen.getByRole('button', { name: /ver planos/i });
    const svg = button.querySelector('svg');

    expect(svg).toBeInTheDocument();
  });
});
