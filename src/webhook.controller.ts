import { Request, Headers, Controller, Post } from '@nestjs/common';
import { InjectPaystackModuleConfig } from './decorators';
import { PaystackModuleConfig } from './interfaces';
import { PaystackPayloadService } from './payload.service';
import { PaystackWebhookService } from './webhook.service';

@Controller('/paystack-webhooks')
export class PayStackWebhookController {
  private readonly requestBodyProperty: string;

  constructor(
    @InjectPaystackModuleConfig()
    private readonly config: PaystackModuleConfig,
    private readonly payloadService: PaystackPayloadService,
    private readonly webhookService: PaystackWebhookService,
  ) {
    this.requestBodyProperty = this.config.webhookConfig.requestBodyProperty;
  }

  @Post('paystack-webhooks')
  async handlePaystackEvents(
    @Headers('x-paystack-signature') signature: string,
    @Request() req,
  ) {
    const body = req[this.requestBodyProperty];
    const eventPayload = this.payloadService.tryHydratePayload(signature, body);
    await this.webhookService.handleWebhookEvent(eventPayload);
  }
}
