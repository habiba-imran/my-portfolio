"use client";
import { useEffect, useRef, type ReactNode, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function Dialog({
  children,
  titleId,
  onClose,
  fullScreen = false,
}: {
  children: ReactNode;
  titleId: string;
  onClose: () => void;
  fullScreen?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first) {
      event.preventDefault();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      id={fullScreen ? "site-menu" : "project-dialog"}
      className={`dialog ${fullScreen ? "menu-dialog" : "case-dialog"}`}
      aria-labelledby={titleId}
      onKeyDown={containFocus}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-content">
        <button
          type="button"
          className="dialog-close"
          onClick={onClose}
          aria-label={fullScreen ? "Close menu" : "Close case study"}
          autoFocus
        >
          <X size={22} aria-hidden="true" />
        </button>
        {children}
      </div>
    </dialog>,
    document.body,
  );
}
