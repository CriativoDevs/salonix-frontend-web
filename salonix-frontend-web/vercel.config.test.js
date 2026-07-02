const fs = require('fs');
const path = require('path');

// FEW-SW-CACHE-01: sem headers explícitos, o Vercel pode servir /sw.js com
// cache HTTP longa, atrasando a atualização do Service Worker em clientes
// que já o instalaram (visto em produção: Chrome preso numa versão de
// dezembro do sw.js que fazia cache-first de respostas da API).
describe('vercel.json headers para /sw.js', () => {
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8')
  );

  test('define uma regra de headers para /sw.js', () => {
    const rule = (vercelConfig.headers || []).find(
      (h) => h.source === '/sw.js'
    );
    expect(rule).toBeDefined();
  });

  test('força no-cache no Cache-Control de /sw.js', () => {
    const rule = (vercelConfig.headers || []).find(
      (h) => h.source === '/sw.js'
    );
    const cacheControl = (rule?.headers || []).find(
      (h) => h.key === 'Cache-Control'
    );
    expect(cacheControl).toBeDefined();
    expect(cacheControl.value).toMatch(/no-cache|no-store/);
  });
});
