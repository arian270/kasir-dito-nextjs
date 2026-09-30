'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Scan, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  RotateCcw, 
  UserPlus, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Barcode,
  Package,
  Layers
} from 'lucide-react';
import { productAPI, memberAPI, transactionAPI } from '../../services/api';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';
import ReceiptModal from '../../components/ReceiptModal';
import Modal from '../../components/Modal';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number || 0);
};

const POS = () => {
  // State Katalog Produk
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  // State Keranjang Belanja
  const [cart, setCart] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [members, setMembers] = useState([]);

  // State Pembayaran
  const [uangBayar, setUangBayar] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // State Modals
  const [scannerOpen, setScannerOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [completedTrx, setCompletedTrx] = useState(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberData, setNewMemberData] = useState({ nama: '', no_hp: '', alamat: '' });

  // Input ref untuk auto focus ke barcode
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchMembers();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await productAPI.getAll({});
      if (res.data.success) {
        setProducts(res.data.data);
        if (res.data.categories) {
          setCategories(res.data.categories);
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await memberAPI.getAll({});
      if (res.data.success) {
        setMembers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  // 1. Tambah produk ke keranjang
  const addToCart = (product, quantityToAdd = 1) => {
    setPaymentError('');

    // Validasi stok produk
    if (product.stok <= 0) {
      alert('Stok barang tidak mencukupi.');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product_id === product.id);

    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      const newQty = existingItem.jumlah + quantityToAdd;

      if (newQty > product.stok) {
        alert('Stok barang tidak mencukupi.');
        return;
      }

      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existingItem,
        jumlah: newQty,
        subtotal: newQty * existingItem.harga
      };
      setCart(updatedCart);
    } else {
      if (quantityToAdd > product.stok) {
        alert('Stok barang tidak mencukupi.');
        return;
      }

      setCart([
        ...cart,
        {
          product_id: product.id,
          barcode: product.barcode,
          nama_barang: product.nama_barang,
          harga: parseFloat(product.harga),
          stok: product.stok,
          satuan: product.satuan,
          jumlah: quantityToAdd,
          subtotal: quantityToAdd * parseFloat(product.harga)
        }
      ]);
    }
  };

  // 2. Ubah kuantitas di keranjang
  const updateQuantity = (productId, newQty) => {
    setPaymentError('');
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const targetProduct = products.find(p => p.id === productId);
    if (targetProduct && newQty > targetProduct.stok) {
      alert('Stok barang tidak mencukupi.');
      return;
    }

    setCart(cart.map(item => {
      if (item.product_id === productId) {
        return {
          ...item,
          jumlah: newQty,
          subtotal: newQty * item.harga
        };
      }
      return item;
    }));
  };

  // 3. Hapus item dari keranjang
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  // 4. Reset Keranjang
  const handleResetCart = () => {
    if (cart.length > 0 && !window.confirm('Apakah Anda yakin ingin mengosongkan keranjang belanja?')) {
      return;
    }
    setCart([]);
    setUangBayar('');
    setPaymentError('');
    setSelectedMemberId('');
  };

  // 5. Scan Barcode (Kamera atau Scanner Manual)
  const handleBarcodeFound = async (barcode) => {
    const trimmed = barcode.trim();
    if (!trimmed) return;

    try {
      const res = await productAPI.getByBarcode(trimmed);
      if (res.data.success && res.data.data) {
        addToCart(res.data.data, 1);
        setBarcodeInput('');
      }
    } catch {
      alert(`Produk dengan barcode '${trimmed}' tidak ditemukan di sistem.`);
    }
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleBarcodeFound(barcodeInput.trim());
    }
  };

  // Kalkulasi Total
  const totalBelanja = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const nominalBayar = parseFloat(uangBayar) || 0;
  const kembalian = nominalBayar - totalBelanja;
  const isBayarCukup = nominalBayar >= totalBelanja && totalBelanja > 0;

  // 6. Proses Pembayaran
  const handleProcessPayment = async () => {
    setPaymentError('');

    if (cart.length === 0) {
      setPaymentError('Keranjang belanja masih kosong.');
      return;
    }

    if (!isBayarCukup) {
      setPaymentError(`Uang bayar kurang! Total belanja adalah ${formatRupiah(totalBelanja)}.`);
      return;
    }

    setProcessingPayment(true);
    try {
      const payload = {
        member_id: selectedMemberId ? parseInt(selectedMemberId) : null,
        bayar: nominalBayar,
        items: cart.map(item => ({
          product_id: item.product_id,
          jumlah: item.jumlah
        }))
      };

      const res = await transactionAPI.create(payload);

      if (res.data.success) {
        // Tampilkan Struk
        setCompletedTrx(res.data.data);
        setReceiptOpen(true);

        // Reset Form Kasir
        setCart([]);
        setUangBayar('');
        setSelectedMemberId('');
        
        // Refresh katalog agar stok terpotong terlihat seketika
        fetchProducts();
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Gagal memproses transaksi.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Tambah Member Cepat
  const handleQuickAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberData.nama || !newMemberData.no_hp) return;
    try {
      const res = await memberAPI.create(newMemberData);
      if (res.data.success) {
        await fetchMembers();
        setSelectedMemberId(res.data.data.id.toString());
        setAddMemberOpen(false);
        setNewMemberData({ nama: '', no_hp: '', alamat: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mendaftarkan member.');
    }
  };

  // Filter Produk di katalog
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.kategori === selectedCategory;
    const matchSearch = searchQuery === '' || 
      p.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-4">
      
      {/* Kasir Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* KOLOM KIRI: KATALOG BARANG & PENCARIAN (7 Kolom) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Barcode & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            
            {/* Input Barcode Cepat */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Barcode className="w-4 h-4" />
                </div>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan atau ketik barcode produk lalu Enter..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                title="Buka Kamera Barcode Scanner"
              >
                <Scan className="w-4 h-4" />
                <span className="hidden sm:inline">Kamera</span>
              </button>

              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cari
              </button>
            </form>

            {/* Pencarian Nama Barang */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cari berdasarkan nama barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>

          {/* Grid Katalog Produk */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Daftar Barang ({filteredProducts.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Klik kartu untuk memasukkan ke keranjang
              </span>
            </div>

            {loadingProducts ? (
              <div className="py-20 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
                <span className="text-xs">Memuat katalog barang...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                Tidak ada barang yang cocok dengan kata kunci pencarian.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stok <= 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && addToCart(p, 1)}
                      className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                        isOutOfStock
                          ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                          : 'bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-300 border-slate-200 cursor-pointer shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                          <span className="truncate pr-1">{p.barcode}</span>
                          <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-sans">
                            {p.kategori}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-tight">
                          {p.nama_barang}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="font-black text-xs sm:text-sm text-emerald-700">
                          {formatRupiah(p.harga)}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700'
                            : p.stok <= 10
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isOutOfStock ? 'Habis' : `Stok: ${p.stok}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* KOLOM KANAN: KERANJANG BELANJA & PEMBAYARAN (5 Kolom) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            
            {/* Header Keranjang & Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Keranjang Belanja</h3>
                  <span className="text-[11px] text-slate-400">{cart.length} Jenis Item</span>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={handleResetCart}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold p-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Kosongkan Keranjang"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Pilih Member (Opsional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Member Pelanggan:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAddMemberOpen(true)}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Member Baru</span>
                </button>
              </div>

              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-700"
              >
                <option value="">Pelanggan Umum (Tanpa Member)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama} - {m.no_hp}
                  </option>
                ))}
              </select>
            </div>

            {/* Daftar Item di Keranjang */}
            <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-100 pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold">Keranjang Masih Kosong</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Pilih produk atau scan barcode untuk menambahkan.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product_id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-slate-800 truncate">{item.nama_barang}</h5>
                      <span className="text-[11px] text-slate-500">
                        {formatRupiah(item.harga)} / {item.satuan}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.jumlah - 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.stok}
                        value={item.jumlah}
                        onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                        className="w-10 text-center font-bold text-xs py-1 border border-slate-200 rounded-md focus:outline-hidden"
                      />
                      <button
                        onClick={() => updateQuantity(item.product_id, item.jumlah + 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="text-right pl-2">
                      <div className="font-black text-xs text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-[10px] text-rose-500 hover:text-rose-700 transition-colors cursor-pointer mt-0.5"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total Pembayaran Banner */}
            <div className="p-4 rounded-xl bg-slate-900 text-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Total Yang Harus Dibayar
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                {formatRupiah(totalBelanja)}
              </div>
            </div>

            {/* Input Bayar & Kembalian */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uang Diterima (Rp)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 50000"
                    value={uangBayar}
                    onChange={(e) => {
                      setUangBayar(e.target.value);
                      setPaymentError('');
                    }}
                    className="w-full pl-3 pr-3 py-2.5 text-base font-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setUangBayar(totalBelanja.toString())}
                  disabled={totalBelanja === 0}
                  className="py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Uang Pas
                </button>
                {[10000, 20000, 50000, 100000].map((nominal) => (
                  <button
                    key={nominal}
                    type="button"
                    onClick={() => setUangBayar(nominal.toString())}
                    className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {nominal >= 1000 ? `${nominal / 1000}rb` : nominal}
                  </button>
                ))}
              </div>

              {/* Kembalian Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Kembalian Otomatis
                  </span>
                  <span className={`text-lg font-black ${
                    kembalian >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {kembalian >= 0 ? formatRupiah(kembalian) : `- ${formatRupiah(Math.abs(kembalian))}`}
                  </span>
                </div>
                {kembalian < 0 && (
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">
                    Uang Kurang!
                  </span>
                )}
              </div>

              {/* Error Message */}
              {paymentError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Tombol Bayar Sekarang */}
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={processingPayment || !isBayarCukup || cart.length === 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Transaksi...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>BAYAR SEKARANG ({formatRupiah(totalBelanja)})</span>
                  </>
                )}
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* MODAL SCANNER BARCODE */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleBarcodeFound}
      />

      {/* MODAL STRUK SUKSES */}
      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        transaction={completedTrx}
      />

      {/* MODAL TAMBAH MEMBER CEPAT */}
      <Modal
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        title="Daftar Member Cepat"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleQuickAddMember} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Member
            </label>
            <input
              type="text"
              required
              value={newMemberData.nama}
              onChange={(e) => setNewMemberData({ ...newMemberData, nama: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="Nama pelanggan"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor HP / WhatsApp
            </label>
            <input
              type="text"
              required
              value={newMemberData.no_hp}
              onChange={(e) => setNewMemberData({ ...newMemberData, no_hp: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="081234567890"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat (Opsional)
            </label>
            <input
              type="text"
              value={newMemberData.alamat}
              onChange={(e) => setNewMemberData({ ...newMemberData, alamat: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="Alamat domisili"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddMemberOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              Simpan & Pilih Member
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default POS;
