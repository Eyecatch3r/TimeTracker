import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LockKeyhole, LogIn, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const RESEND_COOLDOWN_SECONDS = 60;

interface AuthGateProps {
    children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [email, setEmail] = useState('');
    const [linkSent, setLinkSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        void supabase.auth.getSession().then(({ data, error: sessionError }) => {
            if (!mounted) return;

            setSession(data.session);
            setError(sessionError?.message ?? '');
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession);
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = window.setInterval(() => {
            setCooldown((remaining) => Math.max(remaining - 1, 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [cooldown]);

    const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        const { error: signInError } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
                emailRedirectTo: window.location.origin,
                shouldCreateUser: false,
            },
        });

        if (signInError) {
            const rateLimited = signInError.message.toLowerCase().includes('rate limit');
            setError(
                rateLimited
                    ? 'Supabase allows only two emails per hour on its built-in mail service. Try again after the hourly limit resets.'
                    : signInError.message,
            );
        } else {
            setLinkSent(true);
            setCooldown(RESEND_COOLDOWN_SECONDS);
        }

        setSubmitting(false);
    };

    const handleSignOut = async () => {
        setSubmitting(true);
        setError('');

        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
            setError(signOutError.message);
        }

        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="flex min-h-[12rem] items-center justify-center text-blue-200">
                <span className="loading loading-spinner loading-lg" aria-label="Checking session" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900/95 p-8 text-white shadow-2xl backdrop-blur-md">
                <div className="mb-6 flex flex-col items-center gap-3 text-center">
                    <div className="rounded-full bg-blue-500/15 p-3 text-blue-300">
                        <LockKeyhole size={28} aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-blue-100">Time Tracker</h1>
                        <p className="mt-1 text-sm text-blue-300">Use your owner email to receive a sign-in link.</p>
                    </div>
                </div>

                <form className="space-y-4" onSubmit={handleSignIn}>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-blue-100" htmlFor="auth-email">
                            Email
                        </label>
                        <input
                            id="auth-email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {error && (
                        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
                            {error}
                        </p>
                    )}

                    {linkSent && (
                        <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300" role="status">
                            Sign-in link sent. Check your email, including spam.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || cooldown > 0}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <LogIn size={18} aria-hidden="true" />
                        {submitting
                            ? 'Sending...'
                            : cooldown > 0
                                ? `Resend in ${cooldown}s`
                                : linkSent
                                    ? 'Resend sign-in link'
                                    : 'Email sign-in link'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={handleSignOut}
                disabled={submitting}
                className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-blue-200 shadow-lg backdrop-blur hover:bg-slate-800 disabled:opacity-60"
                title={session.user.email}
            >
                <LogOut size={16} aria-hidden="true" />
                Sign out
            </button>
            {error && (
                <p className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-red-500/30 bg-slate-900 px-3 py-2 text-sm text-red-300" role="alert">
                    {error}
                </p>
            )}
            {children}
        </>
    );
}
