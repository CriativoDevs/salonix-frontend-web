export const INVITE_STATUS_VARIANTS = {
  success: {
    toneClass: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  delivered: {
    toneClass: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  pending: {
    toneClass: 'bg-amber-100 text-amber-700 ring-amber-200',
    dotClass: 'bg-amber-500',
  },
  queued: {
    toneClass: 'bg-amber-100 text-amber-700 ring-amber-200',
    dotClass: 'bg-amber-500',
  },
  sending: {
    toneClass: 'bg-amber-100 text-amber-700 ring-amber-200',
    dotClass: 'bg-amber-500',
  },
  failed: {
    toneClass: 'bg-rose-100 text-rose-700 ring-rose-200',
    dotClass: 'bg-rose-500',
  },
  error: {
    toneClass: 'bg-rose-100 text-rose-700 ring-rose-200',
    dotClass: 'bg-rose-500',
  },
  disabled: {
    toneClass: 'bg-brand-light text-brand-surfaceForeground/60 ring-brand-border/60',
    dotClass: 'bg-brand-surfaceForeground/40',
  },
  none: {
    toneClass: 'bg-brand-light text-brand-surfaceForeground/70 ring-brand-border/70',
    dotClass: 'bg-brand-surfaceForeground/30',
  },
  unknown: {
    toneClass: 'bg-brand-light text-brand-surfaceForeground/70 ring-brand-border/70',
    dotClass: 'bg-brand-surfaceForeground/30',
  },
};

export function resolveInviteVariant(statusKey) {
  if (!statusKey) {
    return INVITE_STATUS_VARIANTS.none;
  }
  return INVITE_STATUS_VARIANTS[statusKey] || INVITE_STATUS_VARIANTS.unknown;
}

export function mapInviteStatusToKey(rawStatus) {
  if (!rawStatus) return null;
  const normalized = String(rawStatus).toLowerCase();
  if (['delivered', 'delivering', 'sent', 'success', 'succeeded'].includes(normalized)) {
    return 'success';
  }
  if (['queued', 'pending', 'created', 'scheduled', 'waiting'].includes(normalized)) {
    return 'queued';
  }
  if (['sending', 'processing', 'in_progress'].includes(normalized)) {
    return 'sending';
  }
  if (['failed', 'error', 'bounced', 'blocked'].includes(normalized)) {
    return 'failed';
  }
  return 'unknown';
}

export function resolveInviteStatusLabel(t, statusKey, rawStatus) {
  switch (statusKey) {
    case 'success':
      return t('customers.invite.status.success', 'Enviado');
    case 'queued':
      return t('customers.invite.status.queued', 'Pendente');
    case 'sending':
      return t('customers.invite.status.sending', 'Enviando');
    case 'failed':
      return t('customers.invite.status.failed', 'Falhou');
    case 'disabled':
      return t('customers.invite.status.disabled', 'PWA desativado');
    case 'none':
      return t('customers.invite.status.none', 'Convite');
    case 'unknown':
    default:
      return rawStatus
        ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)
        : t('customers.invite.status.none', 'Convite');
  }
}

export function formatInviteDateTime(value) {
  if (!value) return '';
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return '';
  }
}

export function buildInviteTooltipLines(
  t,
  statusKey,
  meta,
  inviteStatusLabel,
  formatFn = formatInviteDateTime,
) {
  const lines = [];

  if (statusKey === 'disabled') {
    lines.push({
      label: null,
      value: t(
        'customers.invite.tooltip.pwa_disabled',
        'Habilite o PWA Cliente para acompanhar o histórico de convites.',
      ),
    });
    return lines;
  }

  if (!meta.status && statusKey !== 'unknown') {
    lines.push({
      label: null,
      value: t(
        'customers.invite.tooltip.no_attempts',
        'Nenhuma tentativa de convite registrada até o momento.',
      ),
    });
  } else {
    lines.push({
      label: t('customers.invite.tooltip.status_label', 'Último status'),
      value: inviteStatusLabel,
    });
  }

  if (meta.timestamp) {
    const formatted = formatFn(meta.timestamp);
    if (formatted) {
      lines.push({
        label: t('customers.invite.tooltip.timestamp', 'Registrado em'),
        value: formatted,
      });
    }
  }

  if (meta.triggeredBy) {
    lines.push({
      label: t('customers.invite.tooltip.triggered_by', 'Disparado por'),
      value: meta.triggeredBy,
    });
  }

  if (meta.detailMessage) {
    lines.push({
      label: t('customers.invite.tooltip.details', 'Detalhes'),
      value: meta.detailMessage,
    });
  }

  return lines;
}

export function normalizeInviteMeta(customer = {}, flashStatus) {
  const rawLastInvite =
    customer.last_invite ||
    customer.latest_invite ||
    customer.lastInvite ||
    null;

  const status =
    flashStatus?.statusOverride ||
    customer.last_invite_status ||
    rawLastInvite?.status ||
    null;

  const timestamp =
    flashStatus?.timestampOverride ||
    customer.last_invite_at ||
    customer.last_invite_sent_at ||
    rawLastInvite?.sent_at ||
    rawLastInvite?.timestamp ||
    rawLastInvite?.created_at ||
    null;

  const triggeredBy =
    customer.last_invite_triggered_by ||
    rawLastInvite?.triggered_by ||
    rawLastInvite?.sent_by ||
    null;

  const detailMessage =
    flashStatus?.messageOverride ||
    customer.last_invite_detail ||
    customer.last_invite_message ||
    rawLastInvite?.detail ||
    rawLastInvite?.message ||
    null;

  return {
    status: status ? String(status).toLowerCase() : null,
    timestamp,
    triggeredBy,
    detailMessage,
  };
}
