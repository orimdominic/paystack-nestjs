import { Inject, SetMetadata } from '@nestjs/common';
import {
  PAYSTACK_CLIENT_TOKEN,
  PAYSTACK_MODULE_CONFIG_TOKEN,
  PAYSTACK_WEBHOOK_HANDLER,
} from './constants';
import { PaystackWebhookEvent } from './webhook-event.type';

export const InjectPaystackModuleConfig = () =>
  Inject(PAYSTACK_MODULE_CONFIG_TOKEN);

/**
 * Injects the Paystack Client instance
 */
export const InjectPaystackClient = () => Inject(PAYSTACK_CLIENT_TOKEN);

/**
 * Binds the decorated service method as a handler for incoming Paystack Webhook events.
 * Events will be automatically routed here based on their event type property
 * @param config The configuration for this handler
 */
export const PaystackWebhookHandler = (eventType: PaystackWebhookEvent) =>
  SetMetadata(PAYSTACK_WEBHOOK_HANDLER, eventType);
