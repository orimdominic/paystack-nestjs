import { ConsoleLogger, INestApplication, Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PaystackModuleConfig } from '../interfaces';
import { PaystackModule } from '../module';
import { PaystackPayloadService } from '../payload.service';
import { PaystackWebhookHandler } from '../decorators';
import { JSONValue } from '../json.type';
import { PaystackWebhookEvent } from '../webhook-event.type';

const testReceivePaystackFn = jest.fn();
const defaultPaystackWebhookEndpoint = '/paystack/webhook';
const eventType: PaystackWebhookEvent = 'charge.success';
const expectedEvent = { event: eventType };

@Injectable()
class SilentLogger extends ConsoleLogger {
  constructor() {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  error() {}
}

@Injectable()
class ChargeSuccessfulService {
  @PaystackWebhookHandler(eventType)
  handleChargeSuccessfulEvent(event: JSONValue) {
    testReceivePaystackFn(event);
  }
}

type ModuleType = 'forRoot' | 'forRootAsync';

const cases: [ModuleType, string | undefined][] = [
  ['forRoot', undefined],
  ['forRoot', 'paystack'],
  ['forRootAsync', undefined],
  ['forRootAsync', 'paystack'],
];

describe.each(cases)(
  'PaystackModule %p with controller prefix %p (e2e)',
  (moduleType, controllerPrefix) => {
    let app: INestApplication;
    let hydratePayloadMockFn;
    let stripePayloadService;

    const paystackWebhookEndpoint = controllerPrefix
      ? `/${controllerPrefix}`
      : defaultPaystackWebhookEndpoint;

    const moduleConfig: PaystackModuleConfig = {
      secretKey: 'secret',
      enableWebhook: true,
      webhookConfig: {
        controllerPrefix,
        loggingConfiguration: {
          logMatchingEventHandlers: true,
        }, // to include logging in tests
      },
    };

    beforeEach(async () => {
      const moduleImport =
        moduleType === 'forRoot'
          ? PaystackModule.forRoot(PaystackModule, moduleConfig)
          : PaystackModule.forRootAsync(PaystackModule, {
              useFactory: () => moduleConfig,
            });

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [moduleImport],
        providers: [ChargeSuccessfulService],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.useLogger(new SilentLogger());
      await app.init();

      stripePayloadService = app.get<PaystackPayloadService>(
        PaystackPayloadService,
      );
    });

    it('returns an error if the Paystack signature is missing', () => {
      return request(app.getHttpServer())
        .post(paystackWebhookEndpoint)
        .send(expectedEvent)
        .expect(500);
    });

    it('routes incoming events to their handlers based on the event type', () => {
      hydratePayloadMockFn = jest
        .spyOn(stripePayloadService, 'tryHydratePayload')
        .mockImplementationOnce((_, body) => body);

      return request(app.getHttpServer())
        .post(paystackWebhookEndpoint)
        .set('x-paystack-signature', 'paystack')
        .send(expectedEvent)
        .expect(200)
        .then(() => {
          expect(testReceivePaystackFn).toHaveBeenCalledTimes(1);
          expect(hydratePayloadMockFn).toHaveBeenCalledTimes(1);
          expect(hydratePayloadMockFn).toHaveBeenCalledWith(
            'paystack',
            expectedEvent,
          );
          expect(testReceivePaystackFn).toHaveBeenCalledWith(expectedEvent);
        });
    });
    afterEach(() => jest.resetAllMocks());
  },
);
