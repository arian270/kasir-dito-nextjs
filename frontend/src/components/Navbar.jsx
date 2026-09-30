'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Store, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Clock, 
  ShieldCheck, 
  ShoppingBag 
} from 'lucide-react';

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 tracking-tight text-lg flex items-center gap-1.5">
                KASIR <span className="text-emerald-600 font-extrabold">DITO</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-block">
                  POS
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Clock & User Profile & Logout */}
        <div className="flex items-center gap-4">
          
          {/* Live Clock */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-slate-700 font-semibold">{formattedTime} WIB</span>
          </div>

          {/* User Info Badge */}
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user?.username}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider">
                {user?.role === 'admin' ? (
                  <span className="text-indigo-600 flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5 inline" /> Admin
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <ShoppingBag className="w-2.5 h-2.5 inline" /> Petugas
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Keluar dari sistem"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
