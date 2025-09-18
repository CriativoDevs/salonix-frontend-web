# 🚦 Status Atual do MVP – Frontend Web (FEW)

## ✅ Concluído

- **FEW-201 – Autenticação real com backend**
  - Login/Register integrados aos endpoints `users/token/` e `users/register/`.
  - Armazenamento de tokens (session + local storage) e refresh automático.
  - Tratamento uniforme de erros com popup mostrando `code`, `message` e `X-Request-ID`.
  - Logout disponível em desktop/mobile.
- **FEW-207 – Landing page institucional**
  - Página pública `/` com hero, diferenciais, planos e CTA de login/registro.
  - Conteúdo direcionado ao mercado PT com destaque para Criativo Devs.
  - Estrutura pronta para SEO básico e evolução multilíngue.

## 🏗️ Em Andamento / Planejado Próximo

- **Wizard de seleção de planos (FEW-208)** – escolha de plano/trial imediatamente após registro.
- **Onboarding guiado (FEW-209)** – checklist dos passos iniciais do salão.
- **Hardening de segurança no front (FEW-210)** – lockout, CAPTCHA, políticas UX.

## 🧭 Meta do MVP

Entregar uma experiência self-service para proprietários de negócio em Portugal:
1. Descobrir o produto pela landing.
2. Registar, escolher plano/trial e configurar empresa via onboarding.
3. Operar agenda e relatórios com segurança e feedback apropriado.

## 📈 Indicadores de controle sugeridos

- Taxa de conversão landing → registro.
- Conclusão do onboarding (passos completos / tempo médio).
- Erros de autenticação por causa (credencial, lockout, captcha, backend).

> Atualize esta página sempre que uma entrega impactar diretamente a jornada do usuário ou a proposta de valor do MVP.
