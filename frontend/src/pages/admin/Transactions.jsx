'use client';

import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  Printer, 
  Loader2,
  User,
  ShoppingBag
} from 'lucide-react';
import { transactionAPI } from '../../services/api';
import ReceiptModal from '../../components/ReceiptModal';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number || 0);
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Struk Modal
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [search, period, startDate, endDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {
        search: search.trim() || undefined,
        period: period !== 'all' ? period : undefined,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined
      };
      const res = await transactionAPI.getAll(params);
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
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
      console.error('Error loading receipt:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Receipt className="w-6 h-6 text-emerald-600" />
          <span>Data Riwayat Transaksi</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Daftar seluruh transaksi kasir yang tercatat di dalam sistem POS.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Search */}
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari no. transaksi, petugas, atau nama member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Period Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'today', label: 'Hari Ini' },
              { id: 'this_week', label: 'Minggu Ini' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'custom', label: 'Kustom' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
                  period === p.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

        </div>

        {/* Custom Date Range Picker */}
        {period === 'custom' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-600">Rentang Tanggal:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] sm:text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Petugas Kasir</th>
                <th className="py-3 px-4">Pelanggan / Member</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Bayar</th>
                <th className="py-3 px-4">Kembalian</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Memuat riwayat transaksi...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Tidak ada transaksi pada filter ini.
                  </td>
                </tr>
              ) : (
                transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {trx.nomor_transaksi}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {new Date(trx.tanggal_transaksi).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{trx.petugas}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {trx.nama_member ? (
                        <span className="font-semibold text-slate-800">
                          {trx.nama_member}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Umum</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      {formatRupiah(trx.total)}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {formatRupiah(trx.bayar)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">
                      {formatRupiah(trx.kembalian)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenReceipt(trx.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="Lihat & Cetak Struk"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cetak Ulang Struk */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={selectedTrx}
      />

    </div>
  );
};

export default Transactions;
