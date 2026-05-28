import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-6 overflow-hidden bg-slate-50">
      {/* Background Animated Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="glass rounded-[2.5rem] p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 mb-6"
            >
              <Briefcase size={32} />
            </motion.div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">WorkZen HRMS</h1>
            <p className="text-slate-500 mt-2 font-medium">Elevate your workspace management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                >
                  <ShieldCheck size={18} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="input-field pl-11"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="input-field pl-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <div className="pt-4 text-center">
              <p className="text-sm text-slate-500 font-medium">
                New to the platform?{' '}
                <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} WorkZen Solutions. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};
