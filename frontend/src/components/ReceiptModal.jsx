'use client';

import React from 'react';
import Modal from './Modal';
import { Printer, Download, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number || 0);
};

const ReceiptModal = ({ isOpen, onClose, transaction }) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        unit: 'mm',
        format: [80, 160] // Struk thermal 80mm
      });

      doc.setFont('courier', 'normal');
      doc.setFontSize(11);
      doc.text('KASIR DITO POS', 40, 10, { align: 'center' });
      doc.setFontSize(8);
      doc.text('Jl. Raya Pendidikan No. 42', 40, 15, { align: 'center' });
      doc.text('Telp: (021) 789-0123', 40, 19, { align: 'center' });
      doc.text('----------------------------------------', 40, 23, { align: 'center' });

      doc.text(`No. Trx : ${transaction.nomor_transaksi}`, 5, 28);
      doc.text(`Tgl     : ${new Date(transaction.tanggal_transaksi).toLocaleString('id-ID')}`, 5, 32);
      doc.text(`Kasir   : ${transaction.kasir || transaction.petugas || 'Petugas'}`, 5, 36);
      doc.text(`Member  : ${transaction.member?.nama || transaction.nama_member || 'Pelanggan Umum'}`, 5, 40);
      doc.text('----------------------------------------', 40, 44, { align: 'center' });

      let y = 49;
      if (transaction.items && transaction.items.length > 0) {
        transaction.items.forEach((item) => {
          doc.text(`${item.nama_barang}`, 5, y);
          y += 4;
          const subText = `${item.jumlah} x ${parseInt(item.harga).toLocaleString('id-ID')}`;
          const subTotal = parseInt(item.subtotal).toLocaleString('id-ID');
          doc.text(subText, 5, y);
          doc.text(subTotal, 75, y, { align: 'right' });
          y += 5;
        });
      }

      doc.text('----------------------------------------', 40, y, { align: 'center' });
      y += 5;
      doc.setFont('courier', 'bold');
      doc.text('TOTAL', 5, y);
      doc.text(parseInt(transaction.total).toLocaleString('id-ID'), 75, y, { align: 'right' });
      y += 4;
      doc.setFont('courier', 'normal');
      doc.text('BAYAR', 5, y);
      doc.text(parseInt(transaction.bayar).toLocaleString('id-ID'), 75, y, { align: 'right' });
      y += 4;
      doc.text('KEMBALI', 5, y);
      doc.text(parseInt(transaction.kembalian).toLocaleString('id-ID'), 75, y, { align: 'right' });
      y += 8;

      doc.text('========================================', 40, y, { align: 'center' });
      y += 5;
      doc.text('Terima Kasih Telah Berbelanja', 40, y, { align: 'center' });
      y += 4;
      doc.text('Barang tidak dapat ditukar/dikembalikan', 40, y, { align: 'center' });

      doc.save(`Struk_${transaction.nomor_transaksi}.pdf`);
    } catch (err) {
      console.error('Error generating receipt PDF:', err);
      alert('Gagal mendownload PDF struk.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Struk Pembayaran" maxWidth="max-w-md">
      <div>
        {/* Success Icon Header */}
        <div className="text-center mb-4 no-print">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Transaksi Berhasil!</h4>
          <p className="text-xs text-slate-500">Struk siap dicetak atau disimpan sebagai arsip.</p>
        </div>

        {/* Thermal Receipt Visual Preview / Print Area */}
        <div 
          id="receipt-print-area" 
          className="bg-amber-50/40 p-5 rounded-xl border border-dashed border-amber-300 font-mono text-xs text-slate-800 shadow-inner"
        >
          {/* Header Toko */}
          <div className="text-center mb-3">
            <h2 className="font-extrabold text-sm tracking-wide">KASIR DITO POS</h2>
            <p className="text-[11px] text-slate-600">Jl. Raya Pendidikan No. 42</p>
            <p className="text-[11px] text-slate-600">Telp: (021) 789-0123</p>
            <div className="border-b border-dashed border-slate-300 my-2"></div>
          </div>

          {/* Metadata Transaksi */}
          <div className="space-y-1 mb-3 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Trx:</span>
              <span className="font-bold">{transaction.nomor_transaksi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal:</span>
              <span>{new Date(transaction.tanggal_transaksi).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kasir:</span>
              <span className="font-semibold">{transaction.kasir || transaction.petugas || 'Petugas'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Member:</span>
              <span className="font-semibold">
                {transaction.member?.nama || transaction.nama_member || 'Pelanggan Umum'}
              </span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-300 my-2"></div>

          {/* Daftar Barang */}
          <div className="space-y-2 mb-3">
            {transaction.items && transaction.items.map((item, index) => (
              <div key={index} className="text-[11px]">
                <div className="font-semibold text-slate-800">{item.nama_barang}</div>
                <div className="flex justify-between text-slate-600 pl-2">
                  <span>{item.jumlah} x {formatRupiah(item.harga)}</span>
                  <span className="font-mono font-medium text-slate-900">{formatRupiah(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-slate-300 my-2"></div>

          {/* Rincian Total */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
              <span>TOTAL</span>
              <span>{formatRupiah(transaction.total)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>BAYAR (TUNAI)</span>
              <span>{formatRupiah(transaction.bayar)}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-700">
              <span>KEMBALIAN</span>
              <span>{formatRupiah(transaction.kembalian)}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-300 my-3"></div>

          {/* Footer Struk */}
          <div className="text-center text-[10px] text-slate-500 space-y-0.5">
            <p>Terima Kasih Telah Berbelanja</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-3 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>

        <div className="mt-3 no-print">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
