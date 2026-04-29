import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import clsx from "clsx";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";

interface DialogShellProps {
  isOpen: boolean;
  onClose: () => void;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: "accent" | "loss";
  children: ReactNode;
  footer: ReactNode;
  size?: "md" | "lg" | "xl";
}

const TONE_GRADIENT: Record<NonNullable<DialogShellProps["tone"]>, string> = {
  accent:
    "before:bg-[radial-gradient(ellipse_at_top_left,_rgba(124,131,231,0.18)_0%,_transparent_60%)]",
  loss: "before:bg-[radial-gradient(ellipse_at_top_left,_rgba(239,68,68,0.16)_0%,_transparent_60%)]",
};

const TONE_ICON: Record<NonNullable<DialogShellProps["tone"]>, string> = {
  accent: "bg-accent/15 text-accent ring-1 ring-accent/25",
  loss: "bg-loss/15 text-loss ring-1 ring-loss/25",
};

export function DialogShell({
  isOpen,
  onClose,
  icon: Icon,
  title,
  subtitle,
  tone = "accent",
  children,
  footer,
  size = "lg",
}: DialogShellProps) {
  return (
    <Modal
      backdrop="blur"
      classNames={{
        backdrop: "bg-ink-950/70",
        wrapper: "items-center",
        base: clsx(
          "relative overflow-hidden border border-white/10 bg-ink-900/95",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-48 before:opacity-100",
          TONE_GRADIENT[tone],
        ),
        header: "p-0",
        body: "p-0",
        footer: "p-0 border-t border-white/[0.06] bg-black/20",
      }}
      hideCloseButton
      isOpen={isOpen}
      size={size}
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader>
          <div className="relative flex w-full items-center gap-3 px-6 pb-4 pt-5">
            <div
              className={clsx(
                "grid h-10 w-10 place-items-center rounded-xl",
                TONE_ICON[tone],
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 text-[11px] text-ink-400">{subtitle}</p>
              )}
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-5 px-6 pb-6 pt-2">{children}</div>
        </ModalBody>
        <ModalFooter>
          <div className="flex w-full items-center justify-between gap-2 px-6 py-4">
            {footer}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
