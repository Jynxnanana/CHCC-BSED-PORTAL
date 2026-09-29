import { useEffect, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpen, CalendarDays,
  Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Clock3,
  Eye, EyeOff, GraduationCap, LayoutDashboard, Library, LockKeyhole, LogOut, Menu,
  MoreHorizontal, Moon, Search, Settings2, Sparkles, Sun, Users, UserPlus, ShieldCheck,
  CalendarRange, BookMarked, ChartNoAxesCombined, Receipt, CreditCard,
  Bot as BotIcon, HeartPulse, BellRing, X,
} from 'lucide-react'
import PortalPage, { DashboardDetails } from './PortalPages.jsx'

const majors = [
  { name: 'English', code: 'ENG', students: 128, color: 'violet', icon: 'Aa' },
  { name: 'Filipino', code: 'FIL', students: 96, color: 'rose', icon: '文' },
  { name: 'Math', code: 'MTH', students: 112, color: 'blue', icon: 'π' },
  { name: 'Social Science', code: 'SS', students: 103, color: 'amber', icon: '◎' },
  { name: 'BEED', code: 'BEED', students: 84, color: 'green', icon: 'B' },
]
const studentYears = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const orgPositions = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'Public Information Officer', 'Representative', 'Member']

const events = [
  { day: '26', month: 'SEP', title: 'Teaching Demo: Microteaching', meta: '10:00 AM · Education Hall', color: 'violet' },
  { day: '28', month: 'SEP', title: 'BSED Majors’ General Assembly', meta: '1:30 PM · AVR, Main Building', color: 'orange' },
  { day: '30', month: 'SEP', title: 'Deadline: Lesson Plan Portfolio', meta: '11:59 PM · Submit online', color: 'green' },
]

const announcements = [
  { initials: 'CD', name: 'College of Education', time: '2 hours ago', text: 'Pre-registration for the student teaching orientation is now open. Please sign up through your major coordinator.', tag: 'ACADEMIC', color: 'violet' },
  { initials: 'SC', name: 'Student Council', time: 'Yesterday', text: 'Calling all BSED students! Join us for the Educ Week kickoff this Friday. See you there, future educators!', tag: 'CAMPUS LIFE', color: 'orange' },
]

function AdminStudents({ setNotice }) {
  const emptyForm = { studentId: '', name: '', major: 'English', section: '', yearLevel: '1st Year', organization: 'Major', orgPosition: 'Member', password: '' }
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(emptyForm)

  const loadStudents = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/students', { credentials: 'include' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not load students.')
      setStudents(result.students)
    } catch (loadError) { setError(loadError.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadStudents() }, [])

  const resetForm = () => { setEditingId(''); setForm(emptyForm); setError('') }

  const submitStudent = async event => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const editing = Boolean(editingId)
      const response = await fetch(editing ? '/api/admin/students/' + encodeURIComponent(editingId) : '/api/admin/students', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editing ? { name: form.name, major: form.major, section: form.section, yearLevel: form.yearLevel, organization: form.organization, orgPosition: form.orgPosition, password: form.password } : form),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not save the account.')
      if (editing) {
        setStudents(current => current.map(item => item.studentId === editingId ? result.student : item).sort((a, b) => a.name.localeCompare(b.name)))
        setNotice('Student account updated for ' + result.student.name + '.')
      } else {
        setStudents(current => [...current, result.student].sort((a, b) => a.name.localeCompare(b.name)))
        setNotice('Student account created for ' + result.student.name + '.')
      }
      resetForm()
    } catch (saveError) { setError(saveError.message) }
    finally { setSaving(false) }
  }

  const editStudent = item => {
    setEditingId(item.studentId)
    setForm({ studentId: item.studentId, name: item.name, major: item.major, section: item.section || '', yearLevel: item.yearLevel || '1st Year', organization: item.organization || 'Major', orgPosition: item.orgPosition || 'Member', password: '' })
    setError('')
  }

  const deleteStudent = async item => {
    if (!window.confirm('Delete the account for ' + item.name + ' (' + item.studentId + ')?')) return
    setError('')
    try {
      const response = await fetch('/api/admin/students/' + encodeURIComponent(item.studentId), { method: 'DELETE', credentials: 'include' })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Could not delete the account.')
      }
      setStudents(current => current.filter(student => student.studentId !== item.studentId))
      if (editingId === item.studentId) resetForm()
      setNotice('Student account deleted for ' + item.name + '.')
    } catch (deleteError) { setError(deleteError.message) }
  }

  return <section className="admin-students-view">
    <div className="admin-intro"><div><span className="section-kicker">ADMINISTRATION</span><h2>Student accounts</h2><p>Create, view, edit, and delete BSED student accounts.</p></div><span className="admin-count"><Users size={16} /> {students.length} students</span></div>
    <div className="admin-layout">
      <article className="panel admin-form-panel">
        <div className="admin-panel-title"><span className="admin-panel-icon"><UserPlus size={17} /></span><div><h3>{editingId ? 'Edit student account' : 'Add a student'}</h3><p>{editingId ? 'Student ID cannot be changed. Leave password blank to keep it.' : "Set the student's initial password."}</p></div></div>
        <form className="admin-form" onSubmit={submitStudent}>
          <label htmlFor="new-student-id">Student ID</label>
          <input id="new-student-id" required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" placeholder="8-digit ID, e.g. 61212024" value={form.studentId} disabled={Boolean(editingId)} onChange={event => setForm({ ...form, studentId: event.target.value.replace(/\D/g, '').slice(0, 8) })} />
          <label htmlFor="new-student-name">Full name</label>
          <input id="new-student-name" required minLength={2} placeholder="Student's full name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
          <label htmlFor="new-student-major">BSED major</label>
          <select id="new-student-major" value={form.major} onChange={event => setForm({ ...form, major: event.target.value })}>{majors.map(major => <option key={major.code} value={major.name}>{major.name}</option>)}</select>
          <label htmlFor="new-student-year">College year</label>
          <select id="new-student-year" value={form.yearLevel} onChange={event => setForm({ ...form, yearLevel: event.target.value })}>{studentYears.map(year => <option key={year}>{year}</option>)}</select>
          <label htmlFor="new-student-organization">Organization</label>
          <select id="new-student-organization" value={form.organization} onChange={event => setForm({ ...form, organization: event.target.value })}><option>Major</option><option>Minor</option></select>
          <label htmlFor="new-student-position">Organization position</label>
          <select id="new-student-position" value={form.orgPosition} onChange={event => setForm({ ...form, orgPosition: event.target.value })}>{orgPositions.map(position => <option key={position}>{position}</option>)}</select>
          <label htmlFor="new-student-section">Section (optional)</label>
          <input id="new-student-section" maxLength={30} placeholder="e.g. BSED-3A" value={form.section} onChange={event => setForm({ ...form, section: event.target.value })} />
          <label htmlFor="new-student-password">{editingId ? 'New password (optional)' : 'Initial password'}</label>
          <input id="new-student-password" required={!editingId} minLength={form.password || !editingId ? 10 : undefined} type="password" autoComplete="new-password" placeholder={editingId ? 'Leave blank to keep current password' : 'At least 10 characters'} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
          {error && <div className="admin-error" role="alert">{error}</div>}
          <button className="login-submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save student changes' : 'Create student account'} {!saving && <ArrowRight size={15} />}</button>
          {editingId && <button className="admin-cancel-edit" type="button" onClick={resetForm}>Cancel editing</button>}
        </form>
      </article>
      <article className="panel admin-directory">
        <div className="admin-directory-heading"><div><h3>Student directory</h3><p>Registered student portal accounts</p></div><button className="admin-refresh" onClick={loadStudents} aria-label="Refresh student list"><Sparkles size={15} /></button></div>
        {loading ? <div className="admin-empty">Loading students...</div> : students.length === 0 ? <div className="admin-empty"><Users size={22} /><strong>No student accounts yet</strong><span>Add the first BSED student with the form.</span></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>STUDENT</th><th>ID</th><th>MAJOR / ORG</th><th>YEAR / POSITION</th><th>SECTION</th><th>ACTIONS</th></tr></thead><tbody>{students.map(item => <tr key={item.studentId}><td><strong>{item.name}</strong></td><td>{item.studentId}</td><td><span className="admin-major-pill">{item.major}</span><small className="table-subline">{item.organization || 'Major'} org</small></td><td>{item.yearLevel || '—'}<small className="table-subline">{item.orgPosition || 'Member'}</small></td><td>{item.section || '—'}</td><td><div className="admin-row-actions"><button type="button" className="admin-action-button" onClick={() => editStudent(item)}>Edit</button><button type="button" className="admin-action-button danger" onClick={() => deleteStudent(item)}>Delete</button></div></td></tr>)}</tbody></table></div>}
      </article>
    </div>
  </section>
}

