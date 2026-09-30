'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  Store, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  ShoppingBag,
  Loader2
} from 'lucide-react';

const Login = () => {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Silakan isi username dan password.');
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      if (result.user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/kasir');
      }
    } else {
      setError(result.message || 'Username atau password salah.');
    }
  };

  // Helper untuk quick demo
  const fillCredentials = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        
        {/* Card Header Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 mb-3">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            KASIR <span className="text-emerald-400">DITO</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Sistem Kasir & Point of Sale (POS) Tugas Sekolah
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/30 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Masuk ke Sistem</h2>
            <p className="text-xs text-slate-500 mt-1">
              Masukkan kredensial akun Admin atau Petugas kasir Anda.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-2.5">
              Akun Uji Coba Cepat (Klik untuk Mengisi):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin', 'admin123')}
                className="py-1.5 px-2.5 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('petugas', 'petugas123')}
                className="py-1.5 px-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Petugas</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
