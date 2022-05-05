# paystack-nestjs

Integrate Paystack APIs with your NestJS application. This library comes with support for handling Paystack webhook events with ease using decorators, for free 🤓

## Features
1. API client: An injectable Paystack client to interact with Paystack APIs.

2. [Webhook event verification](https://paystack.com/docs/payments/webhooks/#verify-event-origin): Automatically verifies that calls to your webhook endpoint are from Paystack. Errors on calls from non-Paystack servers. It also returns a `200` by default for you.

3. Handle specific events: Permits you to create providers that handle specific events using decorators. You can do away with implementing complex `switch` and `if...else` statements to determine what function/provider will handle an event.

## Installation

```bash
# npm
npm install paystack-nestjs

# yarn
yarn add paystack-nestjs
```

## Usage

### Paystack client

1. Import the library into the module that handles Paystack payments (`PaymentModule` in this case)
```ts
// payment.module.ts

import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaystackModule } from 'paystack-nestjs';

@Module({
  imports: [
    PaystackModule.forRoot(PaystackModule, {
      secretKey: 'sk_4r3y0ur3a11ytry1n9t0f19ur3th1s0ut'
    }),
  ],
  controllers: [PaymentController],
})
export class PaymentModule {}
```
For an asynchronous setup, use `PaystackModule.forRootAsync`

2. Inject the client into a controller or provider via the constructor
```ts
// payment.controller.ts

import { Body, Controller } from '@nestjs/common';
import { InjectPaystackClient } from 'paystack-nestjs';
import { Paystack } from 'paystack-sdk';

@Controller('paystack')
export class PaymentController {
  constructor(
    @InjectPaystackClient() private readonly paystackClient: Paystack,
  ) {}

  @Post('pay')
  async pay(@Body() body) {
    await this.paystackClient.charge.create({
      email: body.email,
      amount: '24000',
      reference: body.trxref,
    });
  }
}
```

The full configuration of the second argument (`PaystackModuleConfig`) passed to `forRoot` method can be found in [interfaces.ts](/src/interfaces.ts)

### Webhook

To enable webhook configuration, set the `enableWebhook` property in `PaystackModuleConfig` to true.

The module adds a `POST /paystack/webhook` route as the default webhook route. This means that if you have a controller method `m` that handles this route, and you have set up Paystack webhook on your developer console to forward events to `your.api/paystack/webhook`, method `m` will receive webhook events from Paystack.

You can modify this route using the `webhookConfig.controllerPrefix` option in `PaystackModuleConfig`.

```ts
// payment.controller.ts

import { Body, Controller } from '@nestjs/common';

@Controller('paystack')
export class PaymentController {

  @Post('webhook')
  handlePaystackEvent(@Body() payload) {
    console.log('verified payload from Paystack =>', payload)
  }
}
```

### Handling Webhook Events with Decorated Methods

The module provides a `PaystackWebhookHandler` decorator that you can use to decorate methods that you want to use to handle specific events. You can set this up using the setup described below.

Let's say you want to have a specific method of a provider handle the `charge.success` event. You inject the module into the co-ordinating module like so

1. Configure and inject the module
```ts
// payment.module.ts

import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaystackModule, PaystackWebhookService } from 'paystack-nestjs';
import { ChargeSuccessService } from './charge-success.service';

@Module({
  imports: [
    PaystackModule.forRoot(PaystackModule, {
      secretKey: 'sk_4r3y0ur3a11ytry1n9t0f19ur3th1s0ut',
      enableWebhook: true,
    }),
  ],
  controllers: [PaymentController],
  providers: [ChargeSuccessService, PaystackWebhookService],
})
export class PaymentModule {}
```

2. Create the provider that holds the method that handles the `charge.success` event. Decorate the (`handleChargeSuccess`) with `PaystackWebhookHandler` and the name of the event that the method should handle (`charge.success`)

```ts
// charge-success.service.ts

import { Injectable } from '@nestjs/common';
import { PaystackWebhookHandler } from 'paystack-nestjs';

@Injectable()
export class ChargeSuccessService {
  @PaystackWebhookHandler('charge.success')
  handleChargeSuccess(payload) {
    console.log('from ChargeSuccessService');
    console.log(`handling ${payload.event}`);
  }
}

```

3. Inject `PaystackWebhookService` into the controller and execute its `handleWebhookEvent`, passing the payload to it.

```ts
// payment.controller.ts

import { Body, Controller, Post } from '@nestjs/common';
import { PaystackWebhookService } from 'paystack-nestjs';

@Controller('paystack')
export class PaymentController {
  constructor(
    private readonly webhookService: PaystackWebhookService,
  ) {}

  @Post('webhook')
  handlePaystackEvent(@Body() payload) {
    this.webhookService.handleWebhookEvent(payload)
  }
}
```

Whenever there is a `charge.success` event, it will be handled by the `handleChargeSuccess` method of `ChargeSuccessService`. You can have more than one method handling the same event.

## Helpful links
- [Paystack webhooks](https://paystack.com/docs/payments/webhooks)
- [Testing webhooks locally with the Paystack CLI](https://paystack.com/blog/product/cli#how-to-get-started-with-the-paystack-cli)

## Contributing
See a need, fill a need! PRs and issues are welcome!

- Inpired by [@golevelup-nestjs/stripe](https://github.com/golevelup/packages/stripe)
- Built on [@en1tan/paystack-node](https://github.com/en1tan/paystack-node)
