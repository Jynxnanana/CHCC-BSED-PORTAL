import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
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
const grades = database.collection('grades')
const advisories = database.collection('advisories')
const classSchedules = database.collection('classSchedules')
const attendance = database.collection('attendance')
const curriculum = database.collection('curriculum')
const enrollments = database.collection('enrollments')
const ledger = database.collection('ledger')
const campusEvents = database.collection('campusEvents')
const communityPosts = database.collection('communityPosts')
const sessions = database.collection('sessions')
const distDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000
const cookieName = 'eduportal_session'
const validMajors = ['English', 'Filipino', 'Math', 'Social Science', 'BEED']
const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const validOrgPositions = ['Member', 'President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'Public Information Officer', 'Representative']

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
app.use(express.json({ limit: '2mb' }))

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
  return { studentId: student.studentId, name: student.name, major: student.major || 'Administration', section: student.section || '', yearLevel: student.yearLevel || '', organization: student.organization || '', orgPosition: student.orgPosition || '', photoUrl: student.photoUrl || '', role: student.role || 'student' }
}

function requireRoles(roles) {
  return async (req, res, next) => {
    const token = getCookie(req, cookieName)
    if (!token) return res.status(401).json({ message: 'Sign in to continue.' })
    try {
      const session = await sessions.findOne({ tokenHash: hashSession(token), expiresAt: { $gt: new Date() }, role: { $in: roles } })
      if (!session) return res.status(403).json({ message: 'You do not have permission to access this resource.' })
      const accounts = session.role === 'teacher' ? teachers : session.role === 'admin' ? admins : students
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
const requireStudent = requireRoles(['student'])

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
    { code: 'MTH', name: 'Math' },
    { code: 'SS', name: 'Social Science' },
    { code: 'BEED', name: 'BEED' },
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
    const account = await collection.findOne({ studentId: session.studentId }, { projection: { _id: 0, studentId: 1, name: 1, major: 1, section: 1, yearLevel: 1, organization: 1, orgPosition: 1, photoUrl: 1, role: 1 } })
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
    const records = await students.find({}, { projection: { _id: 0, studentId: 1, name: 1, major: 1, section: 1, yearLevel: 1, organization: 1, orgPosition: 1, createdAt: 1 } }).sort({ name: 1 }).toArray()
    res.json({ students: records })
  } catch {
    res.status(503).json({ message: 'Could not load the student list.' })
  }
})

app.post('/api/admin/students', requireAdmin, async (req, res) => {
  const studentId = String(req.body?.studentId || '')
  const name = String(req.body?.name || '').trim()
  const major = String(req.body?.major || '')
  const section = String(req.body?.section || '').trim()
  const yearLevel = String(req.body?.yearLevel || '')
  const organization = String(req.body?.organization || '')
  const orgPosition = String(req.body?.orgPosition || '')
  const password = String(req.body?.password || '')
  if (!/^\d{8}$/.test(studentId) || name.length < 2 || name.length > 100 || !validMajors.includes(major) || section.length > 30 || !validYears.includes(yearLevel) || !['Major', 'Minor'].includes(organization) || !validOrgPositions.includes(orgPosition) || password.length < 10) {
    return res.status(400).json({ message: 'Enter an 8-digit ID, name, valid major, and password with at least 10 characters.' })
  }
  try {
    if (await admins.findOne({ studentId }) || await teachers.findOne({ studentId })) return res.status(409).json({ message: 'That ID already belongs to a staff account.' })
    const credentials = await hashPassword(password)
    await students.insertOne({ studentId, name, major, section, yearLevel, organization, orgPosition, ...credentials, createdAt: new Date() })
    res.status(201).json({ student: { studentId, name, major, section, yearLevel, organization, orgPosition } })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That Student ID already has an account.' })
    res.status(503).json({ message: 'Could not create the student account.' })
  }
})

app.put('/api/admin/students/:studentId', requireAdmin, async (req, res) => {
  const studentId = String(req.params.studentId || '')
  const name = String(req.body?.name || '').trim()
  const major = String(req.body?.major || '')
  const section = String(req.body?.section || '').trim()
  const yearLevel = String(req.body?.yearLevel || '')
  const organization = String(req.body?.organization || '')
  const orgPosition = String(req.body?.orgPosition || '')
  const password = String(req.body?.password || '')
  if (!/^\d{8}$/.test(studentId) || name.length < 2 || name.length > 100 || !validMajors.includes(major) || section.length > 30 || !validYears.includes(yearLevel) || !['Major', 'Minor'].includes(organization) || !validOrgPositions.includes(orgPosition) || (password && password.length < 10)) {
    return res.status(400).json({ message: 'Enter a name, valid BSED major, and (if changing it) a password with at least 10 characters.' })
  }
  try {
    const current = await students.findOne({ studentId })
    if (!current) return res.status(404).json({ message: 'Student account not found.' })
    const changes = { name, major, section, yearLevel, organization, orgPosition, updatedAt: new Date() }
    if (password) Object.assign(changes, await hashPassword(password))
    await students.updateOne({ _id: current._id }, { $set: changes })
    await grades.updateMany({ studentId }, { $set: { studentName: name } })
    if (password) await sessions.deleteMany({ studentId, role: 'student' })
    res.json({ student: { studentId, name, major, section, yearLevel, organization, orgPosition } })
  } catch {
    res.status(503).json({ message: 'Could not update the student account.' })
  }
})

