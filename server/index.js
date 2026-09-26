import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashPassword, hashSession, newSessionToken, verifyPassword } from './auth.js'

const app = express()
const port = process.env.PORT || 4000
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017')
const database = client.db('bsed_portal')
const students = database.collection('students')
const admins = database.collection('admins')
const teachers = database.collection('teachers')
const sessions = database.collection('sessions')
const distDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000
const cookieName = 'eduportal_session'

const allowedClientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === allowedClientOrigin) return callback(null, true)
    try {
      const url = new URL(origin)
      const parts = url.hostname.split('.').map(Number)
      const privateLanIp = parts.length === 4 && parts.every(part => Number.isInteger(part) && part >= 0 && part <= 255) && (
        parts[0] === 10 || (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      )
      const localDevelopmentOrigin = url.protocol === 'http:' && url.port === '5173' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || privateLanIp)
      return callback(null, localDevelopmentOrigin)
    } catch {
      return callback(null, false)
    }
  },
  credentials: true,
}))
app.use(express.json({ limit: '10kb' }))

function getCookie(req, name) {
  const cookies = req.headers.cookie || ''
  const pair = cookies.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`))
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : ''
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${cookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionDurationMs / 1000}${secure}`)
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`)
}

function publicStudent(student) {
  return { studentId: student.studentId, name: student.name, major: student.major || 'Administration', role: student.role || 'student' }
}

function requireRoles(roles) {
  return async (req, res, next) => {
    const token = getCookie(req, cookieName)
    if (!token) return res.status(401).json({ message: 'Sign in to continue.' })
    try {
      const session = await sessions.findOne({ tokenHash: hashSession(token), expiresAt: { $gt: new Date() }, role: { $in: roles } })
      if (!session) return res.status(403).json({ message: 'You do not have permission to access this resource.' })
      const accounts = session.role === 'teacher' ? teachers : admins
      req.account = await accounts.findOne({ studentId: session.studentId }, { projection: { passwordHash: 0, passwordSalt: 0 } })
      if (!req.account || !roles.includes(session.role)) return res.status(403).json({ message: 'You do not have permission to access this resource.' })
      next()
    } catch {
      res.status(503).json({ message: 'Account service is temporarily unavailable.' })
    }
  }
}

const requireAdmin = requireRoles(['admin'])
const requireTeacher = requireRoles(['teacher'])

app.get('/api/health', async (_req, res) => {
  try {
    await database.command({ ping: 1 })
    res.json({ status: 'ok', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'degraded', database: 'disconnected' })
  }
})

app.get('/api/majors', (_req, res) => {
  res.json([
    { code: 'ENG', name: 'English' },
    { code: 'FIL', name: 'Filipino' },
    { code: 'MTH', name: 'Mathematics' },
    { code: 'SCI', name: 'Science' },
    { code: 'SST', name: 'Social Studies' },
    { code: 'MPH', name: 'MAPEH' },
  ])
})

app.post('/api/auth/login', async (req, res) => {
  const login = String(req.body?.login || req.body?.studentId || '').trim()
  const password = String(req.body?.password || '')
  const isStudentId = /^\d{8}$/.test(login)
  const isUsername = /^[a-zA-Z][a-zA-Z0-9._-]{2,31}$/.test(login)
  if ((!isStudentId && !isUsername) || !password) return res.status(400).json({ message: 'Enter an 8-digit ID or staff username, plus password.' })

  try {
    const student = isStudentId ? await students.findOne({ studentId: login }) : null
    const admin = student ? null : await admins.findOne(isStudentId ? { studentId: login } : { username: login.toLowerCase() })
    const teacher = student || admin ? null : await teachers.findOne(isStudentId ? { studentId: login } : { username: login.toLowerCase() })
    const account = student || admin || teacher
    if (!account || !(await verifyPassword(password, account))) return res.status(401).json({ message: 'Student ID or password is incorrect.' })

    const token = newSessionToken()
    const expiresAt = new Date(Date.now() + sessionDurationMs)
    const role = admin ? 'admin' : teacher ? 'teacher' : 'student'
    await sessions.insertOne({ tokenHash: hashSession(token), studentId: account.studentId, role, expiresAt, createdAt: new Date() })
    setSessionCookie(res, token)
    res.json({ student: publicStudent({ ...account, role }) })
  } catch (error) {
    console.error('Student sign-in failed:', error.message)
    res.status(503).json({ message: 'Sign-in is temporarily unavailable. Please try again.' })
  }
})

app.get('/api/auth/me', async (req, res) => {
  const token = getCookie(req, cookieName)
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' })
  try {
    const session = await sessions.findOne({ tokenHash: hashSession(token), expiresAt: { $gt: new Date() } })
    if (!session) { clearSessionCookie(res); return res.status(401).json({ message: 'Sign in to continue.' }) }
    const collection = session.role === 'admin' ? admins : session.role === 'teacher' ? teachers : students
    const account = await collection.findOne({ studentId: session.studentId }, { projection: { _id: 0, studentId: 1, name: 1, major: 1, role: 1 } })
    if (!account) { await sessions.deleteOne({ _id: session._id }); clearSessionCookie(res); return res.status(401).json({ message: 'Sign in to continue.' }) }
    res.json({ student: publicStudent({ ...account, role: session.role || 'student' }) })
  } catch (error) {
    console.error('Session lookup failed:', error.message)
    res.status(503).json({ message: 'Account service is temporarily unavailable.' })
  }
})

app.post('/api/auth/logout', async (req, res) => {
  const token = getCookie(req, cookieName)
  if (token) await sessions.deleteOne({ tokenHash: hashSession(token) }).catch(() => {})
  clearSessionCookie(res)
  res.status(204).end()
})

app.post('/api/auth/password', async (req, res) => {
  const token = getCookie(req, cookieName)
  const currentPassword = String(req.body?.currentPassword || '')
  const newPassword = String(req.body?.newPassword || '')
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' })
  try {
    const session = await sessions.findOne({ tokenHash: hashSession(token), expiresAt: { $gt: new Date() } })
    if (!session) return res.status(401).json({ message: 'Sign in to continue.' })
    const collection = session.role === 'admin' ? admins : session.role === 'teacher' ? teachers : students
    const account = await collection.findOne({ studentId: session.studentId })
    if (!account || !(await verifyPassword(currentPassword, account))) return res.status(401).json({ message: 'Current password is incorrect.' })
    const minimumLength = ['admin', 'teacher'].includes(session.role) ? 12 : 10
    if (newPassword.length < minimumLength) return res.status(400).json({ message: `Use at least ${minimumLength} characters for the new password.` })
    const credentials = await hashPassword(newPassword)
    await collection.updateOne({ _id: account._id }, { $set: credentials, passwordChangedAt: new Date() })
    const replacementToken = newSessionToken()
    const expiresAt = new Date(Date.now() + sessionDurationMs)
    await sessions.deleteMany({ studentId: session.studentId, role: session.role })
    await sessions.insertOne({ tokenHash: hashSession(replacementToken), studentId: session.studentId, role: session.role, expiresAt, createdAt: new Date() })
    setSessionCookie(res, replacementToken)
    res.json({ message: 'Password updated.' })
  } catch (error) {
    console.error('Password update failed:', error.message)
    res.status(503).json({ message: 'Could not update the password right now.' })
  }
})

app.get('/api/admin/students', requireAdmin, async (_req, res) => {
  try {
    const records = await students.find({}, { projection: { _id: 0, studentId: 1, name: 1, major: 1, createdAt: 1 } }).sort({ name: 1 }).toArray()
    res.json({ students: records })
  } catch {
    res.status(503).json({ message: 'Could not load the student list.' })
  }
})

app.post('/api/admin/students', requireAdmin, async (req, res) => {
  const studentId = String(req.body?.studentId || '')
  const name = String(req.body?.name || '').trim()
  const major = String(req.body?.major || '')
  const password = String(req.body?.password || '')
  const validMajors = ['English', 'Filipino', 'Mathematics', 'Science', 'Social Studies', 'MAPEH']
  if (!/^\d{8}$/.test(studentId) || !name || !validMajors.includes(major) || password.length < 10) {
    return res.status(400).json({ message: 'Enter an 8-digit ID, name, valid major, and password with at least 10 characters.' })
  }
  try {
    if (await admins.findOne({ studentId }) || await teachers.findOne({ studentId })) return res.status(409).json({ message: 'That ID already belongs to a staff account.' })
    const credentials = await hashPassword(password)
    await students.insertOne({ studentId, name, major, ...credentials, createdAt: new Date() })
    res.status(201).json({ student: { studentId, name, major } })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That Student ID already has an account.' })
    res.status(503).json({ message: 'Could not create the student account.' })
  }
})

app.get('/api/admin/teachers', requireAdmin, async (_req, res) => {
  try {
    const records = await teachers.find({}, { projection: { _id: 0, studentId: 1, username: 1, name: 1, major: 1, createdAt: 1 } }).sort({ name: 1 }).toArray()
    res.json({ teachers: records })
  } catch {
    res.status(503).json({ message: 'Could not load teacher accounts.' })
  }
})

app.post('/api/admin/teachers', requireAdmin, async (req, res) => {
  const studentId = String(req.body?.studentId || '')
  const username = String(req.body?.username || '').trim().toLowerCase()
  const name = String(req.body?.name || '').trim()
  const major = String(req.body?.major || '')
  const password = String(req.body?.password || '')
  const validMajors = ['English', 'Filipino', 'Mathematics', 'Science', 'Social Studies', 'MAPEH']
  if (!/^\d{8}$/.test(studentId) || !/^[a-z][a-z0-9._-]{2,31}$/.test(username) || name.length < 2 || !validMajors.includes(major) || password.length < 12) {
    return res.status(400).json({ message: 'Enter an 8-digit staff ID, valid username, full name, BSED major, and password with at least 12 characters.' })
  }
  try {
    if (await students.findOne({ studentId }) || await admins.findOne({ studentId }) || await teachers.findOne({ $or: [{ studentId }, { username }] }) || await admins.findOne({ username })) {
      return res.status(409).json({ message: 'That staff ID or username is already in use.' })
    }
    const credentials = await hashPassword(password)
    const record = { studentId, username, name, major, role: 'teacher', ...credentials, createdAt: new Date() }
    await teachers.insertOne(record)
    res.status(201).json({ teacher: { studentId, username, name, major, role: 'teacher' } })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That staff ID or username is already in use.' })
    res.status(503).json({ message: 'Could not create the teacher account.' })
  }
})

app.get('/api/teacher/students', requireTeacher, async (req, res) => {
  try {
    const records = await students.find({ major: req.account.major }, { projection: { _id: 0, studentId: 1, name: 1, major: 1, createdAt: 1 } }).sort({ name: 1 }).toArray()
    res.json({ students: records })
  } catch {
    res.status(503).json({ message: 'Could not load students for this major.' })
  }
})

app.use(express.static(distDirectory, { index: false, maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }))
app.get('*', (req, res, next) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(distDirectory, 'index.html'), error => { if (error) next(error) })
})

async function start() {
  await client.connect()
  // Upgrade existing installations: the former superadmin now has ordinary admin access.
  await admins.updateMany({ role: 'superadmin' }, { $set: { role: 'admin' } })
  await sessions.updateMany({ role: 'superadmin' }, { $set: { role: 'admin' } })
  await students.createIndex({ studentId: 1 }, { unique: true })
  await admins.createIndex({ studentId: 1 }, { unique: true })
  await admins.createIndex({ username: 1 }, { unique: true, sparse: true })
  await teachers.createIndex({ studentId: 1 }, { unique: true })
  await teachers.createIndex({ username: 1 }, { unique: true })
  await sessions.createIndex({ tokenHash: 1 }, { unique: true })
  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  app.listen(port, () => console.log(`BSED portal API listening on http://localhost:${port}`))
}

start().catch(error => {
  console.error('Could not start the API:', error.message)
  process.exitCode = 1
})
