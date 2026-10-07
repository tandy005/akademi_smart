'use client';

import React, { useState, useEffect } from 'react';
import { useRole } from '@/context/RoleContext';
import {
  CreditCard,
  Search,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { Member, MonthlyDue } from '@/lib/types';
import ReceiptModal from '@/components/ReceiptModal';
import {
  PageHeader,
  StatCard,
  Button,
  Badge,
  Modal,
  FormInput,
} from '@/components/ui';

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export default function KasPage() {
  const { role, currentMember } = useRole();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [members, setMembers] = useState<Member[]>([]);
  const [dues, setDues] = useState<MonthlyDue[]>([]);
  const [monthlyDueAmount, setMonthlyDueAmount] = useState<number>(75000);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Payment recording modal
  const [payModalDue, setPayModalDue] = useState<MonthlyDue | null>(null);
  const [payModalMember, setPayModalMember] = useState<Member | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'QRIS'>('Tunai');
  const [customAmount, setCustomAmount] = useState<number>(75000);
  const [paymentNote, setPaymentNote] = useState<string>('Lunas tepat waktu');
  const [submitting, setSubmitting] = useState(false);

  // Digital Receipt modal
  const [receiptDue, setReceiptDue] = useState<MonthlyDue | null>(null);
  const [receiptMember, setReceiptMember] = useState<Member | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [memRes, duesRes] = await Promise.all([
        fetch('/api/members'),
        fetch(`/api/dues?year=${year}`),
      ]);

      if (memRes.ok) setMembers(await memRes.json());
      if (duesRes.ok) {
        const d = await duesRes.json();
        setDues(d.dues || []);
        if (d.monthlyDueAmount) setMonthlyDueAmount(d.monthlyDueAmount);
      }
    } catch (err) {
      console.error('Failed to load dues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year]);

  const handleCellClick = (member: Member, monthIndex: number) => {
    const due = dues.find((d) => d.memberId === member.id && d.month === monthIndex);
    if (!due) return;

    if (due.isPaid) {
      setReceiptDue(due);
      setReceiptMember(member);
    } else {
      if (role === 'MEMBER') {
        alert(
          `Iuran bulan ${MONTHS_SHORT[monthIndex - 1]} ${due.year} sebesar Rp ${due.amount.toLocaleString(
            'id-ID'
          )} belum lunas. Silakan lakukan pembayaran ke pengurus/bendahara.`
        );
        return;
      }
      setPayModalDue(due);
      setPayModalMember(member);
      setCustomAmount(due.amount || monthlyDueAmount);
      setPaymentMethod('Tunai');
      setPaymentNote('Lunas');
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalDue) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/dues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueId: payModalDue.id,
          isPaid: true,
          paymentMethod,
          amount: Number(customAmount),
          note: paymentNote,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const updatedDue = result.due;
        setPayModalDue(null);
        await fetchData();

        if (payModalMember) {
          setReceiptDue(updatedDue);
          setReceiptMember(payModalMember);
        }
      } else {
        alert('Gagal mencatat pembayaran');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentMonthDues = dues.filter((d) => d.month === currentMonth);
  const paidThisMonth = currentMonthDues.filter((d) => d.isPaid).length;
  const totalPaidYear = dues.filter((d) => d.isPaid).reduce((sum, d) => sum + d.amount, 0);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Reusable PageHeader */}
      <PageHeader
        badgeText="Iuran & Kas Anggota"
        badgeIcon={<CreditCard className="w-3.5 h-3.5" />}
        title="Pembayaran Kas Bulanan Anggota"
        subtitle="Matriks pembayaran 12 bulan atlet Akademi Smart, kuitansi digital, dan share WhatsApp"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Tahun:</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="Pilih Tahun"
              className="px-3 py-1.5 bg-smart-card border border-smart-border rounded-xl text-xs text-white font-bold focus:outline-none focus:border-smart-gold"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        }
      />

      {/* Metrics Row using StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={`Iuran Bulan ${MONTHS_SHORT[currentMonth - 1]}`}
          value={`${paidThisMonth} / ${members.length} Lunas`}
          subtitle={`${members.length > 0 ? Math.round((paidThisMonth / members.length) * 100) : 0}% terkumpul`}
          icon={<CreditCard className="w-5 h-5" />}
          variant="green"
        />

        <StatCard
          title={`Total Kas Terkumpul (${year})`}
          value={`Rp ${totalPaidYear.toLocaleString('id-ID')}`}
          subtitle="Pemasukan dari kas iuran atlet"
          icon={<DollarSign className="w-5 h-5" />}
          variant="gold"
        />

        <StatCard
          title="Tarif Kas per Atlet"
          value={`Rp ${monthlyDueAmount.toLocaleString('id-ID')}`}
          subtitle="Per bulan per anggota"
          icon={<DollarSign className="w-5 h-5" />}
          variant="maroon"
        />
      </div>

      {/* Legend & Search */}
      <div className="p-4 rounded-2xl bg-smart-card border border-smart-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span>Lunas (Klik untuk Cetak Kuitansi / Share WA)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-smart-dark border border-smart-border inline-block"></span>
            <span>Belum Bayar (Klik untuk Catat Bayar)</span>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama atlet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-smart-dark border border-smart-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-smart-gold"
          />
        </div>
      </div>

      {/* 12-Month Matrix Table */}
      <div className="rounded-2xl bg-smart-card border border-smart-border overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-smart-dark/80 text-slate-400 border-b border-smart-border font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sticky left-0 bg-smart-dark z-10 min-w-44">
                  Nama Atlet &amp; ID
                </th>
                <th className="py-3.5 px-3 min-w-20">Kategori</th>
                {MONTHS_SHORT.map((m, idx) => (
                  <th
                    key={m}
                    className={`py-3.5 px-2 text-center min-w-14 ${
                      idx + 1 === currentMonth ? 'text-smart-gold-light bg-smart-maroon/20' : ''
                    }`}
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-smart-border/60">
              {filteredMembers.map((m) => {
                const isCurrentMember = role === 'MEMBER' && currentMember?.id === m.id;

                return (
                  <tr
                    key={m.id}
                    className={`transition ${
                      isCurrentMember
                        ? 'bg-smart-maroon/20 border-l-2 border-smart-gold'
                        : 'hover:bg-smart-maroon/10'
                    }`}
                  >
                    {/* Name */}
                    <td className="py-3 px-4 sticky left-0 bg-smart-card z-10">
                      <div className="font-bold text-white text-sm flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {isCurrentMember && (
                          <Badge variant="gold" size="sm">
                            Anda
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {m.registrationNumber}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-slate-300 font-medium">{m.category}</td>

                    {/* 12 Months Cells */}
                    {MONTHS_SHORT.map((_, idx) => {
                      const monthNum = idx + 1;
                      const due = dues.find((d) => d.memberId === m.id && d.month === monthNum);
                      const isPaid = due?.isPaid;

                      return (
                        <td
                          key={monthNum}
                          className={`py-2 px-1 text-center ${
                            monthNum === currentMonth ? 'bg-smart-maroon/10' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleCellClick(m, monthNum)}
                            className={`w-9 h-8 rounded-lg font-mono text-[11px] font-bold flex items-center justify-center mx-auto transition cursor-pointer ${
                              isPaid
                                ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 border border-emerald-500/50 shadow-xs'
                                : 'bg-smart-dark hover:bg-smart-card-hover text-slate-500 hover:text-white border border-smart-border/70'
                            }`}
                            title={
                              isPaid
                                ? `Lunas: Rp ${due?.amount.toLocaleString('id-ID')} (${due?.paymentMethod}). Klik untuk kuitansi.`
                                : `Belum bayar. Klik untuk catat pembayaran.`
                            }
                          >
                            {isPaid ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <span>-</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredMembers.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Tidak ada data anggota.
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Reusable Modal */}
      <Modal
        isOpen={Boolean(payModalDue && payModalMember)}
        onClose={() => setPayModalDue(null)}
        title="Catat Pembayaran Iuran Kas"
        subtitle="Akademi Smart Volleyball"
        icon={<CreditCard className="w-4 h-4 text-smart-gold-light" />}
        maxWidth="md"
      >
        {payModalDue && payModalMember && (
          <form onSubmit={handleConfirmPayment} className="p-5 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-smart-dark border border-smart-border space-y-1">
              <div className="font-bold text-white text-sm">{payModalMember.name}</div>
              <div className="text-slate-400">
                ID: {payModalMember.registrationNumber} &bull; {payModalMember.category}
              </div>
              <div className="text-smart-gold-light font-bold pt-1">
                Periode: Bulan {MONTHS_SHORT[payModalDue.month - 1]} {payModalDue.year}
              </div>
            </div>

            <FormInput
              label="Nominal Pembayaran (Rp)"
              type="number"
              required
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
            />

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Metode Pembayaran *</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Tunai', 'Transfer Bank', 'QRIS'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition cursor-pointer ${
                      paymentMethod === m
                        ? 'bg-smart-maroon/40 border-smart-gold text-white shadow-sm'
                        : 'bg-smart-dark border-smart-border text-slate-400 hover:bg-smart-card-hover'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <FormInput
              label="Catatan / Keterangan"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Lunas tepat waktu"
            />

            <div className="pt-3 border-t border-smart-border flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPayModalDue(null)}>
                Batal
              </Button>
              <Button variant="gold" size="sm" type="submit" isLoading={submitting}>
                Konfirmasi Lunas
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(receiptDue && receiptMember)}
        onClose={() => {
          setReceiptDue(null);
          setReceiptMember(null);
        }}
        due={receiptDue}
        member={receiptMember}
        academyName="Akademi Smart"
      />
    </div>
  );
}
