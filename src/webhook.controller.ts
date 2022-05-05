import {
  Request,
  Headers,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectPaystackModuleConfig } from './decorators';
import { PaystackModuleConfig } from './interfaces';
import { PaystackPayloadService } from './payload.service';
import { PaystackWebhookService } from './webhook.service';

@Controller('/paystack/webhook')
export class PaystackWebhookController {
  private readonly requestBodyProperty: string;

  constructor(
    @InjectPaystackModuleConfig()
    private readonly config: PaystackModuleConfig,
    private readonly payloadService: PaystackPayloadService,
    private readonly webhookService: PaystackWebhookService,
  ) {
    this.requestBodyProperty =
      this.config.webhookConfig?.requestBodyProperty || 'body';
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handlePaystackEvents(
    @Headers('x-paystack-signature') signature: string,
    @Request() req,
  ) {
    const body = req[this.requestBodyProperty];
    const eventPayload = this.payloadService.tryHydratePayload(signature, body);
    await this.webhookService.handleWebhookEvent(eventPayload);
  }
}
