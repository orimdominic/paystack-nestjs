import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { DiscoveryModule, DiscoveryService } from '@golevelup/nestjs-discovery';
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { Paystack } from 'paystack-sdk';
import { PaystackModuleConfig } from './interfaces';
import { InjectPaystackModuleConfig } from './decorators';
import { PaystackWebhookController } from './webhook.controller';
import {
  PAYSTACK_CLIENT_TOKEN,
  PAYSTACK_MODULE_CONFIG_TOKEN,
  PAYSTACK_WEBHOOK_HANDLER,
  PAYSTACK_WEBHOOK_SERVICE,
} from './constants';
import { PaystackWebhookService } from './webhook.service';
import { PaystackPayloadService } from './payload.service';
import { flatten, groupBy } from 'lodash';

@Module({
  controllers: [PaystackWebhookController],
})
export class PaystackModule
  extends createConfigurableDynamicRootModule<
    PaystackModule,
    PaystackModuleConfig
  >(PAYSTACK_MODULE_CONFIG_TOKEN, {
    imports: [DiscoveryModule],
    providers: [
      {
        provide: PAYSTACK_CLIENT_TOKEN,
        useFactory({ secretKey }: PaystackModuleConfig): Paystack {
          return new Paystack(secretKey);
        },
        inject: [PAYSTACK_MODULE_CONFIG_TOKEN],
      },
      {
        provide: Symbol('WEBHOOK_CONTROLLER_HACK'),
        inject: [PAYSTACK_MODULE_CONFIG_TOKEN],
        useFactory: ({ webhookConfig }: PaystackModuleConfig) => {
          const controllerPrefix =
            webhookConfig?.controllerPrefix || 'paystack';

          Reflect.defineMetadata(
            PATH_METADATA,
            controllerPrefix,
            PaystackWebhookController,
          );

          webhookConfig?.decorators?.forEach((decor) =>
            decor(PaystackWebhookController),
          );
        },
      },
      PaystackWebhookService,
      PaystackPayloadService,
    ],
    exports: [PAYSTACK_MODULE_CONFIG_TOKEN, PAYSTACK_CLIENT_TOKEN],
  })
  implements OnModuleInit
{
  private readonly logger = new Logger(PaystackModule.name);
  constructor(
    private readonly discover: DiscoveryService,
    private readonly externalContextCreator: ExternalContextCreator,
    @InjectPaystackModuleConfig()
    private readonly paystackModuleConfig: PaystackModuleConfig,
  ) {
    super();
  }
  async onModuleInit() {
    // If they didn't provide a webhook config there's no reason
    // to even attempt discovery
    if (!this.paystackModuleConfig.webhookConfig) {
      return;
    }

    if (
      this.paystackModuleConfig.webhookConfig &&
      !this.paystackModuleConfig.webhookConfig?.secret
    ) {
      const errorMessage =
        'Missing Paystack webhook secret. module is improperly configured and will be unable to process incoming webhooks from Paystack';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    this.logger.log('Initializing Paystack Module for webhooks');

    const [paystackWebhookService] = (
      (await this.discover.providersWithMetaAtKey<boolean>(
        PAYSTACK_WEBHOOK_SERVICE,
      )) || []
    ).map((x) => x.discoveredClass.instance);

    if (
      !paystackWebhookService ||
      !(paystackWebhookService instanceof PaystackWebhookService)
    ) {
      throw new Error('Could not find instance of PaystackWebhookService');
    }

    const eventHandlerMeta =
      await this.discover.providerMethodsWithMetaAtKey<string>(
        PAYSTACK_WEBHOOK_HANDLER,
      );

    const grouped = groupBy(
      eventHandlerMeta,
      (x) => x.discoveredMethod.parentClass.name,
    );

    const webhookHandlers = flatten(
      Object.keys(grouped).map((x) => {
        this.logger.log(`Registering Paystack webhook handlers from ${x}`);

        return grouped[x].map(({ discoveredMethod, meta: eventType }) => ({
          key: eventType,
          handler: this.externalContextCreator.create(
            discoveredMethod.parentClass.instance,
            discoveredMethod.handler,
            discoveredMethod.methodName,
          ),
        }));
      }),
    );

    const handleWebhook = async (webhookEvent: { type: string }) => {
      const { type } = webhookEvent;
      const handlers = webhookHandlers.filter((x) => x.key === type);

      if (handlers.length) {
        if (
          this.paystackModuleConfig?.webhookConfig?.loggingConfiguration
            ?.logMatchingEventHandlers
        ) {
          this.logger.log(
            `Received webhook event for ${type}. Forwarding to ${handlers.length} event handlers`,
          );
        }
        await Promise.all(handlers.map((x) => x.handler(webhookEvent)));
      }
    };
    paystackWebhookService.handleWebhookEvent = handleWebhook;
  }
}