function TeacherAccounts({ setNotice }) {
  const emptyForm = { studentId: '', username: '', name: '', major: 'English', photoUrl: '', password: '' }
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(emptyForm)

  const loadTeachers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/teachers', { credentials: 'include' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not load teacher accounts.')
      setTeachers(result.teachers)
    } catch (loadError) { setError(loadError.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadTeachers() }, [])

  const resetForm = () => { setEditingId(''); setForm(emptyForm); setError('') }

  const submitTeacher = async event => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const editing = Boolean(editingId)
      const response = await fetch(editing ? '/api/admin/teachers/' + encodeURIComponent(editingId) : '/api/admin/teachers', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editing ? { username: form.username, name: form.name, major: form.major, photoUrl: form.photoUrl, password: form.password } : form),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not save the teacher account.')
      if (editing) {
        setTeachers(current => current.map(item => item.studentId === editingId ? result.teacher : item).sort((a, b) => a.name.localeCompare(b.name)))
        setNotice('Teacher account updated for ' + result.teacher.name + '.')
      } else {
        setTeachers(current => [...current, result.teacher].sort((a, b) => a.name.localeCompare(b.name)))
        setNotice('Teacher account created for ' + result.teacher.name + '.')
      }
      resetForm()
    } catch (saveError) { setError(saveError.message) }
    finally { setSaving(false) }
  }

  const editTeacher = item => {
    setEditingId(item.studentId)
    setForm({ studentId: item.studentId, username: item.username, name: item.name, major: item.major, photoUrl: item.photoUrl || '', password: '' })
    setError('')
  }

  const deleteTeacher = async item => {
    if (!window.confirm('Delete the account for ' + item.name + ' (' + item.username + ')?')) return
    setError('')
    try {
      const response = await fetch('/api/admin/teachers/' + encodeURIComponent(item.studentId), { method: 'DELETE', credentials: 'include' })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Could not delete the teacher account.')
      }
      setTeachers(current => current.filter(teacher => teacher.studentId !== item.studentId))
      if (editingId === item.studentId) resetForm()
      setNotice('Teacher account deleted for ' + item.name + '.')
    } catch (deleteError) { setError(deleteError.message) }
  }

  return <section className="admin-students-view">
    <div className="admin-intro"><div><span className="section-kicker">ADMINISTRATION</span><h2>Teacher accounts</h2><p>Create, view, edit, and delete teacher accounts assigned to BSED majors.</p></div><span className="admin-count"><Users size={16} /> {teachers.length} teachers</span></div>
    <div className="admin-layout">
      <article className="panel admin-form-panel">
        <div className="admin-panel-title"><span className="admin-panel-icon"><UserPlus size={17} /></span><div><h3>{editingId ? 'Edit teacher account' : 'Add a teacher'}</h3><p>{editingId ? 'Staff ID cannot be changed. Leave password blank to keep it.' : 'Teachers can view students in their assigned major.'}</p></div></div>
        <form className="admin-form" onSubmit={submitTeacher}>
          <label htmlFor="new-teacher-id">Staff ID</label>
          <input id="new-teacher-id" required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" placeholder="8-digit staff ID" value={form.studentId} disabled={Boolean(editingId)} onChange={event => setForm({ ...form, studentId: event.target.value.replace(/\D/g, '').slice(0, 8) })} />
          <label htmlFor="new-teacher-username">Username</label>
          <input id="new-teacher-username" required minLength={3} maxLength={32} pattern="[a-zA-Z][a-zA-Z0-9._-]*" placeholder="e.g. teacher.english" value={form.username} onChange={event => setForm({ ...form, username: event.target.value.toLowerCase() })} />
          <label htmlFor="new-teacher-name">Full name</label>
          <input id="new-teacher-name" required minLength={2} placeholder="Teacher's full name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
          <label htmlFor="new-teacher-major">Assigned BSED major</label>
          <select id="new-teacher-major" value={form.major} onChange={event => setForm({ ...form, major: event.target.value })}>{majors.map(major => <option key={major.code} value={major.name}>{major.name}</option>)}</select>
          <label htmlFor="new-teacher-photo">Teacher picture (optional, max 800 KB)</label>
          <input id="new-teacher-photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 800 * 1024) { setError('Choose a picture smaller than 800 KB.'); event.target.value = ''; return } const reader = new FileReader(); reader.onload = () => setForm(current => ({ ...current, photoUrl: String(reader.result || '') })); reader.onerror = () => setError('Could not read that picture.'); reader.readAsDataURL(file) }} />
          {form.photoUrl && <div className="teacher-photo-edit"><img src={form.photoUrl} alt="Teacher preview" /><button type="button" className="admin-action-button danger" onClick={() => setForm(current => ({ ...current, photoUrl: '' }))}>Remove picture</button></div>}
          <label htmlFor="new-teacher-password">{editingId ? 'New password (optional)' : 'Initial password'}</label>
          <input id="new-teacher-password" required={!editingId} minLength={form.password || !editingId ? 12 : undefined} type="password" autoComplete="new-password" placeholder={editingId ? 'Leave blank to keep current password' : 'At least 12 characters'} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
          {error && <div className="admin-error" role="alert">{error}</div>}
          <button className="login-submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save teacher changes' : 'Create teacher account'} {!saving && <ArrowRight size={15} />}</button>
          {editingId && <button className="admin-cancel-edit" type="button" onClick={resetForm}>Cancel editing</button>}
        </form>
      </article>
      <article className="panel admin-directory">
        <div className="admin-directory-heading"><div><h3>Teacher directory</h3><p>Registered BSED teacher accounts</p></div><button className="admin-refresh" onClick={loadTeachers} aria-label="Refresh teacher list"><Sparkles size={15} /></button></div>
        {loading ? <div className="admin-empty">Loading teachers...</div> : teachers.length === 0 ? <div className="admin-empty"><Users size={22} /><strong>No teacher accounts yet</strong><span>Add the first teacher with the form.</span></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>TEACHER</th><th>USERNAME</th><th>STAFF ID</th><th>MAJOR</th><th>ACTIONS</th></tr></thead><tbody>{teachers.map(item => <tr key={item.studentId}><td><div className="teacher-directory-person">{item.photoUrl ? <img src={item.photoUrl} alt="" /> : <span>{item.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</span>}<strong>{item.name}</strong></div></td><td>{item.username}</td><td>{item.studentId}</td><td><span className="admin-major-pill">{item.major}</span></td><td><div className="admin-row-actions"><button type="button" className="admin-action-button" onClick={() => editTeacher(item)}>Edit</button><button type="button" className="admin-action-button danger" onClick={() => deleteTeacher(item)}>Delete</button></div></td></tr>)}</tbody></table></div>}
      </article>
    </div>
  </section>
}
function AdminSchedules({ setNotice }) {
  const emptyForm = { term: '', courseCode: '', subject: '', major: 'English', teacherId: '', section: '', day: 'Monday', time: '', room: '', units: '3' }
  const [schedules, setSchedules] = useState([])
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const loadSchedules = async () => {
    setLoading(true)
    setError('')
    try {
      const [scheduleResponse, teacherResponse] = await Promise.all([
        fetch('/api/admin/schedules', { credentials: 'include' }),
        fetch('/api/admin/teachers', { credentials: 'include' }),
      ])
      const [scheduleResult, teacherResult] = await Promise.all([scheduleResponse.json(), teacherResponse.json()])
      if (!scheduleResponse.ok || !teacherResponse.ok) throw new Error(scheduleResult.message || teacherResult.message || 'Could not load schedules.')
      setSchedules(scheduleResult.schedules)
      setTeachers(teacherResult.teachers)
    } catch (loadError) { setError(loadError.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { loadSchedules() }, [])
  const resetForm = () => { setForm(emptyForm); setEditingId(''); setError('') }
  const submitSchedule = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch(editingId ? `/api/admin/schedules/${encodeURIComponent(editingId)}` : '/api/admin/schedules', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(form),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not save the schedule.')
      setNotice(editingId ? 'Class schedule updated.' : 'Class schedule added.')
      resetForm()
      await loadSchedules()
    } catch (saveError) { setError(saveError.message) }
    finally { setSaving(false) }
  }
  const editSchedule = item => {
    setEditingId(item.scheduleId)
    setForm({ term: item.term, courseCode: item.courseCode, subject: item.subject, major: item.major, teacherId: item.teacherId || '', section: item.section || '', day: item.day, time: item.time, room: item.room, units: String(item.units) })
    setError('')
  }
  const deleteSchedule = async item => {
    if (!window.confirm(`Delete ${item.courseCode} — ${item.subject} (${item.section || 'no section'})?`)) return
    setError('')
    try {
      const response = await fetch(`/api/admin/schedules/${encodeURIComponent(item.scheduleId)}`, { method: 'DELETE', credentials: 'include' })
      if (!response.ok) { const result = await response.json(); throw new Error(result.message || 'Could not delete the schedule.') }
      setSchedules(current => current.filter(schedule => schedule.scheduleId !== item.scheduleId))
      if (editingId === item.scheduleId) resetForm()
      setNotice('Class schedule deleted.')
    } catch (deleteError) { setError(deleteError.message) }
  }
  const eligibleTeachers = teachers.filter(item => item.major === form.major)
  return <section className="admin-students-view">
    <div className="admin-intro"><div><span className="section-kicker">ADMINISTRATION</span><h2>Class schedules</h2><p>Add official classes and assign them to a major and teacher.</p></div><span className="admin-count"><CalendarRange size={16} /> {schedules.length} classes</span></div>
    <article className="panel admin-form-panel schedule-admin-form"><div className="admin-panel-title"><span className="admin-panel-icon"><CalendarRange size={17} /></span><div><h3>{editingId ? 'Edit class schedule' : 'Add a class schedule'}</h3><p>Use details confirmed by the Registrar or department.</p></div></div>
      <form className="admin-form schedule-form" onSubmit={submitSchedule}>
        <label htmlFor="schedule-term">Academic term</label><input id="schedule-term" required minLength={4} maxLength={80} placeholder="1st Semester, AY 2026–2027" value={form.term} onChange={event => setForm({ ...form, term: event.target.value })} />
        <label htmlFor="schedule-major">BSED major</label><select id="schedule-major" value={form.major} onChange={event => setForm({ ...form, major: event.target.value, teacherId: '' })}>{majors.map(item => <option key={item.code} value={item.name}>{item.name}</option>)}</select>
        <label htmlFor="schedule-code">Course code</label><input id="schedule-code" required maxLength={20} placeholder="e.g. ENG 301" value={form.courseCode} onChange={event => setForm({ ...form, courseCode: event.target.value.toUpperCase() })} />
        <label htmlFor="schedule-subject">Subject</label><input id="schedule-subject" required minLength={2} maxLength={100} placeholder="Official subject name" value={form.subject} onChange={event => setForm({ ...form, subject: event.target.value })} />
        <label htmlFor="schedule-teacher">Assigned teacher</label><select id="schedule-teacher" value={form.teacherId} onChange={event => setForm({ ...form, teacherId: event.target.value })}><option value="">Unassigned</option>{eligibleTeachers.map(item => <option key={item.studentId} value={item.studentId}>{item.name} ({item.username})</option>)}</select>
        <label htmlFor="schedule-section">Section (optional)</label><input id="schedule-section" maxLength={30} placeholder="e.g. BSED-3A" value={form.section} onChange={event => setForm({ ...form, section: event.target.value })} />
        <label htmlFor="schedule-day">Day</label><select id="schedule-day" value={form.day} onChange={event => setForm({ ...form, day: event.target.value })}>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(value => <option key={value}>{value}</option>)}</select>
        <label htmlFor="schedule-time">Class time</label><input id="schedule-time" required minLength={3} maxLength={60} placeholder="e.g. 8:00–9:30 AM" value={form.time} onChange={event => setForm({ ...form, time: event.target.value })} />
        <label htmlFor="schedule-room">Room</label><input id="schedule-room" required maxLength={50} placeholder="e.g. Room 304" value={form.room} onChange={event => setForm({ ...form, room: event.target.value })} />
        <label htmlFor="schedule-units">Units</label><input id="schedule-units" required type="number" min="1" max="12" step="1" value={form.units} onChange={event => setForm({ ...form, units: event.target.value })} />
        {error && <div className="admin-error" role="alert">{error}</div>}<button className="login-submit" disabled={saving || loading}>{saving ? 'Saving...' : editingId ? 'Save schedule changes' : 'Add class schedule'} {!saving && <ArrowRight size={15} />}</button>{editingId && <button className="admin-cancel-edit" type="button" onClick={resetForm}>Cancel editing</button>}
      </form>
    </article>
    <article className="panel admin-directory schedule-admin-list"><div className="admin-directory-heading"><div><h3>Schedule directory</h3><p>Classes displayed to the matching major and assigned teacher</p></div><button className="admin-refresh" onClick={loadSchedules} aria-label="Refresh schedules"><Sparkles size={15} /></button></div>
      {loading ? <div className="admin-empty">Loading class schedules...</div> : schedules.length === 0 ? <div className="admin-empty"><CalendarRange size={22} /><strong>No class schedules added yet</strong><span>Ask the school for official subject and timetable details.</span></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>CLASS</th><th>TERM</th><th>MAJOR / TEACHER</th><th>SCHEDULE</th><th>ROOM</th><th>ACTIONS</th></tr></thead><tbody>{schedules.map(item => <tr key={item.scheduleId}><td><strong>{item.courseCode} · {item.subject}</strong><small className="table-subline">{item.section || 'No section'} · {item.units} units</small></td><td>{item.term}</td><td>{item.major}<small className="table-subline">{item.teacherName || 'Unassigned'}</small></td><td>{item.day} · {item.time}</td><td>{item.room}</td><td><div className="admin-row-actions"><button type="button" className="admin-action-button" onClick={() => editSchedule(item)}>Edit</button><button type="button" className="admin-action-button danger" onClick={() => deleteSchedule(item)}>Delete</button></div></td></tr>)}</tbody></table></div>}
    </article>
  </section>
}

