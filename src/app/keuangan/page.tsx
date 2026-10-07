'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRole } from '@/context/RoleContext';
import {
  TrendingUp,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  Calendar,
  Filter,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { CashTransaction } from '@/lib/types';
import {
  PageHeader,
  StatCard,
  Button,
  Badge,
  Modal,
  FormInput,
  FormSelect,
} from '@/components/ui';

export default function KeuanganPage() {
  const { role } = useRole();
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [balanceData, setBalanceData] = useState({
    currentBalance: 0,
    totalIncomeAll: 0,
    totalExpenseAll: 0,
    filteredIncome: 0,
    filteredExpense: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CashTransaction>>({
    type: 'EXPENSE',
    category: 'Sewa Lapangan',
    amount: 150000,
    description: '',
    date: new Date().toISOString().split('T')[0],
    recordedBy: 'Bendahara Kas',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/finance?';
      if (selectedMonth) url += `month=${selectedMonth}&`;
      if (selectedType !== 'ALL') url += `type=${selectedType}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setBalanceData({
          currentBalance: data.currentBalance || 0,
          totalIncomeAll: data.totalIncomeAll || 0,
          totalExpenseAll: data.totalExpenseAll || 0,
          filteredIncome: data.filteredIncome || 0,
          filteredExpense: data.filteredExpense || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching finance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.category) {
      setErrorMsg('Harap lengkapi semua kolom');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          type: 'EXPENSE',
          category: 'Sewa Lapangan',
          amount: 150000,
          description: '',
          date: new Date().toISOString().split('T')[0],
          recordedBy: 'Bendahara Kas',
        });
        fetchData();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Gagal menyimpan transaksi');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (!confirm(`Hapus transaksi "${desc}"?`)) return;
    try {
      const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Gagal menghapus transaksi');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Reusable PageHeader */}
      <div className="print:hidden">
        <PageHeader
          badgeText="Laporan Arus Kas"
          badgeIcon={<TrendingUp className="w-3.5 h-3.5" />}
          title="Laporan Keuangan Kas Akademi Smart"
          subtitle="Transparansi pembukuan kas masuk (iuran, pendaftaran, sponsor) dan kas keluar (sewa lapangan, bola voli, honor pelatih)"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                icon={<Printer className="w-4 h-4" />}
              >
                Cetak Laporan
              </Button>

              {role !== 'MEMBER' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Catat Kas Masuk/Keluar
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Printable Header for print mode */}
      <div className="hidden print:block text-slate-900 border-b-2 border-red-900 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Image src="/LogoAkademi.png" alt="Logo" width={44} height={44} />
          <div>
            <h1 className="text-xl font-black text-red-900">AKADEMI SMART VOLLEYBALL</h1>
            <p className="text-xs text-slate-600">
              Laporan Keuangan Kas Resmi &bull; Tanggal Cetak:{' '}
              {new Date().toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards using reusable StatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Saldo Kas Terkini"
          value={`Rp ${balanceData.currentBalance.toLocaleString('id-ID')}`}
          subtitle="Saldo kas bersih tersedia"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="gold"
        />

        <StatCard
          title="Total Pemasukan Kas"
          value={`Rp ${balanceData.totalIncomeAll.toLocaleString('id-ID')}`}
          subtitle="Iuran atlet, sponsor & pendaftaran"
          icon={<ArrowDownRight className="w-5 h-5" />}
          variant="green"
        />

        <StatCard
          title="Total Pengeluaran Kas"
          value={`Rp ${balanceData.totalExpenseAll.toLocaleString('id-ID')}`}
          subtitle="Sewa GOR, bola, medis & operasional"
          icon={<ArrowUpRight className="w-5 h-5" />}
          variant="red"
        />
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-smart-card border border-smart-border flex flex-wrap items-center justify-between gap-3 text-xs print:hidden shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Filter Tipe:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filter Tipe Kas"
              className="px-3 py-1.5 bg-smart-dark border border-smart-border rounded-xl text-slate-200 focus:outline-none focus:border-smart-gold"
            >
              <option value="ALL">Semua Transaksi</option>
              <option value="INCOME">Pemasukan Saja</option>
              <option value="EXPENSE">Pengeluaran Saja</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Bulan:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Filter Periode Bulan"
              className="px-3 py-1.5 bg-smart-dark border border-smart-border rounded-xl text-slate-200 focus:outline-none focus:border-smart-gold"
            />
          </div>
        </div>

        {selectedMonth || selectedType !== 'ALL' ? (
          <button
            onClick={() => {
              setSelectedMonth('');
              setSelectedType('ALL');
            }}
            className="text-smart-gold-light hover:underline cursor-pointer"
          >
            Reset Filter
          </button>
        ) : null}
      </div>

      {/* Transaction Table */}
      <div className="rounded-2xl bg-smart-card border border-smart-border overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-smart-dark/80 text-slate-400 border-b border-smart-border font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Tanggal &amp; No. Bukti</th>
                <th className="py-3.5 px-4">Uraian / Deskripsi</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Tipe Kas</th>
                <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3.5 px-4">Dicatat Oleh</th>
                {role !== 'MEMBER' && <th className="py-3.5 px-4 text-right print:hidden">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-smart-border/60">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-smart-maroon/10 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{tx.date}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {tx.receiptNumber || '-'}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{tx.description}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant="gold" size="sm">
                      {tx.category}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={tx.type === 'INCOME' ? 'green' : 'red'} size="sm">
                      {tx.type === 'INCOME' ? '+ Pemasukan' : '- Pengeluaran'}
                    </Badge>
                  </td>

                  <td
                    className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${
                      tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">{tx.recordedBy}</td>

                  {role !== 'MEMBER' && (
                    <td className="py-3.5 px-4 text-right print:hidden">
                      <button
                        onClick={() => handleDelete(tx.id, tx.description)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {transactions.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Tidak ada catatan transaksi keuangan yang sesuai filter.
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Transaksi Kas Baru"
        subtitle="Akademi Smart Volleyball"
        icon={<TrendingUp className="w-4 h-4 text-smart-gold-light" />}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tipe Transaksi */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Jenis Transaksi *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, type: 'INCOME', category: 'Pendaftaran' })
                }
                className={`py-2 px-3 rounded-xl border font-bold text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  formData.type === 'INCOME'
                    ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-sm'
                    : 'bg-smart-dark border-smart-border text-slate-400 hover:bg-smart-card-hover'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                <span>Pemasukan (+)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, type: 'EXPENSE', category: 'Sewa Lapangan' })
                }
                className={`py-2 px-3 rounded-xl border font-bold text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  formData.type === 'EXPENSE'
                    ? 'bg-smart-red/30 border-smart-red text-white shadow-sm'
                    : 'bg-smart-dark border-smart-border text-slate-400 hover:bg-smart-card-hover'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-red-400" />
                <span>Pengeluaran (-)</span>
              </button>
            </div>
          </div>

          <FormSelect
            label="Kategori"
            required
            value={formData.category || 'Sewa Lapangan'}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {formData.type === 'INCOME' ? (
              <>
                <option value="Iuran Kas">Iuran Kas Anggota</option>
                <option value="Pendaftaran">Uang Pendaftaran Anggota Baru</option>
                <option value="Sponsorship">Sponsorship / Donatur</option>
                <option value="Hadiah Turnamen">Hadiah Kejuaraan / Turnamen</option>
                <option value="Penjualan Jersey">Penjualan Jersey / Merchandise</option>
                <option value="Lain-lain">Pemasukan Lain-lain</option>
              </>
            ) : (
              <>
                <option value="Sewa Lapangan">Sewa Lapangan / GOR Latihan</option>
                <option value="Peralatan/Bola">Pembelian Bola Voli / Net / Antena</option>
                <option value="Honor Pelatih">Honor Pelatih / Pelatih Fisik</option>
                <option value="Konsumsi">Konsumsi Air Minum & Snack Latihan</option>
                <option value="P3K">Medis P3K, Kinesio Tape & Es</option>
                <option value="Pendaftaran Turnamen">Biaya Pendaftaran Kejuaraan</option>
                <option value="Operasional">Operasional Lainnya</option>
              </>
            )}
          </FormSelect>

          <FormInput
            label="Nominal (Rp)"
            type="number"
            required
            min="1000"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            placeholder="Contoh: 250000"
          />

          <FormInput
            label="Deskripsi Transaksi"
            required
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Contoh: Pembelian Bola Mikasa V200W"
          />

          <FormInput
            label="Tanggal Transaksi"
            type="date"
            value={formData.date || ''}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          <div className="pt-3 border-t border-smart-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
              Simpan Transaksi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
