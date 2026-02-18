# Tutorial: Primeiros Passos no Ops Console

Bem-vindo ao Ops Console do Salonix! Este guia ajudará você a navegar e utilizar as ferramentas administrativas.

## Acesso

1. Navegue para `/ops/login`.
2. Insira suas credenciais de administrador/operador.
3. Você será redirecionado para o Dashboard.

## 1. Monitoramento Diário (Dashboard)

Ao entrar, verifique o **Dashboard**:
- **Alertas Abertos**: Se houver alertas críticos (vermelhos), priorize-os.
- **Notificações**: Verifique se o volume de envio está normal. Uma queda brusca pode indicar problemas no provider (ex: Twilio/SendGrid).

## 2. Resolvendo Problemas de Clientes (Suporte)

Se um cliente relatar problemas, vá para **Suporte** no menu lateral.

### Cliente não recebeu email/SMS
1. Peça o ID da notificação (se disponível nos logs do backend) ou procure pelo horário.
2. Na seção "Reenviar Notificação", digite o ID.
3. Clique em "Reenviar Agora".
4. O sistema tentará reenviar imediatamente.

### Cliente bloqueado (Muitas tentativas de senha)
1. Na seção "Desbloquear Conta", insira o ID do Bloqueio (Lockout ID).
2. Adicione uma nota (ex: "Solicitado pelo cliente via WhatsApp").
3. Clique em "Remover Bloqueio".
4. Peça para o cliente tentar novamente em 1 minuto.

## 3. Gerenciando Alertas do Sistema

Na parte inferior da página de Suporte:
1. Revise a lista de alertas pendentes.
2. Após investigar e corrigir a causa raiz (no servidor ou configuração), clique em **Resolver**.
3. O alerta sairá da lista de pendentes.

## Dicas Importantes
- **Nunca** compartilhe sua senha do Ops.
- Use o botão de **Refresh** no topo das páginas para garantir que está vendo dados em tempo real.
- Se encontrar erros na interface (ex: "Erro ao carregar métricas"), reporte ao time de Engenharia.
