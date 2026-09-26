import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const keyLength = 64

export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, keyLength)
  return { passwordSalt: salt, passwordHash: hash.toString('hex') }
}

export async function verifyPassword(password, student) {
  const candidate = await scrypt(password, student.passwordSalt, keyLength)
  const stored = Buffer.from(student.passwordHash, 'hex')
  return stored.length === candidate.length && timingSafeEqual(stored, candidate)
}

export function hashSession(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function newSessionToken() {
  return randomBytes(32).toString('base64url')
}
