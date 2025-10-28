import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // giả lập: onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const handleBack = () => navigate("/"); // 👈 nút quay lại

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    try {
      // await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSignUp(e) {
    e.preventDefault();
    navigate("/signup");
  }

  async function handleEmailSignIn(e) {
    e.preventDefault();
  }

  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path fill="#4285F4" d="M533.5 278.4c0-18.8-1.6-37.1-4.7-54.7H272v103.6h146.9c-6.3 34.1-25 62.9-53.4 82v68.2h86.3c50.5-46.6 81.7-115.2 81.7-199z"/>
      <path fill="#34A853" d="M272 544.3c72.9 0 134-24.1 178.7-65.4l-86.3-68.2c-24 16.1-54.6 25.6-92.4 25.6-71 0-131.3-47.8-152.8-112.1H34.2v70.8c44.8 88.7 138.4 149.3 237.8 149.3z"/>
      <path fill="#FBBC05" d="M119.2 322.4c-10.6-31.6-10.6-65.7 0-97.3V154.3H34.2c-39.4 78.9-39.4 171 0 249.9l85-81.8z"/>
      <path fill="#EA4335" d="M272 107.7c39.6 0 75.3 13.6 103.5 40.4l77.6-77.6C396.3 24.6 335.2 0 272 0 172.6 0 79 60.6 34.2 149.3l85 70.8C140.7 155.5 201 107.7 272 107.7z"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-slate-200"
      >
        {/* 🔙 Nút Back ở góc trên trái */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 text-slate-500 hover:text-slate-700 transition"
        >
          ← Back
        </button>

        <div className="flex items-center gap-4 mt-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">A</div>
          <div>
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="text-sm text-slate-500">Sign in to continue to your app</p>
          </div>
        </div>

        {!user ? (
          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 border px-4 py-3 rounded-lg hover:shadow-sm transition-shadow active:scale-98"
              disabled={loading}
            >
              <GoogleIcon />
              <span className="font-medium">Continue with Google</span>
            </button>

            <div className="relative my-6">
              <hr />
              <div className="absolute left-1/2 -top-3 -translate-x-1/2 bg-white px-3 text-sm text-slate-400">or</div>
            </div>

            <form className="space-y-4" onSubmit={handleEmailSignIn}>
              <label className="block">
                <span className="text-sm text-slate-600">Email</span>
                <input
                  type="email"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="•••••••"
                />
              </label>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white font-medium rounded-md px-4 py-2 hover:brightness-95"
                  disabled={loading}
                >
                  Sign in
                </button>
                <button
                  onClick={handleEmailSignUp}
                  className="flex-1 border rounded-md px-4 py-2 hover:bg-slate-50"
                  disabled={loading}
                >
                  Create account
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-4">
            <img
              src={user.photoURL || 'https://via.placeholder.com/96'}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover"
            />
            <div className="text-center">
              <div className="font-semibold text-lg">{user.displayName || user.email}</div>
              <div className="text-sm text-slate-500">{user.email}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => {}} className="px-4 py-2 rounded-md border">Sign out</button>
            </div>
          </div>
        )}
      </motion.div>

      <div className="fixed right-6 bottom-6 text-xs text-slate-400">
        Built with ❤️ — Tailwind + Firebase
      </div>
    </div>
  );
}
