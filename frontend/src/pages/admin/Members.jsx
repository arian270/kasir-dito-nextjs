'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { memberAPI } from '../../services/api';
import Modal from '../../components/Modal';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    no_hp: '',
    alamat: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [search]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await memberAPI.getAll({
        search: search.trim() || undefined
      });
      if (res.data.success) {
        setMembers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ nama: '', no_hp: '', alamat: '' });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.nama.trim() || !formData.no_hp.trim()) {
      setFormError('Nama dan nomor HP member wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await memberAPI.create(formData);
      if (res.data.success) {
        setFormSuccess('Member baru berhasil didaftarkan!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchMembers();
        }, 800);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menambahkan member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Data Pelanggan & Member</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data member pelanggan toko untuk kemudahan transaksi kasir.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Daftar Member Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari berdasarkan nama member atau nomor HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] sm:text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Nomor HP / WhatsApp</th>
                <th className="py-3 px-4">Alamat Domisili</th>
                <th className="py-3 px-4">Tanggal Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Memuat data member...</span>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    Belum ada data member ditemukan.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400 text-xs">
                      #{member.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {member.nama}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{member.no_hp}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.alamat || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(member.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Member */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Daftarkan Member Baru"
        maxWidth="max-w-md"
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap Member
            </label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="Contoh: Muhammad Rizki"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor Telepon / WhatsApp
            </label>
            <input
              type="text"
              required
              value={formData.no_hp}
              onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="Contoh: 081234567890"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat Lengkap (Opsional)
            </label>
            <textarea
              rows="3"
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="Jl. Mawar No. 12, Kelurahan..."
            />
          </div>

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
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Member'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Members;
