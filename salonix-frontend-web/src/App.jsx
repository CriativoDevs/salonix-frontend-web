import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Router from './routes/Router';
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();

  return (
    <AuthProvider>
      <BrowserRouter>
        <h1>{t('hello')}</h1> {/* Temporário para testes */}
        <Router />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
