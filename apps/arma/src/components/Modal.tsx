import { useEffect, useRef, type ReactNode } from 'react';

/**
 * A modal dialog (<dialog> + showModal): focus inside, Esc closes, the page behind inert. It is opened on mount and
 * removed by unmounting it (onClose), never closed in a cleanup: StrictMode would close it right after opening.
 */
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog ref={ref} className={'modal' + (wide ? ' wide' : '')} aria-labelledby="modal-h" onClose={onClose}>
      <div className="modal-box">
        <h2 id="modal-h">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
