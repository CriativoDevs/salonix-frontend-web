import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchStaffMembers,
  inviteStaffMember,
  updateStaffMember,
  disableStaffMember,
} from '../api/staff';
import { parseApiError } from '../utils/apiError';

const mergeStaffMember = (list, member) => {
  if (!member || typeof member !== 'object') {
    return list;
  }

  const index = list.findIndex((item) => item?.id === member?.id);
  if (index === -1) {
    return [...list, member];
  }

  const next = [...list];
  next[index] = member;
  return next;
};

export function useStaff({ slug } = {}) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [prevSlug, setPrevSlug] = useState(slug);

  if (slug !== prevSlug) {
    setPrevSlug(slug);
    setLoading(!!slug);
    setStaff([]);
    setError(null);
    setForbidden(false);
  }

  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!slug) {
      setStaff([]);
      setLoading(false);
      setError(null);
      setRequestId(null);
      setForbidden(false);
      return;
    }

    setLoading(true);
    setError(null);
    setRequestId(null);
    setForbidden(false);

    try {
      const { staff: staffData, requestId: reqId } = await fetchStaffMembers({
        slug,
      });
      if (!mountedRef.current) return;
      setStaff(Array.isArray(staffData) ? staffData : []);
      setRequestId(reqId || null);
      setLoading(false);
    } catch (err) {
      if (!mountedRef.current) return;
      const status = err?.response?.status;
      setForbidden(status === 403);
      const parsed = parseApiError(err, 'Não foi possível carregar a equipe.');
      setError(parsed);
      setRequestId(parsed.requestId || null);
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const refetch = useCallback(() => {
    if (!mountedRef.current) return;
    load();
  }, [load]);

  const invite = useCallback(
    async (payload) => {
      try {
        const { staffMember, requestId: reqId } = await inviteStaffMember(
          payload,
          { slug }
        );
        if (!mountedRef.current) {
          return { success: true, staffMember, requestId: reqId || null };
        }
        setStaff((current) => mergeStaffMember(current, staffMember));
        return { success: true, staffMember, requestId: reqId || null };
      } catch (err) {
        const parsed = parseApiError(err, 'Falha ao enviar o convite.');
        return { success: false, error: parsed };
      }
    },
    [slug]
  );

  const update = useCallback(
    async (id, payload) => {
      try {
        const { staffMember, requestId: reqId } = await updateStaffMember(
          id,
          payload,
          { slug }
        );
        if (!mountedRef.current) {
          return { success: true, staffMember, requestId: reqId || null };
        }
        setStaff((current) => mergeStaffMember(current, staffMember));
        return { success: true, staffMember, requestId: reqId || null };
      } catch (err) {
        const parsed = parseApiError(
          err,
          'Não foi possível atualizar o membro de equipe.'
        );
        return { success: false, error: parsed };
      }
    },
    [slug]
  );

  const disable = useCallback(
    async (id) => {
      try {
        const { success, requestId: reqId } = await disableStaffMember(id, {
          slug,
        });
        if (!success) {
          return {
            success: false,
            error: {
              message: 'Não foi possível desativar o membro de equipe.',
              code: null,
              details: null,
              requestId: reqId || null,
            },
          };
        }
        if (mountedRef.current) {
          setStaff((current) => current.filter((member) => member?.id !== id));
        }
        return { success: true, requestId: reqId || null };
      } catch (err) {
        const parsed = parseApiError(
          err,
          'Não foi possível desativar o membro de equipe.'
        );
        return { success: false, error: parsed };
      }
    },
    [slug]
  );

  return {
    staff,
    loading,
    error,
    requestId,
    forbidden,
    refetch,
    inviteStaff: invite,
    updateStaff: update,
    disableStaff: disable,
  };
}

export default useStaff;