app.delete('/api/admin/students/:studentId', requireAdmin, async (req, res) => {
  const studentId = String(req.params.studentId || '')
  if (!/^\d{8}$/.test(studentId)) return res.status(400).json({ message: 'Enter a valid 8-digit student ID.' })
  try {
    const result = await students.deleteOne({ studentId })
    if (!result.deletedCount) return res.status(404).json({ message: 'Student account not found.' })
    await sessions.deleteMany({ studentId, role: 'student' })
    await grades.deleteMany({ studentId })
    res.status(204).end()
  } catch {
    res.status(503).json({ message: 'Could not delete the student account.' })
  }
})

app.get('/api/admin/teachers', requireAdmin, async (_req, res) => {
  try {
    const records = await teachers.find({}, { projection: { _id: 0, studentId: 1, username: 1, name: 1, major: 1, photoUrl: 1, createdAt: 1 } }).sort({ name: 1 }).toArray()
    res.json({ teachers: records })
  } catch {
    res.status(503).json({ message: 'Could not load teacher accounts.' })
  }
})

app.get('/api/admin/schedules', requireAdmin, async (_req, res) => {
  try {
    const records = await classSchedules.find({}, { projection: { term: 1, courseCode: 1, subject: 1, major: 1, teacherId: 1, teacherName: 1, section: 1, day: 1, time: 1, room: 1, units: 1 } }).sort({ term: -1, day: 1, time: 1, courseCode: 1 }).toArray()
    res.json({ schedules: records.map(({ _id, ...record }) => ({ ...record, scheduleId: _id.toString() })) })
  } catch {
    res.status(503).json({ message: 'Could not load class schedules.' })
  }
})

function normalizeSchedule(body) {
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const schedule = {
    term: String(body?.term || '').trim(),
    courseCode: String(body?.courseCode || '').trim().toUpperCase(),
    subject: String(body?.subject || '').trim(),
    major: String(body?.major || ''),
    teacherId: String(body?.teacherId || '').trim(),
    section: String(body?.section || '').trim(),
    day: String(body?.day || ''),
    time: String(body?.time || '').trim(),
    room: String(body?.room || '').trim(),
    units: Number(body?.units),
  }
  if (schedule.term.length < 4 || schedule.term.length > 80 || !/^[A-Z0-9][A-Z0-9 -]{1,19}$/.test(schedule.courseCode) || schedule.subject.length < 2 || schedule.subject.length > 100 || !validMajors.includes(schedule.major) || (schedule.teacherId && !/^\d{8}$/.test(schedule.teacherId)) || schedule.section.length > 30 || !validDays.includes(schedule.day) || schedule.time.length < 3 || schedule.time.length > 60 || schedule.room.length < 1 || schedule.room.length > 50 || !Number.isInteger(schedule.units) || schedule.units < 1 || schedule.units > 12) {
    return { error: 'Check the term, course details, major, teacher, class day/time, room, and units.' }
  }
  return { schedule }
}

async function getScheduleTeacher(teacherId, major) {
  if (!teacherId) return { teacherId: '', teacherName: '' }
  const teacher = await teachers.findOne({ studentId: teacherId, major }, { projection: { _id: 0, studentId: 1, name: 1 } })
  return teacher ? { teacherId: teacher.studentId, teacherName: teacher.name } : null
}

app.post('/api/admin/schedules', requireAdmin, async (req, res) => {
  const parsed = normalizeSchedule(req.body)
  if (parsed.error) return res.status(400).json({ message: parsed.error })
  try {
    const teacher = await getScheduleTeacher(parsed.schedule.teacherId, parsed.schedule.major)
    if (!teacher) return res.status(400).json({ message: 'Select a teacher assigned to the chosen major, or leave the teacher unassigned.' })
    const record = { ...parsed.schedule, ...teacher, createdAt: new Date(), updatedAt: new Date() }
    const result = await classSchedules.insertOne(record)
    res.status(201).json({ schedule: { ...record, scheduleId: result.insertedId.toString() } })
  } catch {
    res.status(503).json({ message: 'Could not create the class schedule.' })
  }
})

