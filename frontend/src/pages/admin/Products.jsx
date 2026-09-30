'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Filter,
  Barcode
} from 'lucide-react';
import { productAPI } from '../../services/api';
import Modal from '../../components/Modal';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number || 0);
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    barcode: '',
    nama_barang: '',
    harga: '',
    stok: '',
    kategori: '',
    satuan: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({
        search: search.trim() || undefined,
        kategori: selectedCategory || undefined
      });
      if (res.data.success) {
        setProducts(res.data.data);
        if (res.data.categories) {
          setCategories(res.data.categories);
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedProduct(null);
    setFormData({
      barcode: `899${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      nama_barang: '',
      harga: '',
      stok: '',
      kategori: 'Makanan',
      satuan: 'Pcs'
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setFormData({
      barcode: product.barcode,
      nama_barang: product.nama_barang,
      harga: product.harga,
      stok: product.stok,
      kategori: product.kategori,
      satuan: product.satuan
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.barcode || !formData.nama_barang || !formData.harga || formData.stok === '' || !formData.kategori || !formData.satuan) {
      setFormError('Harap lengkapi semua kolom produk.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        const res = await productAPI.create(formData);
        if (res.data.success) {
          setFormSuccess('Produk baru berhasil ditambahkan!');
          setTimeout(() => {
            setIsModalOpen(false);
            fetchProducts();
          }, 800);
        }
      } else {
        const res = await productAPI.update(selectedProduct.id, formData);
        if (res.data.success) {
          setFormSuccess('Data produk berhasil diperbarui!');
          setTimeout(() => {
            setIsModalOpen(false);
            fetchProducts();
          }, 800);
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data produk.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const res = await productAPI.delete(productToDelete.id);
      if (res.data.success) {
        setDeleteConfirmOpen(false);
        fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus produk.');
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Manajemen Data Barang</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola katalog barang, barcode, harga jual, dan stok toko.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Barang Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari nama barang atau scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] sm:text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Barcode / Kode</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga</th>
                <th className="py-3 px-4 text-center">Stok</th>
                <th className="py-3 px-4">Satuan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Memuat data barang...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Tidak ada barang ditemukan.
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-xs">
                      #{item.id}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 flex items-center gap-1.5">
                      <Barcode className="w-4 h-4 text-slate-400" />
                      <span>{item.barcode}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {item.nama_barang}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatRupiah(item.harga)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.stok === 0
                          ? 'bg-rose-100 text-rose-700'
                          : item.stok <= 10
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {item.stok}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {item.satuan}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Barang"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Barang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Barang */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Tambah Barang Baru' : 'Edit Data Barang'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Barcode & Nama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode / Barcode
              </label>
              <input
                type="text"
                required
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                placeholder="Contoh: 8991234567890"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori
              </label>
              <input
                type="text"
                required
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                placeholder="Makanan, Minuman, Alat Tulis"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Barang
            </label>
            <input
              type="text"
              required
              value={formData.nama_barang}
              onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="Contoh: Indomie Goreng Spesial"
            />
          </div>

          {/* Harga, Stok, Satuan */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Jual (Rp)
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.harga}
                onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                placeholder="3500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stok
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stok}
                onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Satuan
              </label>
              <input
                type="text"
                required
                value={formData.satuan}
                onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                placeholder="Pcs, Bungkus, Botol"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Konfirmasi Hapus Barang"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800">Hapus Produk Ini?</h4>
            <p className="text-xs text-slate-500 mt-1">
              Apakah Anda yakin ingin menghapus <span className="font-bold text-slate-800">"{productToDelete?.nama_barang}"</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Products;
