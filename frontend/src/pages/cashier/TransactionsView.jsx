'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, Search, Printer, Loader2, Calendar } from 'lucide-react';
import { transactionAPI } from '../../services/api';
import ReceiptModal from '../../components/ReceiptModal';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number || 0);
};

const TransactionsView = () => {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [search]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await transactionAPI.getAll({
        search: search.trim() || undefined
      });
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
          <span>Riwayat Transaksi Kasir</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Daftar seluruh transaksi yang telah diproses. Anda dapat mencetak ulang struk pelanggan kapan saja.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari berdasarkan No. Transaksi atau Nama Member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] sm:text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4">Member / Pelanggan</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4 text-center">Cetak Ulang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Memuat riwayat transaksi...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Belum ada riwayat transaksi.
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
                      {trx.petugas}
                    </td>
                    <td className="py-3 px-4">
                      {trx.nama_member ? (
                        <span className="font-semibold text-slate-800">{trx.nama_member}</span>
                      ) : (
                        <span className="text-slate-400 italic">Pelanggan Umum</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      {formatRupiah(trx.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenReceipt(trx.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

export default TransactionsView;