app.put('/api/admin/schedules/:scheduleId', requireAdmin, async (req, res) => {
  const scheduleId = String(req.params.scheduleId || '')
  if (!ObjectId.isValid(scheduleId)) return res.status(400).json({ message: 'Invalid schedule record.' })
  const parsed = normalizeSchedule(req.body)
  if (parsed.error) return res.status(400).json({ message: parsed.error })
  try {
    const teacher = await getScheduleTeacher(parsed.schedule.teacherId, parsed.schedule.major)
    if (!teacher) return res.status(400).json({ message: 'Select a teacher assigned to the chosen major, or leave the teacher unassigned.' })
    const result = await classSchedules.updateOne({ _id: new ObjectId(scheduleId) }, { $set: { ...parsed.schedule, ...teacher, updatedAt: new Date() } })
    if (!result.matchedCount) return res.status(404).json({ message: 'Schedule record not found.' })
    res.json({ schedule: { ...parsed.schedule, ...teacher, scheduleId } })
  } catch {
    res.status(503).json({ message: 'Could not update the class schedule.' })
  }
})

app.delete('/api/admin/schedules/:scheduleId', requireAdmin, async (req, res) => {
  const scheduleId = String(req.params.scheduleId || '')
  if (!ObjectId.isValid(scheduleId)) return res.status(400).json({ message: 'Invalid schedule record.' })
  try {
    const result = await classSchedules.deleteOne({ _id: new ObjectId(scheduleId) })
    if (!result.deletedCount) return res.status(404).json({ message: 'Schedule record not found.' })
    res.status(204).end()
  } catch {
    res.status(503).json({ message: 'Could not delete the class schedule.' })
  }
})

app.get('/api/student/schedules', requireStudent, async (req, res) => {
  try {
    const sectionFilter = req.account.section ? { $in: ['', req.account.section] } : ''
    const records = await classSchedules.find({ major: req.account.major, section: sectionFilter }, { projection: { _id: 0, term: 1, courseCode: 1, subject: 1, major: 1, teacherName: 1, section: 1, day: 1, time: 1, room: 1, units: 1 } }).sort({ term: -1, day: 1, time: 1, courseCode: 1 }).toArray()
    res.json({ schedules: records })
  } catch {
    res.status(503).json({ message: 'Could not load your class schedule.' })
  }
})

app.get('/api/teacher/schedules', requireTeacher, async (req, res) => {
  try {
    const records = await classSchedules.find({ teacherId: req.account.studentId }, { projection: { term: 1, courseCode: 1, subject: 1, major: 1, section: 1, day: 1, time: 1, room: 1, units: 1 } }).sort({ term: -1, day: 1, time: 1, courseCode: 1 }).toArray()
    res.json({ schedules: records.map(({ _id, ...record }) => ({ ...record, scheduleId: _id.toString() })) })
  } catch {
    res.status(503).json({ message: 'Could not load your teaching schedule.' })
  }
})

app.post('/api/admin/teachers', requireAdmin, async (req, res) => {
  const studentId = String(req.body?.studentId || '')
  const username = String(req.body?.username || '').trim().toLowerCase()
  const name = String(req.body?.name || '').trim()
  const major = String(req.body?.major || '')
  const password = String(req.body?.password || '')
  const photoUrl = String(req.body?.photoUrl || '')
  if (photoUrl && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(photoUrl) || photoUrl.length > 1100000)) return res.status(400).json({ message: 'Use a PNG, JPG, or WebP picture smaller than 800 KB.' })
  if (!/^\d{8}$/.test(studentId) || !/^[a-z][a-z0-9._-]{2,31}$/.test(username) || name.length < 2 || name.length > 100 || !validMajors.includes(major) || password.length < 12) {
    return res.status(400).json({ message: 'Enter an 8-digit staff ID, valid username, full name, BSED major, and password with at least 12 characters.' })
  }
  try {
    if (await students.findOne({ studentId }) || await admins.findOne({ studentId }) || await teachers.findOne({ $or: [{ studentId }, { username }] }) || await admins.findOne({ username })) {
      return res.status(409).json({ message: 'That staff ID or username is already in use.' })
    }
    const credentials = await hashPassword(password)
    const record = { studentId, username, name, major, photoUrl, role: 'teacher', ...credentials, createdAt: new Date() }
    await teachers.insertOne(record)
    res.status(201).json({ teacher: { studentId, username, name, major, photoUrl, role: 'teacher' } })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That staff ID or username is already in use.' })
    res.status(503).json({ message: 'Could not create the teacher account.' })
  }
})

