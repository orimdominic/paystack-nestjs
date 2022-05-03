export interface PaystackModuleConfig {
  readonly secretKey: string;
  /**
   * Configuration for processing Paystack webhooks
   */
  webhookConfig?: {
    /**
     * The webhook secret registered in the Paystack Dashboard
     */
    secret: string;

    /**
     * The property on the request that contains the raw message body so that it
     * can be validated. Defaults to 'body'
     */
    requestBodyProperty?: string;

    /**
     * The prefix of the generated webhook handling controller. Defaults to
     * 'paystack-webhooks'
     */
    controllerPrefix?: string;

    /**
     * Any metadata specific decorators you want to apply to the webhook handling
     * controller.
     *
     * Note: these decorators must only set metadata that will be read at request
     * time. Decorators like Nest's `@UsePipes()` or `@UseInterceptors()` will
     * not work due to the time at which Nest reads the metadata for those, but
     * something that uses `SetMetadata` will be fine, because that metadata is
     *  read at request time.
     */
    decorators?: ClassDecorator[];

    /**
     * Logging configuration
     */
    loggingConfiguration?: {
      /**
       * If `true` will log information regarding event handlers that match
       * incoming webhook events
       */
      logMatchingEventHandlers: boolean;
    };
  };
}

export interface PaystackWebhookHandlerConfig {
  /**
   * Event type from Paystack that will be used to match this handler
   */
  eventType: string;
}
