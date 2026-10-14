import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../../../services/api';

type FieldErrors = Partial<Record<'email' | 'password', string>>;
type FlashState = { flash?: { type?: string; message?: string } };

function parseError(err: unknown): { message: string; status?: number } {
  const fallback = { message: 'Login failed. Please try again.' };
  if (err instanceof ApiError) {
    return { message: err.message, status: err.status };
  }
  const anyErr = err as any;
  if (typeof anyErr?.message === 'string') return { message: anyErr.message, status: anyErr.status };
  if (typeof err === 'string') return { message: err };
  if (err instanceof Error) return { message: err.message };
  return fallback;
}

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800 relative" role="alert" aria-live="assertive">
      <div className="flex">
        <div className="flex-1">
          <p className="font-semibold">We couldn’t sign you in</p>
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

function SuccessBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="rounded-md border border-green-200 bg-green-50 p-3 text-green-800 relative" role="status" aria-live="polite">
      <div className="flex">
        <div className="flex-1">
          <p className="font-semibold">Success</p>
          <p className="text-sm mt-1">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-300"
          aria-label="Dismiss success"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // keep full Location type
  const flashState = (location.state as FlashState | null) ?? null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pick up flash message from RegisterPage or ?registered=1
  useEffect(() => {
    if (flashState?.flash?.type === 'success' && flashState.flash.message) {
      setSuccessMsg(flashState.flash.message);
      // Clear history state so refresh doesn’t re-show it
      navigate(location.pathname, { replace: true });
      return;
    }

    // Optional: handle query param fallback like /login?registered=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') {
      setSuccessMsg('Your account was created successfully. Please log in.');
      params.delete('registered');
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState(null, '', newUrl);
    }
  }, [flashState, location.pathname, navigate]);

  const validate = (field?: keyof FieldErrors): boolean => {
    const fe: FieldErrors = { ...fieldErrors };

    if (!field || field === 'email') {
      if (!email.trim()) fe.email = 'Email is required.';
      else delete fe.email;
    }
    if (!field || field === 'password') {
      if (!password) fe.password = 'Password is required.';
      else delete fe.password;
    }

    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const handleBlur = (f: keyof FieldErrors) => validate(f);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/explore');
    } catch (err) {
      const { message } = parseError(err);
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center">Log In</h1>

        {successMsg && <SuccessBanner message={successMsg} onClose={() => setSuccessMsg(null)} />}
        {errorMsg && <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />}

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                validate('email');
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
              }}
              onBlur={() => handleBlur('password')}
              required
              aria-invalid={!!fieldErrors.password}
              className={`w-full ${fieldErrors.password ? 'ring-1 ring-red-400' : ''}`}
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Log In'}
          </Button>
        </form>

        <p className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-orange-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
