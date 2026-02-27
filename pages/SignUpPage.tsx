import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building, Loader } from 'lucide-react';

interface SignUpPageProps {
    onNavigate?: (view: 'login' | 'signup') => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate }) => {
    const { signUp } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [apartment, setApartment] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccessMsg('');

        const { success, error: signUpError } = await signUp(email, pass, fullName, apartment);

        if (!success) {
            setError(signUpError || 'Error during sign up');
            setIsSubmitting(false);
        } else {
            setSuccessMsg('Sign up successful! You can now log in.');
            setIsSubmitting(false);
            // Wait a moment before redirecting
            setTimeout(() => {
                onNavigate?.('login');
            }, 2000);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white border border-slate-100 p-8 rounded-card shadow-medium">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft">
                        <Building className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create an Account</h1>
                    <p className="text-slate-500 text-sm mt-2">Join ResiApp to manage your building life.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                            placeholder="Maria Garcia"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
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
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Apartment Number (Optional)</label>
                        <input
                            type="text"
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                            placeholder="e.g. 101"
                            value={apartment}
                            onChange={(e) => setApartment(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm text-center bg-red-50 p-2 rounded-md">{error}</p>}
                    {successMsg && <p className="text-green-600 text-sm text-center bg-green-50 p-2 rounded-md">{successMsg}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium py-3 rounded-button transition-colors disabled:opacity-50 flex items-center justify-center mt-6"
                    >
                        {isSubmitting ? <Loader className="animate-spin w-5 h-5" /> : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm font-medium text-slate-600">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => onNavigate?.('login')}
                            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                        >
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
