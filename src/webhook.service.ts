import { Injectable, Logger, SetMetadata } from '@nestjs/common';
import { PAYSTACK_WEBHOOK_SERVICE } from './constants';
import { JSONValue } from './json.type';

@Injectable()
@SetMetadata(PAYSTACK_WEBHOOK_SERVICE, true)
export class PaystackWebhookService {
  private readonly logger = new Logger(PaystackWebhookService.name);
  handleWebhookEvent(event: JSONValue) {
    // The implementation for this method is overriden by the containing module
    this.logger.log(event);
  }
}
