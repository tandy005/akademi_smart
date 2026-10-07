'use client';

import React, { useState, useEffect } from 'react';
import { useRole } from '@/context/RoleContext';
import {
  Newspaper,
  Plus,
  Pin,
  Calendar,
  MapPin,
  User,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { NewsAgenda, NewsCategory } from '@/lib/types';
import {
  PageHeader,
  Button,
  Badge,
  Modal,
  FormInput,
  FormSelect,
} from '@/components/ui';

export default function BeritaPage() {
  const { role } = useRole();
  const [newsList, setNewsList] = useState<NewsAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsAgenda | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<NewsAgenda>>({
    title: '',
    category: 'AGENDA',
    date: new Date().toISOString().split('T')[0],
    author: 'Pengurus Akademi Smart',
    content: '',
    summary: '',
    location: '',
    isPinned: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        setNewsList(await res.json());
      }
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'AGENDA',
      date: new Date().toISOString().split('T')[0],
      author: 'Pengurus Akademi Smart',
      content: '',
      summary: '',
      location: '',
      isPinned: false,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: NewsAgenda) => {
    setEditingItem(item);
    setFormData(item);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus "${title}"?`)) return;
    try {
      const res = await fetch(`/api/news?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Gagal menghapus berita');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      setErrorMsg('Judul dan isi berita wajib diisi');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingItem) {
        const res = await fetch('/api/news', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, id: editingItem.id }),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchData();
        } else {
          const d = await res.json();
          setErrorMsg(d.error || 'Gagal mengubah berita');
        }
      } else {
        const res = await fetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchData();
        } else {
          const d = await res.json();
          setErrorMsg(d.error || 'Gagal membuat berita');
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMsg(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = newsList.filter((n) =>
    selectedCategory === 'ALL' ? true : n.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Reusable PageHeader */}
      <PageHeader
        badgeText="Informasi & Agenda"
        badgeIcon={<Newspaper className="w-3.5 h-3.5" />}
        title="Berita & Agenda Akademi Smart"
        subtitle="Informasi kejuaraan voli, turnamen antar klub, jadwal try-out, dan prestasi atlet"
        actions={
          role !== 'MEMBER' && (
            <Button
              variant="primary"
              size="sm"
              onClick={openAddModal}
              icon={<Plus className="w-4 h-4" />}
            >
              Tambah Berita / Agenda
            </Button>
          )
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-smart-border pb-3 text-xs">
        {['ALL', 'AGENDA', 'PENGUMUMAN', 'PRESTASI', 'BERITA'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-smart-gold to-smart-gold-light text-smart-dark shadow-sm'
                : 'bg-smart-card text-slate-300 hover:text-white hover:bg-smart-card-hover border border-smart-border'
            }`}
          >
            {cat === 'ALL' ? 'Semua Berita' : cat}
          </button>
        ))}
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-6 rounded-2xl bg-smart-card border transition-all duration-200 shadow-md flex flex-col justify-between ${
              item.isPinned
                ? 'border-smart-gold/60 ring-1 ring-smart-gold/30 shadow-smart-red/10'
                : 'border-smart-border hover:border-smart-border-light'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      item.category === 'AGENDA'
                        ? 'blue'
                        : item.category === 'PRESTASI'
                        ? 'gold'
                        : 'maroon'
                    }
                    size="sm"
                  >
                    {item.category}
                  </Badge>

                  {item.isPinned && (
                    <Badge variant="gold" size="sm">
                      <span className="flex items-center gap-1">
                        <Pin className="w-3 h-3" /> Disematkan
                      </span>
                    </Badge>
                  )}
                </div>

                {role !== 'MEMBER' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 text-slate-400 hover:text-smart-gold-light rounded transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-1 text-red-400 hover:text-red-300 rounded transition cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                {item.title}
              </h3>

              <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {item.content}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-smart-border flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-smart-gold-light" />
                  {item.date}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-smart-gold-light" />
                  {item.author}
                </span>
              </div>

              {item.location && (
                <span className="flex items-center gap-1 text-smart-gold-light font-medium">
                  <MapPin className="w-3 h-3" />
                  {item.location}
                </span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 p-12 text-center text-slate-500 text-sm bg-smart-card rounded-2xl border border-smart-border">
            Belum ada berita atau agenda dalam kategori ini.
          </div>
        )}
      </div>

      {/* Add / Edit News Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Berita / Agenda' : 'Publikasi Berita & Agenda Baru'}
        subtitle="Akademi Smart Volleyball Club"
        icon={<Newspaper className="w-4 h-4" />}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <FormInput
            label="Judul Berita / Agenda"
            required
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Contoh: Jadwal Libur Latihan Hari Raya"
          />

          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="Kategori"
              required
              value={formData.category || 'AGENDA'}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as NewsCategory })
              }
            >
              <option value="AGENDA">AGENDA (Kejuaraan/Sparing)</option>
              <option value="PENGUMUMAN">PENGUMUMAN (Manajemen)</option>
              <option value="PRESTASI">PRESTASI (Juara/Penghargaan)</option>
              <option value="BERITA">BERITA (Artikel/Tips Voli)</option>
            </FormSelect>

            <FormInput
              label="Tanggal Kegiatan"
              type="date"
              value={formData.date || ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <FormInput
            label="Lokasi Kegiatan (Opsional)"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Contoh: GOR Saparua Bandung"
          />

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Isi Berita Lengkap *</label>
            <textarea
              rows={5}
              required
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Tuliskan isi pengumuman atau agenda secara detail..."
              className="w-full px-3 py-2 bg-smart-dark border border-smart-border rounded-xl text-white focus:outline-none focus:border-smart-gold leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinCheckbox"
              checked={Boolean(formData.isPinned)}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              className="w-4 h-4 text-smart-gold-light rounded border-smart-border bg-smart-dark focus:ring-0 cursor-pointer"
            />
            <label htmlFor="pinCheckbox" className="text-slate-300 cursor-pointer font-medium">
              Sematkan di baris teratas (Pinned Post)
            </label>
          </div>

          <div className="pt-3 border-t border-smart-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
              Publikasikan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
