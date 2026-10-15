import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../../../services/api';

type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>;

function parseError(err: unknown): { message: string; fieldErrors: FieldErrors; status?: number } {
  const fallback = { message: 'Something went wrong. Please try again.', fieldErrors: {} as FieldErrors };
  if (err instanceof ApiError) {
    return { message: err.message, fieldErrors: {}, status: err.status };
  }
  const anyErr = err as any;
  if (typeof anyErr?.message === 'string') {
    return { message: anyErr.message, fieldErrors: {}, status: anyErr.status };
  }
  if (typeof err === 'string') return { message: err, fieldErrors: {} };
  if (err instanceof Error) return { message: err.message, fieldErrors: {} };
  return fallback;
}

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800 relative" role="alert" aria-live="assertive">
      <div className="flex">
        <div className="flex-1">
          <p className="font-semibold">We couldn’t complete your registration</p>
          <p className="text-sm mt-1 whitespace-pre-line">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function Modal({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  const dlgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) dlgRef.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        ref={dlgRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="modal-title" className="text-lg font-semibold mb-1">
          {title}
        </h2>
        <p className="text-sm text-gray-700 whitespace-pre-line mb-4">{message}</p>
        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showBadRequestModal, setShowBadRequestModal] = useState(false);
  const [badRequestText, setBadRequestText] = useState('');

  const validate = (field?: keyof FieldErrors): boolean => {
    const fe: FieldErrors = { ...fieldErrors };

    // Name
    if (!field || field === 'name') {
      if (!name.trim()) fe.name = 'Please enter your name.';
      else delete fe.name;
    }

    // Email (immediate domain rule)
    if (!field || field === 'email') {
      if (!email.trim()) fe.email = 'Email is required.';
      else if (!email.endsWith('@study.thws.de')) fe.email = 'Email must end with @study.thws.de';
      else delete fe.email;
    }

    // Password
    if (!field || field === 'password') {
      if (password.length < 6) fe.password = 'Password must be at least 6 characters.';
      else delete fe.password;
    }

    // Confirm Password
    if (!field || field === 'confirmPassword') {
      if (confirmPassword !== password) fe.confirmPassword = 'Passwords do not match.';
      else delete fe.confirmPassword;
    }

    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const handleBlur = (f: keyof FieldErrors) => validate(f);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setShowBadRequestModal(false);
    setBadRequestText('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      // Flash a success message on the login page
      navigate('/login', {
        state: {
          flash: { type: 'success', message: 'Your account was created successfully. Please log in.' },
        },
      });
    } catch (err) {
      const { message, fieldErrors: fe, status } = parseError(err);
      setFieldErrors(prev => ({ ...prev, ...fe }));
      setErrorMsg(message);

      if (status === 400) {
        const detailList = Object.entries(fe)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
        setBadRequestText(detailList ? `${message}\n\n${detailList}` : message);
        setShowBadRequestModal(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center">Register</h1>

        {errorMsg && <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />}

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div>
            <Input
              placeholder="Name"
              value={name}
              onChange={e => {
                setName(e.target.value);
                validate('name');
              }}
              onBlur={() => handleBlur('name')}
              required
              aria-invalid={!!fieldErrors.name}
              className={`w-full ${fieldErrors.name ? 'ring-1 ring-red-400' : ''}`}
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                validate('email'); // live domain validation
              }}
              onBlur={() => handleBlur('email')}
              required
              aria-invalid={!!fieldErrors.email}
              className={`w-full ${fieldErrors.email ? 'ring-1 ring-red-400' : ''}`}
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                validate('password');
                validate('confirmPassword');
              }}
              onBlur={() => handleBlur('password')}
              required
              aria-invalid={!!fieldErrors.password}
              className={`w-full ${fieldErrors.password ? 'ring-1 ring-red-400' : ''}`}
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Repeat Password"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                validate('confirmPassword');
              }}
              onBlur={() => handleBlur('confirmPassword')}
              required
              aria-invalid={!!fieldErrors.confirmPassword}
              className={`w-full ${fieldErrors.confirmPassword ? 'ring-1 ring-red-400' : ''}`}
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Registering…' : 'Register'}
          </Button>
        </form>

        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-600 hover:underline">
            Log In
          </Link>
        </p>
      </div>

      {/* Styled popup for 400 Bad Request */}
      <Modal
        open={showBadRequestModal}
        title="Please fix the highlighted fields"
        message={badRequestText}
        onClose={() => setShowBadRequestModal(false)}
      />
    </div>
  );
}
