import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import CreditStatusCard from '../components/dashboard/CreditStatusCard';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { useStaff } from '../hooks/useStaff';
import { DEFAULT_TENANT_META } from '../utils/tenant';
import useDashboardData from '../hooks/useDashboardData';
import { fetchSlotDetail } from '../api/slots';
import { fetchCustomerDetail } from '../api/customers';
import { fetchProfessionals } from '../api/professionals';
import { fetchServices } from '../api/services';
import { parseApiError } from '../utils/apiError';

const MAX_UPCOMING_APPOINTMENTS = 5;
const MAX_CANDIDATE_APPOINTMENTS = 20;
const UPCOMING_WINDOW_MINUTES = 15;
const COMPLETED_STATUSES = new Set(['completed', 'paid']);
const ACTIVE_STATUSES = new Set(['scheduled']);

function parseSlotDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }
  if (typeof raw === 'number') {
    const numericDate = new Date(raw);
    return Number.isNaN(numericDate.getTime()) ? null : numericDate;
  }
  if (typeof raw === 'string') {
    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  try {
    const candidate = new Date(raw);
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  } catch {
    return null;
  }
}

function extractBookingsList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (Array.isArray(payload.results)) return payload.results.filter(Boolean);
  return [];
}

function normalizeAppointmentPreview(base = {}, detail = {}) {
  const source = detail && Object.keys(detail).length ? detail : base;
  const slotInfo =
    (detail && detail.slot) ||
    (typeof base?.slot === 'object' ? base.slot : null) ||
    null;

  const slotStart =
    slotInfo?.start_time || source?.slot_start || source?.start_time || null;
  const slotEnd =
    slotInfo?.end_time || source?.slot_end || source?.end_time || null;

  const startDate = parseSlotDate(slotStart);
  const endDate = parseSlotDate(slotEnd);

  const customer = detail?.customer || source?.customer || null;
  const customerName =
    customer?.name ||
    detail?.client_username ||
    source?.customer_name ||
    source?.client_name ||
    '';

  const professional = detail?.professional || source?.professional || null;
  const professionalName =
    professional?.name || source?.professional_name || '';

  const service = detail?.service || source?.service || null;
  const serviceName = service?.name || source?.service_name || '';

  const status = detail?.status || source?.status || 'scheduled';

  const identifier =
    base?.id ??
    detail?.id ??
    source?.appointment_id ??
    source?.appointmentId ??
    null;

  if (identifier == null || !startDate) {
    return null;
  }

  return {
    id: identifier,
    start: startDate,
    end: endDate,
    customerName,
    professionalName,
    serviceName,
    status,
  };
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenant, profile, flags, slug } = useTenant();
  const { user } = useAuth();
  const { staff } = useStaff({ slug });

  // Determinar papel do usuário atual
  const currentUserRole = useMemo(() => {
    if (!Array.isArray(staff) || !user) {
      return null;
    }

    const email =
      typeof user.email === 'string' ? user.email.toLowerCase() : null;
    const username =
      typeof user.username === 'string' ? user.username.toLowerCase() : null;

    const match = staff.find((member) => {
      const memberEmail =
        typeof member.email === 'string' ? member.email.toLowerCase() : null;
      const memberUsername =
        typeof member.username === 'string'
          ? member.username.toLowerCase()
          : null;

      return (
        (email && memberEmail === email) ||
        (username && memberUsername === username)
      );
    });

    return match?.role || null;
  }, [staff, user]);

  const businessSummary = useMemo(() => {
    const fallbackTitle = t('dashboard.subtitle', 'Resumo do seu negócio');
    const defaultBusinessName = DEFAULT_TENANT_META?.profile?.businessName;

    const sanitizedNames = [
      user?.username,
      profile?.businessName,
      tenant?.name,
      tenant?.branding?.appName,
      slug,
    ]
      .map((name) => (typeof name === 'string' ? name.trim() : ''))
      .filter((name) => Boolean(name));

    const tenantDisplayName =
      sanitizedNames.find((name) => {
        if (!name) return false;
        if (
          defaultBusinessName &&
          name === defaultBusinessName &&
          sanitizedNames.some((candidate) => candidate && candidate !== name)
        ) {
          return false;
        }
        return true;
      }) ||
      sanitizedNames[0] ||
      null;

    if (!tenantDisplayName) {
      return fallbackTitle;
    }

    return `${tenantDisplayName} • ${fallbackTitle}`;
  }, [
    profile?.businessName,
    slug,
    t,
    tenant?.branding?.appName,
    tenant?.name,
    user?.username,
  ]);

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingError, setUpcomingError] = useState(null);

  const reportsEnabled = flags?.enableReports !== false;

  // Verificar se o usuário tem acesso aos relatórios (apenas owner e manager)
  const hasReportsAccess = useMemo(() => {
    if (!currentUserRole) {
      // Fallback para usuários sem staff data (como no tenant 'default')
      if (!user) return false;

      const email =
        typeof user.email === 'string' ? user.email.toLowerCase() : '';
      const username =
        typeof user.username === 'string' ? user.username.toLowerCase() : '';

      // Admin sempre tem acesso
      if (email === 'admin@demo.local' || username === 'admin') {
        return true;
      }

      // Manager tem acesso
      if (username === 'manager' || email.includes('manager')) {
        return true;
      }

      // Pro users (owners) têm acesso
      if (username.startsWith('pro_') || email.startsWith('pro_')) {
        return true;
      }

      // Colaboradores não têm acesso
      return false;
    }

    // Com staff data, verificar role
    return currentUserRole === 'owner' || currentUserRole === 'manager';
  }, [currentUserRole, user]);

  const {
    data: dashboardData,
    loading,
    error,
    reportsForbidden,
    refetch,
  } = useDashboardData({ slug, reportsEnabled });

  const bookingsList = useMemo(
    () => extractBookingsList(dashboardData.bookings),
    [dashboardData.bookings]
  );

  useEffect(() => {
    let isActive = true;

    if (!slug || !bookingsList.length) {
      setUpcomingAppointments([]);
      setUpcomingError(null);
      setUpcomingLoading(false);
      return () => {
        isActive = false;
      };
    }

    const candidates = bookingsList
      .filter((item) => {
        if (item?.id == null) return false;
        const status = String(item?.status || '').toLowerCase();
        return !status || ACTIVE_STATUSES.has(status);
      })
      .slice(0, MAX_CANDIDATE_APPOINTMENTS);

    if (!candidates.length) {
      setUpcomingAppointments([]);
      setUpcomingError(null);
      setUpcomingLoading(false);
      return () => {
        isActive = false;
      };
    }

    setUpcomingLoading(true);
    setUpcomingError(null);

    const loadDetails = async () => {
      try {
        const previews = [];
        const customerCache = new Map();
        let professionals = [];
        let services = [];

        if (slug) {
          try {
            professionals = await fetchProfessionals(slug);
          } catch (professionalsError) {
            console.warn(
              'Failed to load professionals for dashboard',
              professionalsError
            );
          }

          try {
            services = await fetchServices(slug);
          } catch (servicesError) {
            console.warn(
              'Failed to load services for dashboard',
              servicesError
            );
          }
        }

        const professionalMap = new Map(
          Array.isArray(professionals)
            ? professionals.map((item) => [item.id, item])
            : []
        );
        const serviceMap = new Map(
          Array.isArray(services) ? services.map((item) => [item.id, item]) : []
        );

        for (const entry of candidates) {
          if (!isActive) break;
          let slotPayload = typeof entry.slot === 'object' ? entry.slot : null;
          const hasDetailedSlot =
            entry && typeof entry.slot === 'object' && entry.slot;

          if (
            (!slotPayload || !slotPayload?.start_time) &&
            !hasDetailedSlot &&
            entry?.slot
          ) {
            try {
              slotPayload = await fetchSlotDetail(entry.slot, { slug });
            } catch (slotError) {
              console.warn('Failed to fetch slot detail', slotError);
            }
          }

          let customerPayload = null;
          if (entry?.customer && slug) {
            if (customerCache.has(entry.customer)) {
              customerPayload = customerCache.get(entry.customer);
            } else {
              try {
                customerPayload = await fetchCustomerDetail(entry.customer, {
                  slug,
                });
                customerCache.set(entry.customer, customerPayload);
              } catch (customerError) {
                console.warn('Failed to fetch customer detail', customerError);
                customerCache.set(entry.customer, null);
              }
            }
          }

          const professionalPayload =
            professionalMap.get(entry.professional) || null;
          const servicePayload = serviceMap.get(entry.service) || null;

          const detailPayload = {
            status: entry.status,
            slot: slotPayload || null,
            client_username: entry.client_username || entry.client,
            client_email: entry.client_email || '',
            customer: customerPayload
              ? { ...customerPayload, name: customerPayload.name }
              : null,
            professional: professionalPayload
              ? { ...professionalPayload, name: professionalPayload.name }
              : null,
            service: servicePayload
              ? { ...servicePayload, name: servicePayload.name }
              : null,
          };

          const preview = normalizeAppointmentPreview(entry, detailPayload);
          if (preview) {
            previews.push(preview);
          }
        }

        if (!isActive) {
          return;
        }

        previews.sort((a, b) => {
          const timeA = a.start?.getTime?.() ?? 0;
          const timeB = b.start?.getTime?.() ?? 0;
          return timeA - timeB;
        });

        const nowDate = new Date();
        const windowEnd = new Date(
          nowDate.getTime() + UPCOMING_WINDOW_MINUTES * 60 * 1000
        );

        const futureAppointments = previews.filter((appointment) => {
          if (!(appointment.start instanceof Date)) return false;
          const timestamp = appointment.start.getTime();
          if (Number.isNaN(timestamp)) return false;
          return appointment.start >= nowDate;
        });

        const withinWindow = futureAppointments.filter((appointment) => {
          if (!(appointment.start instanceof Date)) return false;
          const timestamp = appointment.start.getTime();
          if (Number.isNaN(timestamp)) return false;
          return appointment.start <= windowEnd;
        });

        const fallback = futureAppointments.length
          ? futureAppointments
          : previews;
        const selected = withinWindow.length ? withinWindow : fallback;

        setUpcomingAppointments(selected.slice(0, MAX_UPCOMING_APPOINTMENTS));
        setUpcomingError(null);
      } catch (loadError) {
        if (!isActive) {
          return;
        }
        setUpcomingAppointments([]);
        setUpcomingError(
          parseApiError(
            loadError,
            t(
              'dashboard.upcoming_error',
              'Não foi possível carregar os próximos agendamentos.'
            )
          )
        );
      } finally {
        if (isActive) {
          setUpcomingLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      isActive = false;
    };
  }, [bookingsList, slug, t]);

  const scheduledBookingsCount = useMemo(
    () =>
      bookingsList.filter((item) =>
        ACTIVE_STATUSES.has(String(item?.status || '').toLowerCase())
      ).length,
    [bookingsList]
  );

  const completedBookingsCount = useMemo(
    () =>
      bookingsList.filter((item) =>
        COMPLETED_STATUSES.has(String(item?.status || '').toLowerCase())
      ).length,
    [bookingsList]
  );

  const locale = profile?.language || undefined;

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale),
    [locale]
  );

  const dateFormatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
      });
    }
  }, [locale]);

  const timeFormatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }, [locale]);

  const formatNumber = useCallback(
    (value) => {
      if (value === null || value === undefined) {
        return null;
      }
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return null;
      }
      return numberFormatter.format(numeric);
    },
    [numberFormatter]
  );

  const overviewDaily = dashboardData.overviewDaily;
  const overviewMonthly = dashboardData.overviewMonthly;
  const customersInfo = dashboardData.customers;

  const bookingsValue = useMemo(() => {
    if (loading) return '—';
    const formatted = formatNumber(scheduledBookingsCount);
    return formatted ?? '—';
  }, [formatNumber, loading, scheduledBookingsCount]);

  const bookingsHint = useMemo(() => {
    if (loading) {
      return t('dashboard.loading', 'Carregando dados...');
    }
    const completed = formatNumber(completedBookingsCount);
    if (completed) {
      return t('dashboard.stats_hint_completed', { count: completed });
    }
    if (reportsForbidden) {
      return t(
        'dashboard.reports_blocked_hint',
        'Disponível em planos com relatórios.'
      );
    }
    if (error) {
      return error.message;
    }
    return t('dashboard.stats_hint_unavailable', 'Dados indisponíveis');
  }, [
    completedBookingsCount,
    error,
    formatNumber,
    loading,
    reportsForbidden,
    t,
  ]);

  const customersValue = useMemo(() => {
    if (loading) return '—';
    const formatted = formatNumber(customersInfo?.count);
    return formatted || '—';
  }, [customersInfo?.count, formatNumber, loading]);

  const customersHint = useMemo(() => {
    if (loading) {
      return t('dashboard.loading', 'Carregando dados...');
    }
    const formatted = formatNumber(customersInfo?.count);
    if (formatted) {
      return t('dashboard.stats_hint_customers', { count: formatted });
    }
    return t(
      'dashboard.customers_no_data',
      'Ainda não há clientes cadastrados.'
    );
  }, [customersInfo?.count, formatNumber, loading, t]);

  const occupancyRate =
    typeof overviewDaily?.occupancy_rate === 'number'
      ? overviewDaily.occupancy_rate
      : typeof overviewMonthly?.occupancy_rate === 'number'
        ? overviewMonthly.occupancy_rate
        : null;

  const showOccupancyCard =
    !loading &&
    typeof occupancyRate === 'number' &&
    Number.isFinite(occupancyRate);

  const occupancyValue = useMemo(() => {
    if (!showOccupancyCard) return null;
    const percentage = Math.round(occupancyRate * 100);
    return `${percentage}%`;
  }, [occupancyRate, showOccupancyCard]);

  const occupancyHint = useMemo(() => {
    if (!showOccupancyCard) {
      return null;
    }
    if (loading) {
      return t('dashboard.loading', 'Carregando dados...');
    }
    return t('dashboard.stats_hint_unavailable', 'Dados indisponíveis');
  }, [loading, showOccupancyCard, t]);

  const formatAppointmentTime = useCallback(
    (startDate, endDate) => {
      if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
        return '—';
      }
      const endValid =
        endDate instanceof Date && !Number.isNaN(endDate.getTime())
          ? endDate
          : null;
      try {
        const datePart = dateFormatter.format(startDate);
        const startPart = timeFormatter.format(startDate);
        const endPart = endValid ? timeFormatter.format(endValid) : null;
        return endPart
          ? `${datePart} • ${startPart} – ${endPart}`
          : `${datePart} • ${startPart}`;
      } catch {
        const base = startDate.toISOString?.() || String(startDate);
        const fallback =
          endValid?.toISOString?.() || (endValid ? String(endValid) : null);
        return fallback ? `${base} – ${fallback}` : base;
      }
    },
    [dateFormatter, timeFormatter]
  );

  const upcomingList = useMemo(
    () =>
      upcomingAppointments.map((appointment) => ({
        ...appointment,
        timeLabel: formatAppointmentTime(appointment.start, appointment.end),
      })),
    [formatAppointmentTime, upcomingAppointments]
  );

  return (
    <FullPageLayout>
      <PageHeader
        title={t('dashboard.title', 'Dashboard')}
        subtitle={businessSummary}
      ></PageHeader>

      {error || reportsForbidden ? (
        <Card className="mb-4 border border-warning bg-warning/10 p-4 text-warning">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              {reportsForbidden
                ? t(
                    'dashboard.reports_blocked_hint',
                    'Disponível em planos com relatórios.'
                  )
                : error?.message}
            </p>
            {!reportsForbidden ? (
              <button
                type="button"
                onClick={refetch}
                className="self-start rounded-md border border-warning px-3 py-1 text-xs font-medium text-warning transition hover:bg-warning/20"
              >
                {t('dashboard.retry', 'Tentar novamente')}
              </button>
            ) : null}
          </div>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CreditStatusCard />
        <StatCard
          label={t('dashboard.stats.bookings', 'Agendamentos (hoje)')}
          value={bookingsValue}
          hint={bookingsHint}
        />
        <StatCard
          label={t('dashboard.stats.clients', 'Clientes')}
          value={customersValue}
          hint={customersHint}
        />
        {showOccupancyCard && occupancyValue !== null ? (
          <StatCard
            label={t('dashboard.stats.util', 'Ocupação')}
            value={occupancyValue}
            hint={occupancyHint}
          />
        ) : null}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6 text-brand-surfaceForeground">
          <h2 className="text-lg font-medium text-brand-surfaceForeground">
            {t('dashboard.upcoming', 'Próximos agendamentos')}
          </h2>
          <div className="mt-4">
            {upcomingLoading ? (
              <p className="text-sm text-brand-surfaceForeground/70">
                {t('dashboard.loading', 'Carregando dados...')}
              </p>
            ) : upcomingList.length ? (
              <ul className="divide-y divide-brand-border/60">
                {upcomingList.map((appointment) => (
                  <li key={appointment.id} className="py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2 text-sm font-medium">
                        <span>{appointment.timeLabel}</span>
                        <span className="rounded-full border border-brand-border px-2 py-0.5 text-xs font-medium text-brand-surfaceForeground/80">
                          {t(
                            `bookings.statuses.${appointment.status}`,
                            appointment.status
                          )}
                        </span>
                      </div>
                      <div className="text-sm text-brand-surfaceForeground">
                        {[
                          appointment.customerName ||
                            t('bookings.client_placeholder', 'Cliente'),
                          appointment.professionalName,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                      {appointment.serviceName ? (
                        <div className="text-xs text-brand-surfaceForeground/70">
                          {appointment.serviceName}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title={t(
                  'dashboard.no_upcoming',
                  'Sem agendamentos nas próximas horas'
                )}
                description={
                  upcomingError?.message ||
                  t(
                    'dashboard.create_first',
                    'Crie um novo agendamento ou abra horários disponíveis.'
                  )
                }
                action={
                  <Link
                    to="/bookings"
                    className="text-brand-primary hover:text-brand-accent underline font-medium transition"
                  >
                    {t('dashboard.new_booking', 'Novo agendamento')}
                  </Link>
                }
              />
            )}
          </div>
        </Card>

        <Card className="p-6 text-brand-surfaceForeground">
          <h2 className="text-lg font-medium text-brand-surfaceForeground">
            {t('dashboard.quick_actions', 'Ações rápidas')}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/slots')}
              className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground transition hover:bg-brand-light/80"
            >
              {t('dashboard.add_slot', 'Abrir horários')}
            </button>
            {hasReportsAccess && (
              <button
                type="button"
                onClick={() => navigate('/team')}
                className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground transition hover:bg-brand-light/80"
              >
                {t('dashboard.add_professional', 'Adicionar profissional')}
              </button>
            )}
            {(currentUserRole === 'owner' || currentUserRole === 'manager') && (
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm text-brand-surfaceForeground transition hover:bg-brand-light/80"
              >
                {t('dashboard.add_service', 'Cadastrar serviço')}
              </button>
            )}
          </div>
        </Card>
      </section>
    </FullPageLayout>
  );
}
