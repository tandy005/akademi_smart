'use client';

import React, { useState, useEffect } from 'react';
import { useRole } from '@/context/RoleContext';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Edit2,
  Trash2,
  AlertCircle,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Member, MemberStatus, Gender, calculateMemberAge } from '@/lib/types';
import { generateDirectWhatsAppUrl } from '@/lib/whatsapp-utils';
import {
  PageHeader,
  Button,
  Badge,
  Modal,
  FormInput,
  FormSelect,
} from '@/components/ui';

interface MemberFormState {
  name: string;
  age: string | number;
  gender: Gender;
  phone: string;
  address: string;
  status: MemberStatus;
}

const initialFormState: MemberFormState = {
  name: '',
  age: '',
  gender: 'Putra',
  phone: '',
  address: '',
  status: 'Aktif',
};

export default function AnggotaPage() {
  const { role, refreshMembers } = useRole();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State (Nama, Umur, Jenis Kelamin, Nomor WA, Alamat, Status)
  const [formData, setFormData] = useState<MemberFormState>(initialFormState);

  const fetchMembersList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersList();
  }, []);

  const openAddModal = () => {
    setEditingMember(null);
    setFormData(initialFormState);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    const ageVal = m.age ?? calculateMemberAge(m);
    setFormData({
      name: m.name || '',
      age: ageVal > 0 ? ageVal : '',
      gender: m.gender || 'Putra',
      phone: m.phone || '',
      address: m.address || '',
      status: m.status || 'Aktif',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus anggota "${name}"? Riwayat iuran dan absensi terkait juga akan dihapus.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/members?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMembersList();
        refreshMembers();
      } else {
        alert('Gagal menghapus anggota');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Nama lengkap wajib diisi');
      return;
    }

    setFormSubmitting(true);
    setErrorMsg(null);

    const payload = {
      name: formData.name.trim(),
      age: formData.age !== '' ? Number(formData.age) : undefined,
      gender: formData.gender,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      status: formData.status,
    };

    try {
      if (editingMember) {
        const res = await fetch('/api/members', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editingMember, ...payload, id: editingMember.id }),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchMembersList();
          refreshMembers();
        } else {
          const d = await res.json();
          setErrorMsg(d.error || 'Gagal memperbarui data anggota');
        }
      } else {
        const res = await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchMembersList();
          refreshMembers();
        } else {
          const d = await res.json();
          setErrorMsg(d.error || 'Gagal menambahkan anggota');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter members berdasarkan Nama, Nomor WA, Alamat, Gender, dan Status
  const filtered = members.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      (m.phone && m.phone.includes(q)) ||
      (m.address && m.address.toLowerCase().includes(q));

    const matchGender = selectedGender === 'ALL' || m.gender === selectedGender;
    const matchStatus = selectedStatus === 'ALL' || m.status === selectedStatus;

    return matchSearch && matchGender && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badgeText="Manajemen Anggota"
        badgeIcon={<Users className="w-3.5 h-3.5" />}
        title="Daftar Anggota"
        subtitle="Kelola data anggota: Nama, Umur, Jenis Kelamin, Nomor WhatsApp, Alamat, dan Status"
        actions={
          role !== 'MEMBER' && (
            <Button
              variant="primary"
              size="sm"
              onClick={openAddModal}
              icon={<UserPlus className="w-4 h-4" />}
            >
              Tambah Anggota
            </Button>
          )
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-smart-card border border-smart-border space-y-3 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, nomor WA, atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-smart-dark border border-smart-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-smart-gold transition"
            />
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              aria-label="Filter Jenis Kelamin"
              className="w-full px-3 py-2 bg-smart-dark border border-smart-border rounded-xl text-xs text-slate-200 focus:outline-none focus:border-smart-gold"
            >
              <option value="ALL">Semua Gender</option>
              <option value="Putra">Putra</option>
              <option value="Putri">Putri</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter Status"
              className="w-full px-3 py-2 bg-smart-dark border border-smart-border rounded-xl text-xs text-slate-200 focus:outline-none focus:border-smart-gold"
            >
              <option value="ALL">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Non-Aktif">Non-Aktif</option>
              <option value="Cedera">Cedera</option>
            </select>
          </div>
        </div>

        {/* Counter tag & Reset */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-smart-border/60">
          <span>
            Menampilkan <strong className="text-white">{filtered.length}</strong> dari{' '}
            {members.length} anggota
          </span>
          {(selectedGender !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedGender('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              className="text-smart-gold-light hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl bg-smart-card border border-smart-border overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-smart-dark/80 text-slate-400 border-b border-smart-border font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama</th>
                <th className="py-3.5 px-4 w-24">Umur</th>
                <th className="py-3.5 px-4 w-28">Jenis Kelamin</th>
                <th className="py-3.5 px-4">Nomor WA</th>
                <th className="py-3.5 px-4">Alamat</th>
                <th className="py-3.5 px-4 w-24">Status</th>
                {role !== 'MEMBER' && <th className="py-3.5 px-4 text-right w-20">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-smart-border/60">
              {filtered.map((m, idx) => {
                const age = m.age ?? calculateMemberAge(m);
                const waUrl = m.phone
                  ? generateDirectWhatsAppUrl(
                      m.phone,
                      `Halo ${m.name}, salam dari pengurus Akademi Smart.`
                    )
                  : null;

                return (
                  <tr key={m.id} className="hover:bg-smart-maroon/10 transition">
                    {/* No */}
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Nama */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-smart-maroon/40 border border-smart-gold/40 text-smart-gold-light font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-inner">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{m.name}</div>
                          {m.registrationNumber && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {m.registrationNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Umur */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {age > 0 ? (
                        <span className="font-medium inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-smart-gold-light" />
                          {age} Thn
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Jenis Kelamin */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          m.gender === 'Putri'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {m.gender || 'Putra'}
                      </span>
                    </td>

                    {/* Nomor WA */}
                    <td className="py-3.5 px-4">
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 transition text-xs font-mono"
                          title="Kirim pesan WhatsApp"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{m.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Alamat */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {m.address ? (
                        <div className="flex items-start gap-1.5 max-w-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{m.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={m.status === 'Aktif' ? 'green' : m.status === 'Cedera' ? 'red' : 'slate'}
                        size="sm"
                      >
                        {m.status}
                      </Badge>
                    </td>

                    {/* Aksi */}
                    {role !== 'MEMBER' && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(m)}
                            className="p-1.5 text-slate-400 hover:text-smart-gold-light hover:bg-smart-maroon/20 rounded-lg transition cursor-pointer"
                            title="Edit Data Anggota"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id, m.name)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                            title="Hapus Anggota"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Tidak ada data anggota yang sesuai pencarian atau filter.
            </div>
          )}

          {loading && (
            <div className="p-8 text-center text-slate-400 text-sm">
              Memuat data anggota...
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah / Edit Anggota */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
        subtitle="Isi data anggota: Nama, Umur, Jenis Kelamin, Nomor WA, Alamat, dan Status"
        icon={<UserPlus className="w-4 h-4" />}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3.5">
            {/* 1. Nama */}
            <FormInput
              label="Nama Lengkap"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Rivan Nurmulya"
            />

            {/* 2. Umur & Jenis Kelamin (Grid 2 Kolom) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                label="Umur (Tahun)"
                type="number"
                min="1"
                max="100"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Contoh: 17"
              />

              <FormSelect
                label="Jenis Kelamin"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as Gender })
                }
              >
                <option value="Putra">Putra</option>
                <option value="Putri">Putri</option>
              </FormSelect>
            </div>

            {/* 3. Nomor WA */}
            <FormInput
              label="Nomor WhatsApp"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Contoh: 081234567890"
            />

            {/* 4. Alamat */}
            <FormInput
              label="Alamat"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Contoh: Jl. Soekarno Hatta No. 12, Bandung"
            />

            {/* 5. Status */}
            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as MemberStatus })
              }
            >
              <option value="Aktif">Aktif</option>
              <option value="Non-Aktif">Non-Aktif</option>
              <option value="Cedera">Cedera</option>
            </FormSelect>
          </div>

          <div className="pt-4 border-t border-smart-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={formSubmitting}>
              {editingMember ? 'Simpan Perubahan' : 'Simpan Anggota'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
