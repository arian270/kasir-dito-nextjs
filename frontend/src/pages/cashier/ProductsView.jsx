'use client';

import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Barcode, Loader2, Info } from 'lucide-react';
import { productAPI } from '../../services/api';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number || 0);
};

const ProductsView = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Package className="w-6 h-6 text-emerald-600" />
          <span>Katalog Data Barang</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Daftar harga dan ketersediaan stok barang toko untuk petugas kasir.
        </p>
      </div>

      {/* Info Notice Role Matrix */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Mode Petugas Kasir:</strong> Anda memiliki akses untuk melihat katalog harga dan stok barang. Penambahan barang dan perubahan stok dikelola oleh Administrator.
        </span>
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
            placeholder="Cari nama barang atau barcode..."
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

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] sm:text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Barcode</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Satuan</th>
                <th className="py-3 px-4 text-center">Stok Tersedia</th>
                <th className="py-3 px-4">Satuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Memuat data katalog...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ProductsView;
