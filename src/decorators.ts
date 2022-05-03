import { Inject } from '@nestjs/common';
import { PAYSTACK_MODULE_CONFIG_TOKEN } from './constants';

export const InjectPaystackModuleConfig = () =>
  Inject(PAYSTACK_MODULE_CONFIG_TOKEN);
