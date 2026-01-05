import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { useTenant } from '../hooks/useTenant';
import RoleProtectedRoute from '../routes/RoleProtectedRoute';
import useCreditBalance from '../hooks/useCreditBalance';
import {
  fetchCreditPackages,
  createCreditCheckoutSession,
} from '../api/credits';
import { updateTenantNotifications } from '../api/tenantNotifications';

import { toast } from 'react-toastify';
import billingOverviewApi from '../api/billingOverview';
import useBillingOverview from '../hooks/useBillingOverview';
import FeatureGate from '../components/security/FeatureGate';
import PlanGate from '../components/security/PlanGate';
import { DEFAULT_TENANT_META, resolveTenantAssetUrl } from '../utils/tenant';
import { parseApiError } from '../utils/apiError';
import {
  updateTenantBranding,
  updateTenantAutoInvite,
  updateTenantModules,
  updateTenantContact,
} from '../api/tenant';
import FormInput from '../components/ui/FormInput';
import {
  TENANT_FEATURE_REQUIREMENTS,
  describeFeatureRequirement,
} from '../constants/tenantFeatures';
import {
  resolvePlanModules,
  resolvePlanName,
  resolvePlanTier,
  comparePlanTiers,
} from '../utils/tenantPlan';
import client from '../api/client';
import Modal from '../components/ui/Modal';
import CreditHistoryList from '../components/settings/CreditHistoryList';
// Checkout de créditos via sessão hospedada da Stripe (sem Elements)

const TAB_ITEMS = [
  { id: 'branding', label: 'settings.tabs.branding', icon: '🖼️' },
  { id: 'general', label: 'settings.tabs.general', icon: '⚙️' },
  { id: 'notifications', label: 'settings.tabs.notifications', icon: '🔔' },
  { id: 'billing', label: 'settings.tabs.billing', icon: '💳' },
  // { id: 'business', label: 'settings.tabs.business', icon: '🏢' }, // Ocultado conforme solicitação
  { id: 'data', label: 'settings.tabs.data', icon: '📊' },
];

const FEATURE_LIST = Object.entries(TENANT_FEATURE_REQUIREMENTS).map(
  ([key, value]) => ({
    key,
    ...value,
  })
);

const MODULE_CONFIG = {
  reports: {
    labelKey: 'settings.modules.reports',
    defaultLabel: 'Relatórios avançados',
    flagKey: 'enableReports',
    rawKey: 'reports_enabled',
  },
  pwa_admin: {
    labelKey: 'settings.modules.pwa_admin',
    defaultLabel: 'Painel administrativo (PWA)',
    flagKey: 'enableAdminPwa',
    rawKey: 'pwa_admin_enabled',
  },
  pwa_client: {
    labelKey: 'settings.modules.pwa_client',
    defaultLabel: 'PWA Cliente',
    flagKey: 'enableCustomerPwa',
    rawKey: 'pwa_client_enabled',
  },
  rn_admin: {
    labelKey: 'settings.modules.rn_admin',
    defaultLabel: 'App Admin (React Native)',
    flagKey: 'enableNativeAdmin',
    rawKey: 'rn_admin_enabled',
  },
  rn_client: {
    labelKey: 'settings.modules.rn_client',
    defaultLabel: 'App Cliente (React Native)',
    flagKey: 'enableNativeClient',
    rawKey: 'rn_client_enabled',
  },
};

const MODULE_REQUIREMENTS = {
  reports: 'enableReports',
  pwa_client: 'enableCustomerPwa',
};

const resolveModuleLabel = (moduleKey, t) => {
  const cfg = MODULE_CONFIG[moduleKey];
  if (!cfg) return moduleKey;
  return t(cfg.labelKey, cfg.defaultLabel);
};

const CHANNEL_CONFIG = [
  { key: 'email', defaultLabel: 'Email' },
  { key: 'sms', defaultLabel: 'SMS' },
  { key: 'whatsapp', defaultLabel: 'WhatsApp' },
  { key: 'push_web', defaultLabel: 'Web Push' },
  { key: 'push_mobile', defaultLabel: 'Mobile Push' },
];

