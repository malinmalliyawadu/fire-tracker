// TEMPORARY SHIM while pages are ported to Section/Panel. Delete when unused.
import type { ReactNode } from "react";

import { Section } from "@/components/ui/Section";

export function Card({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <Section aside={action} className={className} title={title}>
      {children}
    </Section>
  );
}
