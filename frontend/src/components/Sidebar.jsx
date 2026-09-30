'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  Receipt,
  FileBarChart2,
  ShoppingCart,
  LogOut,
  Shield,
  UserCheck
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();

  const adminNavItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: 'Data Barang', icon: Package },
    { to: '/admin/stock', label: 'Update Stok', icon: Layers },
    { to: '/admin/members', label: 'Data Member', icon: Users },
    { to: '/admin/transactions', label: 'Data Transaksi', icon: Receipt },
    { to: '/admin/reports', label: 'Laporan', icon: FileBarChart2 },
    { to: '/admin/register', label: 'Buat Akun Petugas', icon: UserCheck }
  ];

  const cashierNavItems = [
    { to: '/kasir', label: 'Halaman Kasir (POS)', icon: ShoppingCart, end: true },
    { to: '/kasir/products', label: 'Data Barang', icon: Package },
    { to: '/kasir/transactions', label: 'Riwayat Transaksi', icon: Receipt },
    { to: '/kasir/reports', label: 'Laporan', icon: FileBarChart2 }
  ];

  const navItems = isAdmin ? adminNavItems : cashierNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md">
              <ShoppingCart className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base tracking-wide">POS SYSTEM</h1>
              <p className="text-[11px] text-slate-400 font-medium">Tugas Kasir Sekolah</p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
            isAdmin ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {isAdmin ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.username}</p>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm inline-block ${
              isAdmin ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-2 flex-1 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === item.to || (item.to !== '/admin' && item.to !== '/kasir' && pathname.startsWith(item.to))
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
