import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { BSON, MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('Set MONGODB_URI to the portal database connection string before running a backup.')
  process.exit(1)
}

const outputDirectory = path.resolve(process.env.BACKUP_DIRECTORY || './backups')
const client = new MongoClient(uri)
const collectionNames = [
  'students', 'admins', 'teachers', 'grades', 'advisories', 'announcements',
  'announcementReads', 'auditLogs', 'classSchedules', 'attendance', 'curriculum',
  'enrollments', 'ledger', 'campusEvents',
]

try {
  await client.connect()
  const database = client.db('bsed_portal')
  const collections = {}
  for (const name of collectionNames) {
    collections[name] = await database.collection(name).find({}).toArray()
  }
  await mkdir(outputDirectory, { recursive: true })
  const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
  const filename = `bsed-portal-backup-${timestamp}.json`
  const destination = path.join(outputDirectory, filename)
  await writeFile(destination, BSON.EJSON.stringify({
    format: 'bsed-portal-backup',
    version: 1,
    database: 'bsed_portal',
    generatedAt: new Date(),
    collections,
  }, null, 2, { relaxed: false }), { flag: 'wx', mode: 0o600 })
  console.log(`Database backup saved to ${destination}`)
} catch (error) {
  console.error(`Database backup failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await client.close().catch(() => {})
}