function formatPostalCodePT(value) {
  const digits = String(value || '')
    .replace(/\D+/g, '')
    .slice(0, 7);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}`;
}

function buildInitialSettings(profile, channels, branding, tenant) {
  const safeProfile = { ...DEFAULT_TENANT_META.profile, ...(profile || {}) };
  const safeChannels = { ...DEFAULT_TENANT_META.channels, ...(channels || {}) };
  const safeBranding = { ...DEFAULT_TENANT_META.branding, ...(branding || {}) };

  return {
    general: {
      businessName: safeProfile.businessName || '',
      email: safeProfile.email || '',
      phone: safeProfile.phone || '',
      address: safeProfile.address || '',
      timezone: safeProfile.timezone || 'Europe/Lisbon',
      language: safeProfile.language || 'pt',
    },
    notifications: {
      emailNotifications: Boolean(safeChannels.email),
      smsNotifications: Boolean(safeChannels.sms),
      appointmentReminders: Boolean(safeChannels.email || safeChannels.sms),
      marketingEmails: Boolean(safeProfile.marketingEmails),
    },
    business: {
      workingHours: {
        ...DEFAULT_TENANT_META.profile.workingHours,
        ...(safeProfile.workingHours || {}),
      },
      appointmentDuration:
        safeProfile.appointmentDuration ??
        DEFAULT_TENANT_META.profile.appointmentDuration,
      bufferTime:
        safeProfile.bufferTime ?? DEFAULT_TENANT_META.profile.bufferTime,
    },
    branding: {
      logoUrl: safeBranding.logoUrl || '',
    },
    brandingAddress: {
      street: tenant?.address_street || '',
      number: tenant?.address_number || '',
      complement: tenant?.address_complement || '',
      neighborhood: tenant?.address_neighborhood || '',
      city: tenant?.address_city || '',
      state: tenant?.address_state || '',
      zip: tenant?.address_zip || '',
      country: tenant?.address_country || '',
    },
  };
}

function DataSettingsStandalone() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [dataTab, setDataTab] = useState('import');
  const [entity, setEntity] = useState('customers');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [header, setHeader] = useState([]);
  const [previewDelimiter, setPreviewDelimiter] = useState(',');
  const [columnMap, setColumnMap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastDryRun, setLastDryRun] = useState(null);
  const [dryRunTooltipOpen, setDryRunTooltipOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportEntity, setExportEntity] = useState(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [updatedSince, setUpdatedSince] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const fileInputRef = useRef(null);
  const previewTableRef = useRef(null);
  const derived = useMemo(() => {
    const summary = result?.summary || null;
    const errors = (summary?.errors || result?.errors || []).filter(Boolean);
    const created = summary?.created ?? result?.created_count ?? null;
    const updated = summary?.updated ?? result?.updated_count ?? null;
    const processed = summary?.processed ?? null;
    const skipped = summary?.skipped ?? null;
    const requestId = result?.request_id || null;
    return { summary, errors, created, updated, processed, skipped, requestId };
  }, [result]);

  const errorBreakdown = useMemo(() => {
    const byField = {};
    const byReason = {};
    (derived.errors || []).forEach((e) => {
      const reason =
        e && typeof e === 'object' ? (e.error ?? '') : String(e || '');
      const row = e && typeof e === 'object' ? e.row || {} : {};
      const keys = Object.keys(row || {});
      let field = '';
      if (keys.includes('phone')) field = 'phone';
      else if (keys.includes('email')) field = 'email';
      else if (keys.includes('name')) field = 'name';
      else if (keys.includes('duration_minutes')) field = 'duration_minutes';
      else if (keys.includes('price_eur')) field = 'price_eur';
      else field = keys[0] || '';
      const r = String(reason).toLowerCase();
      if (field) byField[field] = (byField[field] || 0) + 1;
      if (r) byReason[r] = (byReason[r] || 0) + 1;
    });
    return { by_field: byField, by_reason: byReason };
  }, [derived.errors]);

  const track = useCallback((event, props = {}) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event, props);
        return;
      }
      if (
        typeof window !== 'undefined' &&
        window.analytics &&
        window.analytics.track
      ) {
        window.analytics.track(event, props);
        return;
      }
      console.log('telemetry:event', event, props);
    } catch (err) {
      void err;
    }
  }, []);

  useEffect(() => {
    // console.log('DataSettings:mounted');
  }, []);

  const handleExport = useCallback(
    async (which) => {
      if (exportLoading || cooldown > 0) return;
      const ent = which || entity;
      setError(null);
      setExportEntity(ent);
      setExportLoading(true);
      try {
        const headers = {};
        const params = {};
        if (tenant?.slug) headers['X-Tenant-Slug'] = tenant.slug;
        if (ent === 'customers' || ent === 'staff') {
          if (activeOnly) params.active = true;
          if (updatedSince) params.updated_since = updatedSince;
        }
        track('csv_export_requested', {
          tenant_slug: tenant?.slug || null,
          entity: ent,
          active: ent === 'services' ? null : Boolean(activeOnly),
          updated_since: ent === 'services' ? null : updatedSince || null,
        });
        const response = await client.get(`export/${ent}.csv`, {
          headers,
          params,
          responseType: 'blob',
        });
        const blob = response?.data;
        const cd = String(response?.headers?.['content-disposition'] || '');
        let filename = `${ent}-export.csv`;
        const m =
          cd.match(/filename\*=UTF-8''([^;\n\r]+)/i) ||
          cd.match(/filename="?([^";\n\r]+)"?/i);
        if (m && m[1]) {
          try {
            filename = decodeURIComponent(m[1]);
          } catch {
            filename = m[1];
          }
        }
        const { downloadCSV } = await import('../api/reports');
        downloadCSV(blob, filename);
        track('csv_export_success', {
          tenant_slug: tenant?.slug || null,
          entity: ent,
          filename,
        });
      } catch (e) {
        const parsed = parseApiError(
          e,
          t('common.save_error', 'Falha ao salvar. Tente novamente.')
        );
        setError(parsed);
        const retryAfter = Number(e?.response?.headers?.['retry-after'] || 0);
        if (parsed.code === 'RATE_LIMITED' && retryAfter > 0) {
          setCooldown(retryAfter);
        }
        track('csv_export_failure', {
          tenant_slug: tenant?.slug || null,
          entity: which || entity,
          code: parsed.code || null,
          request_id: parsed.requestId || null,
        });
      } finally {
        setExportLoading(false);
        setExportEntity(null);
      }
    },
    [
      activeOnly,
      cooldown,
      entity,
      tenant?.slug,
      updatedSince,
      track,
      exportLoading,
      t,
    ]
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const resolveTargetFields = useCallback(() => {
    if (entity === 'customers') return ['name', 'email', 'phone', 'ignore'];
    if (entity === 'services')
      return ['name', 'duration_minutes', 'price_eur', 'ignore'];
    if (entity === 'staff') return ['name', 'email', 'role', 'ignore'];
    return ['ignore'];
  }, [entity]);

  const guessField = useCallback(
    (text) => {
      const s = String(text || '').toLowerCase();
      if (entity === 'customers') {
        if (s.includes('email')) return 'email';
        if (
          s.includes('phone') ||
          s.includes('telefone') ||
          s.includes('celular') ||
          s.includes('telem') ||
          s.includes('tel')
        )
          return 'phone';
        if (s.includes('name') || s.includes('nome')) return 'name';
        return 'ignore';
      }
      if (entity === 'staff') {
        if (s.includes('email')) return 'email';
        if (s.includes('role') || s.includes('cargo') || s.includes('função'))
          return 'role';
        if (s.includes('name') || s.includes('nome')) return 'name';
        return 'ignore';
      }
      if (entity === 'services') {
        if (s.includes('price') || s.includes('preço') || s.includes('valor'))
          return 'price_eur';
        if (
          s.includes('duration') ||
          s.includes('duração') ||
          s.includes('minutos') ||
          s.includes('mins')
        )
          return 'duration_minutes';
        if (s.includes('name') || s.includes('serviço') || s.includes('nome'))
          return 'name';
        return 'ignore';
      }
      return 'ignore';
    },
    [entity]
  );

  const validateNormalizedCsv = useCallback((text, ent) => {
    try {
      const lines = String(text || '')
        .split(/\r?\n/)
        .filter((l) => l.trim() !== '');
      if (!lines.length) return { errors: [], processed: 0 };
      const headerLine = lines[0];
      const delimiter = headerLine.includes(';') ? ';' : ',';
      const headerCols = headerLine
        .split(delimiter)
        .map((s) => String(s || '').trim());
      // header index not needed beyond mapping to rowObj
      const errors = [];
      let processed = 0;
      const pushError = (lineNo, msg, rowObj) => {
        errors.push({ line: lineNo, error: msg, row: rowObj });
      };
      for (let li = 1; li < lines.length; li++) {
        const line = lines[li];
        if (!line || !line.trim()) continue;
        processed += 1;
        const cols = line.split(delimiter);
        const rowObj = {};
        headerCols.forEach((h, i) => {
          rowObj[h] = (cols[i] ?? '').trim();
        });
        if (ent === 'customers') {
          const name = rowObj['name'] || '';
          const email = (rowObj['email'] || '').toLowerCase();
          const phone = rowObj['phone'] || '';
          if (!name) pushError(li + 1, 'name obrigatório', rowObj);
          if (email) {
            const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!ok) pushError(li + 1, 'email inválido', rowObj);
          }
          if (phone) {
            const ok = /^[+]?\d{9,15}$/.test(phone.replace(/\s+/g, ''));
            if (!ok) pushError(li + 1, 'phone inválido', rowObj);
          }
        } else if (ent === 'services') {
          const name = rowObj['name'] || '';
          const durationRaw = rowObj['duration_minutes'] || '';
          const priceRaw = rowObj['price_eur'] || '';
          if (!name) pushError(li + 1, 'name obrigatório', rowObj);
          const duration = parseInt(String(durationRaw).trim(), 10);
          if (!Number.isFinite(duration) || duration <= 0) {
            pushError(li + 1, 'duration_minutes inválido', rowObj);
          }
          const priceNum = parseFloat(String(priceRaw).replace(',', '.'));
          if (!Number.isFinite(priceNum) || priceNum < 0) {
            pushError(li + 1, 'price_eur inválido', rowObj);
          }
        } else if (ent === 'staff') {
          const name = rowObj['name'] || '';
          const email = (rowObj['email'] || '').toLowerCase();
          const role = (rowObj['role'] || '').toLowerCase();
          if (!email) pushError(li + 1, 'email obrigatório', rowObj);
          if (!name) pushError(li + 1, 'name obrigatório', rowObj);
          const allowed = new Set(['owner', 'manager', 'collaborator']);
          if (!allowed.has(role)) pushError(li + 1, 'role inválido', rowObj);
        }
      }
      return { errors, processed };
    } catch {
      return { errors: [], processed: 0 };
    }
  }, []);

  const parseCsvPreview = async (f) => {
    try {
      console.log('parseCsvPreview:file', f?.name, f?.size, f?.type);
      const text = await f.text();
      console.log('parseCsvPreview:text_length', text?.length || 0);
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
      console.log('parseCsvPreview:lines_count', lines.length);
      const first = lines[0] || '';
      const delimiter = first.includes(';') ? ';' : ',';
      const rows = lines.slice(0, 11).map((line) => line.split(delimiter));
      console.log('parseCsvPreview:header', rows[0]);
      console.log('parseCsvPreview:rows_preview_count', rows.length);
      setPreview(rows);
      const hdr = Array.isArray(rows[0])
        ? rows[0].map((h) => String(h || '').trim())
        : [];
      setHeader(hdr);
      const defaults = hdr.map((h) => guessField(h));
      setColumnMap(defaults);
      setPreviewDelimiter(delimiter);
      const suggestions = defaults.reduce((acc, v) => {
        acc[v] = (acc[v] || 0) + 1;
        return acc;
      }, {});
      track('csv_import_preview_ready', {
        tenant_slug: tenant?.slug || null,
        entity,
        columns: hdr.length,
        rows_preview: Math.max(rows.length - 1, 0),
        delimiter,
        suggestions,
      });
    } catch (e) {
      console.error('parseCsvPreview:error', e);
      setPreview([]);
      setHeader([]);
      setColumnMap([]);
    }
  };

  useEffect(() => {
    if (preview.length && previewTableRef.current) {
      previewTableRef.current.focus();
    }
  }, [preview]);

  useEffect(() => {
    if (!header.length || !Array.isArray(columnMap) || !columnMap.length)
      return;
    const dist = columnMap.reduce((acc, v) => {
      const k = v || 'ignore';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    track('csv_import_mapping_state', {
      tenant_slug: tenant?.slug || null,
      entity,
      mapped_columns: Object.values(dist).reduce((a, b) => a + b, 0),
      distribution: dist,
    });
  }, [columnMap, header, entity, track, tenant?.slug]);

  const onFileChange = async (e) => {
    try {
      console.log('onFileChange:event_value', e?.target?.value);
      console.log('onFileChange:files_list', e?.target?.files);
      const f = e.target.files?.[0] || null;
      console.log(
        'onFileChange:selected_file',
        f ? { name: f.name, size: f.size, type: f.type } : null
      );
      setFile(f);
      setResult(null);
      setError(null);
      if (f) await parseCsvPreview(f);
    } catch (err) {
      console.error('onFileChange:error', err);
    }
  };

  const getFieldHelp = useCallback(
    (field, ent) => {
      const fe = ent || entity;
      const f = String(field || '').toLowerCase();
      if (fe === 'customers') {
        if (f === 'name')
          return t('settings.data.mapping.help_name', 'Nome do cliente');
        if (f === 'email')
          return t(
            'settings.data.mapping.help_email',
            'E-mail válido (ex: nome@dominio.com)'
          );
        if (f === 'phone')
          return t(
            'settings.data.mapping.help_phone',
            'Telefone internacional (ex: +351XXXXXXXXX)'
          );
      }
      if (fe === 'services') {
        if (f === 'name')
          return t(
            'settings.data.mapping.help_service_name',
            'Nome do serviço'
          );
        if (f === 'duration_minutes')
          return t(
            'settings.data.mapping.help_duration',
            'Duração em minutos (inteiro > 0)'
          );
        if (f === 'price_eur')
          return t(
            'settings.data.mapping.help_price',
            'Preço em EUR (ex: 12.50 ou 12,50)'
          );
      }
      if (fe === 'staff') {
        if (f === 'name')
          return t('settings.data.mapping.help_staff_name', 'Nome completo');
        if (f === 'email')
          return t('settings.data.mapping.help_email', 'E-mail válido');
        if (f === 'role')
          return t(
            'settings.data.mapping.help_role',
            'Cargo: owner, manager ou collaborator'
          );
      }
      return t('settings.data.mapping.help_ignore', 'Ignorar coluna');
    },
    [entity, t]
  );

  useEffect(() => {
    /* console.log(
      'DataSettings:file_state_changed',
      file ? { name: file.name, size: file.size, type: file.type } : null
    ); */
  }, [file]);

  const doUpload = async (dryRun) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLastDryRun(Boolean(dryRun));
    const form = new FormData();
    let uploadBlob = null;
    let uploadName = file.name || 'upload.csv';
    let normalizedTextRef = null;
    const readTextSafe = async (obj) => {
      try {
        if (obj && typeof obj.text === 'function') {
          return await obj.text();
        }
        return await new Response(obj).text();
      } catch {
        return '';
      }
    };
    try {
      const text = await readTextSafe(file);
      const firstLine = text.split(/\r?\n/)[0] || '';
      const usesSemicolon = firstLine.includes(';');
      let normalizedText = text;
      if (usesSemicolon) {
        let inQuotes = false;
        let out = '';
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === '"') {
            inQuotes = !inQuotes;
            out += ch;
          } else if (ch === ';' && !inQuotes) {
            out += ',';
          } else {
            out += ch;
          }
        }
        normalizedText = out;
      }
      try {
        const lines = normalizedText.split(/\r?\n/);
        const header = (lines[0] || '').trim();
        const delimiter = header.includes(',') ? ',' : ';';
        const headerCols = header
          .split(delimiter)
          .map((s) => s.trim().toLowerCase());
        const phoneIdx = headerCols.findIndex(
          (c) =>
            c === 'phone' ||
            c === 'phone_number' ||
            c === 'telefone' ||
            c === 'celular' ||
            c === 'telem' ||
            c === 'tel'
        );
        if (phoneIdx >= 0) {
          const normalizedLines = [header];
          for (let li = 1; li < lines.length; li++) {
            const line = lines[li];
            if (!line || !line.trim()) {
              continue;
            }
            const cols = line.split(delimiter);
            const rawPhone = (cols[phoneIdx] || '').trim();
            const digits = rawPhone.replace(/[^\d+]/g, '');
            let norm = digits;
            if (digits.startsWith('+')) {
              norm = digits;
            } else if (digits.startsWith('00351')) {
              norm = '+351' + digits.slice(5);
            } else if (digits.startsWith('351')) {
              norm = '+351' + digits.slice(3);
            }
            cols[phoneIdx] = norm;
            normalizedLines.push(cols.join(delimiter));
          }
          normalizedText = normalizedLines.join('\n');
        }
        {
          const lines2 = normalizedText.split(/\r?\n/);
          const headerLine2 = (lines2[0] || '').trim();
          const delim2 = headerLine2.includes(',') ? ',' : ';';
          const cols2 = headerLine2.split(delim2);
          const inferred = cols2.map((c) => guessField(String(c || '').trim()));
          let mapped = cols2.map((c, i) => {
            const dest =
              (Array.isArray(columnMap) && columnMap.length
                ? columnMap[i]
                : undefined) || inferred[i];
            if (!dest || dest === 'ignore') return c;
            return dest;
          });
          if (
            entity === 'customers' &&
            mapped.join(',') !== 'name,email,phone'
          ) {
            mapped = ['name', 'email', 'phone'].slice(0, cols2.length);
          } else if (
            entity === 'services' &&
            mapped.join(',') !== 'name,duration_minutes,price_eur'
          ) {
            mapped = ['name', 'duration_minutes', 'price_eur'].slice(
              0,
              cols2.length
            );
          } else if (
            entity === 'staff' &&
            mapped.join(',') !== 'name,email,role'
          ) {
            mapped = ['name', 'email', 'role'].slice(0, cols2.length);
          }
          normalizedText = [mapped.join(delim2), ...lines2.slice(1)].join('\n');
          const lines3 = normalizedText.split(/\r?\n/);
          const headerLine3 = (lines3[0] || '').trim();
          const delim3 = headerLine3.includes(',') ? ',' : ';';
          const headerCols3 = headerLine3.split(delim3).map((s) =>
            String(s || '')
              .trim()
              .toLowerCase()
          );
          const idxDuration = headerCols3.indexOf('duration_minutes');
          const idxPrice = headerCols3.indexOf('price_eur');
          const idxDate = (() => {
            for (let i = 0; i < headerCols3.length; i++) {
              const c = headerCols3[i];
              if (
                c === 'date' ||
                c === 'data' ||
                c === 'birthdate' ||
                c === 'dob'
              ) {
                return i;
              }
            }
            return -1;
          })();
          const idxEmail = headerCols3.indexOf('email');
          const idxRole = headerCols3.indexOf('role');
          const idxPhone2 = headerCols3.indexOf('phone');
          const normRows = [lines3[0]];
          for (let li = 1; li < lines3.length; li++) {
            const line = lines3[li];
            if (!line || !line.trim()) {
              continue;
            }
            const cols = line.split(delim3).map((c) => String(c || ''));
            if (idxDuration >= 0) {
              let v = cols[idxDuration].trim();
              if (v) {
                if (/^\d+:\d{1,2}$/.test(v)) {
                  const [h, m] = v.split(':').map((x) => parseInt(x, 10));
                  const total =
                    (Number.isFinite(h) ? h : 0) * 60 +
                    (Number.isFinite(m) ? m : 0);
                  cols[idxDuration] = String(total);
                } else if (/^\d+\s*h(\s*\d+\s*m)?$/i.test(v)) {
                  const parts = v.toLowerCase().split('h');
                  const h = parseInt(parts[0].replace(/[^\d]/g, ''), 10);
                  const m = parseInt(
                    (parts[1] || '').replace(/[^\d]/g, ''),
                    10
                  );
                  const total =
                    (Number.isFinite(h) ? h : 0) * 60 +
                    (Number.isFinite(m) ? m : 0);
                  cols[idxDuration] = String(total);
                } else {
                  const num = parseInt(v.replace(/[^\d]/g, ''), 10);
                  if (Number.isFinite(num)) cols[idxDuration] = String(num);
                }
              }
            }
            if (idxPrice >= 0) {
              let p = cols[idxPrice].trim();
              if (p) {
                p = p.replace(/[^\d.,-]/g, '');
                const num = parseFloat(p.replace(',', '.'));
                if (Number.isFinite(num)) cols[idxPrice] = String(num);
              }
            }
            if (idxDate >= 0) {
              let d = cols[idxDate].trim();
              if (d) {
                const toIso = (y, m, dd) => {
                  const mm = String(m).padStart(2, '0');
                  const ddp = String(dd).padStart(2, '0');
                  return `${y}-${mm}-${ddp}`;
                };
                if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(d)) {
                  const parts = d.split(/[-/.]/).map((x) => parseInt(x, 10));
                  cols[idxDate] = toIso(parts[0], parts[1], parts[2]);
                } else if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(d)) {
                  const parts = d.split(/[-/.]/).map((x) => parseInt(x, 10));
                  const dd = parts[0];
                  const mm = parts[1];
                  const yy = parts[2];
                  cols[idxDate] = toIso(yy, mm, dd);
                }
              }
            }
            if (idxEmail >= 0) {
              cols[idxEmail] = cols[idxEmail].trim().toLowerCase();
            }
            if (idxRole >= 0) {
              cols[idxRole] = cols[idxRole].trim().toLowerCase();
            }
            if (idxPhone2 >= 0) {
              const raw = cols[idxPhone2].trim();
              const digits = raw.replace(/[^\d+]/g, '');
              let norm = digits;
              if (digits.startsWith('+')) {
                norm = digits;
              } else if (digits.startsWith('00351')) {
                norm = '+351' + digits.slice(5);
              } else if (digits.startsWith('351')) {
                norm = '+351' + digits.slice(3);
              }
              cols[idxPhone2] = norm;
            }
            normRows.push(cols.join(delim3));
          }
          normalizedText = normRows.join('\n');
        }
      } catch {
        // fallback: keep normalizedText as-is
      }
      normalizedTextRef = normalizedText;
      uploadBlob = new Blob([normalizedText], { type: 'text/csv' });
    } catch {
      uploadBlob = file;
    }

    form.append('file', uploadBlob, uploadName);
    const params = { dry_run: dryRun ? 'true' : 'false' };
    try {
      const pre = validateNormalizedCsv(
        normalizedTextRef !== null
          ? normalizedTextRef
          : await readTextSafe(uploadBlob),
        entity
      );
      if (pre.errors.length && !dryRun) {
        setResult({
          summary: {
            processed: pre.processed,
            created: null,
            updated: null,
            skipped: null,
            errors: pre.errors,
          },
          request_id: null,
        });
        const breakdown = (() => {
          const byReason = {};
          const byField = {};
          for (const err of pre.errors) {
            const r =
              (err && typeof err === 'object' ? err.error : String(err)) || '';
            const row = (err && typeof err === 'object' ? err.row : {}) || {};
            const keys = Object.keys(row || {});
            let field = '';
            if (keys.includes('phone')) field = 'phone';
            else if (keys.includes('email')) field = 'email';
            else if (keys.includes('name')) field = 'name';
            else if (keys.includes('duration_minutes'))
              field = 'duration_minutes';
            else if (keys.includes('price_eur')) field = 'price_eur';
            else field = keys[0] || '';
            const rr = String(r).toLowerCase();
            byReason[rr] = (byReason[rr] || 0) + 1;
            byField[field] = (byField[field] || 0) + 1;
          }
          return { by_reason: byReason, by_field: byField };
        })();
        track('csv_import_precheck_failed', {
          tenant_slug: tenant?.slug || null,
          entity,
          file_name: uploadName,
          file_size: file?.size || null,
          errors_count: pre.errors.length,
          errors_breakdown: breakdown,
        });
        return;
      }
      if (pre.errors.length && dryRun) {
        setResult({
          summary: {
            processed: pre.processed,
            created: null,
            updated: null,
            skipped: null,
            errors: pre.errors,
          },
          request_id: null,
        });
        const breakdown = (() => {
          const byReason = {};
          const byField = {};
          for (const err of pre.errors) {
            const r =
              (err && typeof err === 'object' ? err.error : String(err)) || '';
            const row = (err && typeof err === 'object' ? err.row : {}) || {};
            const keys = Object.keys(row || {});
            let field = '';
            if (keys.includes('phone')) field = 'phone';
            else if (keys.includes('email')) field = 'email';
            else if (keys.includes('name')) field = 'name';
            else if (keys.includes('duration_minutes'))
              field = 'duration_minutes';
            else if (keys.includes('price_eur')) field = 'price_eur';
            else field = keys[0] || '';
            const rr = String(r).toLowerCase();
            byReason[rr] = (byReason[rr] || 0) + 1;
            byField[field] = (byField[field] || 0) + 1;
          }
          return { by_reason: byReason, by_field: byField };
        })();
        track('csv_import_precheck_failed', {
          tenant_slug: tenant?.slug || null,
          entity,
          file_name: uploadName,
          file_size: file?.size || null,
          errors_count: pre.errors.length,
          errors_breakdown: breakdown,
        });
        return;
      }
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (tenant?.slug) headers['X-Tenant-Slug'] = tenant.slug;
      const response = await client.post(`import/${entity}/`, form, {
        headers,
        params,
      });
      const data = response?.data || null;
      setResult(data);
      const summary = data?.summary || null;
      const errors = (summary?.errors || data?.errors || []).filter(Boolean);
      const props = {
        tenant_slug: tenant?.slug || null,
        entity,
        dry_run: Boolean(dryRun),
        file_name: uploadName,
        file_size: file?.size || null,
        created: summary?.created ?? data?.created_count ?? null,
        updated: summary?.updated ?? data?.updated_count ?? null,
        processed: summary?.processed ?? null,
        errors_count: errors.length,
        request_id: data?.request_id || null,
      };
      track(
        dryRun ? 'csv_import_dry_run_success' : 'csv_import_success',
        props
      );
      if (errors.length) {
        const breakdown = (() => {
          const byReason = {};
          const byField = {};
          for (const err of errors) {
            const r =
              (err && typeof err === 'object' ? err.error : String(err)) || '';
            const row = (err && typeof err === 'object' ? err.row : {}) || {};
            const keys = Object.keys(row || {});
            let field = '';
            if (keys.includes('phone')) field = 'phone';
            else if (keys.includes('email')) field = 'email';
            else if (keys.includes('name')) field = 'name';
            else if (keys.includes('duration_minutes'))
              field = 'duration_minutes';
            else if (keys.includes('price_eur')) field = 'price_eur';
            else field = keys[0] || '';
            const rr = String(r).toLowerCase();
            byReason[rr] = (byReason[rr] || 0) + 1;
            byField[field] = (byField[field] || 0) + 1;
          }
          return { by_reason: byReason, by_field: byField };
        })();
        track('csv_import_validation_breakdown', {
          tenant_slug: tenant?.slug || null,
          entity,
          dry_run: Boolean(dryRun),
          file_name: uploadName,
          errors_count: errors.length,
          errors_breakdown: breakdown,
        });
      }
    } catch (e) {
      const status = e?.response?.status;
      const message =
        status === 403
          ? t(
              'reports.access_denied.description',
              'Apenas proprietários têm acesso aos relatórios do negócio.'
            )
          : t('common.save_error', 'Falha ao salvar. Tente novamente.');
      setError({
        message,
        status,
        requestId: e?.response?.headers?.['x-request-id'] || null,
      });
      const props = {
        tenant_slug: tenant?.slug || null,
        entity,
        dry_run: Boolean(dryRun),
        file_name: uploadName,
        file_size: file?.size || null,
        status,
        request_id: e?.response?.headers?.['x-request-id'] || null,
      };
      track(
        dryRun ? 'csv_import_dry_run_failure' : 'csv_import_failure',
        props
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    setError(null);
    try {
      const headers = {};
      if (tenant?.slug) headers['X-Tenant-Slug'] = tenant.slug;
      const response = await client.get(`import/templates/${entity}.csv`, {
        headers,
        responseType: 'blob',
      });
      const blob = response?.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}_template.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError({
        message: t('common.save_error', 'Falha ao salvar. Tente novamente.'),
        status: e?.response?.status,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-brand-border">
        <nav
          className="-mb-px flex space-x-8"
          aria-label={t('settings.data.aria_tabs', 'Dados (CSV)')}
          role="tablist"
        >
          <button
            type="button"
            onClick={() => setDataTab('import')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              dataTab === 'import'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-surfaceForeground/60 hover:text-brand-surfaceForeground hover:border-brand-border'
            }`}
            role="tab"
            aria-selected={dataTab === 'import'}
          >
            {t('settings.data.tab_import', 'Importação (CSV)')}
          </button>
          <button
            type="button"
            onClick={() => setDataTab('export')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              dataTab === 'export'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-surfaceForeground/60 hover:text-brand-surfaceForeground hover:border-brand-border'
            }`}
            role="tab"
            aria-selected={dataTab === 'export'}
          >
            {t('settings.data.tab_export', 'Exportação (CSV)')}
          </button>
        </nav>
      </div>
      <p className="text-sm text-brand-surfaceForeground/70">
        {t(
          dataTab === 'export'
            ? 'settings.data.description_export'
            : 'settings.data.description',
          dataTab === 'export'
            ? 'Exporte clientes, serviços ou membros da equipe em arquivo CSV.'
            : 'Importe clientes, serviços ou membros da equipe via arquivo CSV.'
        )}
      </p>
      {dataTab === 'export' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:hidden">
              <label className="block text-xs font-medium text-brand-surfaceForeground/70">
                {t('settings.data.entity', 'Tipo de dados')}
              </label>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-2 text-sm text-brand-surfaceForeground"
              >
                <option value="customers">
                  {t('settings.data.entity_customers', 'Clientes')}
                </option>
                <option value="services">
                  {t('settings.data.entity_services', 'Serviços')}
                </option>
                <option value="staff">
                  {t('settings.data.entity_staff', 'Equipe')}
                </option>
              </select>
              <div className="mt-3 block sm:hidden">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleExport(entity);
                  }}
                  aria-busy={exportLoading}
                  className={`text-brand-primary hover:text-brand-primary/80 font-medium transition-colors inline-flex items-center ${
                    exportLoading || cooldown > 0
                      ? 'opacity-50 cursor-not-allowed pointer-events-none'
                      : 'cursor-pointer'
                  }`}
                >
                  {exportLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {t('settings.data.export.loading', 'Exportando...')}
                    </>
                  ) : (
                    <>{t('settings.data.export.one', 'Exportar CSV')}</>
                  )}
                </a>
              </div>
            </div>
            {entity !== 'services' ? (
              <div className="grid grid-cols-2 gap-3 lg:hidden">
                <div className="flex items-center gap-2">
                  <input
                    id="exportActiveOnly"
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.target.checked)}
                  />
                  <label
                    htmlFor="exportActiveOnly"
                    className="text-sm text-brand-surfaceForeground"
                  >
                    {t('settings.data.filters.active', 'Apenas ativos')}
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-surfaceForeground/70">
                    {t(
                      'settings.data.filters.updated_since',
                      'Atualizados desde'
                    )}
                  </label>
                  <input
                    type="date"
                    value={updatedSince}
                    onChange={(e) => setUpdatedSince(e.target.value)}
                    className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-2 text-sm text-brand-surfaceForeground"
                  />
                </div>
              </div>
            ) : null}
            <div className="hidden lg:grid lg:col-span-3 grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <input
                  id="exportActiveOnlyDesktop"
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                />
                <label
                  htmlFor="exportActiveOnlyDesktop"
                  className="text-sm text-brand-surfaceForeground"
                >
                  {t('settings.data.filters.active', 'Apenas ativos')}
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-surfaceForeground/70">
                  {t(
                    'settings.data.filters.updated_since',
                    'Atualizados desde'
                  )}
                </label>
                <input
                  type="date"
                  value={updatedSince}
                  onChange={(e) => setUpdatedSince(e.target.value)}
                  className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-2 text-sm text-brand-surfaceForeground"
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-wrap items-center gap-4">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleExport('customers');
              }}
              aria-busy={exportLoading && exportEntity === 'customers'}
              className={`text-brand-primary hover:text-brand-primary/80 font-medium transition-colors inline-flex items-center ${
                exportLoading || cooldown > 0
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : 'cursor-pointer'
              }`}
            >
              {exportLoading && exportEntity === 'customers' ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t(
                    'settings.data.export.customers_loading',
                    'Exportando clientes...'
                  )}
                </>
              ) : (
                <>
                  {t(
                    'settings.data.export.customers',
                    'Exportar CSV de Clientes'
                  )}
                </>
              )}
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleExport('services');
              }}
              aria-busy={exportLoading && exportEntity === 'services'}
              className={`text-brand-primary hover:text-brand-primary/80 font-medium transition-colors inline-flex items-center ${
                exportLoading || cooldown > 0
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : 'cursor-pointer'
              }`}
            >
              {exportLoading && exportEntity === 'services' ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t(
                    'settings.data.export.services_loading',
                    'Exportando serviços...'
                  )}
                </>
              ) : (
                <>
                  {t(
                    'settings.data.export.services',
                    'Exportar CSV de Serviços'
                  )}
                </>
              )}
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleExport('staff');
              }}
              aria-busy={exportLoading && exportEntity === 'staff'}
              className={`text-brand-primary hover:text-brand-primary/80 font-medium transition-colors inline-flex items-center ${
                exportLoading || cooldown > 0
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : 'cursor-pointer'
              }`}
            >
              {exportLoading && exportEntity === 'staff' ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t(
                    'settings.data.export.staff_loading',
                    'Exportando equipe...'
                  )}
                </>
              ) : (
                <>
                  {t(
                    'settings.data.export.staff',
                    'Exportar CSV de Profissionais'
                  )}
                </>
              )}
            </a>
            {cooldown > 0 ? (
              <span className="text-xs text-brand-surfaceForeground/60">
                {t('settings.data.rate_limited', 'Muitas tentativas. Aguarde')}{' '}
                {cooldown}s
              </span>
            ) : null}
          </div>
          <p className="text-xs text-brand-surfaceForeground/60 lg:mt-2">
            {t(
              'settings.data.filters.hint_entities',
              'Filtros aplicáveis a Clientes e Profissionais'
            )}
          </p>
          {error ? (
            <div className="rounded border border-brand-border bg-brand-surface p-3">
              <p className="text-sm text-brand-surfaceForeground">
                {error.message}
              </p>
              {error.requestId ? (
                <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                  {t('common.request_id', 'Request ID')}: {error.requestId}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-brand-surfaceForeground/70">
              {t('settings.data.entity', 'Tipo de dados')}
            </label>
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-2 text-sm text-brand-surfaceForeground"
            >
              <option value="customers">
                {t('settings.data.entity_customers', 'Clientes')}
              </option>
              <option value="services">
                {t('settings.data.entity_services', 'Serviços')}
              </option>
              <option value="staff">
                {t('settings.data.entity_staff', 'Equipe')}
              </option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-brand-surfaceForeground/70">
              {t('settings.data.file', 'Arquivo CSV')}
            </label>
            <input
              ref={fileInputRef}
              onChange={onFileChange}
              aria-label={t('settings.data.file', 'Arquivo CSV')}
              onClick={() => {
                console.log('fileInput:click');
                setTimeout(() => {
                  const f = fileInputRef.current?.files?.[0] || null;
                  console.log(
                    'fileInput:poll_500ms',
                    f ? { name: f.name, size: f.size, type: f.type } : null
                  );
                }, 500);
                setTimeout(() => {
                  const f = fileInputRef.current?.files?.[0] || null;
                  console.log(
                    'fileInput:poll_1500ms',
                    f ? { name: f.name, size: f.size, type: f.type } : null
                  );
                }, 1500);
              }}
              onInput={(e) => console.log('fileInput:input', e?.target?.value)}
              onChangeCapture={(e) =>
                console.log('fileInput:changeCapture', e?.target?.files)
              }
              type="file"
              id="csvInputStandalone"
              name="csvInputStandalone"
              accept="text/csv,.csv"
              className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-2 text-sm text-brand-surfaceForeground"
            />
            {file ? (
              <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            ) : null}
          </div>
        </div>
      )}
      {dataTab !== 'export' ? (
        <>
          {preview.length ? (
            <div className="overflow-auto rounded border border-brand-border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-surfaceForeground/80">
                <span>
                  {t('settings.data.preview.columns', 'Colunas')}:{' '}
                  {header.length}
                </span>
                <span>
                  {t('settings.data.preview.rows', 'Linhas (preview)')}:{' '}
                  {Math.max(preview.length - 1, 0)}
                </span>
                <span>
                  {t('settings.data.preview.delimiter', 'Delimitador')}:{' '}
                  {previewDelimiter === ';' ? ';' : ','}
                </span>
              </div>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-brand-light">
                  <tr>
                    {preview[0].map((h, i) => (
                      <th
                        key={`h-${i}`}
                        className="px-3 py-2 text-xs font-semibold text-brand-surfaceForeground/70"
                      >
                        <span className="inline-flex items-center gap-2">
                          {String(h || '').trim()}
                          <span className="relative">
                            <button
                              type="button"
                              className="rounded border border-brand-border bg-brand-light px-1 text-[10px]"
                              aria-label={t(
                                'settings.data.mapping.header_help',
                                'Ajuda da coluna'
                              )}
                              onMouseEnter={(e) => {
                                const el = e.currentTarget.nextSibling;
                                if (el) el.style.display = 'block';
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget.nextSibling;
                                if (el) el.style.display = 'none';
                              }}
                            >
                              {t('common.help', '?')}
                            </button>
                            <div
                              style={{
                                display: 'none',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-primary)',
                                border: '1px solid',
                              }}
                              className="absolute z-20 mt-2 w-64 max-w-xs rounded-lg p-3 text-left text-[11px] shadow-lg"
                            >
                              <div className="font-semibold">
                                {t(
                                  'settings.data.mapping.suggested',
                                  'Sugestão'
                                )}
                                : {guessField(h)}
                              </div>
                              <div className="mt-1">
                                {getFieldHelp(guessField(h), entity)}
                              </div>
                            </div>
                          </span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1).map((row, ri) => (
                    <tr key={`r-${ri}`} className="odd:bg-brand-surface/50">
                      {row.map((cell, ci) => (
                        <td
                          key={`c-${ri}-${ci}`}
                          className="px-3 py-2 text-brand-surfaceForeground/80"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {header.length ? (
            <div className="rounded border border-brand-border bg-brand-surface p-3">
              <p className="text-xs font-medium text-brand-surfaceForeground/70">
                {t('settings.data.mapping.title', 'Mapeamento de colunas')}
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {header.map((h, i) => (
                  <div key={`map-${i}`} className="flex items-center gap-2">
                    <span className="flex-1 truncate text-xs text-brand-surfaceForeground/70">
                      {h}
                    </span>
                    <select
                      value={columnMap[i] || 'ignore'}
                      onChange={(e) => {
                        const v = e.target.value;
                        const prevVal = columnMap[i] || 'ignore';
                        setColumnMap((prev) => {
                          const next = Array.from(prev);
                          next[i] = v;
                          return next;
                        });
                        track('csv_import_map_change', {
                          tenant_slug: tenant?.slug || null,
                          entity,
                          column_index: i,
                          from: prevVal,
                          to: v,
                        });
                      }}
                      aria-label={
                        t(
                          'settings.data.mapping.aria_map_to',
                          'Mapear coluna'
                        ) +
                        ' ' +
                        h
                      }
                      className="w-40 rounded border border-brand-border bg-brand-surface px-2 py-1 text-xs text-brand-surfaceForeground"
                    >
                      {resolveTargetFields().map((opt) => (
                        <option key={`opt-${i}-${opt}`} value={opt}>
                          {opt === 'name'
                            ? t('settings.data.mapping.name', 'Nome')
                            : opt === 'email'
                              ? t('settings.data.mapping.email', 'Email')
                              : opt === 'phone'
                                ? t('settings.data.mapping.phone', 'Telefone')
                                : opt === 'price_eur'
                                  ? t(
                                      'settings.data.mapping.price_eur',
                                      'Preço (EUR)'
                                    )
                                  : opt === 'duration_minutes'
                                    ? t(
                                        'settings.data.mapping.duration_minutes',
                                        'Duração (min)'
                                      )
                                    : opt === 'role'
                                      ? t('settings.data.mapping.role', 'Cargo')
                                      : t(
                                          'settings.data.mapping.ignore',
                                          'Ignorar'
                                        )}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-brand-surfaceForeground/50">
                      {t('settings.data.mapping.suggested', 'Sugestão')}:{' '}
                      {guessField(h)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <div
              className="relative inline-block"
              onMouseEnter={() => setDryRunTooltipOpen(true)}
              onMouseLeave={() => setDryRunTooltipOpen(false)}
            >
              <button
                type="button"
                onClick={() => doUpload(true)}
                disabled={!file || loading}
                className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground"
                aria-describedby="dry-run-tooltip"
                aria-label={t(
                  'settings.data.actions.dry_run',
                  'Validar (dry-run)'
                )}
                onFocus={() => setDryRunTooltipOpen(true)}
                onBlur={() => setDryRunTooltipOpen(false)}
              >
                {loading
                  ? t('common.loading', 'Enviando...')
                  : t('settings.data.actions.dry_run', 'Validar (dry-run)')}
              </button>
              {dryRunTooltipOpen ? (
                <div
                  id="dry-run-tooltip"
                  role="tooltip"
                  className="absolute z-20 mt-2 w-64 max-w-xs rounded-lg p-3 text-left text-xs shadow-lg"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-primary)',
                    border: '1px solid',
                  }}
                >
                  {t(
                    'settings.data.actions.dry_run_tooltip',
                    'Valida o CSV sem importar. Mostra erros e contagens.'
                  )}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => doUpload(false)}
              disabled={!file || loading}
              className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground"
              aria-label={t('settings.data.actions.import', 'Importar')}
            >
              {t('settings.data.actions.import', 'Importar')}
            </button>
            <button
              type="button"
              onClick={downloadTemplate}
              disabled={loading}
              className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground"
              aria-label={t(
                'settings.data.actions.download_template',
                'Baixar modelo'
              )}
            >
              {t('settings.data.actions.download_template', 'Baixar modelo')}
            </button>
          </div>
          {error ? (
            <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error.message ||
                t('common.save_error', 'Falha ao salvar. Tente novamente.')}
            </div>
          ) : null}
          {result ? (
            <div className="space-y-2" aria-live="polite">
              <h4 className="text-sm font-semibold text-brand-surfaceForeground">
                {t(
                  'settings.data.result.title',
                  'Resultado da validação/importação'
                )}
              </h4>
              {lastDryRun === false ? (
                <div className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
                  {t('settings.data.import.success', 'Importação concluída')}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3 text-sm">
                {derived.created !== null ? (
                  <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                    {t('settings.data.result.created', 'Criados')}:{' '}
                    {derived.created}
                  </span>
                ) : null}
                {derived.updated !== null ? (
                  <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                    {t('settings.data.result.updated', 'Atualizados')}:{' '}
                    {derived.updated}
                  </span>
                ) : null}
                {Array.isArray(derived.errors) ? (
                  <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                    {t('settings.data.result.errors_count', 'Erros')}:{' '}
                    {derived.errors.length}
                  </span>
                ) : null}
                {derived.processed !== null ? (
                  <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                    Processados: {derived.processed}
                  </span>
                ) : null}
                {derived.skipped !== null ? (
                  <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                    Ignorados: {derived.skipped}
                  </span>
                ) : null}
                {derived.requestId ? (
                  <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                    {t('settings.data.result.request_id', 'ID da requisição')}:{' '}
                    {derived.requestId}
                  </span>
                ) : null}
              </div>
              {Array.isArray(derived.errors) && derived.errors.length ? (
                <div className="rounded border border-brand-border bg-brand-surface px-3 py-2">
                  <p className="text-xs font-medium text-brand-surfaceForeground/70">
                    {t(
                      'settings.data.result.errors_title',
                      'Erros encontrados'
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-brand-surfaceForeground/70">
                        {t('settings.data.result.errors_by_field', 'Por campo')}
                        :
                      </span>
                      {Object.entries(errorBreakdown.by_field).map(([k, v]) => (
                        <span
                          key={`bf-${k}`}
                          className="rounded border border-brand-border bg-brand-light px-2 py-1"
                        >
                          {k} ({v})
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-brand-surfaceForeground/70">
                        {t(
                          'settings.data.result.errors_by_reason',
                          'Por motivo'
                        )}
                        :
                      </span>
                      {Object.entries(errorBreakdown.by_reason).map(
                        ([k, v]) => (
                          <span
                            key={`br-${k}`}
                            className="rounded border border-brand-border bg-brand-light px-2 py-1"
                          >
                            {k} ({v})
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <div className="overflow-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-brand-light">
                        <tr>
                          <th className="px-2 py-1">
                            {t('settings.data.result.line', 'Linha')}
                          </th>
                          <th className="px-2 py-1">
                            {t('settings.data.result.column', 'Coluna')}
                          </th>
                          <th className="px-2 py-1">
                            {t('settings.data.result.reason', 'Motivo')}
                          </th>
                          <th className="px-2 py-1">
                            {t('settings.data.result.hint', 'Dica')}
                          </th>
                          <th className="px-2 py-1">
                            {t('settings.data.result.value', 'Valor')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {derived.errors.map((e, i) => {
                          const line =
                            e && typeof e === 'object'
                              ? (e.line ?? null)
                              : null;
                          const reason =
                            e && typeof e === 'object'
                              ? (e.error ?? JSON.stringify(e))
                              : String(e);
                          const row =
                            e && typeof e === 'object' ? e.row || {} : {};
                          const keys = Object.keys(row || {});
                          let column = null;
                          if (keys.includes('phone')) column = 'phone';
                          else if (keys.includes('name')) column = 'name';
                          else if (keys.includes('email')) column = 'email';
                          else if (keys.includes('duration_minutes'))
                            column = 'duration_minutes';
                          else if (keys.includes('price_eur'))
                            column = 'price_eur';
                          else column = keys[0] || '';
                          const value = column ? row[column] : '';
                          const hint = (() => {
                            const r = String(reason || '').toLowerCase();
                            if (column === 'email')
                              return t(
                                'settings.data.hints.email',
                                'Use um e-mail válido: nome@dominio.com'
                              );
                            if (column === 'phone')
                              return t(
                                'settings.data.hints.phone',
                                'Use formato internacional, ex: +351912345678'
                              );
                            if (column === 'name' && r.includes('obrigatório'))
                              return t(
                                'settings.data.hints.name_required',
                                'Preencha o nome'
                              );
                            if (column === 'duration_minutes')
                              return t(
                                'settings.data.hints.duration',
                                'Informe minutos numéricos. Ex: 90'
                              );
                            if (column === 'price_eur')
                              return t(
                                'settings.data.hints.price',
                                'Informe número. Ex: 12.50'
                              );
                            return '';
                          })();
                          const colClass = /inválid|obrigatório/i.test(
                            String(reason || '')
                          )
                            ? 'bg-red-50 text-red-600'
                            : '';
                          return (
                            <tr
                              key={`err-row-${i}`}
                              className="odd:bg-brand-surface/50"
                            >
                              <td className="px-2 py-1">{line ?? ''}</td>
                              <td className={`px-2 py-1 ${colClass}`}>
                                {column || ''}
                              </td>
                              <td className={`px-2 py-1 ${colClass}`}>
                                {reason}
                              </td>
                              <td className="px-2 py-1">{hint}</td>
                              <td className="px-2 py-1">{value || ''}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const rows = derived.errors.map((e) => {
                            const line =
                              e && typeof e === 'object' ? (e.line ?? '') : '';
                            const reason =
                              e && typeof e === 'object'
                                ? (e.error ?? JSON.stringify(e))
                                : String(e);
                            const row =
                              e && typeof e === 'object' ? e.row || {} : {};
                            const keys = Object.keys(row || {});
                            let column = '';
                            if (keys.includes('phone')) column = 'phone';
                            else if (keys.includes('name')) column = 'name';
                            else if (keys.includes('email')) column = 'email';
                            else column = keys[0] || '';
                            const value = column ? row[column] : '';
                            const json = JSON.stringify(row);
                            return `${line},${column},${JSON.stringify(reason)},${JSON.stringify(value)},${JSON.stringify(json)}`;
                          });
                          const header = 'line,column,reason,value,row_json';
                          const csv = [header, ...rows].join('\n');
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${entity}_errors.csv`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          window.URL.revokeObjectURL(url);
                        } catch (err) {
                          void err;
                        }
                      }}
                      className="rounded border border-brand-border bg-brand-light px-2 py-1"
                    >
                      {t(
                        'settings.data.result.download_errors',
                        'Baixar erros (CSV)'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-brand-surfaceForeground/60">
                  {t(
                    'settings.data.result.no_errors',
                    'Nenhum erro encontrado'
                  )}
                </p>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Settings() {
  const { t } = useTranslation();
  const {
    tenant,
    tenantSlug,
    plan,
    modules,
    channels,
    flags,
    featureFlagsRaw,
    profile,
    branding,
    loading: tenantLoading,
    error: tenantError,
    refetch,
  } = useTenant();
  const [activeTab, setActiveTab] = useState('branding');
  const {
    balance,
    loading: creditLoading,
    error: creditError,
    refresh: refreshCredits,
  } = useCreditBalance();
  const { overview: billingOverview, refresh: refreshOverview } =
    useBillingOverview();
  // SSE desativado: atualização manual via badge (CreditBadge)

  const initialSettings = useMemo(
    () => buildInitialSettings(profile, channels, branding, tenant),
    [profile, channels, branding, tenant]
  );

  const [settings, setSettings] = useState(initialSettings);
  const [brandingFile, setBrandingFile] = useState(null);
  const [brandingPreview, setBrandingPreview] = useState('');
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingError, setBrandingError] = useState(null);
  const [brandingSuccess, setBrandingSuccess] = useState('');
  const [autoInviteEnabled, setAutoInviteEnabled] = useState(
    Boolean(tenant?.auto_invite_enabled)
  );
  const [autoInviteSaving, setAutoInviteSaving] = useState(false);
  const [pwaClientEnabled, setPwaClientEnabled] = useState(false);
  const [pwaClientSaving, setPwaClientSaving] = useState(false);
  const [pwaClientError, setPwaClientError] = useState(null);
  const [pwaClientSuccess, setPwaClientSuccess] = useState('');
  const [notifRawOverrides, setNotifRawOverrides] = useState({});
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [generalSuccess, setGeneralSuccess] = useState('');

  useEffect(() => {
    setSettings(initialSettings);
    setBrandingFile(null);
    setBrandingSuccess('');
    setBrandingError(null);
  }, [initialSettings]);

  useEffect(() => {
    setAutoInviteEnabled(Boolean(tenant?.auto_invite_enabled));
  }, [tenant?.auto_invite_enabled]);

  useEffect(() => {
    const initial = Boolean(
      (tenant && tenant.pwa_client_enabled) ??
        (flags && flags.enableCustomerPwa)
    );
    setPwaClientEnabled(initial);
  }, [tenant, flags]);

  useEffect(() => {
    if (brandingFile) {
      const url = URL.createObjectURL(brandingFile);
      setBrandingPreview(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    const preview =
      resolveTenantAssetUrl(settings.branding.logoUrl) ||
      resolveTenantAssetUrl(branding?.logoUrl) ||
      '';
    setBrandingPreview(preview);
    return undefined;
  }, [brandingFile, settings.branding.logoUrl, branding?.logoUrl]);

  useEffect(() => {
    if (!tenantLoading && tenant && !tenant?.plan) {
      console.warn(
        '[Settings] Tenant sem dados de plano recebidos do backend.',
        tenant
      );
    }
  }, [tenant, tenantLoading]);

  const formatValue = useCallback(
    (value, fallbackLabel) => {
      if (value === undefined || value === null || value === '') {
        return fallbackLabel || t('settings.value_missing', 'Não informado');
      }
      return value;
    },
    [t]
  );

  const renderInfoCard = useCallback(
    (label, value, key) => (
      <div
        key={key}
        className="rounded-lg border border-brand-border bg-brand-surface/70 px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/60">
          {label}
        </p>
        <p className="mt-1 text-sm text-brand-surfaceForeground">{value}</p>
      </div>
    ),
    []
  );

  const planName = useMemo(() => {
    const byOverview = billingOverview?.current_subscription?.plan_name;
    if (byOverview) return byOverview;
    return resolvePlanName(plan);
  }, [billingOverview?.current_subscription?.plan_name, plan]);
  const planTier = useMemo(() => resolvePlanTier(plan), [plan]);

  const moduleList = useMemo(() => {
    const resolved = new Set(resolvePlanModules(plan, modules).filter(Boolean));

    Object.entries(MODULE_CONFIG).forEach(([moduleKey, config]) => {
      const rawEnabled = Boolean(featureFlagsRaw?.modules?.[config.rawKey]);
      const flattenedEnabled = config.flagKey
        ? Boolean(flags?.[config.flagKey])
        : undefined;

      if (rawEnabled || flattenedEnabled) {
        resolved.add(moduleKey);
      }
    });

    return Array.from(resolved).filter((moduleKey) => {
      const config = MODULE_CONFIG[moduleKey];
      if (!config) return true;

      const featureKey = MODULE_REQUIREMENTS[moduleKey];
      if (featureKey) {
        const requiredPlan =
          TENANT_FEATURE_REQUIREMENTS[featureKey]?.requiredPlan;
        if (requiredPlan) {
          const cmp = comparePlanTiers(requiredPlan, planTier);
          if (cmp < 0) {
            return false;
          }
        }
      }

      if (
        config.rawKey &&
        featureFlagsRaw?.modules &&
        Object.prototype.hasOwnProperty.call(
          featureFlagsRaw.modules,
          config.rawKey
        )
      ) {
        return Boolean(featureFlagsRaw.modules[config.rawKey]);
      }

      if (
        config.flagKey &&
        flags &&
        Object.prototype.hasOwnProperty.call(flags, config.flagKey)
      ) {
        return Boolean(flags[config.flagKey]);
      }

      return true;
    });
  }, [plan, planTier, modules, flags, featureFlagsRaw]);

  useEffect(() => {
    const modulesFlags = featureFlagsRaw?.modules;
    let rawEnabled;
    if (
      modulesFlags &&
      Object.prototype.hasOwnProperty.call(modulesFlags, 'pwa_client_enabled')
    ) {
      rawEnabled = Boolean(modulesFlags.pwa_client_enabled);
    } else {
      rawEnabled = Boolean(flags?.enableCustomerPwa);
    }
    const listed =
      Array.isArray(moduleList) && moduleList.includes('pwa_client');
    setPwaClientEnabled(Boolean(rawEnabled || listed));
  }, [featureFlagsRaw?.modules, flags?.enableCustomerPwa, moduleList]);

  const channelCards = useMemo(
    () =>
      CHANNEL_CONFIG.map(({ key, defaultLabel }) => {
        const override =
          typeof notifRawOverrides?.[key] === 'boolean'
            ? Boolean(notifRawOverrides[key])
            : undefined;
        const rawEnabled =
          override !== undefined
            ? override
            : key === 'sms'
              ? Boolean(flags?.enableSms)
              : key === 'whatsapp'
                ? Boolean(flags?.enableWhatsapp)
                : key === 'push_mobile'
                  ? Boolean(flags?.enableMobilePush)
                  : key === 'push_web'
                    ? Boolean(flags?.enableWebPush)
                    : Boolean(channels?.[key]);
        return {
          key,
          label: t(`settings.channels.${key}`, defaultLabel),
          enabled: Boolean(channels?.[key]),
          rawEnabled,
        };
      }),
    [channels, flags, notifRawOverrides, t]
  );

  const canPurchaseCredits = useMemo(
    () => Boolean(billingOverview?.can_purchase_credits),
    [billingOverview]
  );
  const creditBalanceValue = useMemo(
    () => billingOverview?.credit_balance ?? balance?.current_balance ?? null,
    [billingOverview, balance]
  );
  const smsAvailable = Boolean(flags?.enableSms);
  const whatsappAvailable = Boolean(flags?.enableWhatsapp);

  const hasCustomerPwa = useMemo(() => {
    if (Array.isArray(moduleList) && moduleList.includes('pwa_client')) {
      return true;
    }

    if (flags?.enableCustomerPwa) {
      return true;
    }

    const modulesFlags = featureFlagsRaw?.modules;
    if (
      modulesFlags &&
      typeof modulesFlags === 'object' &&
      Object.prototype.hasOwnProperty.call(modulesFlags, 'pwa_client_enabled')
    ) {
      return Boolean(modulesFlags.pwa_client_enabled);
    }

    return false;
  }, [moduleList, flags, featureFlagsRaw]);

  const canToggleAutoInvite = hasCustomerPwa;

  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [creditPackages, setCreditPackages] = useState([]);
  const [creditsLoadingAction, setCreditsLoadingAction] = useState(false);
  const [selectedCreditAmount, setSelectedCreditAmount] = useState(null);

  const [notifSaving, setNotifSaving] = useState(false);
  const [autoRenewalSaving, setAutoRenewalSaving] = useState(false);

  const handleAutoRenewalToggle = async () => {
    if (!billingOverview || autoRenewalSaving) return;

    const currentStatus = billingOverview.has_auto_renewal;
    const action = currentStatus ? 'cancel' : 'reactivate';
    setAutoRenewalSaving(true);

    try {
      await billingOverviewApi.updateSubscriptionAction({
        action,
        slug: tenantSlug,
      });
      toast.success(
        t(
          currentStatus
            ? 'settings.auto_renewal.cancelled'
            : 'settings.auto_renewal.reactivated',
          currentStatus
            ? 'Renovação automática cancelada com sucesso.'
            : 'Renovação automática reativada com sucesso.'
        )
      );
      await refreshOverview();
    } catch (error) {
      console.error('Failed to toggle auto renewal:', error);
      toast.error(
        t(
          'settings.auto_renewal.error',
          'Erro ao atualizar renovação automática.'
        )
      );
    } finally {
      setAutoRenewalSaving(false);
    }
  };

  const openCreditsModal = useCallback(async () => {
    setCreditsModalOpen(true);
    try {
      const pkgs = await fetchCreditPackages({ slug: tenant?.slug });
      setCreditPackages(Array.isArray(pkgs) ? pkgs : []);
      if (!selectedCreditAmount && pkgs?.length) {
        const first = pkgs[0];
        const amt = first?.price_eur ?? first?.credits ?? 5;
        setSelectedCreditAmount(Number(amt));
      }
    } catch {
      // silencioso; mantém modal e permite fallback dev
    }
  }, [tenant, selectedCreditAmount]);

  const handleBuyCredits = useCallback(async () => {
    if (!selectedCreditAmount) return;
    setCreditsLoadingAction(true);
    try {
      const payload = await createCreditCheckoutSession(
        Number(selectedCreditAmount),
        { slug: tenant?.slug }
      );
      if (payload?.checkout_url) {
        window.location.href = String(payload.checkout_url);
        return;
      }
    } catch {
      // noop
    } finally {
      setCreditsLoadingAction(false);
    }
  }, [selectedCreditAmount, tenant]);

  const handleToggleChannel = useCallback(
    async (channelKey, nextValue) => {
      if (!tenant) return;
      setNotifSaving(true);
      try {
        const payload = {};
        if (channelKey === 'sms') payload.sms_enabled = nextValue;
        if (channelKey === 'whatsapp') payload.whatsapp_enabled = nextValue;
        if (channelKey === 'push_mobile')
          payload.push_mobile_enabled = nextValue;
        const resp = await updateTenantNotifications(payload, {
          slug: tenant?.slug,
        });
        const nextRaw =
          channelKey === 'sms'
            ? Boolean(resp?.sms_enabled ?? nextValue)
            : channelKey === 'whatsapp'
              ? Boolean(resp?.whatsapp_enabled ?? nextValue)
              : channelKey === 'push_mobile'
                ? Boolean(resp?.push_mobile_enabled ?? nextValue)
                : Boolean(nextValue);
        setNotifRawOverrides((prev) => ({ ...prev, [channelKey]: nextRaw }));
        await refetch();
      } catch {
        // noop
      } finally {
        setNotifSaving(false);
      }
    },
    [tenant, refetch]
  );

  const hasFlagData = useMemo(
    () => flags && typeof flags === 'object' && Object.keys(flags).length > 0,
    [flags]
  );

  const lockedFeatures = useMemo(() => {
    return FEATURE_LIST.filter(({ requiredPlan }) => {
      if (!requiredPlan) {
        return false;
      }

      return comparePlanTiers(requiredPlan, planTier) === -1;
    });
  }, [planTier]);

  const sanitizedProfile = useMemo(() => {
    const defaults = DEFAULT_TENANT_META.profile || {};
    const sanitize = (value, defaultValue) => {
      if (value === undefined || value === null) {
        return '';
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return '';
        if (defaultValue && trimmed === defaultValue) {
          return '';
        }
        return trimmed;
      }
      return value;
    };

    return {
      businessName: sanitize(profile?.businessName, defaults.businessName),
      email: sanitize(profile?.email, defaults.email),
      phone: sanitize(profile?.phone, defaults.phone),
      address: sanitize(profile?.address, defaults.address),
      timezone: sanitize(profile?.timezone, defaults.timezone),
      language: sanitize(profile?.language, defaults.language),
    };
  }, [profile]);

  const lastTenantRefreshRef = useRef(0);
  const refreshInFlightRef = useRef(false);
  const refreshTenantData = useCallback(async () => {
    const now = Date.now();
    if (refreshInFlightRef.current) return false;
    if (now - lastTenantRefreshRef.current < 60_000) return false;
    refreshInFlightRef.current = true;
    try {
      await refetch({ silent: true });
      lastTenantRefreshRef.current = Date.now();
      return true;
    } catch (err) {
      console.warn('[Settings] tenant refetch falhou:', err);
      return false;
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [refetch]);

  useEffect(() => {
    const code = billingOverview?.current_subscription?.plan_code;
    if (code) {
      refreshTenantData();
    }
  }, [billingOverview?.current_subscription?.plan_code, refreshTenantData]);

  useEffect(() => {
    const handleFocus = () => {
      refreshOverview();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshOverview();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshOverview]);

  const handleBrandingSave = useCallback(async () => {
    setBrandingSaving(true);
    setBrandingError(null);
    setBrandingSuccess('');

    try {
      const cp = String(settings.brandingAddress.zip || '').trim();
      if (cp && !/^\d{4}-\d{3}$/.test(cp)) {
        setBrandingSaving(false);
        setBrandingError({ message: 'CP inválido. Use 9999-999.' });
        return;
      }
      await updateTenantBranding({
        logoFile: brandingFile,
        logoUrl: brandingFile ? undefined : settings.branding.logoUrl,
        addressStreet: settings.brandingAddress.street,
        addressNumber: settings.brandingAddress.number,
        addressComplement: settings.brandingAddress.complement,
        addressNeighborhood: settings.brandingAddress.neighborhood,
        addressCity: settings.brandingAddress.city,
        addressState: settings.brandingAddress.state,
        addressZip: settings.brandingAddress.zip,
        addressCountry: settings.brandingAddress.country,
      });

      await refreshTenantData();

      setBrandingSuccess(
        t('settings.branding.saved', 'Branding atualizado com sucesso.')
      );
      setBrandingFile(null);
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('common.save_error', 'Falha ao salvar. Tente novamente.')
      );
      setBrandingError(parsed);
    } finally {
      setBrandingSaving(false);
    }
  }, [
    brandingFile,
    refreshTenantData,
    settings.branding.logoUrl,
    settings.brandingAddress,
    t,
  ]);

  const handleLogoFileChange = (event) => {
    const file = event.target.files?.[0];
    setBrandingFile(file || null);
    if (file) {
      setSettings((prev) => ({
        ...prev,
        branding: { ...prev.branding, logoUrl: '' },
      }));
    }
  };

  const handleAutoInviteToggle = useCallback(async () => {
    if (autoInviteSaving || tenantLoading || !canToggleAutoInvite) {
      return;
    }

    const nextValue = !autoInviteEnabled;
    setAutoInviteEnabled(nextValue);
    setAutoInviteSaving(true);

    try {
      await updateTenantAutoInvite(nextValue);
      await refreshTenantData();
    } catch {
      setAutoInviteEnabled(!nextValue);
    } finally {
      setAutoInviteSaving(false);
    }
  }, [
    autoInviteEnabled,
    autoInviteSaving,
    canToggleAutoInvite,
    refreshTenantData,
    tenantLoading,
  ]);

  const handlePwaClientToggle = useCallback(async () => {
    if (pwaClientSaving || tenantLoading) return;
    const nextValue = !pwaClientEnabled;
    setPwaClientEnabled(nextValue);
    setPwaClientSaving(true);
    setPwaClientError(null);
    setPwaClientSuccess('');
    try {
      const resp = await updateTenantModules({ pwaClientEnabled: nextValue });
      await refreshTenantData();
      const ok = Boolean(resp?.pwa_client_enabled);
      setPwaClientSuccess(
        ok
          ? t('settings.pwa_client.success_enabled', 'PWA Cliente habilitado.')
          : t(
              'settings.pwa_client.success_disabled',
              'PWA Cliente desabilitado.'
            )
      );
    } catch (err) {
      const parsed = parseApiError(
        err,
        t(
          'settings.pwa_client.error',
          'Não foi possível atualizar o PWA Cliente.'
        )
      );
      setPwaClientError(parsed);
      setPwaClientEnabled(!nextValue);
    } finally {
      setPwaClientSaving(false);
    }
  }, [pwaClientEnabled, pwaClientSaving, refreshTenantData, tenantLoading, t]);

  const handleGeneralSave = async () => {
    if (generalSaving) return;
    setGeneralSaving(true);
    setGeneralError(null);
    setGeneralSuccess('');

    try {
      await updateTenantContact({
        email: settings.general.email,
        phone: settings.general.phone,
        phone_number: settings.general.phone,
        businessName: settings.general.businessName,
        address: settings.general.address,
      });

      setGeneralSuccess(t('common.saving_done', 'Salvo com sucesso.'));

      // Atualiza o contexto do tenant se necessário
      // applyTenantBootstrap não é exportado ou acessível aqui diretamente,
      // mas podemos chamar refreshTenantData para recarregar tudo.
      await refreshTenantData();
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('common.save_failed', 'Falha ao salvar.')
      );
      setGeneralError(parsed);
    } finally {
      setGeneralSaving(false);
    }
  };

  const renderPlanSummary = () => (
    <Card className="p-6 bg-brand-surface text-brand-surfaceForeground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-surfaceForeground">
            {t('settings.plan_title', 'Plano atual')}
          </h3>
          <p className="text-sm text-brand-surfaceForeground/80">
            {planName || t('settings.plan_unknown', 'Plano não identificado')}
          </p>
          {billingOverview &&
          typeof billingOverview.has_auto_renewal === 'boolean' ? (
            <p className="mt-1 text-xs text-brand-surfaceForeground/70">
              {t('settings.auto_renewal_status', 'Renovação automática')}:{' '}
              <span
                className={
                  billingOverview.has_auto_renewal
                    ? 'font-medium text-green-600'
                    : 'font-medium text-red-600'
                }
              >
                {billingOverview.has_auto_renewal
                  ? t('common.active', 'Ativa')
                  : t('common.cancelled', 'Cancelada')}
              </span>
            </p>
          ) : null}
          {tenantLoading ? (
            <p className="mt-1 text-xs text-brand-surfaceForeground/60">
              {t('common.loading_data', 'Carregando dados do plano...')}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-6 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-brand-surfaceForeground">
            {t('settings.plan_modules', 'Módulos incluídos')}
          </h4>
          {moduleList.length ? (
            <ul className="mt-2 space-y-1 text-sm text-brand-surfaceForeground/80">
              {moduleList.map((module) => {
                const label = resolveModuleLabel(module, t);
                return <li key={module}>• {label}</li>;
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-brand-surfaceForeground/60">
              {t(
                'settings.plan_modules_empty',
                'Nenhum módulo adicional definido para este plano.'
              )}
            </p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-brand-surfaceForeground">
            {t('settings.locked_features', 'Recursos bloqueados')}
          </h4>
          {hasFlagData ? (
            lockedFeatures.length ? (
              <ul className="mt-2 space-y-2 text-sm text-amber-700">
                {lockedFeatures.map(({ key }) => {
                  const requirement = describeFeatureRequirement(key, planName);
                  const label = requirement.labelKey
                    ? t(requirement.labelKey, key)
                    : key;
                  const description = t(
                    requirement.descriptionKey,
                    requirement.isUnknown
                      ? 'Funcionalidade disponível em planos superiores.'
                      : ''
                  );
                  const planCurrent = t(
                    'settings.features.plan_current_suffix',
                    'Plano atual: {{plan}}.',
                    { plan: requirement.currentPlanName || 'desconhecido' }
                  );

                  return (
                    <li
                      key={key}
                      className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2"
                    >
                      <strong>{label}</strong>
                      {requirement.requiredPlan
                        ? ` — ${t('settings.requires_plan', 'Requer plano')} ${requirement.requiredPlan}.`
                        : ''}{' '}
                      {description} {planCurrent}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-brand-surfaceForeground/60">
                {t(
                  'settings.locked_features_empty',
                  'Nenhum recurso bloqueado para este plano.'
                )}
              </p>
            )
          ) : (
            <p className="mt-2 text-sm text-brand-surfaceForeground/60">
              {t(
                'settings.locked_features_unavailable',
                'Sem dados de recursos do plano no momento. Tente atualizar a página.'
              )}
            </p>
          )}
        </div>
      </div>
    </Card>
  );

  const renderBrandingSettings = () => (
    <div className="space-y-6">
      {/* Campos de cor removidos (FEW-BRAND-01) */}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-brand-surfaceForeground">
          {t('settings.branding.logo_helper', 'Logo')}
        </label>
        {brandingPreview ? (
          <img
            src={brandingPreview}
            alt={t('settings.branding.preview_alt', 'Pré-visualização do logo')}
            className="h-14 w-14 rounded border border-brand-border object-contain"
          />
        ) : (
          <p className="text-sm text-brand-surfaceForeground/60">
            {t('settings.branding.no_logo', 'Nenhum logo definido.')}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="cursor-pointer text-sm text-brand-primary hover:text-brand-primary/80 underline">
            {t('settings.branding.logo_file', 'Arquivo de logo')}
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleLogoFileChange}
              disabled={tenantLoading}
              className="hidden"
            />
          </label>
          <span className="text-xs text-brand-surfaceForeground/60">
            {t('settings.branding.logo_info', 'PNG, JPG ou SVG até 2MB.')}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-brand-surfaceForeground">
          {t('settings.branding_address.title', 'Morada do estabelecimento')}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.street', 'Rua')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.street}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    street: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.number', 'Número')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.number}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    number: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.complement', 'Complemento')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.complement}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    complement: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.neighborhood', 'Freguesia')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.neighborhood}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    neighborhood: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.zip', 'CP (Código Postal)')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.zip}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    zip: formatPostalCodePT(e.target.value),
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.state', 'Distrito')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.state}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    state: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.city', 'Localidade')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.city}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    city: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.country', 'País')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.country}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    country: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      {brandingError ? (
        <p className="text-sm text-red-600">{brandingError.message}</p>
      ) : null}
      {brandingSuccess ? (
        <p className="text-sm text-emerald-600">{brandingSuccess}</p>
      ) : null}

      <button
        onClick={handleBrandingSave}
        className="w-full text-center text-brand-primary hover:text-brand-primary/80 underline text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={tenantLoading || brandingSaving}
      >
        {brandingSaving
          ? t('common.saving', 'Salvando...')
          : t('settings.save')}
      </button>
    </div>
  );

  const renderGeneralSettings = () => {
    const cardItems = [];

    cardItems.push({
      key: 'tenantName',
      label: t('settings.general.tenant_name', 'Nome do salão'),
      value: tenant?.name,
    });

    cardItems.push({
      key: 'tenantSlug',
      label: t('settings.general.slug', 'Slug'),
      value: tenant?.slug,
    });

    if (
      sanitizedProfile.businessName &&
      sanitizedProfile.businessName.toLowerCase() !==
        (tenant?.name || '').toLowerCase()
    ) {
      cardItems.push({
        key: 'businessName',
        label: t('settings.general.business_name', 'Nome comercial'),
        value: sanitizedProfile.businessName,
      });
    }

    if (sanitizedProfile.email) {
      cardItems.push({
        key: 'email',
        label: t('settings.general.email', 'Email de contato'),
        value: sanitizedProfile.email,
      });
    }

    if (sanitizedProfile.phone) {
      cardItems.push({
        key: 'phone',
        label: t('settings.general.phone', 'Telefone'),
        value: sanitizedProfile.phone,
      });
    }

    const timezoneValue = tenant?.timezone || sanitizedProfile.timezone;
    if (timezoneValue) {
      cardItems.push({
        key: 'timezone',
        label: t('settings.general.timezone', 'Fuso horário'),
        value: timezoneValue,
      });
    }

    if (sanitizedProfile.language) {
      cardItems.push({
        key: 'language',
        label: t('settings.general.language', 'Idioma'),
        value: sanitizedProfile.language.toUpperCase(),
      });
    }

    if (tenant?.currency) {
      cardItems.push({
        key: 'currency',
        label: t('settings.general.currency', 'Moeda padrão'),
        value: tenant.currency.toUpperCase(),
      });
    }

    return (
      <div className="space-y-6">
        <Card className="p-6 bg-brand-surface text-brand-surfaceForeground">
          <h3 className="mb-4 text-lg font-semibold text-brand-surfaceForeground">
            {t('settings.general.info_title', 'Informações Gerais')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {cardItems.map((item) =>
              renderInfoCard(item.label, formatValue(item.value), item.key)
            )}
          </div>
        </Card>

        <PlanGate featureKey="enableCustomerPwa">
          <Card className="p-6 bg-brand-surface text-brand-surfaceForeground">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-brand-surfaceForeground">
                  {t('settings.pwa_client.title', 'PWA Cliente')}
                </h3>
                <p className="text-sm text-brand-surfaceForeground/80">
                  {t(
                    'settings.pwa_client.description',
                    'Ative o PWA para permitir que seus clientes agendem pelo app.'
                  )}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      autoInviteEnabled
                        ? 'text-emerald-600'
                        : 'text-brand-surfaceForeground/60'
                    }`}
                  >
                    {t(
                      'settings.pwa_client.auto_invite_label',
                      'Convites automáticos:'
                    )}{' '}
                    {autoInviteEnabled
                      ? t('settings.pwa_client.status_enabled', 'Ativo')
                      : t('settings.pwa_client.status_disabled', 'Inativo')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoInviteEnabled}
                    aria-label={t(
                      'settings.pwa_client.auto_invite_toggle_label',
                      'Alternar convites automáticos'
                    )}
                    onClick={handleAutoInviteToggle}
                    disabled={autoInviteSaving}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      autoInviteEnabled ? 'bg-brand-primary' : 'bg-gray-300'
                    } ${autoInviteSaving ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoInviteEnabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  title={
                    pwaClientEnabled
                      ? t('settings.pwa_client.status_enabled', 'Ativo')
                      : t('settings.pwa_client.status_disabled', 'Inativo')
                  }
                  className={`text-sm font-medium ${
                    pwaClientEnabled
                      ? 'text-emerald-600'
                      : 'text-brand-surfaceForeground/60'
                  }`}
                >
                  {pwaClientEnabled
                    ? t('settings.pwa_client.status_enabled', 'Ativo')
                    : t('settings.pwa_client.status_disabled', 'Inativo')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pwaClientEnabled}
                  aria-label={t(
                    'settings.pwa_client.accessible_label',
                    'Alternar PWA Cliente'
                  )}
                  onClick={handlePwaClientToggle}
                  disabled={pwaClientSaving || tenantLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pwaClientEnabled ? 'bg-brand-primary' : 'bg-gray-300'
                  } ${pwaClientSaving || tenantLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      pwaClientEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            {pwaClientError && (
              <p className="mt-2 text-sm text-red-600">
                {pwaClientError.message}
              </p>
            )}
            {pwaClientSuccess && (
              <p className="mt-2 text-sm text-emerald-600">
                {pwaClientSuccess}
              </p>
            )}
          </Card>
        </PlanGate>

        <Card className="p-6 bg-brand-surface text-brand-surfaceForeground">
          <h3 className="mb-4 text-lg font-semibold text-brand-surfaceForeground">
            {t('settings.general.edit_title', 'Editar Informações')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label={t('settings.general.edit_business_name', 'Nome Comercial')}
              value={settings.general.businessName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: {
                    ...settings.general,
                    businessName: e.target.value,
                  },
                })
              }
            />
            <FormInput
              label={t('settings.general.edit_email', 'Email de Contato')}
              type="email"
              value={settings.general.email}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, email: e.target.value },
                })
              }
            />
            <FormInput
              label={t('settings.general.edit_phone', 'Telefone')}
              type="tel"
              value={settings.general.phone}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, phone: e.target.value },
                })
              }
            />
          </div>
          {generalError && (
            <p className="mt-4 text-sm text-red-600">{generalError.message}</p>
          )}
          {generalSuccess && (
            <p className="mt-4 text-sm text-emerald-600">{generalSuccess}</p>
          )}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleGeneralSave}
              disabled={generalSaving}
              className="rounded-lg bg-brand-primary px-4 py-2 text-white hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {generalSaving
                ? t('common.saving', 'Salvando...')
                : t('common.save_changes', 'Salvar Alterações')}
            </button>
          </div>
        </Card>
      </div>
    );
  };

  const renderNotificationSettings = () => (
    <>
      <div className="space-y-4">
        {tenantLoading ? (
          <p className="text-sm text-brand-surfaceForeground/60">
            {t('common.loading_data', 'Carregando dados...')}
          </p>
        ) : null}

        {/* Renovação Automática */}
        <Card className="rounded-lg border border-brand-border bg-brand-surface/70 px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-surfaceForeground">
                {t('settings.auto_renewal.title', 'Renovação Automática')}
              </p>
              <p className="mt-1 text-sm text-brand-surfaceForeground/80">
                {t(
                  'settings.auto_renewal.description',
                  'Gerencie a renovação automática do seu plano de assinatura.'
                )}
              </p>
              {autoRenewalSaving ? (
                <p className="mt-2 text-xs text-brand-surfaceForeground/60">
                  {t('common.saving', 'Salvando...')}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${
                  billingOverview?.has_auto_renewal
                    ? 'text-emerald-600'
                    : 'text-brand-surfaceForeground/60'
                }`}
              >
                {billingOverview?.has_auto_renewal
                  ? t('common.active', 'Ativa')
                  : t('common.inactive', 'Inativa')}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={billingOverview?.has_auto_renewal}
                onClick={handleAutoRenewalToggle}
                disabled={autoRenewalSaving || !billingOverview}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  billingOverview?.has_auto_renewal
                    ? 'bg-brand-primary'
                    : 'bg-gray-300'
                } ${
                  autoRenewalSaving || !billingOverview
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    billingOverview?.has_auto_renewal
                      ? 'translate-x-5'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {channelCards.map(({ key, label, enabled, rawEnabled }) => (
            <div
              key={key}
              title={
                enabled
                  ? t(
                      'settings.tooltip.channel_enabled',
                      'Canal ativo para o salão'
                    )
                  : t(
                      'settings.tooltip.channel_disabled',
                      'Canal indisponível: requer créditos ou plano compatível'
                    )
              }
              className="rounded-lg border border-brand-border bg-brand-surface/70 px-4 py-3"
            >
              <p
                title={String(label)}
                className="text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/60"
              >
                {label}
              </p>
              <p
                title={
                  rawEnabled
                    ? t('settings.channel_enabled', 'Ativo')
                    : t('settings.channel_disabled', 'Inativo')
                }
                className="mt-1 text-sm text-brand-surfaceForeground"
              >
                {rawEnabled
                  ? t('settings.channel_enabled', 'Ativo')
                  : t('settings.channel_disabled', 'Inativo')}
              </p>
              {['sms', 'whatsapp', 'push_mobile'].includes(key) ? (
                <div className="mt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rawEnabled}
                    aria-label={String(label)}
                    onClick={() => handleToggleChannel(key, !rawEnabled)}
                    disabled={
                      notifSaving ||
                      (key === 'push_mobile' && planTier !== 'enterprise')
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      rawEnabled ? 'bg-brand-primary' : 'bg-gray-300'
                    } ${
                      notifSaving ||
                      (key === 'push_mobile' && planTier !== 'enterprise')
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        rawEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  {key === 'push_mobile' && planTier !== 'enterprise' ? (
                    <span className="text-xs text-brand-surfaceForeground/60">
                      {t(
                        'settings.notifications.enterprise_only',
                        'Disponível somente no plano Enterprise'
                      )}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {!smsAvailable || !whatsappAvailable ? (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-brand-border bg-brand-light px-4 py-3 text-brand-surfaceForeground">
            <p className="text-sm">
              {t(
                'settings.notifications_paywall_hint',
                'Canais avançados disponíveis com créditos.'
              )}
            </p>
            <FeatureGate
              featureKey="enableSms"
              fallback={
                canPurchaseCredits ? (
                  <button
                    type="button"
                    title={t(
                      'settings.tooltip.add_credits',
                      'Comprar créditos para liberar canais avançados'
                    )}
                    className="rounded-md border border-brand-border px-3 py-1 text-xs font-medium"
                    onClick={openCreditsModal}
                  >
                    {t('settings.add_credits', 'Adicionar créditos')}
                  </button>
                ) : null
              }
            >
              {creditBalanceValue ? (
                <span className="text-xs">
                  {t('settings.credits_available', 'Créditos disponíveis')}{' '}
                  {String(creditBalanceValue)}
                </span>
              ) : null}
            </FeatureGate>
          </div>
        ) : null}
      </div>
      {creditsModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 p-4">
          <div className="w-full max-w-md rounded-md border theme-border theme-shadow theme-bg-primary p-4 theme-text-primary">
            <h3 className="mb-2 text-sm font-semibold">
              {t('settings.add_credits', 'Adicionar créditos')}
            </h3>
            <p className="mb-3 text-xs theme-text-secondary">
              {t(
                'settings.credits.description',
                'Selecione um valor para comprar. Pagamento via Stripe (checkout).'
              )}
            </p>
            <div className="mb-3">
              <select
                className="input w-full p-2 text-sm"
                value={String(selectedCreditAmount || '')}
                onChange={(e) =>
                  setSelectedCreditAmount(Number(e.target.value))
                }
              >
                {(creditPackages?.length
                  ? creditPackages
                  : [
                      { price_eur: 5 },
                      { price_eur: 10 },
                      { price_eur: 25 },
                      { price_eur: 50 },
                      { price_eur: 100 },
                    ]
                ).map((pkg) => (
                  <option
                    key={String(pkg.price_eur ?? pkg.credits)}
                    value={String(pkg.price_eur ?? pkg.credits)}
                  >
                    € {String(pkg.price_eur ?? pkg.credits)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="text-brand-primary hover:text-brand-primary/80 font-medium text-xs"
                onClick={() => setCreditsModalOpen(false)}
              >
                {t('common.cancel', 'Cancelar')}
              </button>
              <button
                type="button"
                className="text-brand-primary hover:text-brand-primary/80 font-medium text-xs"
                disabled={creditsLoadingAction}
                onClick={handleBuyCredits}
              >
                {creditsLoadingAction
                  ? t('common.processing', 'Processando...')
                  : t('settings.credits.buy', 'Comprar')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  const renderBusinessSettings = () => (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-brand-surfaceForeground">
        {t('settings.tabs.business', 'Negócio')}
      </h3>
      <p className="text-sm text-brand-surfaceForeground/80">
        {t(
          'settings.business.placeholder',
          'Gestão de operação (horários, duração de atendimentos, buffers) será conectada ao backend nas tarefas FEW-241a/242.'
        )}
      </p>
      <p className="text-xs text-brand-surfaceForeground/60">
        {t(
          'settings.business_readonly_hint',
          'Enquanto isso, utilize o console Ops para ajustes ou contacte o suporte.'
        )}
      </p>
    </div>
  );

  const DataSettingsOld = () => {
    const [entity, setEntity] = useState('customers');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const previewTableRef = useRef(null);

    const parseCsvPreview = async (f) => {
      try {
        const text = await f.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
        const rows = lines.slice(0, 11).map((line) => line.split(','));
        setPreview(rows);
      } catch {
        setPreview([]);
      }
    };

    const onFileChange = async (e) => {
      const f = e.target.files?.[0] || null;
      setFile(f);
      setResult(null);
      setError(null);
      if (f) await parseCsvPreview(f);
    };

    const doUpload = async (dryRun) => {
      if (!file) return;
      setLoading(true);
      setError(null);
      setResult(null);
      const form = new FormData();
      form.append('file', file);
      const params = { dry_run: dryRun ? 'true' : 'false' };
      try {
        const headers = { 'Content-Type': 'multipart/form-data' };
        if (tenant?.slug) headers['X-Tenant-Slug'] = tenant.slug;
        const response = await client.post(`import/${entity}/`, form, {
          headers,
          params,
        });
        setResult(response?.data || null);
      } catch (e) {
        const status = e?.response?.status;
        const message =
          status === 403
            ? t(
                'reports.access_denied.description',
                'Apenas proprietários têm acesso aos relatórios do negócio.'
              )
            : t('common.save_error', 'Falha ao salvar. Tente novamente.');
        setError({
          message,
          status,
          requestId: e?.response?.headers?.['x-request-id'] || null,
        });
      } finally {
        setLoading(false);
      }
    };

    const downloadTemplate = async () => {
      setError(null);
      try {
        const headers = {};
        if (tenant?.slug) headers['X-Tenant-Slug'] = tenant.slug;
        const response = await client.get(`import/templates/${entity}.csv`, {
          headers,
          responseType: 'blob',
        });
        const blob = response?.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entity}_template.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        setError({
          message: t('common.save_error', 'Falha ao salvar. Tente novamente.'),
          status: e?.response?.status,
        });
      }
    };

    return (
      <div className="space-y-4">
        <h3 className="text-base font-medium text-brand-surfaceForeground">
          {t('settings.data.title', 'Importação (CSV)')}
        </h3>
        <p className="text-sm text-brand-surfaceForeground/70">
          {t(
            'settings.data.description',
            'Importe clientes, serviços ou membros da equipe via arquivo CSV.'
          )}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-brand-surfaceForeground/70">
              {t('settings.data.entity', 'Tipo de dados')}
            </label>
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-2 text-sm text-brand-surfaceForeground"
            >
              <option value="customers">
                {t('settings.data.entity_customers', 'Clientes')}
              </option>
              <option value="services">
                {t('settings.data.entity_services', 'Serviços')}
              </option>
              <option value="staff">
                {t('settings.data.entity_staff', 'Equipe')}
              </option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-brand-surfaceForeground/70">
              {t('settings.data.file', 'Arquivo CSV')}
            </label>
            <input
              onChange={onFileChange}
              aria-label={t('settings.data.file', 'Arquivo CSV')}
              type="file"
              accept=".csv"
              className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-2 text-sm text-brand-surfaceForeground"
            />
            {file ? (
              <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            ) : null}
          </div>
        </div>
        {preview.length ? (
          <div className="overflow-auto rounded border border-brand-border">
            <table
              ref={previewTableRef}
              tabIndex={-1}
              aria-label={t(
                'settings.data.preview_aria',
                'Pré-visualização do CSV'
              )}
              className="min-w-full text-left text-sm"
            >
              <thead className="bg-brand-light">
                <tr>
                  {preview[0].map((h, i) => (
                    <th
                      key={`h-${i}`}
                      scope="col"
                      className="px-3 py-2 text-xs font-semibold text-brand-surfaceForeground/70"
                    >
                      {String(h || '').trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, ri) => (
                  <tr key={`r-${ri}`} className="odd:bg-brand-surface/50">
                    {row.map((cell, ci) => (
                      <td
                        key={`c-${ri}-${ci}`}
                        className="px-3 py-2 text-brand-surfaceForeground/80"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => doUpload(true)}
            disabled={!file || loading}
            title={t(
              'settings.data.actions.dry_run_tooltip',
              'Valida o CSV sem importar. Mostra erros e contagens.'
            )}
            className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground"
          >
            {loading
              ? t('common.loading', 'Enviando...')
              : t('settings.data.actions.dry_run', 'Validar (dry-run)')}
          </button>
          <button
            type="button"
            onClick={() => doUpload(false)}
            disabled={!file || loading}
            className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground"
          >
            {t('settings.data.actions.import', 'Importar')}
          </button>
          <button
            type="button"
            onClick={downloadTemplate}
            disabled={loading}
            className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground"
          >
            {t('settings.data.actions.download_template', 'Baixar modelo')}
          </button>
        </div>
        {error ? (
          <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error.message ||
              t('common.save_error', 'Falha ao salvar. Tente novamente.')}
          </div>
        ) : null}
        {result ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-brand-surfaceForeground">
              {t(
                'settings.data.result.title',
                'Resultado da validação/importação'
              )}
            </h4>
            <div className="flex flex-wrap gap-3 text-sm">
              {'created_count' in result ? (
                <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                  {t('settings.data.result.created', 'Criados')}:{' '}
                  {result.created_count}
                </span>
              ) : null}
              {'updated_count' in result ? (
                <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                  {t('settings.data.result.updated', 'Atualizados')}:{' '}
                  {result.updated_count}
                </span>
              ) : null}
              {Array.isArray(result.errors) ? (
                <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                  {t('settings.data.result.errors_count', 'Erros')}:{' '}
                  {result.errors.length}
                </span>
              ) : null}
              {result.request_id ? (
                <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                  {t('settings.data.result.request_id', 'ID da requisição')}:{' '}
                  {result.request_id}
                </span>
              ) : null}
            </div>
            {Array.isArray(result.errors) && result.errors.length ? (
              <div className="rounded border border-brand-border bg-brand-surface px-3 py-2">
                <p className="text-xs font-medium text-brand-surfaceForeground/70">
                  {t('settings.data.result.errors_title', 'Erros encontrados')}
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {result.errors.slice(0, 50).map((err, idx) => (
                    <li
                      key={`err-${idx}`}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-red-800"
                    >
                      {typeof err === 'string' ? err : JSON.stringify(err)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-brand-surfaceForeground/60">
                {t('settings.data.result.no_errors', 'Nenhum erro encontrado')}
              </p>
            )}
          </div>
        ) : null}
        <p className="text-xs text-brand-surfaceForeground/60">
          {t('settings.data.hint', 'Disponível apenas para owner.')}
        </p>
      </div>
    );
  };

  const DataSettings = () => {
    const [entity, setEntity] = useState('customers');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [dryRunTooltipOpen, setDryRunTooltipOpen] = useState(false);
    const fileInputRef = useRef(null);
    useEffect(() => {
      console.log('DataSettings:mounted');
    }, []);

    const parseCsvPreview = async (f) => {
      try {
        console.log('parseCsvPreview:file', f?.name, f?.size, f?.type);
        const text = await f.text();
        console.log('parseCsvPreview:text_length', text?.length || 0);
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
        console.log('parseCsvPreview:lines_count', lines.length);
        const rows = lines.slice(0, 11).map((line) => line.split(','));
        console.log('parseCsvPreview:header', rows[0]);
        console.log('parseCsvPreview:rows_preview_count', rows.length);
        setPreview(rows);
      } catch (e) {
        console.error('parseCsvPreview:error', e);
        setPreview([]);
      }
    };

    const onFileChange = async (e) => {
      try {
        console.log('onFileChange:event_value', e?.target?.value);
        console.log('onFileChange:files_list', e?.target?.files);
        const f = e.target.files?.[0] || null;
        console.log(
          'onFileChange:selected_file',
          f ? { name: f.name, size: f.size, type: f.type } : null
        );
        setFile(f);
        setResult(null);
        setError(null);
        if (f) await parseCsvPreview(f);
      } catch (err) {
        console.error('onFileChange:error', err);
      }
    };

    useEffect(() => {
      console.log(
        'DataSettings:file_state_changed',
        file ? { name: file.name, size: file.size, type: file.type } : null
      );
    }, [file]);

    const doUpload = async (dryRun) => {
      if (!file) return;
      setLoading(true);
      setError(null);
      setResult(null);
      const form = new FormData();
      form.append('file', file);
      const params = { dry_run: dryRun ? 'true' : 'false' };
      try {
        const headers = { 'Content-Type': 'multipart/form-data' };
        if (tenant?.slug) headers['X-Tenant-Slug'] = tenant.slug;
        const response = await client.post(`import/${entity}/`, form, {
          headers,
          params,
        });
        setResult(response?.data || null);
      } catch (e) {
        const status = e?.response?.status;
        const message =
          status === 403
            ? t(
                'reports.access_denied.description',
                'Apenas proprietários têm acesso aos relatórios do negócio.'
              )
            : t('common.save_error', 'Falha ao salvar. Tente novamente.');
        setError({
          message,
          status,
          requestId: e?.response?.headers?.['x-request-id'] || null,
        });
      } finally {
        setLoading(false);
      }
    };

    const downloadTemplate = async () => {
      setError(null);
      try {
        const headers = {};
        if (tenant?.slug) headers['X-Tenant-Slug'] = tenant.slug;
        const response = await client.get(`import/templates/${entity}.csv`, {
          headers,
          responseType: 'blob',
        });
        const blob = response?.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entity}_template.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        setError({
          message: t('common.save_error', 'Falha ao salvar. Tente novamente.'),
          status: e?.response?.status,
        });
      }
    };

    return (
      <div className="space-y-4">
        <h3 className="text-base font-medium text-brand-surfaceForeground">
          {t('settings.data.title', 'Importação (CSV)')}
        </h3>
        <p className="text-sm text-brand-surfaceForeground/70">
          {t(
            'settings.data.description',
            'Importe clientes, serviços ou membros da equipe via arquivo CSV.'
          )}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-brand-surfaceForeground/70">
              {t('settings.data.entity', 'Tipo de dados')}
            </label>
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-2 text-sm text-brand-surfaceForeground"
            >
              <option value="customers">
                {t('settings.data.entity_customers', 'Clientes')}
              </option>
              <option value="services">
                {t('settings.data.entity_services', 'Serviços')}
              </option>
              <option value="staff">
                {t('settings.data.entity_staff', 'Equipe')}
              </option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-brand-surfaceForeground/70">
              {t('settings.data.file', 'Arquivo CSV')}
            </label>
            <input
              ref={fileInputRef}
              onChange={onFileChange}
              onClick={() => {
                console.log('fileInput:click');
                setTimeout(() => {
                  const f = fileInputRef.current?.files?.[0] || null;
                  console.log(
                    'fileInput:poll_500ms',
                    f ? { name: f.name, size: f.size, type: f.type } : null
                  );
                }, 500);
                setTimeout(() => {
                  const f = fileInputRef.current?.files?.[0] || null;
                  console.log(
                    'fileInput:poll_1500ms',
                    f ? { name: f.name, size: f.size, type: f.type } : null
                  );
                }, 1500);
              }}
              onInput={(e) => console.log('fileInput:input', e?.target?.value)}
              onChangeCapture={(e) =>
                console.log('fileInput:changeCapture', e?.target?.files)
              }
              type="file"
              id="csvInput"
              name="csvInput"
              accept="text/csv,.csv"
              className="mt-1 w-full rounded border border-brand-border bg-brand-surface px-2 py-2 text-sm text-brand-surfaceForeground"
            />
          </div>
        </div>
        {preview.length ? (
          <div className="overflow-auto rounded border border-brand-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-brand-light">
                <tr>
                  {preview[0].map((h, i) => (
                    <th
                      key={`h-${i}`}
                      className="px-3 py-2 text-xs font-semibold text-brand-surfaceForeground/70"
                    >
                      {String(h || '').trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, ri) => (
                  <tr key={`r-${ri}`} className="odd:bg-brand-surface/50">
                    {row.map((cell, ci) => (
                      <td
                        key={`c-${ri}-${ci}`}
                        className="px-3 py-2 text-brand-surfaceForeground/80"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <div
            className="relative inline-block"
            onMouseEnter={() => setDryRunTooltipOpen(true)}
            onMouseLeave={() => setDryRunTooltipOpen(false)}
          >
            <button
              type="button"
              onClick={() => doUpload(true)}
              disabled={!file || loading}
              className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground"
              aria-describedby="dry-run-tooltip"
            >
              {loading
                ? t('common.loading', 'Enviando...')
                : t('settings.data.actions.dry_run', 'Validar (dry-run)')}
            </button>
            {dryRunTooltipOpen ? (
              <div
                id="dry-run-tooltip"
                role="tooltip"
                className="absolute z-20 mt-2 w-64 max-w-xs rounded-lg p-3 text-left text-xs shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                  border: '1px solid',
                }}
              >
                {t(
                  'settings.data.actions.dry_run_tooltip',
                  'Valida o CSV sem importar. Mostra erros e contagens.'
                )}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => doUpload(false)}
            disabled={!file || loading}
            className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground"
          >
            {t('settings.data.actions.import', 'Importar')}
          </button>
          <button
            type="button"
            onClick={downloadTemplate}
            disabled={loading}
            className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground"
          >
            {t('settings.data.actions.download_template', 'Baixar modelo')}
          </button>
        </div>
        {error ? (
          <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error.message ||
              t('common.save_error', 'Falha ao salvar. Tente novamente.')}
          </div>
        ) : null}
        {result ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-brand-surfaceForeground">
              {t(
                'settings.data.result.title',
                'Resultado da validação/importação'
              )}
            </h4>
            <div className="flex flex-wrap gap-3 text-sm">
              {'created_count' in result ? (
                <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                  {t('settings.data.result.created', 'Criados')}:{' '}
                  {result.created_count}
                </span>
              ) : null}
              {'updated_count' in result ? (
                <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                  {t('settings.data.result.updated', 'Atualizados')}:{' '}
                  {result.updated_count}
                </span>
              ) : null}
              {Array.isArray(result.errors) ? (
                <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                  {t('settings.data.result.errors_count', 'Erros')}:{' '}
                  {result.errors.length}
                </span>
              ) : null}
              {result.request_id ? (
                <span className="rounded border border-brand-border bg-brand-light px-2 py-1">
                  {t('settings.data.result.request_id', 'ID da requisição')}:{' '}
                  {result.request_id}
                </span>
              ) : null}
            </div>
            {Array.isArray(result.errors) && result.errors.length ? (
              <div className="rounded border border-brand-border bg-brand-surface px-3 py-2">
                <p className="text-xs font-medium text-brand-surfaceForeground/70">
                  {t('settings.data.result.errors_title', 'Erros encontrados')}
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {result.errors.slice(0, 50).map((err, idx) => (
                    <li
                      key={`err-${idx}`}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-red-800"
                    >
                      {typeof err === 'string' ? err : JSON.stringify(err)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-brand-surfaceForeground/60">
                {t('settings.data.result.no_errors', 'Nenhum erro encontrado')}
              </p>
            )}
          </div>
        ) : null}
        <p className="text-xs text-brand-surfaceForeground/60">
          {t('settings.data.hint', 'Disponível apenas para owner.')}
        </p>
      </div>
    );
  };

  return (
    <FullPageLayout>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')}>
        {planName ? (
          <span
            title={t('settings.plan_badge', 'Plano') + ': ' + String(planName)}
            className="rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-brand-surfaceForeground"
          >
            {t('settings.plan_badge', 'Plano')}: {planName}
          </span>
        ) : null}
        {/* botão "Gerir plano" removido — usar página de Planos */}
        <span
          role="button"
          onClick={() => {
            if (!creditLoading) {
              refreshCredits();
            }
          }}
          title={
            creditLoading
              ? t('credits.loading', 'Carregando créditos...')
              : t('credits.refresh_hint', 'Clique para atualizar o saldo')
          }
          className="cursor-pointer rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-brand-surfaceForeground"
        >
          {t('credits.label', 'Créditos')}:{' '}
          {creditLoading
            ? t('common.loading', 'Carregando')
            : creditError
              ? t('credits.unavailable', 'Indisponível')
              : (balance?.current_balance ?? '—')}
        </span>
      </PageHeader>

      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {tenantError ? (
          <Card className="border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="text-sm font-medium">
              {tenantError.message ||
                t(
                  'settings.error_loading_tenant',
                  'Não foi possível carregar todas as informações do salão.'
                )}
            </p>
            <p className="mt-1 text-xs">
              {t(
                'settings.error_loading_hint',
                'Tente atualizar a página ou verificar sua conexão. Alguns dados podem estar desatualizados.'
              )}
            </p>
          </Card>
        ) : null}

        {renderPlanSummary()}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {TAB_ITEMS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border border-brand-border bg-brand-light text-brand-surfaceForeground'
                        : 'text-brand-surfaceForeground/70 hover:bg-brand-light hover:text-brand-surfaceForeground'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {t(tab.label)}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="p-4 sm:p-6 bg-brand-surface text-brand-surfaceForeground">
              {activeTab === 'branding' && renderBrandingSettings()}
              {activeTab === 'general' && renderGeneralSettings()}
              {activeTab === 'notifications' && renderNotificationSettings()}
              {activeTab === 'business' && renderBusinessSettings()}
              {activeTab === 'billing' && (
                <RoleProtectedRoute allowedRoles={['owner']}>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-brand-surfaceForeground">
                        {t('settings.billing.title', 'Histórico de Créditos')}
                      </h3>
                      <Link
                        to="/settings/credits"
                        className="text-sm font-semibold text-brand-primary hover:text-brand-primary/80 hover:underline"
                      >
                        {t('settings.add_credits', 'Adicionar créditos')}
                      </Link>
                    </div>
                    <CreditHistoryList />
                  </div>
                </RoleProtectedRoute>
              )}
              {activeTab === 'data' && (
                <RoleProtectedRoute allowedRoles={['owner']}>
                  <DataSettingsStandalone />
                </RoleProtectedRoute>
              )}
            </Card>
          </div>
        </div>
      </div>
    </FullPageLayout>
  );
}

export default Settings;
export { DataSettingsStandalone };
