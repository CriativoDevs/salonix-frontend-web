// Resumo legível do benefício de um voucher (usado em ClientProfile.jsx e
// ClientBookingPage.jsx). O backend (ClientVoucherSerializer) não expõe o
// nome do serviço para vouchers do tipo 'free_service' — nesse caso o
// resumo fica genérico ("Serviço grátis"), registrado em to_see.md.
export function describeVoucherBenefit(clientVoucher, t) {
  const type = clientVoucher?.voucher_type;
  const value = clientVoucher?.voucher_value;

  if (type === 'percent') {
    return t('vouchers.benefit.percent', '{{value}}% de desconto', { value });
  }
  if (type === 'fixed') {
    return t('vouchers.benefit.fixed', 'Desconto de {{value}}', { value });
  }
  return t('vouchers.benefit.free_service', 'Serviço grátis');
}
