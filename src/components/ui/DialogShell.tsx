import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { X } from "lucide-react";
import { useReducedMotion } from "framer-motion";
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
  children: ReactNode;
  /** Leading footer slot: a destructive action, or nothing. */
  footerStart?: ReactNode;
  /** Trailing footer slot: cancel and the primary action. */
  footer: ReactNode;
  size?: "md" | "lg" | "xl";
}

/**
 * The dialog frame. HeroUI's Modal supplies the focus trap, scroll lock and
 * escape handling; everything visible is ours.
 *
 * Motion: 220ms in from scale .97, exit a third faster. A dialog is not
 * anchored to its trigger, so it keeps a centred origin.
 */
export function DialogShell({
  isOpen,
  onClose,
  icon: Icon,
  title,
  subtitle,
  children,
  footerStart,
  footer,
  size = "lg",
}: DialogShellProps) {
  const reduce = useReducedMotion();

  return (
    <Modal
      hideCloseButton
      backdrop="opaque"
      classNames={{
        backdrop: "bg-[color:var(--bg-deep)]/70 backdrop-blur-[2px]",
        wrapper: "items-end sm:items-center",
        base: [
          "m-0 overflow-hidden rounded-t-2xl border border-line-soft bg-surface shadow-dialog sm:m-6 sm:rounded-2xl",
          "max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-4rem)]",
          "text-ink",
        ].join(" "),
        header: "shrink-0 p-0",
        body: "p-0",
        footer: "shrink-0 border-t border-line-soft bg-surface-2 p-0",
      }}
      isOpen={isOpen}
      motionProps={{
        variants: {
          enter: {
            opacity: 1,
            transform: "scale(1) translateY(0px)",
            transition: {
              duration: reduce ? 0.12 : 0.22,
              ease: [0.23, 1, 0.32, 1],
            },
          },
          exit: {
            opacity: 0,
            transform: reduce ? "scale(1)" : "scale(0.97) translateY(6px)",
            transition: {
              duration: reduce ? 0.08 : 0.15,
              ease: [0.23, 1, 0.32, 1],
            },
          },
        },
        initial: {
          opacity: 0,
          transform: reduce ? "scale(1)" : "scale(0.97) translateY(6px)",
        },
      }}
      scrollBehavior="inside"
      size={size}
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex w-full items-start gap-3.5 px-6 pb-4 pt-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink text-on-ink">
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-[18px] font-semibold leading-tight tracking-[-0.01em]">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-[13px] leading-snug text-ink-3">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              aria-label="Close"
              className="press -mr-2 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md text-ink-3 transition-colors duration-[var(--dur-hover)] hover:bg-wash hover:text-ink"
              type="button"
              onClick={onClose}
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-5 px-6 pb-6 pt-1">{children}</div>
        </ModalBody>
        <ModalFooter>
          <div className="flex w-full items-center justify-between gap-3 px-6 py-3.5">
            {footerStart ?? <span />}
            <div className="flex items-center gap-2">{footer}</div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
