import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CmsPage from '../CmsPage';
import * as cmsApi from '../../api/cms';

// FEW-CMS-ORDER-01: o backend ordena as paginas por published_at/created_at,
// nao pela sequencia numerada nos titulos (ex.: "1. ...", "2. ..."). Isso fez
// a lista publica aparecer fora de ordem (1, 6, 7, 8... 2, 3, 4, 5) quando as
// paginas 6-13 foram criadas depois de publicar 1-5. A pagina deve reordenar
// pelo numero inicial do titulo antes de renderizar.

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

jest.mock('../../api/cms');

function renderCmsPage() {
  return render(
    <BrowserRouter>
      <CmsPage />
    </BrowserRouter>
  );
}

describe('CmsPage - ordenação da lista', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('ordena as páginas pelo número no início do título, não pela ordem da API', async () => {
    cmsApi.fetchCmsPages.mockResolvedValue([
      { slug: 'como-funciona-horarios', title: '1. Configura os teus horários', summary: '' },
      { slug: 'como-funciona-marca-morada', title: '6. Personaliza a tua marca e morada', summary: '' },
      { slug: 'como-funciona-creditos-planos', title: '7. Entende os teus créditos', summary: '' },
      { slug: 'como-funciona-servicos-equipa', title: '2. Adiciona os teus serviços', summary: '' },
      { slug: 'como-funciona-clientes', title: '3. Gere os teus clientes', summary: '' },
    ]);

    renderCmsPage();

    await waitFor(() => {
      expect(screen.getByText(/1\. Configura os teus horários/)).toBeInTheDocument();
    });

    const orderedTitles = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/como-funciona/'))
      .map((link) => link.textContent);

    expect(orderedTitles).toEqual([
      expect.stringContaining('1. Configura os teus horários'),
      expect.stringContaining('2. Adiciona os teus serviços'),
      expect.stringContaining('3. Gere os teus clientes'),
      expect.stringContaining('6. Personaliza a tua marca e morada'),
      expect.stringContaining('7. Entende os teus créditos'),
    ]);
  });

  test('mantém no fim páginas sem número no título, sem quebrar a ordenação', async () => {
    cmsApi.fetchCmsPages.mockResolvedValue([
      { slug: 'pagina-sem-numero', title: 'Perguntas frequentes', summary: '' },
      { slug: 'como-funciona-horarios', title: '1. Configura os teus horários', summary: '' },
      { slug: 'como-funciona-servicos-equipa', title: '2. Adiciona os teus serviços', summary: '' },
    ]);

    renderCmsPage();

    await waitFor(() => {
      expect(screen.getByText(/1\. Configura os teus horários/)).toBeInTheDocument();
    });

    const titles = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/como-funciona/'))
      .map((link) => link.textContent);

    expect(titles[0]).toContain('1. Configura os teus horários');
    expect(titles[1]).toContain('2. Adiciona os teus serviços');
    expect(titles[2]).toContain('Perguntas frequentes');
  });
});
