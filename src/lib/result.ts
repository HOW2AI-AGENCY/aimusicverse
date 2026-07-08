/**
 * Result<T, E> — discriminated union for fallible operations.
 *
 * Canonical usage at the service layer:
 *
 * ```ts
 * import { ok, err, isOk, map } from "@/lib/result";
 *
 * const r = await loadUser(id);
 * if (isOk(r)) return map(r, enrichUser);
 * return err(r.error);
 * ```
 *
 * @module lib/result
 */

export type Ok<T> = { readonly kind: "ok"; readonly value: T };
export type Err<E> = { readonly kind: "err"; readonly error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ kind: "ok", value });
export const err = <E>(error: E): Err<E> => ({ kind: "err", error });

export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.kind === "ok";
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => r.kind === "err";

export const map = <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> => (isOk(r) ? ok(fn(r.value)) : r);
