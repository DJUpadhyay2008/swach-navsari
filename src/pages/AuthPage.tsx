import { useState, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  authSignInSchema,
  authSignUpSchema,
  AuthSignInInput,
  AuthSignUpInput,
} from '@/lib/validation/reports';
import { useAuth, getSafePostLoginRedirect } from '@/features/auth';
import { NAVSARI_WARDS } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  HardHat,
  Users,
  RefreshCw,
  LogOut,
  Info,
} from 'lucide-react';

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputId = useId();
  const passwordInputId = useId();
  const nameInputId = useId();
  const wardInputId = useId();
  const phoneInputId = useId();

  const { signIn, signUp, user, roles, isLoading, isConfigured, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Retrieve any return path from query param ?returnTo= or router location state
  const requestedReturnTo =
    searchParams.get('returnTo') ||
    (location.state as { from?: string } | null)?.from ||
    null;

  // Sign In Form
  const signInForm = useForm<AuthSignInInput>({
    resolver: zodResolver(authSignInSchema),
    defaultValues: { email: '', password: '' },
  });

  // Sign Up Form (Citizen Account Only)
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

    const { error, roles: resolvedRoles } = await signIn(data.email, data.password);
    setIsSubmitting(false);

    if (error) {
      // Accessible, generic error feedback that never leaks account existence
      setErrorMessage(
        error.message.includes('Invalid login credentials')
          ? 'Invalid email or password. Please verify your credentials and try again.'
          : error.message
      );
    } else {
      const activeRoles = resolvedRoles && resolvedRoles.length > 0 ? resolvedRoles : roles;
      const destination = getSafePostLoginRedirect(activeRoles, requestedReturnTo);
      navigate(destination, { replace: true });
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
      if (error.message.toLowerCase().includes('already registered')) {
        setErrorMessage('This email is already registered. Please sign in instead.');
      } else {
        setErrorMessage(error.message);
      }
    } else if (newUser) {
      setSuccessMessage(
        'Citizen account created successfully! If email confirmation is required, please check your inbox.'
      );
      // If automatically confirmed or identities exist, route safely
      if (newUser.identities && newUser.identities.length > 0) {
        const destination = getSafePostLoginRedirect(['citizen'], requestedReturnTo);
        navigate(destination, { replace: true });
      }
    }
  };

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-swach-500/10 border border-swach-500/30 flex items-center justify-center mx-auto text-swach-400 animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-white">Verifying Account & Role...</h2>
        <p className="text-xs text-slate-400">Loading verified permissions from public.user_roles</p>
      </div>
    );
  }

  // 2. Already authenticated state
  if (user) {
    if (roles.length === 0) {
      return (
        <div className="max-w-md mx-auto my-12 px-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">No Assigned Role Found</h2>
          <p className="text-xs text-slate-400">
            Your account (<strong className="text-slate-200">{user.email}</strong>) does not have
            an active role registered in the Navsari directory. Please contact your municipal
            administrator.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => signOut()}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      );
    }

    const defaultDestination = getSafePostLoginRedirect(roles, requestedReturnTo);
    const isOfficial = roles.includes('municipal_official');
    const isWorker = roles.includes('sanitation_worker');
    const roleBadge = isOfficial ? 'Municipal Official' : isWorker ? 'Sanitation Worker' : 'Citizen';

    return (
      <div className="max-w-md mx-auto my-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-swach-500/10 border border-swach-500/30 flex items-center justify-center mx-auto text-swach-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <Badge variant="default">{roleBadge}</Badge>
          <h2 className="text-xl font-bold text-white">Already Signed In</h2>
          <p className="text-xs text-slate-400">
            You are currently signed in as <strong className="text-slate-200">{user.email}</strong>.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <Button
            onClick={() => navigate(defaultDestination, { replace: true })}
            leftIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isOfficial
              ? 'Open Municipal Portal'
              : isWorker
              ? 'Open Worker Portal'
              : 'Open My Reports'}
          </Button>
          <Button variant="outline" onClick={() => signOut()} leftIcon={<LogOut className="w-4 h-4" />}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated unified auth view
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header section */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="default">Unified Authentication</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Welcome to a Cleaner Navsari
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Sign in to access the services available to your account.
        </p>
      </div>

      {/* Role information cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Portal access roles">
        {/* Citizen Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Citizen</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Report cleanliness issues, track complaints, and participate in community initiatives.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            Public Registration Available
          </span>
        </div>

        {/* Municipal Official Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Municipal Official</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review complaints, assign workers, and verify resolutions across 13 wards.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Admin Provisioned Account
          </span>
        </div>

        {/* Sanitation Worker Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <HardHat className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Sanitation Worker</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              View assigned tasks, navigate to site, and submit completion evidence.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Supervisor Assigned Account
          </span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md mx-auto space-y-6">
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

        <Card className="bg-white border border-slate-200 shadow-sm p-6 sm:p-8 rounded-2xl">
          {/* Tab selector */}
          <div
            role="tablist"
            aria-label="Authentication modes"
            className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 mb-6"
          >
            <button
              type="button"
              role="tab"
              id="tab-signin"
              aria-selected={mode === 'signin'}
              aria-controls="panel-signin"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-lg transition-colors focus:outline-none ${
                mode === 'signin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              id="tab-signup"
              aria-selected={mode === 'signup'}
              aria-controls="panel-signup"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-lg transition-colors focus:outline-none ${
                mode === 'signup'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Citizen Account
            </button>
          </div>

          {mode === 'signin' ? (
            <div id="panel-signin" role="tabpanel" aria-labelledby="tab-signin" className="space-y-5">
              <form onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor={emailInputId}
                    className="text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      id={emailInputId}
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      {...signInForm.register('email')}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  {signInForm.formState.errors.email && (
                    <p className="text-xs text-rose-500" role="alert">
                      {signInForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={passwordInputId}
                    className="text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      id={passwordInputId}
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...signInForm.register('password')}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  {signInForm.formState.errors.password && (
                    <p className="text-xs text-rose-500" role="alert">
                      {signInForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  isLoading={isSubmitting}
                  disabled={!isConfigured}
                >
                  Sign In to Account
                </Button>
              </form>

              {/* Explanatory section for Municipal Official & Staff Sign In */}
              <div
                id="staff-signin-info"
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Municipal Official & Staff Sign In</span>
                </div>
                <p className="leading-relaxed text-slate-500">
                  Municipal officials and sanitation workers sign in using this same form. Staff
                  accounts are provisioned by Navsari municipal administration. Enter your
                  authorized credentials above to access your operational portal.
                </p>
              </div>
            </div>
          ) : (
            <div id="panel-signup" role="tabpanel" aria-labelledby="tab-signup" className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                <span className="font-bold text-emerald-900">Public Citizen Registration: </span>
                Create an account to report garbage, overflow, and hygiene issues in Navsari.
              </div>

              <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor={nameInputId}
                    className="text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      id={nameInputId}
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Ananya Patel"
                      {...signUpForm.register('fullName')}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                  {signUpForm.formState.errors.fullName && (
                    <p className="text-xs text-rose-500" role="alert">
                      {signUpForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`${emailInputId}-signup`}
                    className="text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      id={`${emailInputId}-signup`}
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      {...signUpForm.register('email')}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                  {signUpForm.formState.errors.email && (
                    <p className="text-xs text-rose-500" role="alert">
                      {signUpForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`${passwordInputId}-signup`}
                    className="text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      id={`${passwordInputId}-signup`}
                      type="password"
                      autoComplete="new-password"
                      placeholder="Minimum 6 characters"
                      {...signUpForm.register('password')}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                  {signUpForm.formState.errors.password && (
                    <p className="text-xs text-rose-500" role="alert">
                      {signUpForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor={wardInputId}
                      className="text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Navsari Ward
                    </label>
                    <select
                      id={wardInputId}
                      {...signUpForm.register('wardNumber')}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                    >
                      {NAVSARI_WARDS.map((w) => (
                        <option key={w.number} value={w.number}>
                          Ward #{w.number} — {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor={phoneInputId}
                      className="text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Phone (Optional)
                    </label>
                    <input
                      id={phoneInputId}
                      type="tel"
                      autoComplete="tel"
                      placeholder="+919876543210"
                      {...signUpForm.register('phone')}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  isLoading={isSubmitting}
                  disabled={!isConfigured}
                >
                  Create Citizen Account
                </Button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
