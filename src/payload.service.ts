import { Injectable, Logger } from '@nestjs/common';
import { InjectPaystackModuleConfig } from './decorators';
import { PaystackModuleConfig } from './interfaces';
import { createHmac } from 'crypto';
import { JSONValue } from './json.type';

@Injectable()
export class PaystackPayloadService {
  private readonly logger = new Logger(PaystackPayloadService.name);
  constructor(
    @InjectPaystackModuleConfig()
    private readonly paystackModuleConfig: PaystackModuleConfig,
  ) {}

  tryHydratePayload(
    signature: string,
    payload: JSONValue,
    validator = createHmac,
  ) {
    const secret = this.paystackModuleConfig.webhookConfig.secret || '';
    const hash = validator('sha512', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    if (signature !== hash) {
      this.logger.error('Error validating Paystack event');
      throw new Error('Error validating Paystack event');
    }
    return payload;
  }
}
