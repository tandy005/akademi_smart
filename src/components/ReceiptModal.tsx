'use client';

import React from 'react';
import Image from 'next/image';
import { MonthlyDue, Member } from '@/lib/types';
import { X, Printer, Send, CheckCircle2 } from 'lucide-react';
import { generateDirectWhatsAppUrl } from '@/lib/whatsapp-utils';
import { Button } from '@/components/ui';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  due: MonthlyDue | null;
  member: Member | null;
  academyName: string;
}

const MONTH_NAMES = [
  '',
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

export default function ReceiptModal({
  isOpen,
  onClose,
  due,
  member,
  academyName = 'Akademi Smart',
}: ReceiptModalProps) {
  if (!isOpen || !due || !member) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptDate = due.paidAt
    ? new Date(due.paidAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const waReceiptText = `🏐 *KUITANSI RESMI PEMBAYARAN KAS* 🏐\n*${academyName.toUpperCase()}*\n\nNo. Kuitansi: *${due.receiptNumber || 'KWT-SMART-LUNAS'}*\nNama Atlet: *${member.name}* (${member.registrationNumber})\nKategori: *${member.category}* | Posisi: *${member.position}*\n\n✅ Pembayaran: Iuran Kas Bulan *${MONTH_NAMES[due.month]} ${due.year}*\n💵 Jumlah: *Rp ${due.amount.toLocaleString('id-ID')}*\nMetode: *${due.paymentMethod || 'Tunai'}*\nTanggal Bayar: *${receiptDate}*\nStatus: *LUNAS*\n\nTerima kasih atas kedisiplinan dan dukungannya untuk kemajuan atlet Akademi Smart! 🏐✨`;

  const waUrl = member.phone ? generateDirectWhatsAppUrl(member.phone, waReceiptText) : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
      <div className="bg-smart-card border border-smart-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Actions */}
        <div className="flex items-center justify-between p-4 border-b border-smart-border bg-smart-dark/50 print:hidden">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Kuitansi Kas Digital</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="xs" onClick={handlePrint} icon={<Printer className="w-3.5 h-3.5" />}>
              Cetak
            </Button>
            {member.phone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Kirim WA
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-smart-maroon/30 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 bg-white text-slate-900 printable-receipt">
          <div className="border-b-2 border-red-900 pb-4 mb-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative flex-shrink-0">
                <Image
                  src="/LogoAkademi.png"
                  alt="Logo Akademi Smart"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight text-red-900 leading-tight">
                  {academyName.toUpperCase()}
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Kuitansi Resmi Iuran Kas Bulanan Atlet
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-red-100 border border-red-300 text-red-900 font-extrabold text-xs rounded uppercase tracking-wider">
                LUNAS
              </span>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                {due.receiptNumber || 'KWT-SMART-2026'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs mb-4">
            <div>
              <div className="text-slate-500 font-medium">Diterima Dari Atlet:</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{member.name}</div>
              <div className="text-slate-600">ID: {member.registrationNumber}</div>
              <div className="text-slate-600">
                {member.category} &bull; {member.position}
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 font-medium">Tanggal Pembayaran:</div>
              <div className="font-bold text-slate-900 mt-0.5">{receiptDate}</div>
              <div className="text-slate-600 mt-1">
                Metode: <span className="font-semibold">{due.paymentMethod || 'Tunai'}</span>
              </div>
            </div>
          </div>

          <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 my-4">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 pb-2 border-b border-red-200/60">
              <span>URAIAN PEMBAYARAN</span>
              <span>NOMINAL</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2">
              <div>
                <div className="font-bold text-slate-900">
                  Iuran Kas Bulan {MONTH_NAMES[due.month]} {due.year}
                </div>
                <div className="text-xs text-slate-500">Iuran operasional lapangan & pembinaan bola voli</div>
              </div>
              <div className="font-black text-slate-900">
                Rp {due.amount.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-[11px] text-slate-500">
              Catatan: {due.note || 'Lunas tepat waktu'}
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Total Dibayar:</div>
              <div className="text-xl font-black text-red-900">
                Rp {due.amount.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-dashed border-slate-300 flex justify-between text-[11px] text-slate-500">
            <div>
              <p>Pengurus / Bendahara</p>
              <div className="h-10"></div>
              <p className="font-bold text-slate-800">( Bendahara Akademi Smart )</p>
            </div>
            <div className="text-right">
              <p>Atlet / Wali Murid</p>
              <div className="h-10"></div>
              <p className="font-bold text-slate-800">( {member.name} )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
