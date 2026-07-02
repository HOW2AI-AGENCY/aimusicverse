/**
 * Recharts v3 tightened Tooltip `Formatter` to require handling `ValueType | undefined`.
 * The project has ~20 chart panels using the v2 signature `(value: string|number, name?: string) => [...]`.
 * Rather than rewrite every callsite, we widen the Formatter alias back to accept
 * simpler, non-undefined-aware signatures. Runtime behaviour is unaffected — recharts
 * always passes a defined value for populated points.
 */
declare module "recharts/types/component/DefaultTooltipContent" {
  export type ValueType = number | string | Array<number | string>;
  export type NameType = number | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Formatter<TValue extends ValueType = ValueType, TName extends NameType = NameType> = (
    value: any,
    name?: any,
    item?: any,
    index?: number,
    payload?: any,
  ) => React.ReactNode | [React.ReactNode, TName];
}
