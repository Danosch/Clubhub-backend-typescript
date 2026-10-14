import React from 'react';

/** Props accepted by the shared `Input` component. */
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Styled input element with default border, focus ring, and support for
 * passing any native input attributes.
 */
export default function Input(props: InputProps) {
  return (
    <input
      {...props}
      className={`border border-gray-300 rounded p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
        props.className ?? ''
      }`}
    />
  );
}
