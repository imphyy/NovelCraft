import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-md shadow-paper p-10 border border-border">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-md flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <span className="text-primary text-3xl font-bold font-serif">N</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-2 font-serif tracking-tight">
              NovelCraft
            </h2>
            <p className="text-muted-foreground/60 text-sm uppercase tracking-widest">
              Create your account
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md flex items-start gap-2 text-sm">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-border/60 rounded-md bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/20"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-border/60 rounded-md bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/20"
                  placeholder="••••••••"
                />
                <p className="text-[10px] text-muted-foreground/40 mt-2 uppercase tracking-widest">Must be at least 8 characters</p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-border/60 rounded-md bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-md text-sm font-bold bg-primary text-primary-foreground hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-[0.2em]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign up
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-xs pt-8 border-t border-border/10">
              <span className="text-muted-foreground/60 uppercase tracking-widest">Already have an account? </span>
              <Link to="/login" className="font-bold text-primary/80 hover:text-primary transition-colors uppercase tracking-widest">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
