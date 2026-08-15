import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import clsx from "clsx";
import { X } from "lucide-react";
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
  /** Leading footer slot — a destructive action, or nothing. */
  footerStart?: ReactNode;
  /** Trailing footer slot — cancel and the primary action. */
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
  footerStart,
  footer,
  size = "lg",
}: DialogShellProps) {
  return (
    <Modal
      hideCloseButton
      backdrop="blur"
      classNames={{
        backdrop: "bg-ink-950/70",
        wrapper: "items-center",
        base: clsx(
          "relative mx-4 my-4 overflow-hidden border border-white/10 bg-ink-900/95 sm:mx-6 sm:my-8",
          // Whatever the content, the chrome stays on screen and the fields
          // scroll between it.
          "max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)]",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-48 before:opacity-100",
          TONE_GRADIENT[tone],
        ),
        header: "shrink-0 border-b border-white/[0.06] p-0",
        body: "p-0",
        footer: "shrink-0 border-t border-white/[0.06] bg-black/20 p-0",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size={size}
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader>
          <div className="relative flex w-full items-start gap-3 px-6 py-4">
            <div
              className={clsx(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                TONE_ICON[tone],
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-base font-semibold leading-tight tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-[11px] leading-snug text-ink-300">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              aria-label="Close"
              className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              type="button"
              onClick={onClose}
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-5 px-6 py-5">{children}</div>
        </ModalBody>
        <ModalFooter>
          <div className="flex w-full items-center justify-between gap-3 px-6 py-4">
            {footerStart ?? <span />}
            <div className="flex items-center gap-2">{footer}</div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
