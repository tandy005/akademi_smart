import crypto from 'crypto';

// Kunci rahasia server untuk penandatanganan KTA
// Diambil dari environment variable jika tersedia, atau menggunakan kunci default sistem
const KTA_SIGN_SECRET =
  process.env.KTA_SIGN_SECRET ||
  process.env.AUTH_SECRET ||
  'smart09-volleyball-kta-secure-key-2026-vla';

/**
 * Membuat token tanda tangan digital HMAC untuk seorang atlet.
 * Token ini mengunci kombinasi (memberId + registrationNumber).
 * Hanya server yang mengetahui KTA_SIGN_SECRET yang bisa membuat token ini.
 */
export function generateMemberKtaSignature(memberId: string, regNo?: string): string {
  const data = `SMART_KTA:${memberId.trim()}:${(regNo || '').trim()}`;
  return crypto
    .createHmac('sha256', KTA_SIGN_SECRET)
    .update(data)
    .digest('hex')
    .slice(0, 16); // 16 karakter hex (cukup ringkas untuk QR dan 100% aman)
}

/**
 * Memverifikasi keaslian token KTA.
 * Menggunakan timingSafeEqual untuk mencegah serangan timing attack.
 */
export function verifyMemberKtaSignature(
  memberId: string,
  tokenProvided: string,
  regNo?: string
): boolean {
  if (!memberId || !tokenProvided) return false;

  const expectedToken = generateMemberKtaSignature(memberId, regNo);

  try {
    const bufA = Buffer.from(tokenProvided.trim().toLowerCase());
    const bufB = Buffer.from(expectedToken.toLowerCase());

    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
