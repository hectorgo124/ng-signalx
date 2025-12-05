import { BaseResourceOptions } from '@angular/core';
import { rxResource, RxResourceOptions } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

/**
 * Extended options for Angular's `rxResource()` function.
 *
 * Adds support for an optional `filter` predicate that determines
 * whether the loader should run for the current request.
 *
 * @template TData - The type of the resource data.
 * @template TRequest - The type of the request object.
 *
 */
export type SignalxRxresourceOptions<TData, TRequest> = RxResourceOptions<
  TData,
  TRequest
> & {
  /**
   * Optional predicate invoked before executing loader.
   * If it returns `false`, the loader will NOT run,
   * and the resource will immediately resolve to `defaultValue`.
   */
  filter?: (request: TRequest) => boolean;
};

/**
 * A fully typed wrapper around Angular 19's `rxResource()` API.
 *
 * Features added:
 * - Optional filtering logic before running loader
 * - Fallback to `defaultValue`
 *
 * @template TData - The result type of the resource.
 * @template TRequest - The shape of the reactive request object.
 *
 * @param options - Rxresource configuration with optional filter.
 * @returns A fully configured Angular resource.
 *
 *
 * @example
 * ```ts
 * exampleResource = signalxResource<Response | null, { isLogged: boolean }>({
 *   request: () => ({ isLogged: this.$logged() }),
 *   filter: ({ isLogged }) => isLogged,
 *   loader: () =>
 *     fetch('http://localhost:4200/assets/es.json')
 *       .then(res => res.json()),
 *   defaultValue: null,
 * });
 * ```
 */

export function signalxRxresource<TData, TRequest>(
  options: SignalxRxresourceOptions<TData, TRequest>,
) {
  const { filter, ...rest } = options;

  const { loader, defaultValue, ...promiseRest } = rest;

  return rxResource<TData, TRequest>({
    ...(promiseRest as BaseResourceOptions<TData, TRequest>),
    defaultValue,

    loader: (ctx) => {
      const req = ctx.request;

      if ((filter && !filter(req)) || !loader) {
        return of(defaultValue as TData);
      }

      return loader(ctx);
    },
  });
}
