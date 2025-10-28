import React, { useState } from 'react';
import { Link } from "react-router-dom";

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    async function handleGoogleSignup() {
        setError('');
        setLoading(true);
        try {
            // await signInWithPopup(auth, googleProvider);
            setSuccess('Successfully signed up with Google!');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Google signup failed');
        } finally {
            setLoading(false);
        }
    }

    async function handleEmailSignup(e) {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            // await createUserWithEmailAndPassword(auth, email, password);
            setSuccess('Account created successfully!');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    }

    const GoogleIcon = () => (
        <svg width="20" height="20" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path fill="#4285F4" d="M533.5 278.4c0-18.8-1.6-37.1-4.7-54.7H272v103.6h146.9c-6.3 34.1-25 62.9-53.4 82v68.2h86.3c50.5-46.6 81.7-115.2 81.7-199z" />
            <path fill="#34A853" d="M272 544.3c72.9 0 134-24.1 178.7-65.4l-86.3-68.2c-24 16.1-54.6 25.6-92.4 25.6-71 0-131.3-47.8-152.8-112.1H34.2v70.8c44.8 88.7 138.4 149.3 237.8 149.3z" />
            <path fill="#FBBC05" d="M119.2 322.4c-10.6-31.6-10.6-65.7 0-97.3V154.3H34.2c-39.4 78.9-39.4 171 0 249.9l85-81.8z" />
            <path fill="#EA4335" d="M272 107.7c39.6 0 75.3 13.6 103.5 40.4l77.6-77.6C396.3 24.6 335.2 0 272 0 172.6 0 79 60.6 34.2 149.3l85 70.8C140.7 155.5 201 107.7 272 107.7z" />
        </svg>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-pink-50 p-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <h2 className="text-2xl font-semibold text-center mb-4">Create an Account</h2>
                <button onClick={handleGoogleSignup} disabled={loading} className="w-full flex items-center justify-center gap-3 border px-4 py-3 rounded-lg hover:shadow-sm transition-all mb-5" >
                    <GoogleIcon />
                    <span className="font-medium">Sign up with Google</span>
                </button>

                <div className="relative my-4">
                    <hr />
                    <div className="absolute left-1/2 -top-3 -translate-x-1/2 bg-white px-3 text-sm text-slate-400">or</div>
                </div>

                <form onSubmit={handleEmailSignup} className="space-y-4">
                    <label className="block">
                        <span className="text-sm text-slate-600">Email</span>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            placeholder="you@gmail.com"
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm text-slate-600">Password</span>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            placeholder="At least 6 characters"
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm text-slate-600">Confirm Password</span>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                    </label>

                    {error && <div className="text-sm text-red-600">{error}</div>}
                    {success && <div className="text-sm text-green-600">{success}</div>}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-medium rounded-md px-4 py-2 hover:brightness-95"
                        disabled={loading}
                    >
                        {loading ? 'Signing up...' : 'Create Account'}
                    </button>
                </form>

                <p className="mt-4 text-sm text-center text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-600 hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}