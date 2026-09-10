import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  formatAuthError,
} from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { user: authedUser, isPending } = useCurrentUserState();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<"social" | "email">("social");
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const firebaseReady = isFirebaseConfigured();

  // If user is already authed, navigate to the main page
  useEffect(() => {
    if (!isPending && authedUser) {
      navigate({ to: "/" });
    }
  }, [authedUser, isPending, navigate]);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      if (!firebaseReady) {
        setErrorMessage(
          "Firebase credentials not found in .env.local. You can enter instantly in Local Dev Mode below, or fill in your VITE_FIREBASE_* variables."
        );
        setLoading(false);
        return;
      }
      const user = await loginWithGoogle();
      if (user) {
        navigate({ to: "/" });
      }
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (!firebaseReady) {
        setErrorMessage(
          "Firebase credentials not found in .env.local. Please configure Firebase or use Local Dev Mode."
        );
        setLoading(false);
        return;
      }

      if (isRegistering) {
        await registerWithEmail(email, password, displayName);
      } else {
        await loginWithEmail(email, password);
      }
      navigate({ to: "/" });
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-gradient-to-tr from-indigo-100/60 via-purple-50/70 to-pink-100/60 font-sans px-4 py-8">
      {/* Background ambient blur decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/50 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/50 blur-[120px] pointer-events-none" />

      {/* Main card wrapper */}
      <div className="w-full max-w-[440px] bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(100,116,139,0.12)] border border-slate-100/60 relative z-10 transition-all duration-300">
        {/* Firebase Status Badge */}
        <div className="flex justify-center mb-6">
          {firebaseReady ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Firebase Backend Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Local Mode (Firebase setup in .env.local)
            </span>
          )}
        </div>

        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          {/* Logo */}
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-4 shadow-[0_8px_16px_rgba(79,70,229,0.25)]">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome to ReliefNet
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 text-center">
            Disaster relief coordination platform
          </p>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Action Connectors */}
        <div className="space-y-3">
          {/* Native Firebase Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50/80 text-sm font-semibold text-slate-700 transition-all duration-200 cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {loading ? "Signing in..." : "Continue with Google"}
          </button>

          {/* Email / Password toggle */}
          {authMode === "email" ? (
            <form onSubmit={handleEmailAuth} className="mt-4 space-y-3 pt-2">
              {isRegistering && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow cursor-pointer disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : isRegistering
                  ? "Create Account"
                  : "Sign In with Email"}
              </button>
              <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-indigo-600 hover:underline cursor-pointer"
                >
                  {isRegistering
                    ? "Already have an account? Sign in"
                    : "Need an account? Sign up"}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("social")}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Back
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAuthMode("email")}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 transition-all cursor-pointer"
            >
              Sign in with Email & Password
            </button>
          )}

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">or</span>
            </div>
          </div>

          {/* Local Dev / Instant Access Button */}
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
          >
            Enter ReliefNet (Local Dev Mode)
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-400">
          Disaster relief coordination ledger · All transfers verifiable
        </div>
      </div>
    </div>
  );
}
