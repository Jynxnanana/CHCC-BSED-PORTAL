import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { hashPassword } from './auth.js'

const studentId = '99999999'
const username = 'superadmin'
const password = process.env.SUPERADMIN_PASSWORD
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017')

try {
  if (!password || password.length < 12) throw new Error('Set SUPERADMIN_PASSWORD to a value with at least 12 characters before seeding.')
  await client.connect()
  const database = client.db('bsed_portal')
  const students = database.collection('students')
  const admins = database.collection('admins')
  const sessions = database.collection('sessions')
  const existing = await admins.findOne({ username })
  const credentials = await hashPassword(password)
  if (existing) {
    await admins.updateOne({ _id: existing._id }, { $set: { ...credentials, role: 'superadmin', passwordChangedAt: new Date() } })
    await sessions.deleteMany({ studentId: existing.studentId })
    console.log('Updated the superadmin account password from SUPERADMIN_PASSWORD.')
  } else {
    if (await students.findOne({ studentId })) throw new Error(`ID ${studentId} is already assigned to a student.`)
    if (await admins.findOne({ studentId })) throw new Error(`ID ${studentId} is already assigned to an admin.`)
    await admins.insertOne({ studentId, username, name: 'Portal Super Administrator', role: 'superadmin', ...credentials, createdAt: new Date() })
    console.log('Created superadmin account: username superadmin.')
  }
  console.log('Change this password before sharing the portal outside your local development network.')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await client.close()
}
