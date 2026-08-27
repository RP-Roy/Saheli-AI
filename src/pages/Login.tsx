import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

// ─── Login Page ───────────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const isDemoFallback = !isSupabaseConfigured();

  const handleDemoLogin = () => {
    localStorage.setItem('forceDemoMode', 'true');
    window.location.href = '/';
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    
    const { error } = await authService.signIn(email, password);
    
    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    
    const { error } = await authService.signUp(email, password, email.split('@')[0]);
    
    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg('Success! Please check your email for a confirmation link to log in. (Or disable Email Confirmations in your Supabase Auth settings).');
    }
    
    setIsLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
      <p className="text-slate-400 text-sm mb-6">Sign in to your Saheli account</p>

      {/* Demo mode shortcut */}
      <button
        type="button"
        id="demo-login-btn"
        onClick={handleDemoLogin}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all duration-200 mb-5"
      >
        <Sparkles className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold">Enter Demo Mode</p>
          <p className="text-xs text-amber-400/70 mt-0.5">{isDemoFallback ? 'Supabase not configured · Simulated data' : 'Bypass real authentication · Simulated data'}</p>
        </div>
        <span className="text-xs bg-amber-500/30 px-2 py-0.5 rounded-full">{isDemoFallback ? 'Fallback' : 'Demo'}</span>
      </button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs text-slate-500">
          <span className="bg-surface-800 px-3">or sign in with email</span>
        </div>
      </div>

      <form className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-400 text-sm">
            {errorMsg}
          </div>
        )}
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-surface-700/60 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-surface-700/60 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            onClick={handleSignUp}
            loading={isLoading}
          >
            Sign Up
          </Button>
          <Button
            type="button"
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleSignIn}
            loading={isLoading}
          >
            Sign In
          </Button>
        </div>
      </form>


    </div>
  );
}
