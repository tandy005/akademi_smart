'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useRole } from '@/context/RoleContext';
import {
  Shield,
  Award,
  User,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Database,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useRole();

  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'COACH' | 'MEMBER'>('ADMIN');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRoleSelect = (role: 'ADMIN' | 'COACH' | 'MEMBER') => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'ADMIN') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'COACH') {
      setUsername('coach');
      setPassword('coach123');
    } else {
      setUsername('atlet');
      setPassword('atlet123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        setSuccessMessage('Login berhasil! Mengalihkan ke halaman utama...');
        setTimeout(() => {
          router.push('/');
        }, 700);
      } else {
        setErrorMessage(result.error || 'Username atau password tidak cocok');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan atau server saat login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0303] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-smart-maroon/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-smart-gold/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Container Card (Split Layout based on UI/loginPage.png) */}
      <div className="w-full max-w-5xl bg-[#140606] border border-smart-border-light/70 rounded-3xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col lg:flex-row relative z-10 min-h-[580px]">
        
        {/* ================= LEFT SIDE: BRANDING, LOGO & WELCOME ================= */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#0f0404] via-[#240606] to-[#5e0707] p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden text-white">
          {/* Subtle Decorative Wave & Circle Patterns */}
          <div className="absolute -top-16 -left-16 w-56 h-56 bg-smart-red/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-10 -left-10 w-48 h-48 bg-smart-gold/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* SVG Organic Wave Divider on Right Edge (Visible on desktop lg+) */}
          <div className="hidden lg:block absolute top-0 bottom-0 -right-[1px] w-24 pointer-events-none z-10">
            <svg
              className="w-full h-full text-slate-100"
              viewBox="0 0 100 600"
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path
                d="M100,0 L100,600 L80,600 C30,450 110,320 40,180 C-10,80 70,0 80,0 Z"
                className="text-slate-100 fill-current"
              />
            </svg>
            {/* Golden Edge Accent Line along wave */}
            <svg
              className="absolute top-0 bottom-0 left-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 600"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M80,0 C70,0 -10,80 40,180 C110,320 30,450 80,600"
                stroke="#D99016"
                strokeWidth="2.5"
                strokeOpacity="0.75"
              />
            </svg>
          </div>

          {/* Top Header Badge */}
          <div className="flex items-center gap-2 relative z-20">
            <div className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-smart-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-smart-gold"></span>
            </div>
            <span className="text-xs font-bold tracking-wider text-smart-gold uppercase">
              Akademi Voly Smart 09
            </span>
          </div>

          {/* Center Graphic: LogoAkademi.png */}
          <div className="my-8 flex flex-col items-center sm:items-start text-center sm:text-left relative z-20">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-6 rounded-3xl bg-gradient-to-br from-smart-dark/90 to-smart-card border-2 border-smart-gold/50 p-2 shadow-2xl shadow-smart-red/30 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <Image
                src="/LogoAkademi.png"
                alt="Logo Akademi Voly Smart 09"
                width={160}
                height={160}
                className="w-full h-full object-contain drop-shadow-lg"
                priority
              />
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Hi! Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-sm font-normal">
              Sistem Manajemen Terpadu &amp; Smart Reminder Bola Voli
            </p>
          </div>

          {/* Footer Copyright on Left Side */}
          <div className="text-xs text-slate-400/80 font-medium relative z-20 pt-4 border-t border-white/10 flex items-center justify-between">
            <span>copyright &copy; {new Date().getFullYear()} Akademi Voly Smart 09</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-smart-gold-light">
              <Sparkles className="w-3 h-3" /> Edisi Resmi
            </span>
          </div>
        </div>

        {/* ================= RIGHT SIDE: WHITE LOGIN CARD & FORM ================= */}
        <div className="w-full lg:w-1/2 bg-slate-100 p-6 sm:p-10 lg:p-12 flex flex-col justify-center text-slate-900 relative">
          
          {/* Inner Form Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl max-w-md w-full mx-auto">
            
            {/* Title: LOGIN PAGE */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-black tracking-wider text-[#8F0000] uppercase">
                LOGIN PAGE
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Pilih peran dan masukkan kredensial untuk masuk
              </p>
            </div>

            {/* Role Quick Selector Tabs */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Pilih Peran Akun:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Admin Tab */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('ADMIN')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedRole === 'ADMIN'
                      ? 'bg-gradient-to-b from-[#8F0000] to-[#6b0606] text-white border-[#8F0000] shadow-md shadow-[#8F0000]/25 scale-[1.02]'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Shield className={`w-4 h-4 mb-0.5 ${selectedRole === 'ADMIN' ? 'text-smart-gold-light' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Admin</span>
                  <span className={`text-[10px] ${selectedRole === 'ADMIN' ? 'text-white/80' : 'text-slate-400'}`}>Pengurus</span>
                </button>

                {/* Coach Tab */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('COACH')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedRole === 'COACH'
                      ? 'bg-gradient-to-b from-amber-600 to-amber-700 text-white border-amber-600 shadow-md shadow-amber-600/25 scale-[1.02]'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Award className={`w-4 h-4 mb-0.5 ${selectedRole === 'COACH' ? 'text-amber-100' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Pelatih</span>
                  <span className={`text-[10px] ${selectedRole === 'COACH' ? 'text-white/80' : 'text-slate-400'}`}>Coach</span>
                </button>

                {/* Member Tab */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('MEMBER')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedRole === 'MEMBER'
                      ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 text-white border-emerald-600 shadow-md shadow-emerald-600/25 scale-[1.02]'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <User className={`w-4 h-4 mb-0.5 ${selectedRole === 'MEMBER' ? 'text-emerald-100' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Anggota</span>
                  <span className={`text-[10px] ${selectedRole === 'MEMBER' ? 'text-white/80' : 'text-slate-400'}`}>Atlet/Wali</span>
                </button>
              </div>
            </div>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input with User Icon */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {selectedRole === 'MEMBER' ? 'Username / Nomor Registrasi (NIS)' : 'Username'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={selectedRole === 'MEMBER' ? 'Username atlet (atlet / smart2025001)' : 'Username'}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#8F0000] focus:ring-2 focus:ring-[#8F0000]/15 transition font-medium"
                  />
                </div>
              </div>

              {/* Password Input with Lock Icon */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#8F0000] focus:ring-2 focus:ring-[#8F0000]/15 transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#8F0000] focus:ring-[#8F0000] cursor-pointer"
                  />
                  <span>Ingat saya</span>
                </label>
                <span className="text-slate-400 hover:text-[#8F0000] transition cursor-pointer font-medium">
                  Lupa Password?
                </span>
              </div>

              {/* Submit Button (Styled in Maroon to Red agreed palette) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-[#8F0000] via-[#A80000] to-[#D00000] hover:brightness-110 text-white font-bold py-3 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#8F0000]/25 disabled:opacity-60 cursor-pointer text-sm tracking-wide"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Memverifikasi Akun...
                  </span>
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Database & Security Verification Footer Badge */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Autentikasi Aman &bull; Terhubung ke <strong>Neon PostgreSQL</strong></span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
