import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { hashPassword } from './auth.js'

const [studentId, name, major] = process.argv.slice(2)
const validMajors = ['English', 'Filipino', 'Mathematics', 'Science', 'Social Studies', 'MAPEH']

if (!/^\d{8}$/.test(studentId || '') || !name?.trim() || !validMajors.includes(major)) {
  console.error('Usage: npm run create:student -- <8-digit-id> "<student name>" "<major>"')
  console.error(`Majors: ${validMajors.join(', ')}`)
  process.exit(1)
}

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal so the password can be entered without echoing.')
  }
  process.stdout.write(prompt)
  process.stdin.setRawMode(true)
  process.stdin.resume()
  return new Promise((resolve, reject) => {
    let value = ''
    const onData = chunk => {
      for (const byte of chunk) {
        if (byte === 3) { process.stdin.off('data', onData); process.stdin.setRawMode(false); reject(new Error('Cancelled.')); return }
        if (byte === 13 || byte === 10) {
          process.stdin.off('data', onData)
          process.stdin.setRawMode(false)
          process.stdout.write('\n')
          resolve(value)
          return
        }
        if (byte === 8 || byte === 127) value = value.slice(0, -1)
        else if (byte >= 32) value += String.fromCharCode(byte)
      }
    }
    process.stdin.on('data', onData)
  })
}

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017')
try {
  const password = await readHidden('Set a password (at least 10 characters): ')
  if (password.length < 10) throw new Error('Use a password with at least 10 characters.')
  await client.connect()
  const students = client.db('bsed_portal').collection('students')
  if (await client.db('bsed_portal').collection('admins').findOne({ studentId })) throw new Error(`Student ID ${studentId} already belongs to an admin account.`)
  const credentials = await hashPassword(password)
  await students.insertOne({ studentId, name: name.trim(), major, ...credentials, createdAt: new Date() })
  console.log(`Created student account ${studentId} (${major}).`)
} catch (error) {
  if (error.code === 11000) console.error(`Student ID ${studentId} already has an account.`)
  else console.error(error.message)
  process.exitCode = 1
} finally {
  await client.close()
}
