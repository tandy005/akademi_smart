'use client';

import React, { useState, useMemo } from 'react';
import { CashTransaction } from '@/lib/types';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import { Badge } from './ui';

interface MonthlyFinanceChartProps {
  transactions: CashTransaction[];
  year?: number;
  selectedMonth?: number;
  onSelectMonth?: (month: number) => void;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const MONTH_SHORT = [
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

export default function MonthlyFinanceChart({
  transactions,
  year = new Date().getFullYear(),
  selectedMonth,
  onSelectMonth,
}: MonthlyFinanceChartProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Calculate monthly metrics for all 12 months
  const monthlyData = useMemo(() => {
    return MONTH_NAMES.map((name, index) => {
      const monthNum = index + 1;
      const monthPrefix = `${year}-${String(monthNum).padStart(2, '0')}`;
      const monthTxs = transactions.filter((t) => t.date && t.date.startsWith(monthPrefix));

      const income = monthTxs
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTxs
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      const net = income - expense;

      return {
        month: monthNum,
        name,
        shortName: MONTH_SHORT[index],
        income,
        expense,
        net,
        transactionCount: monthTxs.length,
      };
    });
  }, [transactions, year]);

  // Find max value to scale chart bars nicely
  const maxVal = useMemo(() => {
    let max = 0;
    monthlyData.forEach((d) => {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
      if (Math.abs(d.net) > max) max = Math.abs(d.net);
    });
    return max > 0 ? max : 1000000;
  }, [monthlyData]);

  // Overall year totals
  const yearTotals = useMemo(() => {
    const totalIncome = monthlyData.reduce((acc, m) => acc + m.income, 0);
    const totalExpense = monthlyData.reduce((acc, m) => acc + m.expense, 0);
    const totalNet = totalIncome - totalExpense;
    return { totalIncome, totalExpense, totalNet };
  }, [monthlyData]);

  const activeData = hoveredMonth !== null
    ? monthlyData[hoveredMonth - 1]
    : selectedMonth !== undefined && selectedMonth >= 1 && selectedMonth <= 12
    ? monthlyData[selectedMonth - 1]
    : null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C0202] via-[#330404] to-[#120101] border border-[#A81B1B]/50 p-5 sm:p-7 space-y-6 shadow-2xl">
      {/* Subtle decorative glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#D00000]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

      {/* Header & Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-smart-gold/20 text-smart-gold-light border border-smart-gold/40">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Grafik Laporan Kas Tiap Bulan ({year})
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Perbandingan pemasukan, pengeluaran, dan sisa keuangan kas akademi per bulan
          </p>
        </div>

        {/* Legend & View Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 text-xs bg-black/40 px-3 py-1.5 rounded-xl border border-[#A81B1B]/30 backdrop-blur-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block shadow-sm"></span>
              <span className="text-slate-300 text-[11px] font-medium">Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block shadow-sm"></span>
              <span className="text-slate-300 text-[11px] font-medium">Pengeluaran</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-smart-gold-light inline-block shadow-sm"></span>
              <span className="text-slate-300 text-[11px] font-medium">Sisa Kas</span>
            </div>
          </div>

          <div className="flex items-center rounded-xl bg-black/40 border border-[#A81B1B]/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1 rounded-lg transition font-semibold cursor-pointer ${
                viewMode === 'chart'
                  ? 'bg-gradient-to-r from-[#8F0000] to-[#b91c1c] text-white shadow-sm border border-red-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Grafik
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg transition font-semibold cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-[#8F0000] to-[#b91c1c] text-white shadow-sm border border-red-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tabel
            </button>
          </div>
        </div>
      </div>

      {/* Hovered or Selected Month Tooltip Card */}
      <div className="relative z-10 p-3.5 rounded-2xl bg-black/40 border border-[#A81B1B]/40 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-smart-gold-light" />
          <span className="text-slate-300">
            Fokus Data:{' '}
            <strong className="text-white font-bold">
              {activeData ? activeData.name : 'Rata-rata / Tahunan'} {year}
            </strong>
          </span>
          {activeData && onSelectMonth && (
            <Badge variant="gold" size="sm">
              Bulan {activeData.month}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Pemasukan:</span>
            <span className="text-white font-bold">
              Rp {(activeData ? activeData.income : yearTotals.totalIncome).toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-rose-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Pengeluaran:</span>
            <span className="text-white font-bold">
              Rp {(activeData ? activeData.expense : yearTotals.totalExpense).toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-smart-gold-light">
            <Wallet className="w-3.5 h-3.5" />
            <span>Sisa Kas:</span>
            <span
              className={
                (activeData ? activeData.net : yearTotals.totalNet) >= 0
                  ? 'text-emerald-400 font-bold'
                  : 'text-rose-400 font-bold'
              }
            >
              Rp {(activeData ? activeData.net : yearTotals.totalNet).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Main View: Chart or Table */}
      {viewMode === 'chart' ? (
        <div className="relative z-10 pt-2">
          {/* Bar Chart Container */}
          <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-1.5 sm:gap-2.5 pb-2 border-b border-[#A81B1B]/40 relative">
            {/* Horizontal guide lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-15">
              <div className="border-b border-white w-full"></div>
              <div className="border-b border-white w-full"></div>
              <div className="border-b border-white w-full"></div>
              <div className="border-b border-white w-full"></div>
            </div>

            {monthlyData.map((d) => {
              const incomeHeight = maxVal > 0 ? Math.min(100, Math.round((d.income / maxVal) * 100)) : 0;
              const expenseHeight = maxVal > 0 ? Math.min(100, Math.round((d.expense / maxVal) * 100)) : 0;
              const netHeight =
                maxVal > 0 ? Math.min(100, Math.round((Math.max(0, d.net) / maxVal) * 100)) : 0;

              const isSelected = selectedMonth === d.month;
              const isHovered = hoveredMonth === d.month;

              return (
                <div
                  key={d.month}
                  onClick={() => onSelectMonth && onSelectMonth(d.month)}
                  onMouseEnter={() => setHoveredMonth(d.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  className={`flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer transition-all rounded-xl p-1 ${
                    isSelected
                      ? 'bg-smart-gold/20 ring-1 ring-smart-gold/60'
                      : isHovered
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Floating tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-24 z-20 bg-[#0f0404] text-white rounded-xl p-2.5 shadow-2xl text-[10px] w-38 pointer-events-none border border-[#A81B1B]/60">
                      <div className="font-bold text-white mb-1 border-b border-[#A81B1B]/40 pb-0.5">
                        {d.name} {year}
                      </div>
                      <div className="text-emerald-400 flex justify-between">
                        <span>Pemasukan:</span>
                        <span>Rp {(d.income / 1000).toLocaleString('id-ID')}k</span>
                      </div>
                      <div className="text-rose-400 flex justify-between">
                        <span>Pengeluaran:</span>
                        <span>Rp {(d.expense / 1000).toLocaleString('id-ID')}k</span>
                      </div>
                      <div className="text-smart-gold-light font-bold flex justify-between pt-0.5 border-t border-[#A81B1B]/40">
                        <span>Sisa Kas:</span>
                        <span>Rp {(d.net / 1000).toLocaleString('id-ID')}k</span>
                      </div>
                    </div>
                  )}

                  {/* Bars cluster */}
                  <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full pb-1">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${Math.max(4, incomeHeight)}%` }}
                      className={`w-2 sm:w-2.5 rounded-t-sm transition-all duration-300 ${
                        d.income > 0
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:brightness-125 shadow-sm shadow-emerald-500/30'
                          : 'bg-white/10'
                      }`}
                    />

                    {/* Expense Bar */}
                    <div
                      style={{ height: `${Math.max(4, expenseHeight)}%` }}
                      className={`w-2 sm:w-2.5 rounded-t-sm transition-all duration-300 ${
                        d.expense > 0
                          ? 'bg-gradient-to-t from-rose-700 to-rose-400 group-hover:brightness-125 shadow-sm shadow-rose-500/30'
                          : 'bg-white/10'
                      }`}
                    />

                    {/* Net/Saldo Bar */}
                    <div
                      style={{ height: `${Math.max(4, netHeight)}%` }}
                      className={`w-1.5 sm:w-2 rounded-t-sm transition-all duration-300 ${
                        d.net > 0
                          ? 'bg-gradient-to-t from-amber-600 to-smart-gold-light group-hover:brightness-125 shadow-sm shadow-amber-400/30'
                          : d.net < 0
                          ? 'bg-rose-950 opacity-60'
                          : 'bg-white/10'
                      }`}
                    />
                  </div>

                  {/* Month Label */}
                  <span
                    className={`text-[10px] sm:text-xs font-semibold mt-1 transition ${
                      isSelected
                        ? 'text-smart-gold-light font-bold scale-105'
                        : isHovered
                        ? 'text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    {d.shortName}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-300 px-1">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-smart-gold-light" />
              Klik pada batang bulan untuk memfilter ringkasan keuangan kas di atas.
            </span>
            <span className="text-slate-400 hidden sm:inline font-mono">
              Nilai tertinggi skala: Rp {maxVal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="relative z-10 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#A81B1B]/40 text-slate-300 font-semibold bg-black/40">
                <th className="py-2.5 px-3">Bulan</th>
                <th className="py-2.5 px-3">Transaksi</th>
                <th className="py-2.5 px-3 text-right">Pemasukan</th>
                <th className="py-2.5 px-3 text-right">Pengeluaran</th>
                <th className="py-2.5 px-3 text-right">Sisa Kas (Net)</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#A81B1B]/20 text-slate-300">
              {monthlyData.map((d) => (
                <tr
                  key={d.month}
                  className={`hover:bg-white/5 transition ${
                    selectedMonth === d.month ? 'bg-smart-gold/20 font-semibold text-white' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-white font-medium">{d.name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{d.transactionCount} transaksi</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-emerald-400">
                    Rp {d.income.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-rose-400">
                    Rp {d.expense.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold">
                    <span className={d.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      Rp {d.net.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectMonth && onSelectMonth(d.month)}
                      className="text-[11px] text-smart-gold-light hover:underline font-semibold cursor-pointer"
                    >
                      Pilih Bulan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#A81B1B]/50 font-bold text-white bg-black/50">
                <td className="py-3 px-3">Total Tahunan</td>
                <td className="py-3 px-3 text-slate-400">12 Bulan</td>
                <td className="py-3 px-3 text-right text-emerald-400">
                  Rp {yearTotals.totalIncome.toLocaleString('id-ID')}
                </td>
                <td className="py-3 px-3 text-right text-rose-400">
                  Rp {yearTotals.totalExpense.toLocaleString('id-ID')}
                </td>
                <td className="py-3 px-3 text-right text-smart-gold-light">
                  Rp {yearTotals.totalNet.toLocaleString('id-ID')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
