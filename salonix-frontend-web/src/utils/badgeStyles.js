// Centralized badge styles for consistent UI across the application

// Base badge classes that should be applied to all badges
export const BASE_BADGE_CLASSES = 'rounded-full border px-2 py-1 text-xs font-medium uppercase';

// Status badge styles for appointments
export const APPOINTMENT_STATUS_STYLES = {
  scheduled: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  completed: 'border-sky-200 bg-sky-100 text-sky-800',
  paid: 'border-emerald-300 bg-emerald-200 text-emerald-900',
  cancelled: 'border-rose-200 bg-rose-100 text-rose-800',
};

// Role badge styles for team members
export const ROLE_BADGE_STYLES = {
  owner: 'border-purple-200 bg-purple-100 text-purple-800',
  manager: 'border-sky-200 bg-sky-100 text-sky-800',
  collaborator: 'border-emerald-200 bg-emerald-100 text-emerald-800',
};

// Status badge styles for team members
export const TEAM_STATUS_STYLES = {
  active: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  invited: 'border-amber-200 bg-amber-100 text-amber-800',
  disabled: 'border-rose-200 bg-rose-100 text-rose-800',
};

// Alert badge styles
export const ALERT_BADGE_STYLES = {
  warning: 'border-amber-200 bg-amber-100 text-amber-800',
  error: 'border-rose-200 bg-rose-100 text-rose-800',
  info: 'border-sky-200 bg-sky-100 text-sky-800',
  success: 'border-emerald-200 bg-emerald-100 text-emerald-800',
};

// Utility function to get complete badge classes
export const getBadgeClasses = (styleClasses, fallback = 'border-gray-200 bg-gray-100 text-gray-800') => {
  return `${BASE_BADGE_CLASSES} ${styleClasses || fallback}`;
};

// Utility functions for specific badge types
export const getAppointmentStatusBadge = (status) => {
  return getBadgeClasses(APPOINTMENT_STATUS_STYLES[status]);
};

export const getRoleBadge = (role) => {
  return getBadgeClasses(ROLE_BADGE_STYLES[role]);
};

export const getTeamStatusBadge = (status) => {
  return getBadgeClasses(TEAM_STATUS_STYLES[status]);
};

export const getAlertBadge = (type = 'warning') => {
  return getBadgeClasses(ALERT_BADGE_STYLES[type]);
};