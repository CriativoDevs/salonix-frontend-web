## Descrição

<!-- Descreva o que esta PR faz e por quê -->

Closes #

---

## Tipo de mudança

- [ ] Bug fix
- [ ] Nova feature
- [ ] Refactor
- [ ] Segurança
- [ ] Docs / config

---

## Checklist de Segurança FEW

Marque os itens relevantes para esta PR. Se o item não se aplica, marque N/A.

### Execução de Código
- [ ] Não há uso de `eval()`, `new Function()`, ou `setTimeout(string)`
- [ ] Não há uso de `dangerouslySetInnerHTML` sem sanitização (ex: DOMPurify)
- [ ] Não há construção de HTML por concatenação de strings

### Tokens e Dados Sensíveis
- [ ] Tokens não são expostos em query strings de URLs
- [ ] Tokens não aparecem em logs (`console.log`, telemetry events)
- [ ] Links com tokens usam header ou rid em vez de `?token=`
- [ ] Emails/SMS não contêm tokens diretos (usar rid com TTL)

### Redirecionamentos
- [ ] Redirecionamentos externos passam por `safeRedirect()` de `src/utils/safeRedirect`
- [ ] Links externos usam `rel="noreferrer"` ou `referrerPolicy: 'no-referrer'`
- [ ] Não há `window.location = userInput` sem validação

### Formulários e Inputs
- [ ] Inputs de usuário não são usados como seletores CSS ou caminhos de URL diretos
- [ ] Upload de arquivos valida tipo e tamanho antes de enviar
- [ ] Dados de formulário são enviados via HTTPS (fetch com URL relativa ou VITE_API_URL)

### Dependências Externas
- [ ] Scripts externos (captcha, analytics) não foram adicionados sem aprovação
- [ ] Não há chamadas para CDNs externos não aprovados
- [ ] N/A — nenhuma dependência externa nova

### Testes
- [ ] Testes existentes continuam passando (`npm test -- --no-coverage`)
- [ ] Cenários de segurança afetados têm cobertura de testes
- [ ] N/A — mudança não afeta fluxos de segurança

---

## Notas

<!-- Observações, decisões técnicas, ou pontos de atenção para o reviewer -->
