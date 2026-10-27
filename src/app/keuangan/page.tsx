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
  FileText,
  Download,
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
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CashTransaction>>({
    type: 'EXPENSE',
    category: 'Sewa Lapangan',
    amount: undefined,
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
          amount: undefined,
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

  // Export Laporan Keuangan ke Dokumen PDF Resmi
  const handleDownloadPdf = async () => {
    if (transactions.length === 0) {
      alert('Tidak ada data transaksi untuk diunduh.');
      return;
    }
    setIsExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      // Inisialisasi dokumen A4 Portrait
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
      const todayDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // Label Periode Transaksi
      let periodeText = 'Semua Periode Transaksi';
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        const monthNames = [
          '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        periodeText = `Periode: Bulan ${monthNames[parseInt(month, 10)]} ${year}`;
      }
      if (selectedType !== 'ALL') {
        periodeText += ` (${selectedType === 'INCOME' ? 'Pemasukan Saja' : 'Pengeluaran Saja'})`;
      }

      // 1. Header Banner / Kop Surat Resmi
      doc.setFillColor(143, 0, 0); // Maroon #8F0000
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setTextColor(255, 200, 61); // Emas #FFC83D
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('AKADEMI VOLY SMART 09', 14, 11);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('LAPORAN RESMI ARUS KAS & PEMBUKUAN KEUANGAN', 14, 18);

      doc.setFontSize(8);
      doc.text(`Tgl Cetak: ${todayDate}`, pageWidth - 14, 15, { align: 'right' });

      // 2. Info Periode & Ringkasan 3 Stat Card
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(periodeText, 14, 34);

      // Card 1: Saldo Kas Terkini
      doc.setFillColor(254, 252, 232); // gold light
      doc.setDrawColor(234, 179, 8);
      doc.roundedRect(14, 38, 58, 18, 2, 2, 'FD');
      doc.setFontSize(7.5);
      doc.setTextColor(133, 77, 14);
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL SALDO KAS BERSIH', 18, 44);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rp ${balanceData.currentBalance.toLocaleString('id-ID')}`, 18, 52);

      // Card 2: Total Pemasukan
      doc.setFillColor(240, 253, 244); // green light
      doc.setDrawColor(34, 197, 94);
      doc.roundedRect(76, 38, 58, 18, 2, 2, 'FD');
      doc.setFontSize(7.5);
      doc.setTextColor(22, 101, 52);
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL PEMASUKAN', 80, 44);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      const incVal = selectedMonth ? balanceData.filteredIncome : balanceData.totalIncomeAll;
      doc.text(`+ Rp ${incVal.toLocaleString('id-ID')}`, 80, 52);

      // Card 3: Total Pengeluaran
      doc.setFillColor(254, 242, 242); // red light
      doc.setDrawColor(239, 68, 68);
      doc.roundedRect(138, 38, 58, 18, 2, 2, 'FD');
      doc.setFontSize(7.5);
      doc.setTextColor(153, 27, 27);
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL PENGELUARAN', 142, 44);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      const expVal = selectedMonth ? balanceData.filteredExpense : balanceData.totalExpenseAll;
      doc.text(`- Rp ${expVal.toLocaleString('id-ID')}`, 142, 52);

      // 3. Tabel Data Transaksi Keuangan
      const tableRows = transactions.map((tx, idx) => [
        (idx + 1).toString(),
        tx.date,
        tx.receiptNumber || '-',
        tx.description,
        tx.category,
        tx.type === 'INCOME' ? 'Masuk' : 'Keluar',
        `${tx.type === 'INCOME' ? '+' : '-'} Rp ${tx.amount.toLocaleString('id-ID')}`,
        tx.recordedBy || 'Bendahara',
      ]);

      autoTable(doc, {
        startY: 61,
        head: [['No', 'Tanggal', 'No. Bukti', 'Uraian Transaksi', 'Kategori', 'Tipe', 'Nominal (Rp)', 'Petugas']],
        body: tableRows,
        styles: {
          fontSize: 8,
          cellPadding: 2.2,
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [143, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { cellWidth: 20 },
          2: { cellWidth: 24, font: 'courier' },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 24 },
          5: { halign: 'center', cellWidth: 16 },
          6: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
          7: { cellWidth: 22 },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 6) {
            const rawText = data.cell.raw as string;
            if (rawText.startsWith('+')) {
              data.cell.styles.textColor = [22, 101, 52];
            } else {
              data.cell.styles.textColor = [185, 28, 28];
            }
          }
        },
      });

      // 4. Pengesahan & Tanda Tangan
      const finalY = (doc as any).lastAutoTable?.finalY || 180;
      let signY = finalY + 12;

      // Jaga agar tidak terpotong di akhir halaman
      if (signY + 45 > 280) {
        doc.addPage();
        signY = 25;
      }

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Sidoarjo, ${todayDate}`, pageWidth - 60, signY);

      doc.text('Mengetahui / Memeriksa,', 20, signY + 6);
      doc.text('Ketua Akademi Smart', 20, signY + 11);
      doc.line(20, signY + 32, 65, signY + 32);
      doc.setFont('helvetica', 'bold');
      doc.text('( Pembina / Ketua )', 20, signY + 37);

      doc.setFont('helvetica', 'normal');
      doc.text('Dicatat Oleh,', pageWidth - 60, signY + 6);
      doc.text('Bendahara Kas', pageWidth - 60, signY + 11);
      doc.line(pageWidth - 60, signY + 32, pageWidth - 15, signY + 32);
      doc.setFont('helvetica', 'bold');
      doc.text('( Bendahara Smart )', pageWidth - 60, signY + 37);

      // Download file PDF
      const filename = `Laporan_Keuangan_Akademi_Smart_${selectedMonth || 'Semua'}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Gagal membuat PDF Laporan Keuangan:', err);
      alert('Terjadi kesalahan saat mengunduh PDF laporan keuangan.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Data ke Format CSV / Excel
  const handleDownloadCsv = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data transaksi untuk diexport.');
      return;
    }
    const headers = ['No', 'Tanggal', 'No. Bukti', 'Uraian Transaksi', 'Kategori', 'Tipe', 'Nominal', 'Petugas'];
    const rows = transactions.map((tx, idx) => [
      idx + 1,
      `"${tx.date}"`,
      `"${tx.receiptNumber || '-'}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      `"${tx.category}"`,
      tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      tx.amount,
      `"${tx.recordedBy || 'Bendahara'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Keuangan_Akademi_Smart_${selectedMonth || 'Semua'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadPdf}
                isLoading={isExportingPdf}
                icon={<FileText className="w-4 h-4" />}
                title="Download Dokumen PDF Laporan Keuangan Resmi"
              >
                Download PDF
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadCsv}
                icon={<Download className="w-4 h-4" />}
                title="Export Data ke Excel / CSV"
              >
                Export Excel
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                icon={<Printer className="w-4 h-4" />}
                title="Cetak via Printer Browser"
              >
                Cetak
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

          {/* Tipe Transaksi Dropdown */}
          <FormSelect
            label="Jenis Transaksi"
            required
            value={formData.type || 'EXPENSE'}
            onChange={(e) => {
              const newType = e.target.value as 'INCOME' | 'EXPENSE';
              setFormData({
                ...formData,
                type: newType,
                category: newType === 'INCOME' ? 'Pendaftaran' : 'Sewa Lapangan',
              });
            }}
          >
            <option value="EXPENSE">Pengeluaran Kas (-)</option>
            <option value="INCOME">Pemasukan Kas (+)</option>
          </FormSelect>

          <FormSelect
            label="Kategori"
            required
            value={formData.category || (formData.type === 'INCOME' ? 'Pendaftaran' : 'Sewa Lapangan')}
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
                <option value="Peralatan">Pembelian Bola Voli / Net / Antena</option>
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
            value={formData.amount !== undefined && formData.amount !== null ? formData.amount : ''}
            onChange={(e) => {
              const val = e.target.value;
              setFormData({ ...formData, amount: val === '' ? undefined : Number(val) });
            }}
            placeholder="0"
            helperText={
              formData.amount && formData.amount > 0
                ? `Terbilang: Rp ${formData.amount.toLocaleString('id-ID')}`
                : 'Masukkan angka nominal (contoh: 50000)'
            }
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
