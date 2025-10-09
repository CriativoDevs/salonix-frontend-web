export const appointmentCustomer = {
  id: 1,
  name: 'Cliente Demo',
  email: 'customer@example.com',
  phone_number: '+351912345678',
};

export const appointmentListItem = {
  id: 99,
  client: 6,
  customer: appointmentCustomer.id,
  service: 5,
  professional: 10,
  slot: 132,
  notes: 'Agendamento de demonstração',
  created_at: '2025-10-08T14:59:28.970950+01:00',
  status: 'scheduled',
  cancelled_by: null,
};

export const appointmentListResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [appointmentListItem],
};

export const appointmentDetail = {
  id: appointmentListItem.id,
  status: 'scheduled',
  notes: appointmentListItem.notes,
  created_at: appointmentListItem.created_at,
  client_username: 'pro_smoke',
  client_email: 'pro_smoke@demo.local',
  customer: appointmentCustomer,
  service: {
    id: appointmentListItem.service,
    name: 'Corte Feminino',
    price_eur: '25.00',
    duration_minutes: 45,
  },
  professional: {
    id: appointmentListItem.professional,
    name: 'Alice',
    bio: '',
    is_active: true,
  },
  slot: {
    id: appointmentListItem.slot,
    start_time: '2025-10-08 14:00',
    end_time: '2025-10-08 15:00',
    is_available: false,
    status: 'booked',
  },
};

export const appointmentPayload = {
  customer: appointmentCustomer.id,
  service: appointmentListItem.service,
  professional: appointmentListItem.professional,
  slot: appointmentListItem.slot,
  notes: appointmentListItem.notes,
};
