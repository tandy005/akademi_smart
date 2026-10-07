'use client';

import React, { useState, useEffect } from 'react';
import { useRole } from '@/context/RoleContext';
import {
  MessageSquareText,
  Send,
  Settings,
  Clock,
  CheckCircle2,
  Zap,
  Phone,
  RefreshCw,
  History,
} from 'lucide-react';
import { WhatsAppConfig, ReminderLog } from '@/lib/types';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  FormInput,
} from '@/components/ui';

export default function ReminderPage() {
  const { role } = useRole();
  const [config, setConfig] = useState<WhatsAppConfig>({
    provider: 'SIMULATOR',
    apiKey: '',
    senderNumber: '081234567890',
    webhookUrl: '',
    autoReminderEnabled: true,
    reminderHoursBefore: 4,
    messageTemplate: '',
  });
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [academyName, setAcademyName] = useState('Akademi Voly Smart 09');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Test send state
  const [testPhone, setTestPhone] = useState('081234567890');
  const [testMsg, setTestMsg] = useState(
    '🏐 Halo Atlet! Ini adalah pesan uji coba WhatsApp Gateway Akademi Voly Smart 09.'
  );
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Auto-reminder check state
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  const fetchConfigAndLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reminder');
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (data.logs) setLogs(data.logs);
        if (data.academyName) setAcademyName(data.academyName);
      }
    } catch (err) {
      console.error('Failed to load reminder settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigAndLogs();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccessMsg(null);

    try {
      const res = await fetch('/api/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_CONFIG',
          config,
        }),
      });

      if (res.ok) {
        setSaveSuccessMsg('✅ Pengaturan WhatsApp Gateway & Template berhasil disimpan!');
      } else {
        alert('Gagal menyimpan konfigurasi');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMsg) return;

    setTestSending(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_MESSAGE',
          phone: testPhone,
          message: testMsg,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult(
          `✅ Pesan terkirim! Status: ${data.status} ${
            data.status === 'SIMULATED' ? '(Mode Simulator Aktif)' : ''
          }`
        );
        fetchConfigAndLogs();
      } else {
        setTestResult(`❌ Gagal: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setTestResult(`❌ Gagal: ${errorMsg}`);
    } finally {
      setTestSending(false);
    }
  };

  const handleRunCron = async () => {
    setCronRunning(true);
    setCronResult(null);

    try {
      const res = await fetch('/api/reminder/cron');
      const data = await res.json();
      if (res.ok) {
        if (data.remindedSchedules && data.remindedSchedules.length > 0) {
          setCronResult(
            `✅ Terkirim untuk sesi: ${data.remindedSchedules.join(
              ', '
            )} (${data.totalSent} pesan)`
          );
        } else {
          setCronResult(
            `ℹ️ Pemeriksaan selesai: Tidak ada jadwal baru yang membutuhkan reminder dalam 4 jam saat ini (sudah terkirim sebelumnya atau sesi di luar rentang).`
          );
        }
        fetchConfigAndLogs();
      } else {
        setCronResult(`❌ Error saat menjalankan auto reminder.`);
      }
    } catch {
      setCronResult(`❌ Terjadi kesalahan jaringan.`);
    } finally {
      setCronRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Reusable PageHeader */}
      <PageHeader
        badgeText="Integrasi WhatsApp & Smart Reminder"
        badgeIcon={<MessageSquareText className="w-3.5 h-3.5" />}
        title="Pengaturan WhatsApp Gateway & Reminder 4 Jam"
        subtitle="Konfigurasi WhatsApp Gateway (Fonnte, WAHA, Simulator), template pesan dinamis, dan pengujian pesan"
        actions={
          <Button
            variant="gold"
            size="sm"
            onClick={handleRunCron}
            isLoading={cronRunning}
            icon={<Zap className="w-4 h-4" />}
          >
            Scan Reminder 4 Jam Sekarang
          </Button>
        }
      />

      {cronResult && (
        <div className="p-3.5 rounded-xl bg-smart-card border border-smart-gold/40 text-smart-gold-light text-xs font-medium flex items-center gap-2 shadow-sm">
          <span>{cronResult}</span>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Gateway Config & Message Template */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-smart-gold-light" />
                  <span>Konfigurasi WhatsApp Gateway</span>
                </CardTitle>
                <CardDescription>
                  Pilih penyedia WhatsApp Gateway untuk pengiriman notifikasi otomatis
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                {/* Provider Radio */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">
                    Penyedia Layanan (Provider) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div
                      onClick={() => setConfig({ ...config, provider: 'SIMULATOR' })}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        config.provider === 'SIMULATOR'
                          ? 'bg-smart-maroon/30 border-smart-gold text-white shadow-sm'
                          : 'bg-smart-dark border-smart-border text-slate-400 hover:bg-smart-card-hover'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                        <Zap className="w-3.5 h-3.5 text-smart-gold-light" />
                        <span>Simulator Mode</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Langsung aktif tanpa token API eksternal. Log pesan tercatat otomatis.
                      </p>
                    </div>

                    <div
                      onClick={() => setConfig({ ...config, provider: 'FONNTE' })}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        config.provider === 'FONNTE'
                          ? 'bg-smart-maroon/30 border-smart-gold text-white shadow-sm'
                          : 'bg-smart-dark border-smart-border text-slate-400 hover:bg-smart-card-hover'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                        <Send className="w-3.5 h-3.5 text-smart-gold-light" />
                        <span>Fonnte Gateway</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Kirim langsung ke WA nyata via token resmi Fonnte API Indonesia.
                      </p>
                    </div>

                    <div
                      onClick={() => setConfig({ ...config, provider: 'WAHA' })}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        config.provider === 'WAHA'
                          ? 'bg-smart-maroon/30 border-smart-gold text-white shadow-sm'
                          : 'bg-smart-dark border-smart-border text-slate-400 hover:bg-smart-card-hover'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                        <MessageSquareText className="w-3.5 h-3.5 text-smart-gold-light" />
                        <span>WAHA / Self-Hosted</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        WhatsApp HTTP API open-source mandiri (Baileys/Puppeteer).
                      </p>
                    </div>
                  </div>
                </div>

                {/* API Key if not simulator */}
                {config.provider !== 'SIMULATOR' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      label="API Token / Secret Key"
                      type="password"
                      value={config.apiKey || ''}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="Masukkan Token Fonnte / WAHA..."
                    />

                    {config.provider === 'WAHA' && (
                      <FormInput
                        label="Endpoint URL WAHA"
                        type="url"
                        value={config.webhookUrl || ''}
                        onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                        placeholder="http://localhost:3000"
                      />
                    )}
                  </div>
                )}

                {/* Auto Reminder Settings */}
                <div className="p-4 rounded-xl bg-smart-dark border border-smart-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">
                        Aktifkan Pengingat Otomatis 4 Jam
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Sistem background akan mengecek dan mengirim reminder ke atlet saat sesi
                        &le; 4 jam
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.autoReminderEnabled}
                      onChange={(e) =>
                        setConfig({ ...config, autoReminderEnabled: e.target.checked })
                      }
                      className="w-5 h-5 text-smart-gold-light rounded bg-smart-card border-smart-border focus:ring-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-smart-border/60">
                    <span className="text-slate-300 font-medium">Batas Waktu Pengingat:</span>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={config.reminderHoursBefore || 4}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          reminderHoursBefore: Number(e.target.value) || 4,
                        })
                      }
                      className="w-16 px-2.5 py-1.5 bg-smart-card border border-smart-border rounded-lg text-white font-mono text-center focus:outline-none focus:border-smart-gold"
                    />
                    <span className="text-slate-400">Jam sebelum jadwal latihan dimulai</span>
                  </div>
                </div>

                {/* Message Template Customizer */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">
                      Template Pesan Pengingat WhatsApp
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Mendukung format tebal (*text*) dan miring (_text_)
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={config.messageTemplate}
                    onChange={(e) => setConfig({ ...config, messageTemplate: e.target.value })}
                    className="w-full p-3 bg-smart-dark border border-smart-border rounded-xl text-emerald-300 font-mono text-xs focus:outline-none focus:border-smart-gold leading-relaxed"
                  />

                  <div className="mt-2 p-3 rounded-xl bg-smart-dark border border-smart-border text-[11px] text-slate-400 space-y-1">
                    <div className="font-semibold text-smart-gold-light">Variabel Template yang Tersedia:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-slate-300">
                      <span>{'{nama}'} = Nama Atlet</span>
                      <span>{'{kategori}'} = U-15 / U-18</span>
                      <span>{'{posisi}'} = Setter / Spiker</span>
                      <span>{'{tanggal}'} = Hari &amp; Tanggal</span>
                      <span>{'{jam}'} = Jam Sesi Latihan</span>
                      <span>{'{lokasi}'} = Lokasi GOR</span>
                      <span>{'{pelatih}'} = Coach Bertugas</span>
                      <span>{'{materi}'} = Fokus Materi</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button variant="primary" size="md" type="submit" isLoading={saving}>
                    Simpan Pengaturan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Test Sending & Recent Logs */}
        <div className="space-y-6">
          {/* Test Send Box */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Phone className="w-4 h-4 text-smart-gold-light" />
                <span>Uji Coba Pengiriman Pesan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400 mb-4">
                Cek apakah pesan berhasil dikirim ke nomor WhatsApp Anda
              </p>

              <form onSubmit={handleTestSend} className="space-y-3 text-xs">
                <FormInput
                  label="Nomor WhatsApp Tujuan"
                  type="tel"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="081234567890"
                />

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Isi Pesan Test</label>
                  <textarea
                    rows={3}
                    value={testMsg}
                    onChange={(e) => setTestMsg(e.target.value)}
                    className="w-full p-2.5 bg-smart-dark border border-smart-border rounded-xl text-slate-200 focus:outline-none focus:border-smart-gold text-xs"
                  />
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  type="submit"
                  isLoading={testSending}
                  className="w-full"
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Kirim Pesan Uji Coba
                </Button>

                {testResult && (
                  <div
                    className={`p-2.5 rounded-lg text-xs ${
                      testResult.startsWith('✅')
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {testResult}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Broadcast Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-smart-gold-light" />
                <span>Riwayat Pengiriman WA</span>
              </CardTitle>
              <button
                onClick={fetchConfigAndLogs}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                title="Segarkan Log"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-smart-dark/80 border border-smart-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[130px]">
                        {log.recipientName}
                      </span>
                      <Badge
                        variant={
                          log.status === 'SUCCESS'
                            ? 'green'
                            : log.status === 'SIMULATED'
                            ? 'gold'
                            : 'red'
                        }
                        size="sm"
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{log.recipientPhone}</div>
                    <div className="text-[11px] text-slate-500 truncate">{log.scheduleTitle}</div>
                    <div className="text-[10px] text-slate-500 pt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB &bull; {new Date(log.timestamp).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    Belum ada riwayat pengiriman pesan WhatsApp.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
