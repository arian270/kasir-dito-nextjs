'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  PackageCheck
} from 'lucide-react';
import { productAPI } from '../../services/api';
import Modal from '../../components/Modal';

const StockUpdate = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('add'); // 'add' | 'subtract'
  const [amount, setAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({
        search: search.trim() || undefined
      });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStockModal = (product, defaultAction = 'add') => {
    setSelectedProduct(product);
    setActionType(defaultAction);
    setAmount('10');
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const calculateNewStock = () => {
    if (!selectedProduct) return 0;
    const qty = parseInt(amount) || 0;
    if (actionType === 'add') {
      return selectedProduct.stok + qty;
    } else {
      return selectedProduct.stok - qty;
    }
  };

  const predictedStock = calculateNewStock();
  const isNegative = predictedStock < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const qty = parseInt(amount);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Masukkan jumlah stok yang valid (minimal 1).');
      return;
    }

    if (isNegative) {
      setErrorMsg('Perhatian: Stok tidak boleh bernilai minus!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await productAPI.updateStock(selectedProduct.id, {
        action: actionType,
        amount: qty
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setTimeout(() => {
          setIsModalOpen(false);
          fetchProducts();
        }, 1000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal memperbarui stok barang.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            <span>Update Stok Barang</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tambah atau kurangi persediaan fisik barang secara akurat (Stok tidak boleh minus).
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari barang untuk diupdate stoknya..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] sm:text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Barcode</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi Cepat Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Memuat daftar stok...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Tidak ada barang ditemukan.
                  </td>
                </tr>
              ) : (
                products.map((item) => {
                  const isLow = item.stok <= 10 && item.stok > 0;
                  const isOut = item.stok === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                        {item.barcode}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {item.nama_barang}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.kategori}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-sm">
                        <span className={`px-3 py-1 rounded-full ${
                          isOut 
                            ? 'bg-rose-100 text-rose-700' 
                            : isLow 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.stok} {item.satuan}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Habis
                          </span>
                        ) : isLow ? (
                          <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Menipis
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aman
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenStockModal(item, 'add')}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Tambah Stok Masuk"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah</span>
                          </button>
                          <button
                            onClick={() => handleOpenStockModal(item, 'subtract')}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Kurangi Stok Keluar"
                          >
                            <Minus className="w-3.5 h-3.5" />
                            <span>Kurangi</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Update Stok */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Penyesuaian Stok Barang"
        maxWidth="max-w-md"
      >
        {selectedProduct && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Info Produk */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{selectedProduct.nama_barang}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedProduct.barcode}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Stok Sekarang</span>
                  <span className="font-extrabold text-base text-slate-800">
                    {selectedProduct.stok} {selectedProduct.satuan}
                  </span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Tombol Pilihan Jenis Update */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jenis Operasi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('add')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    actionType === 'add'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Stok Masuk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('subtract')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    actionType === 'subtract'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  <span>Kurangi Stok</span>
                </button>
              </div>
            </div>

            {/* Input Jumlah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jumlah ({selectedProduct.satuan})
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold"
                placeholder="Contoh: 10"
              />
            </div>

            {/* Live Calculation Preview */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              isNegative 
                ? 'bg-rose-50 border-rose-300 text-rose-800' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span>Stok Awal:</span>
                <span>{selectedProduct.stok} {selectedProduct.satuan}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span>Perubahan:</span>
                <span className={actionType === 'add' ? 'text-emerald-700' : 'text-rose-700'}>
                  {actionType === 'add' ? '+' : '-'}{amount || 0} {selectedProduct.satuan}
                </span>
              </div>
              <div className="border-t border-dashed border-slate-300 my-1.5"></div>
              <div className="flex items-center justify-between text-sm font-extrabold">
                <span>Prediksi Stok Akhir:</span>
                <span className={isNegative ? 'text-rose-600' : 'text-emerald-700'}>
                  {predictedStock} {selectedProduct.satuan}
                </span>
              </div>
              {isNegative && (
                <p className="text-[11px] font-bold text-rose-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Peringatan: Stok tidak boleh minus/negatif! Kurangi jumlah pengurang.
                </p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || isNegative || !amount}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Simpan Perubahan'}
              </button>
            </div>

          </form>
        )}
      </Modal>

    </div>
  );
};

export default StockUpdate;
