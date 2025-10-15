/* eslint-env jest */

import {
  mapInviteStatusToKey,
  resolveInviteStatusLabel,
  buildInviteTooltipLines,
  normalizeInviteMeta,
  resolveInviteVariant,
  formatInviteDateTime,
} from '../inviteStatus';

const t = (_, fallback) => fallback;

describe('inviteStatus utils', () => {
  describe('mapInviteStatusToKey', () => {
    it.each([
      ['Delivered', 'success'],
      ['queued', 'queued'],
      ['in_progress', 'sending'],
      ['error', 'failed'],
    ])('normalises %s to %s', (input, expected) => {
      expect(mapInviteStatusToKey(input)).toBe(expected);
    });

    it('returns unknown for unrecognised statuses', () => {
      expect(mapInviteStatusToKey('mystery')).toBe('unknown');
    });

    it('returns null when raw status missing', () => {
      expect(mapInviteStatusToKey(null)).toBeNull();
    });
  });

  describe('resolveInviteStatusLabel', () => {
    it('prefers translated label for known keys', () => {
      expect(resolveInviteStatusLabel(t, 'queued', 'queued')).toBe('Pendente');
    });

    it('falls back to pretty raw status when unknown', () => {
      expect(resolveInviteStatusLabel(t, 'unknown', 'custom_status')).toBe('Custom_status');
    });

    it('falls back to neutral text when nothing available', () => {
      expect(resolveInviteStatusLabel(t, 'unknown', null)).toBe('Convite');
    });
  });

  describe('normalizeInviteMeta', () => {
    it('builds meta from backend payload', () => {
      const meta = normalizeInviteMeta({
        last_invite_status: 'DELIVERED',
        last_invite_at: '2023-05-01T10:30:00Z',
        last_invite_triggered_by: 'Maria',
      });

      expect(meta).toEqual({
        status: 'delivered',
        timestamp: '2023-05-01T10:30:00Z',
        triggeredBy: 'Maria',
        detailMessage: null,
      });
    });

    it('prefers overrides from flash status', () => {
      const meta = normalizeInviteMeta(
        {
          last_invite_status: 'failed',
          last_invite_detail: 'Original detail',
        },
        {
          statusOverride: 'queued',
          messageOverride: 'Override detail',
          timestampOverride: '2024-01-01T12:00:00Z',
        },
      );

      expect(meta).toEqual({
        status: 'queued',
        timestamp: '2024-01-01T12:00:00Z',
        triggeredBy: null,
        detailMessage: 'Override detail',
      });
    });
  });

  describe('resolveInviteVariant', () => {
    it('returns variant config for known key', () => {
      expect(resolveInviteVariant('failed')).toMatchObject({
        toneClass: expect.stringContaining('rose'),
      });
    });

    it('defaults to neutral when key missing', () => {
      expect(resolveInviteVariant(undefined)).toMatchObject({
        toneClass: expect.stringContaining('brand-light'),
      });
    });
  });

  describe('buildInviteTooltipLines', () => {
    it('returns disabled message when PWA is disabled', () => {
      const lines = buildInviteTooltipLines(t, 'disabled', {}, 'Pendente');
      expect(lines).toHaveLength(1);
      expect(lines[0].value).toContain('PWA');
    });

    it('returns detailed lines when metadata present', () => {
      const formatFn = jest.fn().mockReturnValue('formatted-date');
      const lines = buildInviteTooltipLines(
        t,
        'success',
        {
          status: 'success',
          timestamp: '2023-01-01T00:00:00Z',
          triggeredBy: 'João',
          detailMessage: 'Detalhes extras',
        },
        'Enviado',
        formatFn,
      );

      expect(lines.map((line) => line.value)).toEqual([
        'Enviado',
        'formatted-date',
        'João',
        'Detalhes extras',
      ]);
      expect(formatFn).toHaveBeenCalledWith('2023-01-01T00:00:00Z');
    });

    it('adds placeholder when status missing', () => {
      const lines = buildInviteTooltipLines(
        t,
        'none',
        { status: null },
        'Convite',
      );
      expect(lines[0].value).toContain('Nenhuma tentativa');
    });
  });

  describe('formatInviteDateTime', () => {
    it('returns empty string for invalid value', () => {
      expect(formatInviteDateTime('not-a-date')).toBe('');
    });
  });
});
