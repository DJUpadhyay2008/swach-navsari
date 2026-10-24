import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  authSignInSchema,
  authSignUpSchema,
  AuthSignInInput,
  AuthSignUpInput,
} from '@/lib/validation/reports';
import { useAuth } from '@/features/auth';
import { NAVSARI_WARDS } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Lock, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, user, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  const from = (location.state as { from?: string })?.from || '/my-reports';

  // Sign In Form
  const signInForm = useForm<AuthSignInInput>({
    resolver: zodResolver(authSignInSchema),
    defaultValues: { email: '', password: '' },
  });

  // Sign Up Form
  const signUpForm = useForm<AuthSignUpInput>({
    resolver: zodResolver(authSignUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      wardNumber: 4,
      phone: '',
    },
  });

  const onSignInSubmit = async (data: AuthSignInInput) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await signIn(data.email, data.password);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      navigate(from, { replace: true });
    }
  };

  const onSignUpSubmit = async (data: AuthSignUpInput) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error, user: newUser } = await signUp(
      data.email,
      data.password,
      data.fullName,
      data.wardNumber,
      data.phone
    );
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
    } else if (newUser) {
      setSuccessMessage(
        'Account registered successfully! If email confirmation is enabled on your Supabase project, please check your inbox.'
      );
      // If auto-confirmed, navigate
      if (newUser.identities && newUser.identities.length > 0) {
        navigate(from, { replace: true });
      }
    }
  };

  if (user) {
    return (
      <div className="max-w-md mx-auto my-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-swach-500/10 border border-swach-500/30 flex items-center justify-center mx-auto text-swach-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Already Signed In</h2>
        <p className="text-xs text-slate-400">
          You are currently signed in as <strong className="text-slate-200">{user.email}</strong>.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button onClick={() => navigate('/report')} leftIcon={<ArrowRight className="w-4 h-4" />}>
            Report an Issue
          </Button>
          <Button variant="outline" onClick={() => navigate('/my-reports')}>
            View My Reports
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="default">Citizen Identity</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {mode === 'signin' ? 'Sign in to S.W.A.C.H.' : 'Register as Navsari Citizen'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          {mode === 'signin'
            ? 'Track your complaints, verify resolution evidence, and submit feedback.'
            : 'Join verified Navsari citizens to report and resolve local cleanliness issues.'}
        </p>
      </div>

      {!isConfigured && (
        <Alert variant="warning" title="Supabase Backend Required for Auth">
          Real user authentication requires configuring <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code>. Fake logins are disabled to
          maintain security integrity.
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" title="Authentication Notice">
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Success">
          {successMessage}
        </Alert>
      )}

      <Card>
        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'signin'
                ? 'bg-swach-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'signup'
                ? 'bg-swach-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Citizen Account
          </button>
        </div>

        {mode === 'signin' ? (
          <form onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  {...signInForm.register('email')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
                />
              </div>
              {signInForm.formState.errors.email && (
                <p className="text-xs text-rose-400">{signInForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...signInForm.register('password')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
                />
              </div>
              {signInForm.formState.errors.password && (
                <p className="text-xs text-rose-400">
                  {signInForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              disabled={!isConfigured}
            >
              Sign In to Account
            </Button>
          </form>
        ) : (
          <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. Ananya Patel"
                  {...signUpForm.register('fullName')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
                />
              </div>
              {signUpForm.formState.errors.fullName && (
                <p className="text-xs text-rose-400">
                  {signUpForm.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  {...signUpForm.register('email')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
                />
              </div>
              {signUpForm.formState.errors.email && (
                <p className="text-xs text-rose-400">{signUpForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  {...signUpForm.register('password')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
                />
              </div>
              {signUpForm.formState.errors.password && (
                <p className="text-xs text-rose-400">
                  {signUpForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Navsari Ward
                </label>
                <select
                  {...signUpForm.register('wardNumber')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-swach-500"
                >
                  {NAVSARI_WARDS.map((w) => (
                    <option key={w.number} value={w.number}>
                      Ward #{w.number} — {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+919876543210"
                  {...signUpForm.register('phone')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-swach-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              disabled={!isConfigured}
            >
              Create Citizen Account
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
