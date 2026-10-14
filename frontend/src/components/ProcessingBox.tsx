import React from 'react';
import { Loader2 } from 'lucide-react';

/** Props for the modal-like processing overlay. */
interface ProcessingBoxProps {
  message?: string;
}

/**
 * Full-screen translucent overlay with a spinner and message.
 * Useful while saving or loading.
 */
export default function ProcessingBox({ message = 'Processing...' }: ProcessingBoxProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
        <span className="text-gray-800">{message}</span>
      </div>
    </div>
  );
}
