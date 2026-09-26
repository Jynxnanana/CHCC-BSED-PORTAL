import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { hashPassword } from './auth.js'

const studentId = '00000001'
const username = 'admin'
const password = process.env.DEFAULT_ADMIN_PASSWORD
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017')

try {
  if (!password || password.length < 12) throw new Error('Set DEFAULT_ADMIN_PASSWORD to a value with at least 12 characters before seeding.')
  await client.connect()
  const database = client.db('bsed_portal')
  const students = database.collection('students')
  const admins = database.collection('admins')
  const existingAdmin = await admins.findOne({ username })
  const credentials = await hashPassword(password)
  if (existingAdmin) {
    await admins.updateOne({ _id: existingAdmin._id }, { $set: { ...credentials, role: 'admin', passwordChangedAt: new Date() } })
    await database.collection('sessions').deleteMany({ studentId: existingAdmin.studentId, role: 'admin' })
    console.log('Updated the admin account password from DEFAULT_ADMIN_PASSWORD.')
  } else {
    if (await students.findOne({ studentId })) throw new Error(`Student ID ${studentId} is already assigned to a student.`)
    if (await admins.findOne({ studentId })) throw new Error(`Student ID ${studentId} is already assigned to another admin.`)
    await admins.insertOne({ studentId, username, name: 'Portal Administrator', role: 'admin', ...credentials, createdAt: new Date() })
    console.log('Created local default admin account: username admin.')
  }
  console.log('Change this password before exposing the portal to other users.')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await client.close()
}