function TeacherDashboard({ teacher }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const loadStudents = () => {
    setLoading(true)
    setError('')
    fetch('/api/teacher/students', { credentials: 'include' })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load your roster.'); setStudents(result.students) })
      .catch(loadError => setError(loadError.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { loadStudents() }, [])
  const filteredStudents = students.filter(item => `${item.name} ${item.studentId}`.toLowerCase().includes(query.trim().toLowerCase()))
  const exportRoster = () => {
    const csv = [['Student name', 'Student ID', 'Major'], ...filteredStudents.map(item => [item.name, item.studentId, item.major])]
      .map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${teacher.major.toLowerCase().replaceAll(' ', '-')}-student-roster.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
  return <section className="admin-students-view teacher-dashboard">
    <div className="admin-intro"><div><span className="section-kicker">TEACHER PORTAL</span><h2>Welcome, {teacher.name}</h2><p>{teacher.major} major · staff ID {teacher.studentId}</p></div><span className="admin-count"><Users size={16} /> {students.length} students</span></div>
    <div className="teacher-summary-grid"><article className="panel teacher-summary-card"><span className="teacher-summary-icon"><Users size={17} /></span><div><span className="section-kicker">ASSIGNED ROSTER</span><strong>{loading ? '—' : students.length}</strong><small>{teacher.major} major students</small></div></article><article className="panel teacher-summary-card"><span className="teacher-summary-icon teacher-summary-icon-alt"><GraduationCap size={17} /></span><div><span className="section-kicker">TEACHING AREA</span><strong>{teacher.major}</strong><small>Assigned by your portal administrator</small></div></article></div>
    <article className="panel admin-directory">
      <div className="admin-directory-heading"><div><h3>{teacher.major} student roster</h3><p>Search and export student accounts assigned to your BSED major.</p></div><span className="admin-major-pill">{teacher.major}</span></div>
      <div className="teacher-roster-tools"><label className="teacher-roster-search"><Search size={15} /><input aria-label="Search student roster" placeholder="Search name or student ID" value={query} onChange={event => setQuery(event.target.value)} /></label><div className="admin-row-actions"><button className="admin-action-button" onClick={loadStudents} disabled={loading}>Refresh</button><button className="admin-action-button" onClick={exportRoster} disabled={loading || filteredStudents.length === 0}>Export CSV</button></div></div>
      {error ? <div className="admin-error" role="alert">{error}</div> : loading ? <div className="admin-empty">Loading students...</div> : students.length === 0 ? <div className="admin-empty"><Users size={22} /><strong>No student accounts in this major yet</strong></div> : filteredStudents.length === 0 ? <div className="admin-empty"><Search size={20} /><strong>No students match that search</strong><span>Try a different name or student ID.</span></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>MAJOR</th></tr></thead><tbody>{filteredStudents.map(item => <tr key={item.studentId}><td><strong>{item.name}</strong></td><td>{item.studentId}</td><td><span className="admin-major-pill">{item.major}</span></td></tr>)}</tbody></table></div>}
      {!loading && !error && students.length > 0 && <p className="teacher-roster-count">Showing {filteredStudents.length} of {students.length} students</p>}
    </article>
    <p className="teacher-feature-note">Only accounts assigned to your BSED major are shown. Class schedules still need to be connected to official school records.</p>
  </section>
}

function TeacherGradebook({ teacher }) {
  const [students, setStudents] = useState([])
  const [schedules, setSchedules] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ studentId: '', scheduleId: '', grade: '' })
  const loadGradebook = async () => {
    setLoading(true)
    setError('')
    try {
      const [studentResponse, gradeResponse] = await Promise.all([
        fetch('/api/teacher/students', { credentials: 'include' }),
        fetch('/api/teacher/grades', { credentials: 'include' }),
      ])
      const scheduleResponse = await fetch('/api/teacher/schedules', { credentials: 'include' })
      const [studentResult, gradeResult, scheduleResult] = await Promise.all([studentResponse.json(), gradeResponse.json(), scheduleResponse.json()])
      if (!studentResponse.ok || !gradeResponse.ok || !scheduleResponse.ok) throw new Error(studentResult.message || gradeResult.message || scheduleResult.message || 'Could not load the gradebook.')
      setStudents(studentResult.students)
      setGrades(gradeResult.grades)
      setSchedules(scheduleResult.schedules)
      setForm(current => ({ ...current, studentId: studentResult.students.some(item => item.studentId === current.studentId) ? current.studentId : studentResult.students[0]?.studentId || '', scheduleId: scheduleResult.schedules.some(item => item.scheduleId === current.scheduleId) ? current.scheduleId : scheduleResult.schedules[0]?.scheduleId || '' }))
    } catch (loadError) { setError(loadError.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { loadGradebook() }, [])
  const submitGrade = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/teacher/grades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not save this grade.')
      setNotice(`Saved ${result.grade.courseCode} for ${result.grade.studentName}.`)
      setForm(current => ({ ...current, grade: '' }))
      await loadGradebook()
    } catch (saveError) { setError(saveError.message) }
    finally { setSaving(false) }
  }
  return <section className="admin-students-view teacher-dashboard">
    <div className="admin-intro"><div><span className="section-kicker">TEACHER PORTAL · GRADEBOOK</span><h2>Gradebook</h2><p>Enter final course grades for students in the {teacher.major} major.</p></div><span className="admin-count"><BookMarked size={16} /> {grades.length} records</span></div>
    <article className="panel admin-form-panel teacher-grade-form-panel"><div className="admin-panel-title"><span className="admin-panel-icon"><BookMarked size={17} /></span><div><h3>Save a final grade</h3><p>Saving the same student, course code, and term updates that record.</p></div></div>
      {!loading && students.length === 0 ? <div className="admin-empty">There are no students in your assigned major yet.</div> : !loading && schedules.length === 0 ? <div className="admin-empty">No classes are assigned to your teacher account yet. Ask the administrator to add your official class schedule.</div> : <form className="admin-form teacher-grade-form" onSubmit={submitGrade}>
        <label htmlFor="grade-class">Assigned class</label><select id="grade-class" required value={form.scheduleId} onChange={event => setForm({ ...form, scheduleId: event.target.value })}><option value="" disabled>Select an assigned class</option>{schedules.map(item => <option key={item.scheduleId} value={item.scheduleId}>{item.courseCode} · {item.subject} · {item.section || 'All sections'} · {item.term}</option>)}</select>
        <label htmlFor="grade-student">Student</label><select id="grade-student" required value={form.studentId} onChange={event => setForm({ ...form, studentId: event.target.value })}><option value="" disabled>Select a student</option>{students.filter(item => { const selected = schedules.find(schedule => schedule.scheduleId === form.scheduleId); return !selected?.section || item.section === selected.section }).map(item => <option key={item.studentId} value={item.studentId}>{item.name} · {item.studentId}{item.section ? ` · ${item.section}` : ''}</option>)}</select>
        <label htmlFor="grade-value">Final grade</label><select id="grade-value" required value={form.grade} onChange={event => setForm({ ...form, grade: event.target.value })}><option value="" disabled>Select grade</option>{Array.from({ length: 17 }, (_, index) => (1 + index * 0.25).toFixed(2)).map(value => <option key={value} value={value}>{value}</option>)}</select>
        {error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="password-saved" role="status">{notice}</div>}<button className="login-submit" disabled={saving || loading || students.length === 0 || schedules.length === 0}>{saving ? 'Saving grade...' : 'Save final grade'} {!saving && <ArrowRight size={15} />}</button>
      </form>}
    </article>
    <article className="panel admin-directory teacher-grade-records"><div className="admin-directory-heading"><div><h3>Saved grade records</h3><p>Only students in your assigned major are included.</p></div><button className="admin-refresh" onClick={loadGradebook} aria-label="Refresh gradebook"><Sparkles size={15} /></button></div>
      {error && !notice ? <div className="admin-error" role="alert">{error}</div> : loading ? <div className="admin-empty">Loading grades...</div> : grades.length === 0 ? <div className="admin-empty"><BookMarked size={22} /><strong>No grades have been saved yet</strong></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>STUDENT</th><th>COURSE</th><th>TERM</th><th>UNITS</th><th>GRADE</th><th>RESULT</th></tr></thead><tbody>{grades.map(item => <tr key={`${item.studentId}-${item.courseCode}-${item.term}`}><td><strong>{item.studentName}</strong><small className="table-subline">{item.studentId}</small></td><td><strong>{item.courseCode}</strong><small className="table-subline">{item.subject}</small></td><td>{item.term}</td><td>{item.units}</td><td>{item.grade}</td><td><span className={`admin-grade-status ${item.status === 'Passed' ? 'passed' : item.status === 'Incomplete' ? 'incomplete' : 'failed'}`}>{item.status}</span></td></tr>)}</tbody></table></div>}
    </article>
    <p className="teacher-feature-note">Use grades supplied by the instructor or Registrar. This gradebook records final grades and does not replace official Registrar approval.</p>
  </section>
}

function TeacherAttendance() {
  const [students, setStudents] = useState([])
  const [schedules, setSchedules] = useState([])
  const [scheduleId, setScheduleId] = useState('')
  const [date, setDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10))
  const [statuses, setStatuses] = useState({})
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    Promise.all(['/api/teacher/schedules', '/api/teacher/students'].map(url => fetch(url, { credentials: 'include' }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load attendance tools.'); return result })))
      .then(([classData, rosterData]) => { setSchedules(classData.schedules); setScheduleId(classData.schedules[0]?.scheduleId || ''); setStudents(rosterData.students) })
      .catch(loadError => setError(loadError.message)).finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    if (!scheduleId || !date) return
    fetch(`/api/teacher/attendance/${encodeURIComponent(scheduleId)}?date=${encodeURIComponent(date)}`, { credentials: 'include' })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load the attendance sheet.'); setStatuses(Object.fromEntries(result.records.map(item => [item.studentId, item.status]))) })
      .catch(loadError => setError(loadError.message))
  }, [scheduleId, date])
  const selectedClass = schedules.find(item => item.scheduleId === scheduleId)
  const classStudents = students.filter(item => !selectedClass?.section || item.section === selectedClass.section)
  const save = async event => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch(`/api/teacher/attendance/${encodeURIComponent(scheduleId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ date, entries: classStudents.map(item => ({ studentId: item.studentId, status: statuses[item.studentId] || 'Present' })) }) })
      const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not save attendance.')
      setNotice(`Saved attendance for ${result.saved} students.`)
    } catch (saveError) { setError(saveError.message) } finally { setSaving(false) }
  }
  return <section className="admin-students-view"><div className="admin-intro"><div><span className="section-kicker">TEACHER PORTAL</span><h2>Class attendance</h2><p>Record attendance for your assigned classes.</p></div></div>{loading ? <div className="admin-empty">Loading assigned classes...</div> : !schedules.length ? <div className="admin-empty">Ask the administrator to assign a class before taking attendance.</div> : <article className="panel admin-form-panel"><form className="admin-form" onSubmit={save}><label htmlFor="attendance-class">Assigned class</label><select id="attendance-class" value={scheduleId} onChange={event => setScheduleId(event.target.value)}>{schedules.map(item => <option key={item.scheduleId} value={item.scheduleId}>{item.courseCode} · {item.subject} · {item.section || 'All sections'}</option>)}</select><label htmlFor="attendance-date">Class date</label><input id="attendance-date" type="date" max={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)} value={date} onChange={event => setDate(event.target.value)} /><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>STUDENT</th><th>SECTION</th><th>STATUS</th></tr></thead><tbody>{classStudents.map(item => <tr key={item.studentId}><td>{item.name}<small className="table-subline">{item.studentId}</small></td><td>{item.section || '—'}</td><td><select aria-label={`Attendance for ${item.name}`} value={statuses[item.studentId] || 'Present'} onChange={event => setStatuses(current => ({ ...current, [item.studentId]: event.target.value }))}>{['Present', 'Absent', 'Late', 'Excused'].map(value => <option key={value}>{value}</option>)}</select></td></tr>)}</tbody></table></div>{error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="password-saved" role="status">{notice}</div>}<button className="login-submit" disabled={saving || !classStudents.length}>{saving ? 'Saving...' : 'Save attendance'} {!saving && <ArrowRight size={15} />}</button></form></article>}</section>
}

function AdminWorkflow({ active, setNotice }) {
  const [records, setRecords] = useState([])
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ major: 'English', courseCode: '', subject: '', units: '3', yearLevel: '1', term: '1st Semester' })
  const [finance, setFinance] = useState({ studentId: '', type: 'Charge', amount: '', detail: '', term: '', reference: '' })
  const [eventForm, setEventForm] = useState({ title: '', date: '', location: '', description: '' })
  const [busy, setBusy] = useState(false)
  const endpoints = { 'Grade Approvals': '/api/admin/grade-approvals', 'Enrollment Review': '/api/admin/enrollments', 'Curriculum Catalog': '/api/admin/curriculum', 'Student Ledger Admin': '/api/admin/students', 'Campus Events': '/api/admin/events' }
  const reload = async () => {
    setError('')
    try { const response = await fetch(endpoints[active], { credentials: 'include' }); const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load records.'); const list = result.grades || result.enrollments || result.subjects || result.events || result.students || []; setRecords(list); if (result.students) setStudents(result.students) }
    catch (loadError) { setError(loadError.message) }
  }
  useEffect(() => { reload() }, [active])
  const act = async (url, method, body) => {
    setBusy(true); setError('')
    try { const response = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, credentials: 'include', body: body ? JSON.stringify(body) : undefined }); const result = response.status === 204 ? {} : await response.json(); if (!response.ok) throw new Error(result.message || 'Could not save.'); await reload(); return result }
    catch (actionError) { setError(actionError.message); return null } finally { setBusy(false) }
  }
  const title = active === 'Grade Approvals' ? 'Grade approvals' : active === 'Enrollment Review' ? 'Enrollment review' : active === 'Curriculum Catalog' ? 'Curriculum catalog' : active === 'Student Ledger Admin' ? 'Student ledger entries' : 'Campus events'
  return <section className="admin-students-view"><div className="admin-intro"><div><span className="section-kicker">ADMINISTRATION</span><h2>{title}</h2><p>Manage and review records stored in the portal database.</p></div><button className="admin-action-button" onClick={reload}>Refresh</button></div>{error && <div className="admin-error" role="alert">{error}</div>}
    {active === 'Grade Approvals' && <article className="panel admin-directory"><h3>Grades awaiting review</h3>{!records.length ? <div className="admin-empty">No grade records need review.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>STUDENT</th><th>CLASS</th><th>TERM</th><th>GRADE</th><th>DECISION</th></tr></thead><tbody>{records.map(item => <tr key={item.gradeId}><td>{item.studentName}<small className="table-subline">{item.studentId} · {item.major}</small></td><td>{item.courseCode} · {item.subject}</td><td>{item.term}</td><td>{item.grade}</td><td><div className="admin-row-actions"><button disabled={busy} className="admin-action-button" onClick={async () => { if (await act(`/api/admin/grade-approvals/${item.gradeId}`, 'PATCH', { decision: 'Approved' })) setNotice('Grade approved and released to student.') }}>Approve</button><button disabled={busy} className="admin-action-button danger" onClick={async () => { if (await act(`/api/admin/grade-approvals/${item.gradeId}`, 'PATCH', { decision: 'Needs correction', note: 'Please review and resubmit this grade.' })) setNotice('Grade returned for correction.') }}>Return</button></div></td></tr>)}</tbody></table></div>}</article>}
    {active === 'Enrollment Review' && <article className="panel admin-directory"><h3>Submitted registrations</h3>{!records.length ? <div className="admin-empty">No registration requests yet.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>STUDENT</th><th>TERM / LOAD</th><th>CLASSES</th><th>STATUS</th><th>REVIEW</th></tr></thead><tbody>{records.map(item => <tr key={item.enrollmentId}><td>{item.studentName}<small className="table-subline">{item.studentId} · {item.section || item.major}</small></td><td>{item.term}<small className="table-subline">{item.units} units</small></td><td>{item.classes.map(classItem => classItem.courseCode).join(', ')}</td><td>{item.status}</td><td>{item.status === 'Pending' && <div className="admin-row-actions"><button disabled={busy} className="admin-action-button" onClick={async () => { if (await act(`/api/admin/enrollments/${item.enrollmentId}`, 'PATCH', { status: 'Approved' })) setNotice('Registration approved.') }}>Approve</button><button disabled={busy} className="admin-action-button danger" onClick={async () => { if (await act(`/api/admin/enrollments/${item.enrollmentId}`, 'PATCH', { status: 'Needs correction' })) setNotice('Registration returned for correction.') }}>Return</button></div>}</td></tr>)}</tbody></table></div>}</article>}
    {active === 'Curriculum Catalog' && <><article className="panel admin-form-panel"><form className="admin-form" onSubmit={async event => { event.preventDefault(); const result = await act('/api/admin/curriculum', 'POST', { ...form, units: Number(form.units), yearLevel: Number(form.yearLevel) }); if (result) { setForm(current => ({ ...current, courseCode: '', subject: '' })); setNotice('Curriculum requirement added.') } }}><label>Major</label><select value={form.major} onChange={event => setForm({ ...form, major: event.target.value })}>{majors.map(item => <option key={item.code}>{item.name}</option>)}</select><label>Course code</label><input required value={form.courseCode} onChange={event => setForm({ ...form, courseCode: event.target.value })} /><label>Subject</label><input required value={form.subject} onChange={event => setForm({ ...form, subject: event.target.value })} /><label>Units / year level / term</label><div className="admin-row-actions"><input type="number" min="1" max="12" value={form.units} onChange={event => setForm({ ...form, units: event.target.value })} /><input type="number" min="1" max="4" value={form.yearLevel} onChange={event => setForm({ ...form, yearLevel: event.target.value })} /><input value={form.term} onChange={event => setForm({ ...form, term: event.target.value })} /></div><button className="login-submit" disabled={busy}>Add curriculum subject</button></form></article><article className="panel admin-directory"><h3>Official requirements</h3>{!records.length ? <div className="admin-empty">Add requirements verified by the academic department.</div> : records.map(item => <div className="teacher-advisory-item" key={item.curriculumId}><div><strong>{item.major} · {item.courseCode}</strong><span>{item.subject} · {item.units} units · Year {item.yearLevel}, {item.term}</span></div><button className="admin-action-button danger" onClick={async () => { if (await act(`/api/admin/curriculum/${item.curriculumId}`, 'DELETE')) setNotice('Curriculum requirement removed.') }}>Delete</button></div>)}</article></>}
    {active === 'Student Ledger Admin' && <><article className="panel admin-form-panel"><form className="admin-form" onSubmit={async event => { event.preventDefault(); const result = await act('/api/admin/ledger', 'POST', { ...finance, amount: Number(finance.amount) }); if (result) { setFinance(current => ({ ...current, amount: '', detail: '', reference: '' })); setNotice('Ledger entry posted.') } }}><label>Student</label><select required value={finance.studentId} onChange={event => setFinance({ ...finance, studentId: event.target.value })}><option value="">Select student</option>{students.map(item => <option key={item.studentId} value={item.studentId}>{item.name} · {item.studentId}</option>)}</select><label>Entry type</label><select value={finance.type} onChange={event => setFinance({ ...finance, type: event.target.value })}><option>Charge</option><option>Payment</option></select><label>Amount (PHP)</label><input required type="number" min="0.01" step="0.01" value={finance.amount} onChange={event => setFinance({ ...finance, amount: event.target.value })} /><label>Academic term</label><input required value={finance.term} onChange={event => setFinance({ ...finance, term: event.target.value })} /><label>Entry details</label><input required value={finance.detail} onChange={event => setFinance({ ...finance, detail: event.target.value })} /><label>Cashier receipt reference (required for payment)</label><input required={finance.type === 'Payment'} value={finance.reference} onChange={event => setFinance({ ...finance, reference: event.target.value })} /><button className="login-submit" disabled={busy}>Post ledger entry</button></form></article><p className="feature-note">This records cashier-verified charges and payments. It does not collect or process money.</p></>}
    {active === 'Campus Events' && <><article className="panel admin-form-panel"><form className="admin-form" onSubmit={async event => { event.preventDefault(); const result = await act('/api/admin/events', 'POST', eventForm); if (result) { setEventForm({ title: '', date: '', location: '', description: '' }); setNotice('Campus event published.') } }}><label>Event title</label><input required value={eventForm.title} onChange={event => setEventForm({ ...eventForm, title: event.target.value })} /><label>Date</label><input required type="date" value={eventForm.date} onChange={event => setEventForm({ ...eventForm, date: event.target.value })} /><label>Location</label><input value={eventForm.location} onChange={event => setEventForm({ ...eventForm, location: event.target.value })} /><label>Description</label><textarea value={eventForm.description} onChange={event => setEventForm({ ...eventForm, description: event.target.value })} /><button className="login-submit" disabled={busy}>Publish event</button></form></article><article className="panel admin-directory">{records.map(item => <div className="teacher-advisory-item" key={item.eventId}><div><strong>{item.title}</strong><span>{item.date} · {item.location}</span><p>{item.description}</p></div><button className="admin-action-button danger" onClick={async () => { if (await act(`/api/admin/events/${item.eventId}`, 'DELETE')) setNotice('Event deleted.') }}>Delete</button></div>)}</article></>}
  </section>
}
function TeacherAdvisories({ teacher }) {
  const [advisories, setAdvisories] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const loadAdvisories = () => {
    setLoading(true)
    fetch('/api/teacher/advisories', { credentials: 'include' })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load advisories.'); setAdvisories(result.advisories) })
      .catch(loadError => setError(loadError.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { loadAdvisories() }, [])
  const publishAdvisory = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/teacher/advisories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ title, body }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not publish the advisory.')
      setTitle('')
      setBody('')
      setNotice(`Advisory published for ${teacher.major} students.`)
      await loadAdvisories()
    } catch (saveError) { setError(saveError.message) }
    finally { setSaving(false) }
  }
  return <section className="admin-students-view teacher-dashboard">
    <div className="admin-intro"><div><span className="section-kicker">TEACHER PORTAL · COMMUNICATIONS</span><h2>Major advisories</h2><p>Post updates for students in your assigned {teacher.major} major.</p></div><span className="admin-count"><BellRing size={16} /> {advisories.length} posts</span></div>
    <article className="panel teacher-advisory-composer"><div className="admin-panel-title"><span className="admin-panel-icon"><BellRing size={17} /></span><div><h3>Publish an advisory</h3><p>Your post is shared with student accounts in {teacher.major}.</p></div></div><form className="admin-form" onSubmit={publishAdvisory}><label htmlFor="advisory-title">Title</label><input id="advisory-title" required minLength={5} maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="Short announcement title" /><label htmlFor="advisory-body">Message</label><textarea id="advisory-body" required minLength={10} maxLength={1500} value={body} onChange={event => setBody(event.target.value)} placeholder="Write an update for your major students..." />{error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="password-saved" role="status">{notice}</div>}<button className="login-submit" disabled={saving}>{saving ? 'Publishing...' : 'Publish advisory'} {!saving && <ArrowRight size={15} />}</button></form></article>
    <article className="panel admin-directory teacher-grade-records"><div className="admin-directory-heading"><div><h3>Recent advisories</h3><p>Most recent posts for your assigned major</p></div><button className="admin-refresh" onClick={loadAdvisories} aria-label="Refresh advisories"><Sparkles size={15} /></button></div>{error && !notice ? <div className="admin-error" role="alert">{error}</div> : loading ? <div className="admin-empty">Loading advisories...</div> : advisories.length === 0 ? <div className="admin-empty"><BellRing size={22} /><strong>No advisories yet</strong><span>Published updates will also appear in student Notifications.</span></div> : <div className="teacher-advisory-list">{advisories.map((item, index) => <article className="teacher-advisory-item" key={`${item.createdAt}-${index}`}><div><strong>{item.title}</strong><span>{item.teacherName} · {new Date(item.createdAt).toLocaleString()}</span></div><p>{item.body}</p></article>)}</div>}</article>
    <p className="teacher-feature-note">Post course and major-related updates only. Do not include sensitive student information in an advisory.</p>
  </section>
}

function App() {
  const [student, setStudent] = useState(null)
  const [homeAdvisories, setHomeAdvisories] = useState([])
  const [homeEvents, setHomeEvents] = useState([])
  const [authReady, setAuthReady] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [idInput, setIdInput] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [active, setActive] = useState('Overview')
  const [selectedMajor, setSelectedMajor] = useState('English')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('eduportal-theme') || 'light')
  const studentId = student?.studentId || ''
  useEffect(() => {
    if (student?.role !== 'student') { setHomeAdvisories([]); setHomeEvents([]); return }
    Promise.all(['/api/student/advisories', '/api/student/events'].map(url => fetch(url, { credentials: 'include' }).then(response => response.ok ? response.json() : {})))
      .then(([advisoryData, eventData]) => { setHomeAdvisories(advisoryData.advisories || []); setHomeEvents(eventData.events || []) }).catch(() => {})
  }, [student?.studentId, student?.role])
  const studentName = student?.name || ''
  const studentInitials = studentName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || studentId.slice(-2)
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase()
  const navItems = student?.role === 'teacher' ? [
    { title: 'TEACHING', links: [{ name: 'Teacher Dashboard', icon: LayoutDashboard }, { name: 'My Schedule', icon: CalendarRange }, { name: 'Attendance', icon: Clock3 }, { name: 'Gradebook', icon: BookMarked }, { name: 'Major Advisories', icon: BellRing }, { name: 'Account Settings', icon: Settings2 }] },
  ] : [
    { title: 'MENU', links: [{ name: 'Overview', icon: LayoutDashboard }, { name: 'Notifications', icon: BellRing }, { name: 'Account Settings', icon: Settings2 }] },
    { title: 'ACADEMICS', links: [{ name: 'Class Schedule', icon: CalendarRange }, { name: 'Academic Evaluation', icon: ChartNoAxesCombined }] },
    { title: 'STUDENT SERVICES', links: [{ name: 'Campus Events', icon: CalendarDays }, { name: 'Virtual Assistant', icon: BotIcon }, { name: 'Community & Services', icon: HeartPulse }, { name: 'BSED Majors', icon: GraduationCap }] },
    ...(student?.role === 'admin' ? [{ title: 'ADMINISTRATION', links: [{ name: 'Students', icon: ShieldCheck }, { name: 'Teacher Accounts', icon: GraduationCap }, { name: 'Class Schedules', icon: CalendarRange }, { name: 'Curriculum Catalog', icon: ChartNoAxesCombined }, { name: 'Campus Events', icon: CalendarDays }] }] : []),
  ]
  const selectNav = (name) => { setActive(name); setMobileNav(false) }
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async response => { if (response.ok) { const result = await response.json(); setStudent(result.student); if (result.student.role === 'admin') setActive('Students'); else if (result.student.role === 'teacher') setActive('Teacher Dashboard') } })
      .catch(() => {})
      .finally(() => setAuthReady(true))
  }, [])

  const signIn = async (event) => {
    event.preventDefault()
    if (!/^\d{8}$/.test(idInput) && !/^[a-zA-Z][a-zA-Z0-9._-]{2,31}$/.test(idInput)) { setLoginError('Enter an 8-digit Student ID or a valid staff username.'); return }
    if (!password.trim()) { setLoginError('Enter your password to continue.'); return }
    setLoginError('')
    setSigningIn(true)
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ login: idInput, password }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not sign in.')
      setStudent(result.student)
      if (result.student.role === 'admin') setActive('Students')
      else if (result.student.role === 'teacher') setActive('Teacher Dashboard')
      setPassword('')
    } catch (error) {
      setLoginError(error.message === 'Failed to fetch' ? 'The account service is unavailable. Start the API and try again.' : error.message)
    } finally {
      setSigningIn(false)
    }
  }

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    setStudent(null)
    setPassword('')
    setIdInput('')
  }

  if (!authReady) return <div className={`app-shell login-shell ${theme === 'dark' ? 'theme-dark' : ''}`}><main className="login-page"><div className="login-loading">Checking your student account...</div></main></div>

  if (!studentId) return (
    <div className={`app-shell login-shell ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <main className="login-page">
        <div className="login-art" aria-hidden="true" />
        <div className="login-top"><div className="login-school-brand"><img src="/chcc-institutional-logo.jpg" alt="Concepcion Holy Cross College Inc. seal" /><span><strong>CONCEPCION HOLY CROSS COLLEGE INC.</strong><small>School of Education</small></span></div><button className="icon-button theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'} onClick={() => { const nextTheme = theme === 'dark' ? 'light' : 'dark'; setTheme(nextTheme); localStorage.setItem('eduportal-theme', nextTheme) }}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button></div>
        <section className="login-card"><div className="login-emblem"><img src="/education-council-logo.jpg" alt="Concepcion Holy Cross College Education Student Council seal" /></div><span className="section-kicker">CONCEPCION HOLY CROSS COLLEGE INC. · SCHOOL OF EDUCATION</span><h1>Welcome back</h1><p className="login-intro">Sign in to your BSED student portal and pick up where you left off.</p>
          <form className="login-form" onSubmit={signIn} noValidate><label htmlFor="student-id">Student ID or staff username</label><div className="login-input-wrap"><GraduationCap size={17} /><input id="student-id" autoComplete="username" placeholder="8-digit ID or staff username" value={idInput} onChange={event => { setIdInput(event.target.value.trim().slice(0, 32)); setLoginError('') }} /></div><small className="field-hint">Students use an 8-digit ID. Teachers and admins use their username.</small><label htmlFor="student-password">Password</label><div className="login-input-wrap"><LockKeyhole size={16} /><input id="student-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={event => { setPassword(event.target.value); setLoginError('') }} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{loginError && <div className="login-error" role="alert">{loginError}</div>}<button className="login-submit" type="submit" disabled={signingIn}>{signingIn ? 'Signing in...' : 'Sign in'} {!signingIn && <ArrowRight size={16} />}</button></form>
          <div className="login-demo"><span className="demo-info">i</span><span>Use the credentials provided by your school. Contact the student help desk if your account is not active.</span></div>
        </section><footer className="login-footer">© 2026 Concepcion Holy Cross College Inc. <span>·</span> Made for future educators <span className="footer-heart">♥</span></footer>
      </main>
    </div>
  )

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><img src="/education-council-logo.jpg" alt="" /></div><span>edu<span className="brand-light">portal</span></span><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={19} /></button></div>
        <div className="school-pill"><img className="school-seal" src="/chcc-institutional-logo.jpg" alt="" /><span><strong>Concepcion Holy Cross College Inc.</strong><small>School of Education</small></span><ChevronDown size={15} /></div>
        <div className="student-card"><div className="avatar avatar-student">{student.photoUrl ? <img src={student.photoUrl} alt="" /> : studentInitials}</div><div><strong>{studentName}</strong><small>{student.role === 'teacher' ? `${student.major} Teacher` : student.role === 'admin' ? 'Administrator' : `BSED · ${student.major} Major`}</small></div><button className="icon-button" aria-label="Student options"><MoreHorizontal size={18} /></button></div>
        <nav className="side-nav">{navItems.map(group => <div className="nav-group" key={group.title}><p className="nav-label">{group.title}</p>{group.links.map(({ name, icon: Icon }) => <button key={name} onClick={() => selectNav(name)} className={`nav-link ${active === name ? 'nav-active' : ''}`}><Icon size={18} strokeWidth={1.8} /><span>{name}</span>{name === 'Assignments' && <span className="nav-count">3</span>}</button>)}</div>)}</nav>
        <div className="sidebar-bottom"><button className="nav-link settings-link" onClick={signOut}><LogOut size={18} /><span>Sign out</span></button><div className="sidebar-footer">© 2026 Concepcion Holy Cross College Inc.</div></div>
      </aside>
      {mobileNav && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}

      <main className="main-area">
        <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={21} /></button><div className="breadcrumb">Student Portal <ChevronRight size={14} /> <strong>{active}</strong></div><div className="topbar-actions"><label className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search anything..." /><kbd>⌘ K</kbd></label><button className="icon-button theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'} onClick={() => { const nextTheme = theme === 'dark' ? 'light' : 'dark'; setTheme(nextTheme); localStorage.setItem('eduportal-theme', nextTheme) }}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice('You’re all caught up!')}><Bell size={19} /><i /></button><div className="avatar avatar-top">{student.photoUrl ? <img src={student.photoUrl} alt="" /> : studentInitials}</div></div></header>

        <div className="page-content">
          {active === 'Overview' && <section className="welcome-row"><div><div className="eyebrow"><span className="live-dot" /> {todayLabel}</div><h1>Welcome, {studentName} <span className="wave">✳</span></h1><p>Ready to inspire the next generation? Here’s your day at a glance.</p></div><span className="term-select">Your academic information</span></section>}

          {active === 'Teacher Dashboard' && student.role === 'teacher' ? <TeacherDashboard teacher={student} /> : active === 'Attendance' && student.role === 'teacher' ? <TeacherAttendance /> : active === 'Gradebook' && student.role === 'teacher' ? <TeacherGradebook teacher={student} /> : active === 'Major Advisories' && student.role === 'teacher' ? <TeacherAdvisories teacher={student} /> : active === 'Teacher Accounts' && student.role === 'admin' ? <TeacherAccounts setNotice={setNotice} /> : active === 'Students' && student.role === 'admin' ? <AdminStudents setNotice={setNotice} /> : active === 'Class Schedules' && student.role === 'admin' ? <AdminSchedules setNotice={setNotice} /> : ['Grade Approvals', 'Enrollment Review', 'Curriculum Catalog', 'Student Ledger Admin', 'Campus Events'].includes(active) && student.role === 'admin' ? <AdminWorkflow active={active} setNotice={setNotice} /> : active === 'Overview' ? <>
          <DashboardDetails student={student} />
<section className="content-grid"><div className="left-column"><article className="panel announcements-panel"><div className="panel-heading"><div><span className="section-kicker">MAJOR ADVISORIES</span><h2>Latest announcements</h2></div><button className="subtle-link" onClick={() => selectNav('Notifications')}>View all <ArrowRight size={14} /></button></div><div className="announcement-list">{homeAdvisories.slice(0, 4).map((post, index) => <div className="announcement" key={`${post.createdAt}-${index}`}><div className="avatar avatar-violet">{post.teacherName?.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'T'}</div><div className="announcement-body"><div className="announcement-meta"><strong>{post.teacherName}</strong><span>·</span><span>{new Date(post.createdAt).toLocaleDateString()}</span></div><h3>{post.title}</h3><p>{post.body}</p></div></div>)}{homeAdvisories.length === 0 && <p className="feature-muted">No major advisories have been posted.</p>}</div></article></div>

          <div className="right-column"><article className="panel majors-panel"><div className="panel-heading"><div><span className="section-kicker">FIND YOUR PEOPLE</span><h2>BSED majors</h2></div><button className="icon-button panel-more" aria-label="More major options"><MoreHorizontal size={18} /></button></div><p className="panel-description">Explore your department and connect with fellow future educators.</p><div className="major-list">{majors.map(major => <button key={major.code} className={`major-row ${selectedMajor === major.name ? 'major-selected' : ''}`} onClick={() => { setSelectedMajor(major.name); setNotice(`${major.name} major selected.`) }}><span className={`major-icon major-${major.color}`}>{major.icon}</span><span className="major-copy"><strong>{major.name}</strong><small>{major.students} students</small></span><ArrowRight size={15} className="major-arrow" /></button>)}</div><button className="all-majors-button" onClick={() => selectNav('BSED Majors')}>Explore all majors <ArrowRight size={15} /></button></article>

          <article className="panel quick-panel"><div className="panel-heading"><div><span className="section-kicker">CAMPUS CALENDAR</span><h2>Upcoming events</h2></div><CalendarDays size={17} className="quick-calendar" /></div><div className="event-list">{homeEvents.slice(0, 4).map(event => <div className="event-row" key={`${event.date}-${event.title}`}><div className="event-date"><strong>{new Date(`${event.date}T00:00:00`).getDate()}</strong><span>{new Date(`${event.date}T00:00:00`).toLocaleString('en', { month: 'short' }).toUpperCase()}</span></div><div className="event-copy"><strong>{event.title}</strong><small>{event.date} · {event.location}</small></div></div>)}{homeEvents.length === 0 && <p className="feature-muted">No upcoming events posted.</p>}</div><button className="text-link events-link" onClick={() => selectNav('Campus Events')}>See all events <ArrowRight size={15} /></button></article></div></section>

          <footer className="page-footer"><span>Made for future educators <span className="footer-heart">♥</span></span><span>Need help? <button onClick={() => setNotice('Contact your school administrator for support.')}>Contact support</button></span></footer>
          </> : <PortalPage active={active} student={student} onNotice={setNotice} />}
        </div>
      </main>
      {search && <div className="search-hint"><Sparkles size={15} /><span>Searching portal for “{search}”</span><button onClick={() => setSearch('')}>Clear</button></div>}
      {notice && <div className="toast"><span className="toast-check"><Check size={14} /></span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  )
}

export default App