app.put('/api/admin/teachers/:studentId', requireAdmin, async (req, res) => {
  const studentId = String(req.params.studentId || '')
  const username = String(req.body?.username || '').trim().toLowerCase()
  const name = String(req.body?.name || '').trim()
  const major = String(req.body?.major || '')
  const password = String(req.body?.password || '')
  const photoUrl = String(req.body?.photoUrl || '')
  if (photoUrl && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(photoUrl) || photoUrl.length > 1100000)) return res.status(400).json({ message: 'Use a PNG, JPG, or WebP picture smaller than 800 KB.' })
  if (!/^\d{8}$/.test(studentId) || !/^[a-z][a-z0-9._-]{2,31}$/.test(username) || name.length < 2 || name.length > 100 || !validMajors.includes(major) || (password && password.length < 12)) {
    return res.status(400).json({ message: 'Enter a valid username, name, BSED major, and (if changing it) a password with at least 12 characters.' })
  }
  try {
    const current = await teachers.findOne({ studentId })
    if (!current) return res.status(404).json({ message: 'Teacher account not found.' })
    const duplicateTeacher = await teachers.findOne({ username, studentId: { $ne: studentId } })
    const duplicateAdmin = await admins.findOne({ username })
    if (duplicateTeacher || duplicateAdmin) return res.status(409).json({ message: 'That username is already in use.' })
    const changes = { username, name, major, photoUrl, updatedAt: new Date() }
    if (password) Object.assign(changes, await hashPassword(password))
    await teachers.updateOne({ _id: current._id }, { $set: changes })
    await classSchedules.updateMany({ teacherId: studentId }, { $set: { major, teacherName: name, updatedAt: new Date() } })
    if (password) await sessions.deleteMany({ studentId, role: 'teacher' })
    res.json({ teacher: { studentId, username, name, major, photoUrl, role: 'teacher' } })
  } catch {
    res.status(503).json({ message: 'Could not update the teacher account.' })
  }
})

app.delete('/api/admin/teachers/:studentId', requireAdmin, async (req, res) => {
  const studentId = String(req.params.studentId || '')
  if (!/^\d{8}$/.test(studentId)) return res.status(400).json({ message: 'Enter a valid 8-digit staff ID.' })
  try {
    const result = await teachers.deleteOne({ studentId })
    if (!result.deletedCount) return res.status(404).json({ message: 'Teacher account not found.' })
    await sessions.deleteMany({ studentId, role: 'teacher' })
    await classSchedules.updateMany({ teacherId: studentId }, { $set: { teacherId: '', teacherName: '', updatedAt: new Date() } })
    res.status(204).end()
  } catch {
    res.status(503).json({ message: 'Could not delete the teacher account.' })
  }
})

app.get('/api/teacher/students', requireTeacher, async (req, res) => {
  try {
    const records = await students.find({ major: req.account.major }, { projection: { _id: 0, studentId: 1, name: 1, major: 1, section: 1, createdAt: 1 } }).sort({ name: 1 }).toArray()
    res.json({ students: records })
  } catch {
    res.status(503).json({ message: 'Could not load students for this major.' })
  }
})

app.get('/api/teacher/grades', requireTeacher, async (req, res) => {
  try {
    const records = await grades.find({ updatedBy: req.account.studentId }, { projection: { _id: 0, studentId: 1, studentName: 1, major: 1, courseCode: 1, subject: 1, term: 1, units: 1, grade: 1, status: 1, approvalStatus: 1, updatedAt: 1 } }).sort({ studentName: 1, term: -1, courseCode: 1 }).toArray()
    res.json({ grades: records })
  } catch {
    res.status(503).json({ message: 'Could not load grade records.' })
  }
})

app.post('/api/teacher/grades', requireTeacher, async (req, res) => {
  const studentId = String(req.body?.studentId || '')
  const scheduleId = String(req.body?.scheduleId || '')
  const grade = Number(req.body?.grade)
  if (!/^\d{8}$/.test(studentId) || !ObjectId.isValid(scheduleId) || !Number.isFinite(grade) || grade < 1 || grade > 5 || Math.round(grade * 4) !== grade * 4) {
    return res.status(400).json({ message: 'Choose an assigned class and student, then enter a grade from 1.00 to 5.00 in 0.25 steps.' })
  }
  try {
    const schedule = await classSchedules.findOne({ _id: new ObjectId(scheduleId), teacherId: req.account.studentId, major: req.account.major })
    if (!schedule) return res.status(403).json({ message: 'That class is not assigned to your teacher account.' })
    const studentQuery = { studentId, major: req.account.major }
    if (schedule.section) studentQuery.section = schedule.section
    const student = await students.findOne(studentQuery, { projection: { _id: 0, studentId: 1, name: 1, major: 1, section: 1 } })
    if (!student) return res.status(404).json({ message: 'Student not found in the assigned major and section.' })
    const status = grade <= 3 ? 'Passed' : grade === 4 ? 'Incomplete' : 'Failed'
    const record = { ...student, scheduleId, courseCode: schedule.courseCode, subject: schedule.subject, term: schedule.term, units: schedule.units, grade: grade.toFixed(2), status, approvalStatus: 'Pending', updatedAt: new Date(), updatedBy: req.account.studentId }
    await grades.updateOne({ studentId, courseCode: schedule.courseCode, term: schedule.term }, { $set: record, $unset: { approvedAt: '', approvedBy: '', approvalNote: '' }, $setOnInsert: { createdAt: new Date() } }, { upsert: true })
    res.json({ grade: record })
  } catch {
    res.status(503).json({ message: 'Could not save this grade.' })
  }
})

