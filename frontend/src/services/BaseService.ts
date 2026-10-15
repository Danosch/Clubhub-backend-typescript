import { ClientApi, clientApi } from './api';

/**
 * Base class for feature services that call the backend.
 * Holds a reference to the shared `ClientApi` instance.
 */
export abstract class BaseService {
  /** API client used for HTTP requests. */
  protected api: ClientApi;

  /**
   * @param api API client instance. Defaults to the shared `clientApi`.
   */
  constructor(api: ClientApi = clientApi) {
    this.api = api;
  }

  /**
   * Merge multiple plain objects into a single payload. Non-objects are ignored.
   * Useful to build request bodies from optional fragments.
   */
  protected buildPayload(...args: unknown[]): Record<string, unknown> {
    return args.reduce<Record<string, unknown>>((acc, arg) => {
      if (typeof arg === 'object' && arg !== null) {
        return { ...acc, ...(arg as Record<string, unknown>) };
      }
      return acc;
    }, {});
  }
}
