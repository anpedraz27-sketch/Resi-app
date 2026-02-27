import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building, Loader } from 'lucide-react';

interface LoginProps {
  onNavigate?: (view: 'login' | 'signup') => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const success = await login(email, pass);
    if (!success) {
      setError('Invalid credentials');
      setIsSubmitting(false);
    }
    // Success handles redirect in App.tsx via useEffect/State
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-100 p-8 rounded-card shadow-medium">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft">
            <Building className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to ResiApp</h1>
          <p className="text-slate-500 text-sm mt-2">Manage your building life seamlessly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font- medium text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              placeholder="you@edificio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              required
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              placeholder="••••••••"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium py-3 rounded-button transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? <Loader className="animate-spin w-5 h-5" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm font-medium text-slate-600 mb-3">Quick Login (Demo)</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@edificio.com');
                setPass('admin123');
              }}
              className="px-3 py-2 text-xs font-semibold rounded-button bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('vecino@edificio.com');
                setPass('vecino123');
              }}
              className="px-3 py-2 text-xs font-semibold rounded-button bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
            >
              Resident
            </button>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-sm font-medium text-slate-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate?.('signup')}
                className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
