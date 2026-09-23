import React from 'react';
import { buildWhatsAppUrl, buildWhatsAppMessage } from '../../utils/whatsapp';
import WhatsAppIcon from '../ui/icons/WhatsAppIcon';

/**
 * Botão "Enviar via WhatsApp" (Click-to-Chat, wa.me).
 * Não renderiza nada se o cliente não tiver telefone registado.
 */
export default function WhatsAppButton({
  appointment,
  eventType,
  label,
  className = '',
}) {
  if (!appointment) return null;

  const phone = appointment.customerPhone;
  const message = buildWhatsAppMessage(appointment, eventType);
  const url = buildWhatsAppUrl(phone, message);

  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ||
        'inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-1.5 text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/20'
      }
    >
      <WhatsAppIcon size={14} />
      {label}
    </a>
  );
}
