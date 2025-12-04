import {
  type PromiseResourceOptions,
  resource,
  signal,
  type StreamingResourceOptions,
} from '@angular/core';

/**
 * Extended options for Angular's `resource()` function.
 *
 * Adds support for an optional `filter` predicate that determines
 * whether the loader/stream should run for the current request.
 *
 * @template TData - The type of the resource data.
 * @template TRequest - The type of the request object.
 *
 */
export type SignalxResourceOptions<TData, TRequest> = (
  | PromiseResourceOptions<TData, TRequest>
  | StreamingResourceOptions<TData, TRequest>
) & {
  /**
   * Optional predicate invoked before executing loader/stream.
   * If it returns `false`, the loader or stream will NOT run,
   * and the resource will immediately resolve to `defaultValue`.
   */
  filter?: (request: TRequest) => boolean;
};

/**
 * Detects whether the provided options correspond
 * to a Promise-based resource configuration.
 *
 * @template TData
 * @template TRequest
 * @param options - Raw resource options.
 * @returns Whether the options contain a `loader` function.
 *
 * @typePredicate options is PromiseResourceOptions<TData, TRequest> & { filter?: (request: TRequest) => boolean }
 *
 * @example
 * ```ts
 * if (isPromiseResource(options)) {
 *   options.loader(...);
 * }
 * ```
 */
function isPromiseResource<TData, TRequest>(
  options: SignalxResourceOptions<TData, TRequest>
): options is PromiseResourceOptions<TData, TRequest> & {
  filter?: (request: TRequest) => boolean;
} {
  return 'loader' in options;
}

/**
 * Detects whether the provided options correspond
 * to a StreamingResource configuration.
 *
 * @template TData
 * @template TRequest
 * @param options - Raw resource options.
 * @returns Whether the options contain a `stream` function.
 *
 * @typePredicate options is StreamingResourceOptions<TData, TRequest> & { filter?: (request: TRequest) => boolean }
 *
 * @example
 * ```ts
 * if (isStreamingResource(options)) {
 *   options.stream(...);
 * }
 * ```
 */
function isStreamingResource<TData, TRequest>(
  options: SignalxResourceOptions<TData, TRequest>
): options is StreamingResourceOptions<TData, TRequest> & {
  filter?: (request: TRequest) => boolean;
} {
  return 'stream' in options;
}

/**
 * A fully typed wrapper around Angular 19's `resource()` API.
 *
 * Features added:
 * - Optional filtering logic before running loader/stream
 * - Fallback to `defaultValue`
 * - Works for both Promise and streaming resources
 *
 * @template TData - The result type of the resource.
 * @template TRequest - The shape of the reactive request object.
 *
 * @param options - Resource configuration with optional filter.
 * @returns A fully configured Angular resource.
 *
 *
 * @example **Promise-based Resource**
 * ```ts
 * loaderResource = signalxResource<Response | null, { isLogged: boolean }>({
 *   request: () => ({ isLogged: this.$logged() }),
 *   filter: ({ isLogged }) => isLogged,
 *   loader: () =>
 *     fetch('http://localhost:4200/assets/es.json')
 *       .then(res => res.json()),
 *   defaultValue: null,
 * });
 * ```
 *
 * @example **Streaming Resource**
 * ```ts
 * streamResource = signalxResource<string[], { isLogged: boolean }>({
 *   request: () => ({ isLogged: this.$logged() }),
 *   filter: ({ isLogged }) => isLogged,
 *   stream: () =>
 *     new Promise(resolve => {
 *       const socket = new WebSocket('ws://localhost:9090');
 *       const msgSignal = signal({ value: [] as string[] });
 *       socket.onerror = () => {
 *         msgSignal.update(curr => ({
 *           value: [...curr.value, 'Error'],
 *         }));
 *         resolve(msgSignal);
 *       };
 *     }),
 *   defaultValue: ['Default'],
 * });
 * ```
 */
export function signalxResource<TData, TRequest>(
  options: SignalxResourceOptions<TData, TRequest>
) {
  const { filter, ...rest } = options;

  // --- Promise Resource ---
  if (isPromiseResource(options)) {
    const { loader, defaultValue, ...promiseRest } = rest;

    return resource<TData, TRequest>({
      ...(promiseRest as PromiseResourceOptions<TData, TRequest>),
      defaultValue,

      loader: (ctx) => {
        const req = ctx.request;

        if ((filter && !filter(req)) || !loader) {
          return Promise.resolve(defaultValue as TData);
        }

        return loader(ctx);
      },
    });
  }

  // --- Streaming Resource ---
  if (isStreamingResource(options)) {
    const { stream, defaultValue, ...streamRest } = rest;

    return resource<TData, TRequest>({
      ...(streamRest as StreamingResourceOptions<TData, TRequest>),
      defaultValue,

      stream: (ctx) => {
        const req = ctx.request;

        if ((filter && !filter(req)) || !stream) {
          return Promise.resolve(signal({ value: defaultValue! }));
        }

        return stream(ctx);
      },
    });
  }

  throw new Error('signalxResource: invalid resource configuration');
}