app.get('/api/student/grades', requireStudent, async (req, res) => {
  try {
    const records = await grades.find({ studentId: req.account.studentId, approvalStatus: 'Approved' }, { projection: { _id: 0, courseCode: 1, subject: 1, term: 1, units: 1, grade: 1, status: 1, updatedAt: 1 } }).sort({ term: -1, courseCode: 1 }).toArray()
    res.json({ grades: records })
  } catch {
    res.status(503).json({ message: 'Could not load your grade records.' })
  }
})

app.get('/api/admin/grade-approvals', requireAdmin, async (_req, res) => {
  try {
    const records = await grades.find({ approvalStatus: { $ne: 'Approved' } }).sort({ updatedAt: -1 }).toArray()
    res.json({ grades: records.map(({ _id, ...record }) => ({ ...record, gradeId: _id.toString() })) })
  } catch { res.status(503).json({ message: 'Could not load grade approvals.' }) }
})

app.patch('/api/admin/grade-approvals/:gradeId', requireAdmin, async (req, res) => {
  const gradeId = String(req.params.gradeId || '')
  const decision = String(req.body?.decision || '')
  const note = String(req.body?.note || '').trim().slice(0, 300)
  if (!ObjectId.isValid(gradeId) || !['Approved', 'Needs correction'].includes(decision)) return res.status(400).json({ message: 'Choose approve or return for correction.' })
  try {
    const changes = { approvalStatus: decision, approvalNote: note, reviewedAt: new Date(), reviewedBy: req.account.studentId }
    if (decision === 'Approved') Object.assign(changes, { approvedAt: new Date(), approvedBy: req.account.studentId })
    const result = await grades.updateOne({ _id: new ObjectId(gradeId) }, { $set: changes, ...(decision !== 'Approved' ? { $unset: { approvedAt: '', approvedBy: '' } } : {}) })
    if (!result.matchedCount) return res.status(404).json({ message: 'Grade record not found.' })
    res.json({ approvalStatus: decision })
  } catch { res.status(503).json({ message: 'Could not update grade approval.' }) }
})

