/**
 * Result<T, E> — discriminated union for fallible operations.
 *
 * Why we use this instead of thrown exceptions / nullable returns:
 *
 * 1. **No control-flow hijacking.** Throwing across module boundaries hides
 *    failure from type signatures. A `Result<T, E>` makes failure explicit at
 *    the call site; the caller is forced (by pattern-matching on `kind`) to
 *    decide what to do.
 * 2. **No double-channel encoding.** We don't want to pair a `value | null`
 *    with a separate `Error | null` — that loses information about which
 *    channel is the signal. A single tagged value carries exactly one state.
 * 3. **Tree-shakeable named exports.** All helpers are pure functions over the
 *    value; bundlers can drop unused helpers per consumer.
 *
 * Canonical usage at the service layer:
 *
 * ```ts
 * import { ok, err, isOk, map, andThen } from "@/lib/result";
 *
 * type LoadResult = Result<User, AppError>;
 *
 * const r = await loadUser(id);
 * if (isOk(r)) {
 *   // r.value is User here, narrowed by the type guard
 *   return map(r, enrichUser);
 * }
 * return err(r.error);
 * ```
 *
 * Conventions:
 * - `E` defaults to `Error` for ergonomic JS-land use, but service-layer
 *   code should pick a narrower error type (see {@link AppError}).
 * - Helpers are data-last curried by convention via free functions so they
 *   compose with pipe helpers if the project ever adopts one.
 *
 * @module lib/result
 */

/**
 * The success branch of {@link Result}. Carries the computed value.
 */
export type Ok<T> = {
  readonly kind: "ok";
  readonly value: T;
};

/**
 * The failure branch of {@link Result}. Carries the error payload — by default
 * an `Error` instance, but service-layer callers should narrow to a domain
 * error type (e.g. `AppError`).
 */
export type Err<E> = {
  readonly kind: "err";
  readonly error: E;
};

/**
 * A value of type `T` on success, or an error of type `E` on failure.
 *
 * The two branches share a `kind` discriminator; the {@link isOk} and
 * {@link isErr} type guards narrow `Result<T, E>` to `Ok<T>` or `Err<E>` for
 * safe access to `value` / `error`.
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Wrap a value in the success branch.
 *
 * @param value The successful value to wrap.
 * @returns An {@link Ok} tagged with `value`.
 */
export const ok = <T>(value: T): Ok<T> => ({ kind: "ok", value });

/**
 * Wrap an error in the failure branch.
 *
 * @param error The error payload — typically an `Error` instance or a domain
 *   error type such as `AppError`.
 * @returns An {@link Err} tagged with `error`.
 */
export const err = <E>(error: E): Err<E> => ({ kind: "err", error });

/**
 * Type guard: narrows `Result<T, E>` to `Ok<T>`.
 *
 * @param r The result to inspect.
 * @returns `true` when `r.kind === "ok"`, narrowing the input to `Ok<T>`.
 */
export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.kind === "ok";

/**
 * Type guard: narrows `Result<T, E>` to `Err<E>`.
 *
 * @param r The result to inspect.
 * @returns `true` when `r.kind === "err"`, narrowing the input to `Err<E>`.
 */
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => r.kind === "err";

/**
 * Functor map over the success branch. Applies `fn` to the wrapped value if
 * `r` is `ok`; passes `err` through unchanged.
 *
 * @param r The input result.
 * @param fn Function applied to the success value.
 * @returns A new `Result<U, E>` with `fn` applied to the value, or the original
 *   error preserved.
 */
export const map = <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> => (isOk(r) ? ok(fn(r.value)) : r);

/**
 * Monadic bind (`>>=` / `flatMap`). Chains a computation that itself returns a
 * `Result`. If `r` is `err`, the function is not invoked and the error is
 * passed through.
 *
 * Use this when the next step can fail in a domain-specific way and you want
 * to short-circuit the chain — e.g. parsing then validating then persisting.
 *
 * @param r The input result.
 * @param fn Function applied to the success value; returns a new `Result`.
 * @returns The result of `fn(r.value)` when `r` is `ok`, or the original
 *   error when `r` is `err`.
 */
export const andThen = <T, U, E>(r: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> =>
  isOk(r) ? fn(r.value) : r;

/**
 * Functor map over the failure branch. Transforms the wrapped error if `r` is
 * `err`; passes `ok` through unchanged.
 *
 * Useful for translating between error domains at layer boundaries — e.g.
 * mapping a low-level `Error` to a typed `AppError` at the service boundary.
 *
 * @param r The input result.
 * @param fn Function applied to the error payload.
 * @returns A new `Result<T, F>` with `fn` applied to the error, or the
 *   original success value preserved.
 */
export const mapErr = <T, E, F>(r: Result<T, E>, fn: (e: E) => F): Result<T, F> => (isErr(r) ? err(fn(r.error)) : r);
