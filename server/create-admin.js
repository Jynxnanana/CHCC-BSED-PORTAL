import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { hashPassword } from './auth.js'

const [studentId, name] = process.argv.slice(2)
if (!/^\d{8}$/.test(studentId || '') || !name?.trim() || name.trim().length > 100) {
  console.error('Usage: npm run create:admin -- <8-digit-id> "<admin name>"')
  process.exit(1)
}

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') throw new Error('Run this command in an interactive terminal so the password can be entered without echoing.')
  process.stdout.write(prompt)
  process.stdin.setRawMode(true)
  process.stdin.resume()
  return new Promise((resolve, reject) => {
    let value = ''
    const onData = chunk => {
      for (const byte of chunk) {
        if (byte === 3) { process.stdin.off('data', onData); process.stdin.setRawMode(false); reject(new Error('Cancelled.')); return }
        if (byte === 13 || byte === 10) { process.stdin.off('data', onData); process.stdin.setRawMode(false); process.stdout.write('\n'); resolve(value); return }
        if (byte === 8 || byte === 127) value = value.slice(0, -1)
        else if (byte >= 32) value += String.fromCharCode(byte)
      }
    }
    process.stdin.on('data', onData)
  })
}

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017')
try {
  const password = await readHidden('Set an admin password (at least 12 characters): ')
  if (password.length < 12) throw new Error('Use an admin password with at least 12 characters.')
  await client.connect()
  const database = client.db('bsed_portal')
  if (await database.collection('students').findOne({ studentId }) || await database.collection('teachers').findOne({ studentId })) throw new Error(`Student ID ${studentId} already belongs to another account.`)
  if (await database.collection('admins').findOne({ studentId })) throw new Error(`Student ID ${studentId} already has an administrator account.`)
  const credentials = await hashPassword(password)
  await database.collection('admins').insertOne({ studentId, name: name.trim(), role: 'admin', ...credentials, createdAt: new Date() })
  console.log(`Created admin account ${studentId}.`)
} catch (error) {
  if (error.code === 11000) console.error(`Admin ID ${studentId} already has an account.`)
  else console.error(error.message)
  process.exitCode = 1
} finally {
  await client.close()
}