app.get('/api/teacher/advisories', requireTeacher, async (req, res) => {
  try {
    const records = await advisories.find({ major: req.account.major }, { projection: { _id: 0, title: 1, body: 1, teacherName: 1, major: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(100).toArray()
    res.json({ advisories: records })
  } catch {
    res.status(503).json({ message: 'Could not load advisories.' })
  }
})

app.post('/api/teacher/advisories', requireTeacher, async (req, res) => {
  const title = String(req.body?.title || '').trim()
  const body = String(req.body?.body || '').trim()
  if (title.length < 5 || title.length > 120 || body.length < 10 || body.length > 1500) {
    return res.status(400).json({ message: 'Use a title from 5–120 characters and message from 10–1,500 characters.' })
  }
  try {
    const advisory = { title, body, teacherName: req.account.name, teacherId: req.account.studentId, major: req.account.major, createdAt: new Date() }
    const result = await advisories.insertOne(advisory)
    res.status(201).json({ advisory: { title, body, teacherName: advisory.teacherName, major: advisory.major, createdAt: advisory.createdAt, id: result.insertedId.toString() } })
  } catch {
    res.status(503).json({ message: 'Could not post the advisory.' })
  }
})

app.get('/api/student/advisories', requireStudent, async (req, res) => {
  try {
    const records = await advisories.find({ major: req.account.major }, { projection: { _id: 0, title: 1, body: 1, teacherName: 1, major: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(100).toArray()
    res.json({ advisories: records })
  } catch {
    res.status(503).json({ message: 'Could not load advisories.' })
  }
})

app.get('/api/student/attendance', requireStudent, async (req, res) => {
  try {
    const records = await attendance.find({ studentId: req.account.studentId }).sort({ date: -1, courseCode: 1 }).toArray()
    res.json({ records: records.map(({ _id, ...record }) => record) })
  } catch { res.status(503).json({ message: 'Could not load attendance records.' }) }
})

app.get('/api/teacher/attendance/:scheduleId', requireTeacher, async (req, res) => {
  const scheduleId = String(req.params.scheduleId || '')
  const date = String(req.query.date || '')
  if (!ObjectId.isValid(scheduleId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Choose a valid class and date.' })
  try {
    const schedule = await classSchedules.findOne({ _id: new ObjectId(scheduleId), teacherId: req.account.studentId })
    if (!schedule) return res.status(403).json({ message: 'That class is not assigned to your teacher account.' })
    const records = await attendance.find({ scheduleId, date }).toArray()
    res.json({ records: records.map(({ _id, studentId, status }) => ({ studentId, status })) })
  } catch { res.status(503).json({ message: 'Could not load attendance for this class date.' }) }
})

app.post('/api/teacher/attendance/:scheduleId', requireTeacher, async (req, res) => {
  const scheduleId = String(req.params.scheduleId || '')
  const date = String(req.body?.date || '')
  const entries = Array.isArray(req.body?.entries) ? req.body.entries : []
  if (!ObjectId.isValid(scheduleId) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10) || entries.length < 1 || entries.length > 100) return res.status(400).json({ message: 'Choose a class, valid class date, and at least one student attendance entry.' })
  try {
    const schedule = await classSchedules.findOne({ _id: new ObjectId(scheduleId), teacherId: req.account.studentId, major: req.account.major })
    if (!schedule) return res.status(403).json({ message: 'That class is not assigned to your teacher account.' })
    const operations = []
    for (const entry of entries) {
      const studentId = String(entry?.studentId || '')
      const status = String(entry?.status || '')
      if (!/^\d{8}$/.test(studentId) || !['Present', 'Absent', 'Late', 'Excused'].includes(status)) return res.status(400).json({ message: 'Each student needs a valid attendance status.' })
      const studentQuery = { studentId, major: schedule.major }
      if (schedule.section) studentQuery.section = schedule.section
      const student = await students.findOne(studentQuery, { projection: { _id: 0, studentId: 1, name: 1, section: 1 } })
      if (!student) return res.status(400).json({ message: 'A selected student is not in the assigned class section.' })
      operations.push({ updateOne: { filter: { studentId, scheduleId, date }, update: { $set: { ...student, scheduleId, courseCode: schedule.courseCode, subject: schedule.subject, term: schedule.term, teacherId: req.account.studentId, status, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, upsert: true } })
    }
    if (operations.length) await attendance.bulkWrite(operations)
    res.json({ saved: operations.length })
  } catch { res.status(503).json({ message: 'Could not save attendance.' }) }
})

app.get('/api/admin/curriculum', requireAdmin, async (req, res) => {
  try {
    const filter = req.query.major ? { major: String(req.query.major) } : {}
    const records = await curriculum.find(filter).sort({ yearLevel: 1, term: 1, courseCode: 1 }).toArray()
    res.json({ subjects: records.map(({ _id, ...item }) => ({ ...item, curriculumId: _id.toString() })) })
  } catch { res.status(503).json({ message: 'Could not load curriculum requirements.' }) }
})

app.post('/api/admin/curriculum', requireAdmin, async (req, res) => {
  const item = { major: String(req.body?.major || ''), courseCode: String(req.body?.courseCode || '').trim().toUpperCase(), subject: String(req.body?.subject || '').trim(), units: Number(req.body?.units), yearLevel: Number(req.body?.yearLevel), term: String(req.body?.term || '').trim() }
  if (!validMajors.includes(item.major) || !/^[A-Z0-9][A-Z0-9 -]{1,19}$/.test(item.courseCode) || item.subject.length < 2 || item.subject.length > 100 || !Number.isInteger(item.units) || item.units < 1 || item.units > 12 || !Number.isInteger(item.yearLevel) || item.yearLevel < 1 || item.yearLevel > 4 || item.term.length < 2 || item.term.length > 80) return res.status(400).json({ message: 'Check the major, course code, subject, units, year level, and term.' })
  try {
    const result = await curriculum.insertOne({ ...item, createdAt: new Date(), createdBy: req.account.studentId })
    res.status(201).json({ subject: { ...item, curriculumId: result.insertedId.toString() } })
  } catch { res.status(503).json({ message: 'Could not add curriculum requirement.' }) }
})

app.delete('/api/admin/curriculum/:curriculumId', requireAdmin, async (req, res) => {
  if (!ObjectId.isValid(req.params.curriculumId)) return res.status(400).json({ message: 'Invalid curriculum record.' })
  try {
    const result = await curriculum.deleteOne({ _id: new ObjectId(req.params.curriculumId) })
    if (!result.deletedCount) return res.status(404).json({ message: 'Curriculum record not found.' })
    res.status(204).end()
  } catch { res.status(503).json({ message: 'Could not remove curriculum requirement.' }) }
})

app.get('/api/student/evaluation', requireStudent, async (req, res) => {
  try {
    const [requirements, gradeRecords] = await Promise.all([
      curriculum.find({ major: req.account.major }).sort({ yearLevel: 1, term: 1, courseCode: 1 }).toArray(),
      grades.find({ studentId: req.account.studentId, approvalStatus: 'Approved' }, { projection: { _id: 0, courseCode: 1, subject: 1, term: 1, grade: 1, status: 1 } }).toArray(),
    ])
    const subjects = requirements.map(({ _id, ...item }) => {
      const result = gradeRecords.find(grade => grade.courseCode === item.courseCode)
      return { ...item, status: result?.status || 'Not taken', grade: result?.grade || '' }
    })
    res.json({ subjects })
  } catch { res.status(503).json({ message: 'Could not load academic evaluation.' }) }
})

app.post('/api/student/enrollments', requireStudent, async (req, res) => {
  const term = String(req.body?.term || '').trim()
  const scheduleIds = Array.isArray(req.body?.scheduleIds) ? [...new Set(req.body.scheduleIds.map(String))] : []
  if (term.length < 4 || term.length > 80 || !scheduleIds.length || scheduleIds.length > 12 || scheduleIds.some(id => !ObjectId.isValid(id))) return res.status(400).json({ message: 'Select at least one available class for a valid academic term.' })
  try {
    const matchingSection = req.account.section ? { $in: ['', req.account.section] } : ''
    const selected = await classSchedules.find({ _id: { $in: scheduleIds.map(id => new ObjectId(id)) }, major: req.account.major, term, section: matchingSection }).toArray()
    if (selected.length !== scheduleIds.length) return res.status(400).json({ message: 'One or more selected classes are not available to your major and section.' })
    if (selected.reduce((total, item) => total + item.units, 0) > 24) return res.status(400).json({ message: 'Selected course load exceeds 24 units. Contact the Registrar for an overload review.' })
    const duplicate = await enrollments.findOne({ studentId: req.account.studentId, term, status: { $in: ['Pending', 'Approved'] } })
    if (duplicate) return res.status(409).json({ message: 'A registration for this term is already pending or approved.' })
    const record = { studentId: req.account.studentId, studentName: req.account.name, major: req.account.major, section: req.account.section || '', term, scheduleIds, classes: selected.map(item => ({ courseCode: item.courseCode, subject: item.subject, units: item.units, section: item.section })), units: selected.reduce((total, item) => total + item.units, 0), status: 'Pending', submittedAt: new Date() }
    const result = await enrollments.insertOne(record)
    res.status(201).json({ enrollment: { ...record, enrollmentId: result.insertedId.toString() } })
  } catch { res.status(503).json({ message: 'Could not submit your registration.' }) }
})

app.get('/api/student/enrollments', requireStudent, async (req, res) => {
  try {
    const records = await enrollments.find({ studentId: req.account.studentId }).sort({ submittedAt: -1 }).toArray()
    res.json({ enrollments: records.map(({ _id, ...item }) => ({ ...item, enrollmentId: _id.toString() })) })
  } catch { res.status(503).json({ message: 'Could not load your registration history.' }) }
})

app.get('/api/student/enrolled-subjects', requireStudent, async (req, res) => {
  try {
    const records = await enrollments.find({ studentId: req.account.studentId, status: 'Approved' }).sort({ submittedAt: -1 }).toArray()
    res.json({ subjects: records.flatMap(record => (record.classes || []).map(item => ({ ...item, term: record.term }))) })
  } catch { res.status(503).json({ message: 'Could not load approved enrolled subjects.' }) }
})

app.get('/api/admin/enrollments', requireAdmin, async (_req, res) => {
  try {
    const records = await enrollments.find({}).sort({ submittedAt: -1 }).toArray()
    res.json({ enrollments: records.map(({ _id, ...item }) => ({ ...item, enrollmentId: _id.toString() })) })
  } catch { res.status(503).json({ message: 'Could not load submitted registrations.' }) }
})

app.patch('/api/admin/enrollments/:enrollmentId', requireAdmin, async (req, res) => {
  const enrollmentId = String(req.params.enrollmentId || '')
  const status = String(req.body?.status || '')
  if (!ObjectId.isValid(enrollmentId) || !['Approved', 'Needs correction', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Choose an enrollment decision.' })
  try {
    const result = await enrollments.updateOne({ _id: new ObjectId(enrollmentId), status: 'Pending' }, { $set: { status, reviewedAt: new Date(), reviewedBy: req.account.studentId, reviewNote: String(req.body?.note || '').trim().slice(0, 300) } })
    if (!result.matchedCount) return res.status(404).json({ message: 'Pending registration not found.' })
    res.json({ status })
  } catch { res.status(503).json({ message: 'Could not update the registration decision.' }) }
})

app.get('/api/student/ledger', requireStudent, async (req, res) => {
  try {
    const records = await ledger.find({ studentId: req.account.studentId }).sort({ postedAt: -1 }).toArray()
    const totals = records.reduce((sum, item) => { sum.charges += item.type === 'Charge' ? item.amount : 0; sum.payments += item.type === 'Payment' ? item.amount : 0; return sum }, { charges: 0, payments: 0 })
    res.json({ records: records.map(({ _id, ...item }) => item), totals: { ...totals, balance: totals.charges - totals.payments } })
  } catch { res.status(503).json({ message: 'Could not load student ledger.' }) }
})

app.post('/api/admin/ledger', requireAdmin, async (req, res) => {
  const studentId = String(req.body?.studentId || '')
  const type = String(req.body?.type || '')
  const amount = Number(req.body?.amount)
  const detail = String(req.body?.detail || '').trim()
  const term = String(req.body?.term || '').trim()
  const reference = String(req.body?.reference || '').trim()
  if (!/^\d{8}$/.test(studentId) || !['Charge', 'Payment'].includes(type) || !Number.isFinite(amount) || amount <= 0 || amount > 10000000 || detail.length < 3 || detail.length > 200 || term.length < 4 || term.length > 80 || (type === 'Payment' && reference.length < 3)) return res.status(400).json({ message: 'Enter a valid student ID, charge/payment type, amount, details, and term. Payments need a cashier receipt reference.' })
  try {
    const student = await students.findOne({ studentId }, { projection: { _id: 0, studentId: 1, name: 1, major: 1 } })
    if (!student) return res.status(404).json({ message: 'Student account not found.' })
    const record = { ...student, type, amount: Math.round(amount * 100) / 100, detail, term, reference: reference.slice(0, 80), status: 'Posted', postedAt: new Date(), postedBy: req.account.studentId }
    const result = await ledger.insertOne(record)
    res.status(201).json({ record: { ...record, transactionId: result.insertedId.toString() } })
  } catch { res.status(503).json({ message: 'Could not post ledger entry.' }) }
})

app.get('/api/student/events', requireStudent, async (_req, res) => {
  try {
    const records = await campusEvents.find({ date: { $gte: new Date().toISOString().slice(0, 10) } }).sort({ date: 1 }).limit(100).toArray()
    res.json({ events: records.map(({ _id, ...item }) => item) })
  } catch { res.status(503).json({ message: 'Could not load campus events.' }) }
})

app.get('/api/admin/events', requireAdmin, async (_req, res) => {
  try {
    const records = await campusEvents.find({}).sort({ date: 1 }).toArray()
    res.json({ events: records.map(({ _id, ...item }) => ({ ...item, eventId: _id.toString() })) })
  } catch { res.status(503).json({ message: 'Could not load campus events.' }) }
})

app.post('/api/admin/events', requireAdmin, async (req, res) => {
  const title = String(req.body?.title || '').trim()
  const date = String(req.body?.date || '')
  const location = String(req.body?.location || '').trim()
  const description = String(req.body?.description || '').trim()
  if (title.length < 3 || title.length > 120 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || location.length > 120 || description.length > 1000) return res.status(400).json({ message: 'Enter an event title, valid date, location, and description.' })
  try {
    const event = { title, date, location, description, createdAt: new Date(), createdBy: req.account.studentId }
    const result = await campusEvents.insertOne(event)
    res.status(201).json({ event: { ...event, eventId: result.insertedId.toString() } })
  } catch { res.status(503).json({ message: 'Could not add campus event.' }) }
})

app.delete('/api/admin/events/:eventId', requireAdmin, async (req, res) => {
  if (!ObjectId.isValid(req.params.eventId)) return res.status(400).json({ message: 'Invalid event record.' })
  try {
    const result = await campusEvents.deleteOne({ _id: new ObjectId(req.params.eventId) })
    if (!result.deletedCount) return res.status(404).json({ message: 'Event not found.' })
    res.status(204).end()
  } catch { res.status(503).json({ message: 'Could not delete campus event.' }) }
})

app.get('/api/student/community', requireStudent, async (req, res) => {
  try {
    const records = await communityPosts.find({}).sort({ createdAt: -1 }).limit(100).toArray()
    res.json({ posts: records.map(({ _id, ...item }) => ({ ...item, postId: _id.toString() })) })
  } catch { res.status(503).json({ message: 'Could not load community posts.' }) }
})

app.post('/api/student/community', requireStudent, async (req, res) => {
  const body = String(req.body?.body || '').trim()
  if (body.length < 3 || body.length > 1000) return res.status(400).json({ message: 'A community post must be 3 to 1,000 characters.' })
  try {
    const post = { author: req.account.name, studentId: req.account.studentId, major: req.account.major, body, createdAt: new Date() }
    const result = await communityPosts.insertOne(post)
    res.status(201).json({ post: { ...post, postId: result.insertedId.toString() } })
  } catch { res.status(503).json({ message: 'Could not publish your post.' }) }
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
  await grades.createIndex(
    { studentId: 1, courseCode: 1, term: 1 },
    {
      unique: true,
      partialFilterExpression: {
        studentId: { $type: 'string' },
        courseCode: { $type: 'string' },
        term: { $type: 'string' },
      },
    },
  )
  await attendance.createIndex({ studentId: 1, scheduleId: 1, date: 1 }, { unique: true })
  await curriculum.createIndex({ major: 1, courseCode: 1 }, { unique: true })
  await enrollments.createIndex({ studentId: 1, term: 1, submittedAt: -1 })
  await ledger.createIndex({ studentId: 1, postedAt: -1 })
  await campusEvents.createIndex({ date: 1 })
  await communityPosts.createIndex({ createdAt: -1 })
  await advisories.createIndex({ major: 1, createdAt: -1 })
  await classSchedules.createIndex({ major: 1, term: 1, day: 1 })
  await classSchedules.createIndex({ teacherId: 1, term: 1 })
  await sessions.createIndex({ tokenHash: 1 }, { unique: true })
  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  app.listen(port, () => console.log(`BSED portal API listening on http://localhost:${port}`))
}

start().catch(error => {
  console.error('Could not start the API:', error.message)
  process.exitCode = 1
})
