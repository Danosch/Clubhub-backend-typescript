import React from 'react';

/** Props for a simple on/off toggle button. */
type ToggleProps = {
  checked: boolean;
  onChange: () => void;
};

/**
 * Accessible toggle switch with animated knob. Calls `onChange` when toggled.
 */
export default function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-orange-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
