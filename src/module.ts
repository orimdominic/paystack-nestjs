import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { PaystackModuleConfig } from './interfaces';
import {
  PAYSTACK_CLIENT_TOKEN,
  PAYSTACK_MODULE_CONFIG_TOKEN,
} from './constants';
import { DiscoveryModule, DiscoveryService } from '@golevelup/nestjs-discovery';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { Paystack } from 'paystack-sdk';
import { Logger, OnModuleInit } from '@nestjs/common';
import { InjectPaystackModuleConfig } from './decorators';

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
  onModuleInit() {
    throw new Error('Method not implemented.');
  }
}
