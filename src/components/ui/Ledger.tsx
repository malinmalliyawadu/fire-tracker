import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

import clsx from "clsx";
import { ChevronRight } from "lucide-react";

/**
 * Ledger primitives. Tables are the native form for money: rows ruled by
 * hairlines, figures right-aligned and tabular, the whole row the target.
 */

interface LedgerProps {
  children: ReactNode;
  className?: string;
  /** Column widths, as `<col>` widths. */
  cols?: Array<string | undefined>;
}

export function Ledger({ children, className, cols }: LedgerProps) {
  return (
    <div className={clsx("-mx-3 overflow-x-auto px-3", className)}>
      <table className="w-full border-collapse text-[14px]">
        {cols && (
          <colgroup>
            {cols.map((width, i) => (
              <col key={i} style={width ? { width } : undefined} />
            ))}
          </colgroup>
        )}
        {children}
      </table>
    </div>
  );
}

export function LedgerHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="text-[12.5px] text-ink-3">{children}</tr>
    </thead>
  );
}

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "right";
}

export function Th({ align = "left", className, children, ...rest }: ThProps) {
  return (
    <th
      className={clsx(
        "whitespace-nowrap border-b border-line pb-2 pr-4 font-normal last:pr-0",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
      scope="col"
      {...rest}
    >
      {children}
    </th>
  );
}

interface RowProps {
  children: ReactNode;
  /** Makes the whole row a button that opens the editor. */
  onOpen?: () => void;
  label?: string;
  className?: string;
  muted?: boolean;
}

export function LedgerRow({
  children,
  onOpen,
  label,
  className,
  muted,
}: RowProps) {
  return (
    <tr
      aria-label={onOpen ? label : undefined}
      className={clsx(
        "group border-b border-line-soft last:border-b-0",
        onOpen &&
          "cursor-pointer transition-colors duration-[var(--dur-hover)] hover:bg-wash focus-visible:bg-wash focus-visible:outline-none",
        muted && "text-ink-3",
        className,
      )}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={
        onOpen
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen();
              }
            }
          : undefined
      }
    >
      {children}
    </tr>
  );
}

interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "right";
  /** Tabular figures. */
  num?: boolean;
}

export function Td({
  align = "left",
  num,
  className,
  children,
  ...rest
}: TdProps) {
  return (
    <td
      className={clsx(
        "py-3 pr-4 align-middle first:rounded-l-md last:rounded-r-md last:pr-0",
        align === "right" && "text-right",
        num && "num",
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

/** The trailing cell on an openable row: a chevron that steps forward on hover. */
export function OpenCell() {
  return (
    <td className="w-6 py-3 pl-2 text-right align-middle">
      <ChevronRight
        aria-hidden
        className="inline h-4 w-4 text-ink-4 transition-[transform,color] duration-[var(--dur-hover)] ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:text-ink"
      />
    </td>
  );
}

/** Primary text with an optional second line beneath it. */
export function Cell({
  primary,
  secondary,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium text-ink">{primary}</div>
      {secondary && (
        <div className="mt-0.5 truncate text-[12.5px] text-ink-3">
          {secondary}
        </div>
      )}
    </div>
  );
}
