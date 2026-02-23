import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import useBillingOverview from '../hooks/useBillingOverview';
import { resolvePlanName } from '../utils/tenantPlan';
import Modal from '../components/ui/Modal';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import { cancelTenantAccount } from '../api/tenant';
import { parseApiError } from '../utils/apiError';

export default function AccountSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { plan, loading: tenantLoading } = useTenant();
  const { user, logout } = useAuth();
  const { overview: billingOverview, loading: billingLoading } =
    useBillingOverview();
  const [dangerOpen, setDangerOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const planName = useMemo(() => {
    const byOverview = billingOverview?.current_subscription?.plan_name;
    if (byOverview) return byOverview;
    return resolvePlanName(plan);
  }, [billingOverview?.current_subscription?.plan_name, plan]);

  const ownerName = useMemo(() => {
    if (!user) return '';
    if (user.full_name) return user.full_name;
    if (user.name) return user.name;
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    if (user.username) return user.username;
    if (user.email) return user.email;
    return '';
  }, [user]);

  const ownerEmail = user?.email || '';

  const expectedWord = useMemo(() => {
    return 'CANCELAR CONTA';
  }, []);

  const confirmMismatch =
    confirmText.trim().toUpperCase() !== expectedWord.toUpperCase();
  const passwordMissing = password.trim() === '';
  const canConfirm = !confirmMismatch && !passwordMissing && !submitting;

  const handleConfirmCancel = async () => {
    if (!canConfirm) return;

    setSubmitting(true);
    setCancelError(null);

    const combinedReason = (() => {
      const trimmedComment = comment.trim();
      if (reason && trimmedComment) {
        return `${reason} — ${trimmedComment}`;
      }
      if (reason) return reason;
      if (trimmedComment) return trimmedComment;
      return '';
    })();

    try {
      await cancelTenantAccount({
        password,
        confirmationText: expectedWord,
        cancellationReason: combinedReason,
      });

      setDangerOpen(false);
      setConfirmText('');
      setPassword('');
      setReason('');
      setComment('');

      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('account.danger.modal.generic_error')
      );
      setCancelError(parsed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FullPageLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title={t('account.title', 'Configurações da Conta')}
          subtitle={t(
            'account.subtitle',
            'Gerencie informações da conta e ações críticas'
          )}
        >
          <Link to="/settings" className="btn-link text-sm">
            {t('account.back_to_settings', 'Voltar para Configurações')}
          </Link>
        </PageHeader>

        <div className="flex flex-col gap-6">
          <div>
            <Card className="p-4">
              <h2 className="text-lg font-medium">
                {t('account.info.title', 'Dados da Conta')}
              </h2>
              <p className="mt-1 text-sm text-secondary">
                {t(
                  'account.info.subtitle',
                  'Plano atual, proprietário e informações básicas'
                )}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-brand-border bg-brand-surface/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/60">
                    {t('account.info.plan_label', 'Plano atual do salão')}
                  </p>
                  <p className="mt-1 text-sm text-brand-surfaceForeground">
                    {tenantLoading || billingLoading
                      ? t('account.info.loading_plan', 'Carregando plano...')
                      : planName ||
                        t('settings.plan_unknown', 'Plano não identificado')}
                  </p>
                </div>
                <div className="rounded-lg border border-brand-border bg-brand-surface/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/60">
                    {t(
                      'account.info.owner_label',
                      'Owner (proprietário da conta)'
                    )}
                  </p>
                  <p className="mt-1 text-sm text-brand-surfaceForeground">
                    {ownerName ||
                      t('account.info.owner_unknown', 'Nome não disponível')}
                  </p>
                  <p className="mt-0.5 text-xs text-brand-surfaceForeground/70">
                    {ownerEmail ||
                      t(
                        'account.info.owner_email_unknown',
                        'Email não disponível'
                      )}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card className="border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              <h2 className="text-lg font-semibold">
                {t('account.danger.title', 'Zona de Perigo')}
              </h2>
              <p className="mt-1 text-sm">
                {t(
                  'account.danger.subtitle',
                  'Ações irreversíveis relacionadas à sua conta'
                )}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-red-700 dark:text-red-300">
                  {t(
                    'account.danger.hint',
                    'Esta ação removerá permanentemente o acesso à conta.'
                  )}
                </div>
                <FormButton
                  variant="link"
                  size="sm"
                  className="text-red-700 hover:text-red-600 dark:text-red-300"
                  onClick={() => setDangerOpen(true)}
                >
                  {t('account.danger.cancel_cta', 'Cancelar minha conta')}
                </FormButton>
              </div>
            </Card>
          </div>
        </div>

        <Modal
          open={dangerOpen}
          onClose={() => setDangerOpen(false)}
          title={t('account.danger.modal.title', 'Confirmar cancelamento')}
          description={t(
            'account.danger.modal.subtitle',
            'Esta ação é irreversível. Digite a palavra de confirmação e sua senha.'
          )}
        >
          <div className="space-y-4">
            <FormInput
              label={t(
                'account.danger.modal.confirm_label',
                'Digite {{word}} para confirmar',
                { word: expectedWord }
              )}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedWord}
              error={
                confirmText && confirmMismatch
                  ? t(
                      'account.danger.modal.validation.confirm_mismatch',
                      'A palavra digitada não confere.'
                    )
                  : ''
              }
            />
            <FormInput
              label={t('account.danger.modal.password_label', 'Senha')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              error={
                password === ''
                  ? ''
                  : passwordMissing
                    ? t(
                        'account.danger.modal.validation.password_required',
                        'Informe sua senha.'
                      )
                    : ''
              }
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-brand-surfaceForeground">
                {t('account.danger.modal.reason_label', 'Motivo da saída')}
              </label>
              <select
                className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">{t('common.select', 'Selecione')}</option>
                <option value="cost">
                  {t('account.danger.modal.reason.cost', 'Custo')}
                </option>
                <option value="features">
                  {t('account.danger.modal.reason.features', 'Faltam recursos')}
                </option>
                <option value="complexity">
                  {t('account.danger.modal.reason.complexity', 'Complexidade')}
                </option>
                <option value="other">
                  {t('account.danger.modal.reason.other', 'Outro')}
                </option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-brand-surfaceForeground">
                {t(
                  'account.danger.modal.comment_label',
                  'Comentário (opcional)'
                )}
              </label>
              <textarea
                className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t(
                  'account.danger.modal.comment_placeholder',
                  'Conte-nos rapidamente o motivo...'
                )}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <FormButton
                variant="link"
                size="sm"
                onClick={() => setDangerOpen(false)}
              >
                {t('account.danger.modal.close_button', 'Fechar')}
              </FormButton>
              <FormButton
                variant="link"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={!canConfirm}
              >
                {submitting
                  ? t('common.loading', 'Carregando...')
                  : t('account.danger.modal.confirm_button', 'Confirmar')}
              </FormButton>
            </div>
            {cancelError && (
              <p className="mt-2 text-sm text-red-600">
                {cancelError.message || String(cancelError)}
              </p>
            )}
          </div>
        </Modal>
      </div>
    </FullPageLayout>
  );
}
