'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MonthlyDue, Member } from '@/lib/types';
import { X, Printer, Send, CheckCircle2, FileText } from 'lucide-react';
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      // Format A5 Portrait (148 x 210 mm)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      // Header Banner Maroon
      doc.setFillColor(143, 0, 0);
      doc.rect(0, 0, 148, 18, 'F');

      doc.setTextColor(255, 200, 61); // Gold
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(academyName.toUpperCase(), 10, 12);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('KUITANSI PEMBAYARAN KAS', 148 - 10, 12, { align: 'right' });

      // Receipt info
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.text(`No: ${due.receiptNumber || 'KWT-SMART-2026'}`, 10, 26);
      doc.text(`Status: LUNAS`, 148 - 10, 26, { align: 'right' });

      // Garis pembatas
      doc.setDrawColor(203, 213, 225);
      doc.line(10, 29, 138, 29);

      // Info Pihak
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Diterima Dari:', 10, 36);
      doc.setFont('helvetica', 'normal');
      doc.text(`${member.name} (${member.registrationNumber})`, 10, 42);
      doc.text(`Kategori: ${member.category} | Posisi: ${member.position}`, 10, 48);

      doc.setFont('helvetica', 'bold');
      doc.text('Rincian Pembayaran:', 85, 36);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tanggal: ${receiptDate}`, 85, 42);
      doc.text(`Metode: ${due.paymentMethod || 'Tunai'}`, 85, 48);

      // Box Pembayaran
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(10, 55, 128, 30, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(10, 55, 128, 30, 3, 3, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Iuran Kas Bulan ${MONTH_NAMES[due.month]} ${due.year}`, 16, 66);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Iuran operasional lapangan & pembinaan bola voli', 16, 73);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(143, 0, 0);
      doc.text(`Rp ${due.amount.toLocaleString('id-ID')}`, 132, 70, { align: 'right' });

      // Total Box
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(10, 90, 128, 14, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('TOTAL DIBAYAR:', 16, 99);
      doc.setFontSize(12);
      doc.setTextColor(143, 0, 0);
      doc.text(`Rp ${due.amount.toLocaleString('id-ID')}`, 132, 100, { align: 'right' });

      // Catatan
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'italic');
      doc.text(`Catatan: ${due.note || 'Lunas tepat waktu'}`, 10, 112);

      // Tanda Tangan
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);

      doc.text('Bendahara / Pengurus,', 15, 130);
      doc.line(15, 155, 55, 155);
      doc.setFont('helvetica', 'bold');
      doc.text('( Bendahara Smart )', 15, 160);

      doc.setFont('helvetica', 'normal');
      doc.text('Atlet / Wali Murid,', 95, 130);
      doc.line(95, 155, 135, 155);
      doc.setFont('helvetica', 'bold');
      doc.text(`( ${member.name} )`, 95, 160);

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text('Akademi Voly Smart 09 Sidoarjo • Kuitansi Sah Sistem Digital', 74, 180, { align: 'center' });

      doc.save(`Kuitansi_${member.name.replace(/\s+/g, '_')}_${MONTH_NAMES[due.month]}_${due.year}.pdf`);
    } catch (err) {
      console.error('Gagal membuat PDF kuitansi:', err);
      alert('Terjadi kesalahan saat mengunduh PDF kuitansi.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const waReceiptText = `🏐 *KUITANSI RESMI PEMBAYARAN KAS* 🏐\n*${academyName.toUpperCase()}*\n\nNo. Kuitansi: *${due.receiptNumber || 'KWT-SMART-LUNAS'}*\nNama Atlet: *${member.name}* (${member.registrationNumber})\nKategori: *${member.category}* | Posisi: *${member.position}*\n\n✅ Pembayaran: Iuran Kas Bulan *${MONTH_NAMES[due.month]} ${due.year}*\n💵 Jumlah: *Rp ${due.amount.toLocaleString('id-ID')}*\nMetode: *${due.paymentMethod || 'Tunai'}*\nTanggal Bayar: *${receiptDate}*\nStatus: *LUNAS*\n\nTerima kasih atas kedisiplinan dan dukungannya untuk kemajuan atlet Akademi Smart! 🏐✨`;

  const waUrl = member.phone ? generateDirectWhatsAppUrl(member.phone, waReceiptText) : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs print:fixed print:inset-0 print:z-[99999] print:bg-white print:p-0 print:m-0 print:flex print:items-center print:justify-center print:overflow-visible">
      <div className="bg-smart-card border border-smart-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-150 print:bg-transparent print:border-none print:shadow-none print:max-w-xl print:w-full print:m-0 print:p-0">
        {/* Header Actions */}
        <div className="flex items-center justify-between p-4 border-b border-smart-border bg-smart-dark/50 print:hidden">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Kuitansi Kas Digital</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="primary"
              size="xs"
              onClick={handleDownloadPdf}
              isLoading={isGeneratingPdf}
              icon={<FileText className="w-3.5 h-3.5" />}
              title="Cetak & Unduh Kuitansi PDF"
            >
              Cetak PDF
            </Button>
            <Button variant="secondary" size="xs" onClick={handlePrint} icon={<Printer className="w-3.5 h-3.5" />}>
              Print
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
