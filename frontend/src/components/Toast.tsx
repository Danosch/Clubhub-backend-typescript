import React, { useEffect } from 'react';

/** Props for the transient toast message. */
interface ToastProps {
  message: string;
  onClose: () => void;
}

/**
 * Small toast notification that auto-dismisses after 3 seconds.
 */
export default function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow">
      {message}
    </div>
  );
}
