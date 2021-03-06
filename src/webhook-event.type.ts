export type PaystackWebhookEvent =
  | 'charge.dispute.create'
  | 'charge.dispute.remind'
  | 'charge.dispute.resolve'
  | 'charge.success'
  | 'customeridentification.failed'
  | 'customeridentification.success'
  | 'invoice.create'
  | 'invoice.payment_failed'
  | 'invoice.update'
  | 'paymentrequest.pending'
  | 'paymentrequest.success'
  | 'subscription.create'
  | 'subscription.disable'
  | 'subscription.expiring_cards'
  | 'subscription.not_renew'
  | 'transfer.failed'
  | 'transfer.success'
  | 'transfer.reversed';
