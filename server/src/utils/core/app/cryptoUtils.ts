// cryptoUtils.ts
import crypto from 'crypto';

interface HashResult {
  salt: string;
  hash: string;
}

// Helper function to hash a password using pbkdf2
export async function hashPassword(password: string): Promise<HashResult> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 100000;
    const keyLength = 64;
    const digest = 'sha512';

    crypto.pbkdf2(password, salt, iterations, keyLength, digest, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve({ salt, hash: derivedKey.toString('hex') });
      }
    });
  });
}

// Helper function to verify a password
export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const iterations = 100000;
    const keyLength = 64;
    const digest = 'sha512';

    crypto.pbkdf2(password, salt, iterations, keyLength, digest, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(derivedKey.toString('hex') === hash);
      }
    });
  });
}
