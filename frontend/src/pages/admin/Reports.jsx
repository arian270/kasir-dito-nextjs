'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileBarChart2, 
  Printer, 
  Download, 
  TrendingUp, 
  Receipt, 
  ShoppingBag, 
  Award, 
  Calendar, 
  Filter,
  Loader2 
} from 'lucide-react';
import { reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number || 0);
};

const Reports = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState({
    summary: { total_transaksi: 0, total_pendapatan: 0, total_barang_terjual: 0, rata_rata_transaksi: 0 },
    transactions: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [period, startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        period: period !== 'all' ? period : undefined,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined
      };
      const res = await reportAPI.getReport(params);
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');

      // Title & Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('LAPORAN PENJUALAN TRANSAKSI KASIR', 105, 15, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('KASIR DITO POS - SISTEM INFORMASI KASIR', 105, 21, { align: 'center' });
      doc.text('Jl. Raya Pendidikan No. 42 | Telp: (021) 789-0123', 105, 26, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.line(14, 30, 196, 30);

      // Metadata Info
      const periodLabel = 
        period === 'today' ? 'Hari Ini' :
        period === 'this_week' ? 'Minggu Ini' :
        period === 'this_month' ? 'Bulan Ini' :
        period === 'custom' ? `${startDate || '-'} s/d ${endDate || '-'}` : 'Semua Periode';

      doc.setFontSize(9);
      doc.text(`Periode Laporan : ${periodLabel}`, 14, 36);
      doc.text(`Tanggal Unduh   : ${new Date().toLocaleString('id-ID')}`, 14, 41);
      doc.text(`Dicetak Oleh    : ${user?.username} (${user?.role})`, 14, 46);

      doc.text(`Total Transaksi : ${reportData.summary.total_transaksi} Transaksi`, 140, 36);
      doc.text(`Total Omset     : ${formatRupiah(reportData.summary.total_pendapatan)}`, 140, 41);
      doc.text(`Barang Terjual  : ${reportData.summary.total_barang_terjual} Item`, 140, 46);

      // Data Table
      const tableRows = reportData.transactions.map((t, idx) => [
        idx + 1,
        t.nomor_transaksi,
        new Date(t.tanggal_transaksi).toLocaleString('id-ID'),
        t.petugas,
        t.nama_member,
        t.status_pembayaran,
        formatRupiah(t.total)
      ]);

      autoTable(doc, {
        startY: 52,
        head: [['No', 'No. Transaksi', 'Tanggal', 'Petugas', 'Member', 'Status', 'Total']],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        foot: [[
          '', 
          'TOTAL KESELURUHAN', 
          '', 
          '', 
          '', 
          `${reportData.summary.total_transaksi} Trx`, 
          formatRupiah(reportData.summary.total_pendapatan)
        ]],
        footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' }
      });

      doc.save(`Laporan_Kasir_${period}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal membuat file PDF laporan.');
    }
  };

  const { summary, transactions, topProducts } = reportData;

  return (
    <div className="space-y-6">
      
      {/* Header & Print/Download Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-emerald-600" />
            <span>Laporan Transaksi & Keuangan</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analisis pendapatan toko, volume penjualan, dan riwayat mutasi kasir.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0 mr-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Periode:
          </span>
          {[
            { id: 'all', label: 'Semua Periode' },
            { id: 'today', label: 'Hari Ini' },
            { id: 'this_week', label: 'Minggu Ini' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'custom', label: 'Rentang Tanggal' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
                period === item.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Pilih Tanggal:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
            <span className="text-slate-400">sampai</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Omset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pendapatan</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-slate-800">{formatRupiah(summary.total_pendapatan)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Pada periode terpilih</p>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Transaksi</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-slate-800">{summary.total_transaksi} Transaksi</h3>
            <p className="text-[11px] text-slate-400 mt-1">Struk tercetak</p>
          </div>
        </div>

        {/* Total Produk Terjual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Barang Terjual</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-slate-800">{summary.total_barang_terjual} Item</h3>
            <p className="text-[11px] text-slate-400 mt-1">Total kuantitas barang</p>
          </div>
        </div>

        {/* Rata-rata Nilai Belanja */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Keranjang</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-slate-800">{formatRupiah(summary.rata_rata_transaksi)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Per transaksi</p>
          </div>
        </div>

      </div>

      {/* Top 5 Produk Terlaris Card */}
      {topProducts && topProducts.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Top 5 Produk Terlaris</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {topProducts.map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Peringkat #{idx + 1}
                </span>
                <p className="font-bold text-xs text-slate-800 truncate mt-1">{p.nama_barang}</p>
                <div className="flex justify-between items-center mt-2 text-[11px]">
                  <span className="text-slate-500">{p.terjual} terjual</span>
                  <span className="font-bold text-slate-900">{formatRupiah(p.total_omset)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Report Table (Also used in print layout) */}
      <div id="print-area" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Printable Header Banner (visible only during print) */}
        <div className="hidden print:block p-4 border-b border-slate-300 text-center">
          <h1 className="text-lg font-black text-slate-900">LAPORAN PENJUALAN TRANSAKSI KASIR</h1>
          <p className="text-xs text-slate-600">KASIR DITO POS - Sistem Kasir Modern</p>
          <div className="text-xs text-slate-500 mt-1">
            Dicetak Oleh: {user?.username} ({user?.role}) | Tanggal: {new Date().toLocaleString('id-ID')}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] sm:text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Status / Metode</th>
                <th className="py-3 px-4 text-right">Total Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Menghasilkan laporan...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Tidak ada transaksi pada filter periode ini.
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
                    <td className="py-3 px-4 text-slate-600">
                      {trx.nama_member || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">
                        {trx.status_pembayaran}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatRupiah(trx.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {transactions.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs sm:text-sm">
                <tr>
                  <td colSpan="5" className="py-3 px-4 uppercase text-slate-700">
                    Total Keseluruhan ({transactions.length} Transaksi)
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-black text-base">
                    {formatRupiah(summary.total_pendapatan)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
};

export default Reports;
