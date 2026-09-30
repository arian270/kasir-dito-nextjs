'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Receipt, 
  Package, 
  Users, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  PlusCircle, 
  FileText,
  Loader2,
  Calendar
} from 'lucide-react';
import { productAPI, memberAPI, transactionAPI, reportAPI } from '../../services/api';
import ReceiptModal from '../../components/ReceiptModal';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number || 0);
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOmset: 0,
    totalTransaksi: 0,
    totalProduk: 0,
    totalMember: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Report Data
      const reportRes = await reportAPI.getReport({ period: 'all' });
      const summary = reportRes.data.data.summary;

      // 2. Fetch Products
      const productsRes = await productAPI.getAll({});
      const products = productsRes.data.data;
      const lowStock = products.filter(p => p.stok <= 10);

      // 3. Fetch Members
      const membersRes = await memberAPI.getAll({});
      const members = membersRes.data.data;

      // 4. Fetch Recent Transactions
      const trxRes = await transactionAPI.getAll({ limit: 5 });

      setStats({
        totalOmset: summary.total_pendapatan || 0,
        totalTransaksi: summary.total_transaksi || 0,
        totalProduk: products.length,
        totalMember: members.length
      });
      setLowStockProducts(lowStock);
      setRecentTransactions((trxRes.data.data || []).slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (id) => {
    try {
      const res = await transactionAPI.getById(id);
      if (res.data.success) {
        setSelectedTrx(res.data.data);
        setIsReceiptOpen(true);
      }
    } catch (err) {
      console.error('Error fetching receipt detail:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <p className="text-sm font-medium">Memuat data dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/60 inline-block mb-2">
            Panel Administrator
          </span>
          <h2 className="text-2xl font-black">Ringkasan Operasional Toko</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Pantau arus kas, stok produk, dan aktivitas kasir secara real-time.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/products"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Kelola Barang</span>
          </Link>
          <Link
            href="/admin/stock"
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Layers className="w-4 h-4" />
            <span>Update Stok</span>
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Laporan</span>
          </Link>
        </div>
      </div>

      {/* 4 Statistik Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Omset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Omset</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-slate-800">{formatRupiah(stats.totalOmset)}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              Akumulasi seluruh transaksi
            </p>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Transaksi</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-slate-800">{stats.totalTransaksi} Trx</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Tercatat dalam sistem
            </p>
          </div>
        </div>

        {/* Total Produk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Produk</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-slate-800">{stats.totalProduk} Item</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Katalog barang toko
            </p>
          </div>
        </div>

        {/* Total Member */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Member</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-slate-800">{stats.totalMember} Orang</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Member pelanggan aktif
            </p>
          </div>
        </div>

      </div>

      {/* 2 Kolom: Peringatan Stok Menipis & Transaksi Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Peringatan Stok Menipis */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Peringatan Stok Menipis</h4>
            </div>
            <Link
              href="/admin/stock"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
            >
              <span>Restock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Semua stok barang masih dalam kondisi aman.
              </div>
            ) : (
              lowStockProducts.slice(0, 6).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div className="overflow-hidden pr-2">
                    <p className="font-semibold text-xs text-slate-800 truncate">{item.nama_barang}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{item.barcode}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      item.stok === 0
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {item.stok} {item.satuan}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom Kanan: Transaksi Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Aktivitas Transaksi Terbaru</h4>
            </div>
            <Link
              href="/admin/transactions"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">No. Transaksi</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Kasir</th>
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3 text-center rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      Belum ada transaksi tercatat.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {trx.nomor_transaksi}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(trx.tanggal_transaksi).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {trx.petugas}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {trx.nama_member || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {formatRupiah(trx.total)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleOpenReceipt(trx.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          Struk
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Cetak Struk */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={selectedTrx}
      />

    </div>
  );
};

export default Dashboard;
