import { INestApplication, Injectable, SetMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Paystack } from 'paystack-sdk';
import { InjectPaystackClient } from '../decorators';
import { PaystackModule } from '../module';
import { PaystackWebhookController } from '../webhook.controller';

const testReceivePaystackFn = jest.fn();

const TestDecorator = () => SetMetadata('TEST:METADATA', 'metadata');

@Injectable()
class TestService {
  constructor(
    @InjectPaystackClient() private readonly paystackClient: Paystack,
  ) {
    testReceivePaystackFn(this.paystackClient);
  }
}

describe('Paystack Module', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PaystackModule.forRoot(PaystackModule, {
          secretKey: 'secret',
          enableWebhook: true,
        }),
      ],
      providers: [TestService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('exposes a Paystack client', () => {
    expect(testReceivePaystackFn).toHaveBeenCalledTimes(1);

    const client = testReceivePaystackFn.mock.calls[0][0];
    expect(client).toBeInstanceOf(Paystack);
  });

  it('applies the decorator to the controller', async () => {
    await Test.createTestingModule({
      imports: [
        PaystackModule.forRoot(PaystackModule, {
          secretKey: 'secret',
          enableWebhook: true,
          webhookConfig: {
            decorators: [TestDecorator()],
          },
        }),
      ],
    }).compile();

    expect(
      Reflect.getMetadata('TEST:METADATA', PaystackWebhookController),
    ).toBe('metadata');
  });
});
