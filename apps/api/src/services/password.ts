import crypto from 'crypto';

const KEY_LENGTH = 64;

export async function hashSecret(secret: string, salt = crypto.randomBytes(16).toString('hex')) {
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(secret, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });

  return `${salt}:${key.toString('hex')}`;
}

export async function verifySecret(secret: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const candidate = await hashSecret(secret, salt);
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(stored));
}

export function createOtp() {
  return String(crypto.randomInt(100000, 999999));
}
