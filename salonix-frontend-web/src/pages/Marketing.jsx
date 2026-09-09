import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, ChevronDown, ChevronUp, Send } from 'lucide-react';
import FullPageLayout from '../layouts/FullPageLayout';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import FormButton from '../components/ui/FormButton';
import ToastContainer from '../components/ui/ToastContainer';
import useToast from '../hooks/useToast';
import { useTenant } from '../hooks/useTenant';
import {
  fetchMarketingCampaigns,
  createMarketingCampaign,
} from '../api/marketing';
import { parseApiError } from '../utils/apiError';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBJECT_MAX = 150;
const BODY_MAX = 5000;

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'completed' || s === 'sent') {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (s === 'failed' || s === 'error') {
    return 'bg-rose-100 text-rose-700';
  }
  if (s === 'processing' || s === 'pending') {
    return 'bg-amber-100 text-amber-800';
  }
  return 'bg-brand-light text-brand-surfaceForeground/80';
}

function CampaignBreakdown({ campaign, t }) {
  const rows = [
    {
      key: 'free_sent_count',
      label: t('marketing.breakdown.free_sent', 'Enviados (cota grátis)'),
      value: campaign.free_sent_count,
    },
    {
      key: 'credit_sent_count',
      label: t('marketing.breakdown.credit_sent', 'Enviados via crédito'),
      value: campaign.credit_sent_count,
    },
    {
      key: 'credit_charged_eur',
      label: t('marketing.breakdown.credit_charged', 'Créditos consumidos'),
      value: campaign.credit_charged_eur,
    },
    {
      key: 'blocked_credit_count',
      label: t(
        'marketing.breakdown.blocked_credit',
        'Bloqueados por falta de crédito'
      ),
      value: campaign.blocked_credit_count,
    },
    {
      key: 'skipped_no_consent_count',
      label: t(
        'marketing.breakdown.skipped_no_consent',
        'Pulados (sem consentimento)'
      ),
      value: campaign.skipped_no_consent_count,
    },
    {
      key: 'eligible_count',
      label: t('marketing.breakdown.eligible', 'Clientes elegíveis'),
      value: campaign.eligible_count,
    },
  ];

  return (
    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex items-center justify-between rounded-lg border border-brand-border bg-brand-light/40 px-3 py-2 text-sm"
        >
          <dt className="text-brand-surfaceForeground/70">{row.label}</dt>
          <dd className="font-semibold text-brand-surfaceForeground">
            {row.value ?? 0}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CampaignHistoryRow({ campaign, t, i18n }) {
  const [expanded, setExpanded] = useState(false);
  const createdAt = campaign.created_at
    ? new Date(campaign.created_at)
    : null;
  const formattedDate =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleString(i18n.language)
      : '—';

  return (
    <Card className="rounded-2xl border border-brand-border bg-brand-surface/80 p-4 shadow-sm ring-1 ring-brand-border/60">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-surfaceForeground">
            {campaign.subject}
          </p>
          <p className="mt-0.5 text-xs text-brand-surfaceForeground/70">
            {formattedDate}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(campaign.status)}`}
          >
            {t(
              `marketing.status.${campaign.status}`,
              campaign.status || t('marketing.status.unknown', 'Desconhecido')
            )}
          </span>
          <span className="whitespace-nowrap text-xs text-brand-surfaceForeground/70">
            {t('marketing.history.total_sent', 'Enviados')}:{' '}
            <strong className="text-brand-surfaceForeground">
              {campaign.total_sent_count ?? 0}
            </strong>
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-brand-surfaceForeground/60" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-brand-surfaceForeground/60" />
          )}
        </div>
      </button>

      {expanded ? (
        <div className="mt-4 border-t border-brand-border pt-4">
          {campaign.reply_to ? (
            <p className="mb-3 text-xs text-brand-surfaceForeground/70">
              {t('marketing.form.reply_to_label', 'Responder para')}:{' '}
              <span className="font-medium text-brand-surfaceForeground">
                {campaign.reply_to}
              </span>
            </p>
          ) : null}
          <CampaignBreakdown campaign={campaign} t={t} />
          {campaign.created_by_username ? (
            <p className="mt-3 text-xs text-brand-surfaceForeground/60">
              {t('marketing.history.created_by', 'Criada por')}:{' '}
              {campaign.created_by_username}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function Marketing() {
  const { t, i18n } = useTranslation();
  const { slug } = useTenant();
  const { toasts, showSuccess, showError, hideToast } = useToast();

  const [form, setForm] = useState({ subject: '', body: '', reply_to: '' });
  const [errors, setErrors] = useState({});

  const [campaigns, setCampaigns] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const [resultCampaign, setResultCampaign] = useState(null);

  const loadHistory = useCallback(() => {
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(null);
    fetchMarketingCampaigns({ slug })
      .then((data) => {
        if (cancelled) return;
        setCampaigns(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setHistoryError(
          parseApiError(err, t('common.error', 'Ocorreu um erro'))
        );
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  useEffect(() => {
    const cleanup = loadHistory();
    return () => cleanup?.();
  }, [loadHistory]);

  const bodyLength = useMemo(() => String(form.body || '').length, [form.body]);

  const validate = () => {
    const nextErrors = {};
    const subject = String(form.subject || '').trim();
    const body = String(form.body || '').trim();
    const replyTo = String(form.reply_to || '').trim();

    if (!subject) {
      nextErrors.subject = t(
        'marketing.form.errors.subject_required',
        'Escreva o assunto do email.'
      );
    } else if (subject.length > SUBJECT_MAX) {
      nextErrors.subject = t(
        'marketing.form.errors.subject_too_long',
        'Assunto muito longo.'
      );
    }

    if (!body) {
      nextErrors.body = t(
        'marketing.form.errors.body_required',
        'Escreva o conteúdo do email.'
      );
    } else if (body.length > BODY_MAX) {
      nextErrors.body = t(
        'marketing.form.errors.body_too_long',
        'Conteúdo muito longo.'
      );
    }

    if (replyTo && !EMAIL_RE.test(replyTo)) {
      nextErrors.reply_to = t(
        'marketing.form.errors.reply_to_invalid',
        'Informe um email válido.'
      );
    }

    return nextErrors;
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSendError(null);
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    setSending(true);
    setSendError(null);
    try {
      const created = await createMarketingCampaign(
        {
          subject: String(form.subject || '').trim(),
          body: String(form.body || '').trim(),
          reply_to: String(form.reply_to || '').trim() || null,
        },
        { slug }
      );
      setConfirmOpen(false);
      setResultCampaign(created);
      setCampaigns((prev) => [created, ...prev]);
      setForm({ subject: '', body: '', reply_to: '' });
      setErrors({});
      showSuccess(
        t('marketing.toast.sent', 'Campanha enviada com sucesso.')
      );
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('marketing.form.errors.send_failed', 'Não foi possível enviar a campanha.')
      );
      setSendError(parsed);
      showError(parsed.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <FullPageLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('marketing.title', 'Marketing por email')}
          subtitle={t(
            'marketing.subtitle',
            'Componha e envie campanhas de email para os seus clientes com consentimento para receber comunicações.'
          )}
        />

        <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
          <div className="border-b border-brand-border pb-4">
            <h2 className="text-lg font-semibold text-brand-surfaceForeground">
              {t('marketing.form.title', 'Nova campanha')}
            </h2>
            <p className="mt-1 text-sm text-brand-surfaceForeground/70">
              {t(
                'marketing.form.subtitle',
                'O email é enviado a todos os clientes elegíveis — não é possível escolher um grupo específico no momento.'
              )}
            </p>
          </div>

          <form
            onSubmit={handleOpenConfirm}
            className="mt-5 space-y-5"
            aria-label="marketing-campaign-form"
            noValidate
          >
            <div>
              <label
                htmlFor="marketing-subject"
                className="block text-sm font-medium text-brand-surfaceForeground mb-2"
              >
                {t('marketing.form.subject_label', 'Assunto')}
              </label>
              <input
                id="marketing-subject"
                type="text"
                value={form.subject}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subject: e.target.value }))
                }
                maxLength={SUBJECT_MAX}
                placeholder={t(
                  'marketing.form.subject_placeholder',
                  'Ex.: Novidades e promoções deste mês'
                )}
                className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                aria-invalid={Boolean(errors.subject)}
                disabled={sending}
              />
              {errors.subject ? (
                <p className="mt-1 text-xs text-rose-600" aria-live="polite">
                  {errors.subject}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="marketing-body"
                className="block text-sm font-medium text-brand-surfaceForeground mb-2"
              >
                {t('marketing.form.body_label', 'Conteúdo do email')}
              </label>
              <textarea
                id="marketing-body"
                value={form.body}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, body: e.target.value }))
                }
                rows={8}
                maxLength={BODY_MAX}
                placeholder={t(
                  'marketing.form.body_placeholder',
                  'Escreva a mensagem que os seus clientes vão receber...'
                )}
                className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground placeholder-brand-surfaceForeground/70 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                aria-invalid={Boolean(errors.body)}
                disabled={sending}
              />
              <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                {bodyLength}/{BODY_MAX}
              </p>
              {errors.body ? (
                <p className="mt-1 text-xs text-rose-600" aria-live="polite">
                  {errors.body}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="marketing-reply-to"
                className="block text-sm font-medium text-brand-surfaceForeground mb-2"
              >
                {t('marketing.form.reply_to_label', 'Responder para')}{' '}
                <span className="font-normal text-brand-surfaceForeground/60">
                  ({t('common.optional', 'opcional')})
                </span>
              </label>
              <input
                id="marketing-reply-to"
                type="email"
                value={form.reply_to}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, reply_to: e.target.value }))
                }
                placeholder={t(
                  'marketing.form.reply_to_placeholder',
                  'contato@meunegocio.com'
                )}
                className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                aria-invalid={Boolean(errors.reply_to)}
                disabled={sending}
              />
              <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                {t(
                  'marketing.form.reply_to_help',
                  'O email é sempre enviado pela plataforma; se preencher este campo, as respostas dos clientes vão para este endereço.'
                )}
              </p>
              {errors.reply_to ? (
                <p className="mt-1 text-xs text-rose-600" aria-live="polite">
                  {errors.reply_to}
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-brand-border bg-brand-light/40 p-3 text-xs text-brand-surfaceForeground/70">
              {t(
                'marketing.form.recipients_note',
                'Destinatários: todos os clientes elegíveis (com consentimento para receber comunicações). Ainda não é possível segmentar destinatários.'
              )}
            </div>

            {sendError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {sendError.message}
              </div>
            ) : null}

            <FormButton
              type="submit"
              variant="link"
              disabled={sending}
              className="inline-flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {t('marketing.form.submit', 'Rever e enviar campanha')}
            </FormButton>
          </form>
        </Card>

        <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
          <div className="border-b border-brand-border pb-4">
            <h2 className="text-lg font-semibold text-brand-surfaceForeground">
              {t('marketing.history.title', 'Histórico de campanhas')}
            </h2>
            <p className="mt-1 text-sm text-brand-surfaceForeground/70">
              {t(
                'marketing.history.subtitle',
                'Consulte as campanhas já enviadas e o resultado de cada envio.'
              )}
            </p>
          </div>

          {historyError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {historyError.message}
            </div>
          ) : null}

          {historyLoading ? (
            <p className="mt-5 text-sm text-brand-surfaceForeground/70">
              {t('common.loading', 'Carregando...')}
            </p>
          ) : campaigns.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title={t(
                  'marketing.history.empty_title',
                  'Nenhuma campanha enviada'
                )}
                description={t(
                  'marketing.history.empty_description',
                  'Quando enviar a primeira campanha de email, ela aparece aqui.'
                )}
                action={
                  <div className="flex items-center gap-2 text-brand-surfaceForeground/50">
                    <Mail className="h-5 w-5" />
                  </div>
                }
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {campaigns.map((campaign) => (
                <CampaignHistoryRow
                  key={campaign.id}
                  campaign={campaign}
                  t={t}
                  i18n={i18n}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => (sending ? null : setConfirmOpen(false))}
        title={t('marketing.confirm.title', 'Confirmar envio da campanha')}
        description={t(
          'marketing.confirm.description',
          'Tem certeza que quer enviar esta campanha para todos os clientes elegíveis? Esta ação não pode ser desfeita.'
        )}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <FormButton
              variant="link"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={sending}
            >
              {t('common.cancel', 'Cancelar')}
            </FormButton>
            <FormButton
              variant="link"
              size="sm"
              onClick={handleConfirmSend}
              loading={sending}
              disabled={sending}
            >
              {t('marketing.confirm.submit', 'Sim, enviar campanha')}
            </FormButton>
          </div>
        }
      >
        <div className="space-y-2 text-sm text-brand-surfaceForeground">
          <p>
            <span className="font-semibold">
              {t('marketing.form.subject_label', 'Assunto')}:
            </span>{' '}
            {form.subject}
          </p>
          <p className="text-brand-surfaceForeground/70">
            {t(
              'marketing.confirm.recipients_note',
              'Será enviado a todos os clientes elegíveis com consentimento para receber comunicações.'
            )}
          </p>
        </div>
      </Modal>

      <Modal
        open={Boolean(resultCampaign)}
        onClose={() => setResultCampaign(null)}
        title={t('marketing.result.title', 'Resultado do envio')}
        footer={
          <div className="flex justify-end">
            <FormButton
              variant="link"
              size="sm"
              onClick={() => setResultCampaign(null)}
            >
              {t('common.close', 'Fechar')}
            </FormButton>
          </div>
        }
      >
        {resultCampaign ? (
          <div className="space-y-4">
            <p className="text-sm text-brand-surfaceForeground/80">
              {t(
                'marketing.result.summary',
                'A campanha "{{subject}}" foi processada. Confira o resultado abaixo.',
                { subject: resultCampaign.subject }
              )}
            </p>
            <CampaignBreakdown campaign={resultCampaign} t={t} />
          </div>
        ) : null}
      </Modal>

      <ToastContainer toasts={toasts} onClose={hideToast} />
    </FullPageLayout>
  );
}

export default Marketing;
