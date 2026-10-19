import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownToLine, ArrowRight, BellRing, BookOpen, CalendarDays, Check, ChevronDown,
  Clock3, CreditCard, Download, FileText,
  Printer, Receipt, Search, ShieldCheck,
} from 'lucide-react'

const subjects = [
  { code: 'EDUC 203', name: 'The Teacher and the Community', units: 3, day: 'Monday', time: '8:00–9:30 AM', room: 'Room 304', status: 'Passed', grade: '1.50' },
  { code: 'EDUC 206', name: 'Assessment of Learning 2', units: 3, day: 'Monday', time: '10:30 AM–12:00 PM', room: 'Room 212', status: 'Passed', grade: '1.25' },
  { code: 'ENG 305', name: 'Language and Linguistics', units: 3, day: 'Tuesday', time: '9:00–10:30 AM', room: 'Room 401', status: 'Passed', grade: '1.75' },
  { code: 'ENG 307', name: 'Teaching Literature', units: 3, day: 'Wednesday', time: '1:00–2:30 PM', room: 'Room 405', status: 'Passed', grade: '1.50' },
  { code: 'EDUC 301', name: 'Teaching Internship', units: 6, day: 'Thursday', time: '8:00 AM–3:00 PM', room: 'Lab 1', status: 'In progress', grade: '—' },
  { code: 'ENG 310', name: 'Creative Writing', units: 3, day: 'Friday', time: '10:00–11:30 AM', room: 'Room 403', status: 'In progress', grade: '—' },
  { code: 'EDUC 210', name: 'Foundations of Special and Inclusive Education', units: 3, day: '—', time: '—', room: '—', status: 'Failed', grade: '5.00' },
]

const registrationHistory = [
  { term: '1st Semester, AY 2026–2027', id: 'REG-26-091824', date: 'September 18, 2026', units: 21, status: 'Registered' },
  { term: '2nd Semester, AY 2025–2026', id: 'REG-26-011105', date: 'January 11, 2026', units: 23, status: 'Completed' },
  { term: '1st Semester, AY 2025–2026', id: 'REG-25-080712', date: 'August 7, 2025', units: 21, status: 'Completed' },
  { term: 'Summer, AY 2024–2025', id: 'REG-25-051503', date: 'May 15, 2025', units: 6, status: 'Completed' },
]

const terms = ['1st Semester, AY 2026–2027', '2nd Semester, AY 2025–2026', '1st Semester, AY 2025–2026']
const transactions = [
  { date: 'Sep 18, 2026', id: 'TXN-260918-1042', detail: 'Tuition and miscellaneous fees', debit: '₱28,500.00', credit: '—', status: 'Posted' },
  { date: 'Sep 18, 2026', id: 'TXN-260918-1043', detail: 'Laboratory and student services fees', debit: '₱3,500.00', credit: '—', status: 'Posted' },
  { date: 'Sep 18, 2026', id: 'PAY-260918-0831', detail: 'Online payment · Reference 0831', debit: '—', credit: '₱25,000.00', status: 'Posted' },
  { date: 'Aug 7, 2026', id: 'PAY-260807-0345', detail: 'Down payment', debit: '—', credit: '₱7,000.00', status: 'Posted' },
]

function Panel({ children, className = '' }) { return <section className={`panel feature-panel ${className}`}>{children}</section> }
function PageHeading({ eyebrow, title, description, action }) {
  return <div className="feature-heading"><div><span className="section-kicker">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>
}
function downloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
function PrintExport({ onExport }) {
  return <div className="feature-actions"><button className="feature-action" onClick={() => window.print()}><Printer size={15} /> Print</button><button className="feature-action" onClick={onExport}><Download size={15} /> Export CSV</button></div>
}
function StatusPill({ value }) { return <span className={`status-pill status-${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</span> }
function DataTable({ headings, rows }) {
  return <div className="feature-table-wrap"><table className="feature-table"><thead><tr>{headings.map(item => <th key={item}>{item}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
}

export function DashboardDetails({ student }) {
  const [data, setData] = useState({ grades: [], subjects: [], attendance: [], schedules: [], enrollments: [] })
  const [loading, setLoading] = useState(true)
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())
  useEffect(() => {
    Promise.all(['/api/student/grades', '/api/student/evaluation', '/api/student/attendance', '/api/student/schedules', '/api/student/enrollments'].map(url => fetch(url, { credentials: 'include' }).then(response => response.ok ? response.json() : {})))
      .then(([grades, subjects, attendanceRecords, schedules, enrollments]) => setData({ grades: grades.grades || [], subjects: subjects.subjects || [], attendance: attendanceRecords.records || [], schedules: schedules.schedules || [], enrollments: enrollments.enrollments || [] }))
      .finally(() => setLoading(false))
  }, [])
  const passed = data.subjects.filter(item => ['Passed', 'Credited'].includes(item.status)).length
  const failed = data.subjects.filter(item => item.status === 'Failed').length
  const attendanceRate = data.attendance.length ? Math.round(data.attendance.filter(item => ['Present', 'Late', 'Excused'].includes(item.status)).length / data.attendance.length * 100) : null
  const units = data.enrollments.find(item => item.status === 'Approved')?.units || 0
  const gwaUnits = data.grades.reduce((sum, item) => sum + Number(item.units || 0), 0)
  const gwa = gwaUnits ? (data.grades.reduce((sum, item) => sum + Number(item.grade) * Number(item.units || 0), 0) / gwaUnits).toFixed(2) : '—'
  const todayClasses = data.schedules.filter(item => item.day === todayName)
  return <>
    <div className="student-overview-grid"><Panel className="student-profile-card"><div className="student-profile-top"><div className="student-profile-avatar">{student?.name?.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'BS'}</div><div><span className="section-kicker">STUDENT PROFILE</span><h3>{student?.name || 'BSED Student'}</h3><p>{student?.studentId}</p></div></div><div className="profile-facts"><div><span>PROGRAM</span><strong>Bachelor of Secondary Education</strong></div><div><span>MAJOR</span><strong>{student?.major}</strong></div><div><span>COLLEGE YEAR</span><strong>{student?.yearLevel || 'Not assigned'}</strong></div><div><span>ORGANIZATION</span><strong>{student?.organization || 'Major'} · {student?.orgPosition || 'Member'}</strong></div><div><span>SECTION</span><strong>{student?.section || 'Not assigned'}</strong></div></div></Panel><Panel className="gwa-card"><div className="metric-label">APPROVED GWA</div><div className="gwa-number">{loading ? '…' : gwa}</div><div className="gwa-subline">Calculated from Registrar-approved grades</div><span className="gwa-subline">Your approved academic average</span></Panel></div>
    <div className="student-metrics-grid"><Panel><div className="metric-label">SUBJECTS PASSED</div><div className="small-metric green-text">{loading ? '…' : passed}</div><span className="metric-foot">From official curriculum records</span></Panel><Panel><div className="metric-label">SUBJECTS FAILED</div><div className="small-metric red-text">{loading ? '…' : failed}</div><span className="metric-foot">Review with your academic adviser</span></Panel><Panel><div className="metric-label">APPROVED LOAD</div><div className="small-metric">{loading ? '…' : units} <span>units</span></div><span className="metric-foot">Registrar-approved registration</span></Panel><Panel><div className="metric-label">ATTENDANCE RATE</div><div className="small-metric">{loading ? '…' : attendanceRate === null ? '—' : `${attendanceRate}%`}</div><span className="metric-foot">Based on teacher-submitted records</span></Panel></div>
    <div className="dashboard-lower-grid dashboard-classes-only"><Panel><PageHeading eyebrow={`TODAY · ${todayName.toUpperCase()}`} title="Your classes today" description="From your assigned official schedule." />{loading ? <div className="feature-empty">Loading schedule...</div> : todayClasses.length ? todayClasses.map(item => <div className="today-class" key={item.scheduleId}><time>{item.time}</time><div><strong>{item.subject}</strong><span>{item.courseCode} · {item.room}</span></div></div>) : <div className="feature-empty">No classes are listed for today.</div>}</Panel></div>
  </>
}
function ClassSchedulePage({ student }) {
  const [schedules, setSchedules] = useState([])
  const [term, setTerm] = useState('')
  const [day, setDay] = useState('All days')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const endpoint = student?.role === 'teacher' ? '/api/teacher/schedules' : '/api/student/schedules'
    fetch(endpoint, { credentials: 'include' })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load class schedules.'); setSchedules(result.schedules) })
      .catch(loadError => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [student?.role])
  const availableTerms = [...new Set(schedules.map(item => item.term))]
  const selectedTerm = availableTerms.includes(term) ? term : availableTerms[0] || ''
  const rows = schedules.filter(item => item.term === selectedTerm && (day === 'All days' || item.day === day))
  const filename = student?.role === 'teacher' ? 'my-teaching-schedule.csv' : 'class-schedule.csv'
  return <><PageHeading eyebrow={student?.role === 'teacher' ? 'TEACHING · ASSIGNED CLASSES' : 'ACADEMICS · OFFICIAL SCHEDULE'} title={student?.role === 'teacher' ? 'My Schedule' : 'Class Schedule'} description={student?.role === 'teacher' ? 'Classes assigned to your teacher account.' : 'Official classes assigned to your BSED major.'} action={<PrintExport onExport={() => downloadCsv(filename, [['Term', 'Course code', 'Subject', 'Major', 'Section', 'Teacher', 'Day', 'Time', 'Room', 'Units'], ...rows.map(item => [item.term, item.courseCode, item.subject, item.major, item.section, item.teacherName, item.day, item.time, item.room, item.units])])} />} />
    {loading ? <Panel><div className="feature-empty">Loading class schedules...</div></Panel> : error ? <div className="admin-error" role="alert">{error}</div> : schedules.length === 0 ? <Panel><div className="feature-empty"><CalendarDays size={22} /><strong>No class schedules have been assigned yet</strong><span>Ask the administrator or Registrar when the official schedule is available.</span></div></Panel> : <>
      <Panel><div className="table-toolbar"><label>Academic term <select aria-label="Academic term" value={selectedTerm} onChange={event => setTerm(event.target.value)}>{availableTerms.map(value => <option key={value}>{value}</option>)}</select></label><label>Day <select value={day} onChange={event => setDay(event.target.value)}>{['All days', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(value => <option key={value}>{value}</option>)}</select></label></div><DataTable headings={['DAY', 'TIME', 'COURSE', 'SECTION', 'TEACHER', 'ROOM', 'UNITS']} rows={rows.map(item => [item.day, item.time, <><strong>{item.courseCode} · {item.subject}</strong><small className="table-subline">{item.term}</small></>, item.section || '—', item.teacherName || 'Unassigned', item.room, item.units])} /></Panel>
      {rows.length === 0 && <div className="feature-empty">No classes match the selected day.</div>}
    </>}
  </>
}

function EnrolledSubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { fetch('/api/student/enrolled-subjects', { credentials: 'include' }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load enrolled subjects.'); setSubjects(result.subjects) }).catch(loadError => setError(loadError.message)).finally(() => setLoading(false)) }, [])
  return <><PageHeading eyebrow="ACADEMICS · APPROVED ENROLLMENT" title="Enrolled Subjects" description="Classes approved for your student account by the Registrar." action={<PrintExport onExport={() => downloadCsv('enrolled-subjects.csv', [['Term', 'Course code', 'Subject', 'Section', 'Units'], ...subjects.map(item => [item.term, item.courseCode, item.subject, item.section, item.units])])} />} />{loading ? <Panel><div className="feature-empty">Loading approved subjects...</div></Panel> : error ? <div className="admin-error" role="alert">{error}</div> : subjects.length === 0 ? <Panel><div className="feature-empty"><BookOpen size={22} /><strong>No subjects have been approved yet</strong><span>Submit a registration request and check Enrollment History for the Registrar decision.</span></div></Panel> : <Panel><DataTable headings={['COURSE', 'TERM', 'SECTION', 'UNITS']} rows={subjects.map(item => [<><strong>{item.courseCode} · {item.subject}</strong></>, item.term, item.section || '—', item.units])} /></Panel>}</>
}
function EnrollmentHistoryPage() {
  return <><PageHeading eyebrow="ACADEMICS · REGISTRAR RECORDS" title="Enrollment History" description="Previous and current registration records for your student account." action={<PrintExport onExport={() => downloadCsv('enrollment-history.csv', [['Term', 'Registration ID', 'Date', 'Units', 'Status'], ...registrationHistory.map(item => [item.term, item.id, item.date, item.units, item.status])])} />} /><Panel><DataTable headings={['ACADEMIC TERM', 'REGISTRATION ID', 'REGISTRATION DATE', 'UNITS', 'STATUS']} rows={registrationHistory.map(item => [<strong>{item.term}</strong>, item.id, item.date, item.units, <StatusPill value={item.status} />])} /></Panel><div className="feature-note"><ShieldCheck size={16} /> Sample enrollment history for preview. Official registration records must come from the Registrar.</div></>
}

function GradesPage() {
  const [grades, setGrades] = useState([])
  const [term, setTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    fetch('/api/student/grades', { credentials: 'include' })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load your grades.'); setGrades(result.grades) })
      .catch(loadError => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [])
  const termsWithGrades = [...new Set(grades.map(item => item.term))]
  const selectedTerm = termsWithGrades.includes(term) ? term : termsWithGrades[0] || ''
  const rows = grades.filter(item => item.term === selectedTerm)
  const weightedUnits = rows.reduce((total, item) => total + item.units, 0)
  const gwa = weightedUnits ? (rows.reduce((total, item) => total + Number(item.grade) * item.units, 0) / weightedUnits).toFixed(2) : '—'
  return <><PageHeading eyebrow="ACADEMICS · SAVED RECORDS" title="Report of Grades" description="Review final grades recorded for your student account." action={<PrintExport onExport={() => downloadCsv('report-of-grades.csv', [['Term', selectedTerm], ['Course code', 'Subject', 'Units', 'Grade', 'Status'], ...rows.map(item => [item.courseCode, item.subject, item.units, item.grade, item.status])])} />} />
    {loading ? <Panel><div className="feature-empty">Loading your grades...</div></Panel> : error ? <div className="admin-error" role="alert">{error}</div> : grades.length === 0 ? <Panel><div className="feature-empty"><BookOpen size={22} /><strong>No grades have been approved yet</strong><span>New grade entries appear after Registrar approval.</span></div></Panel> : <>
      <div className="term-picker"><CalendarDays size={16} /><select aria-label="Academic term" value={selectedTerm} onChange={event => setTerm(event.target.value)}>{termsWithGrades.map(value => <option key={value}>{value}</option>)}</select><span>Term GWA <strong>{gwa}</strong></span></div>
      <Panel><DataTable headings={['COURSE CODE', 'SUBJECT', 'UNITS', 'FINAL GRADE', 'RESULT']} rows={rows.map(item => [item.courseCode, item.subject, item.units, item.grade, <StatusPill value={item.status} />])} /></Panel>
      <p className="feature-note"><FileText size={15} /> These are portal records entered by your teacher. Contact the Registrar for an official certified report.</p>
    </>}
  </>
}
function EvaluationPage() {
  const semesterGroups = [
    { term: '1st Year · 1st Semester', items: [['EDUC 101', 'The Child and Adolescent Learner', 'Passed'], ['GE 101', 'Understanding the Self', 'Passed'], ['ENG 101', 'Introduction to Language Study', 'Passed'], ['GE 102', 'Purposive Communication', 'Failed']] },
    { term: '1st Year · 2nd Semester', items: [['EDUC 102', 'The Teaching Profession', 'Passed'], ['ENG 102', 'Survey of English Literature', 'Passed'], ['GE 103', 'Mathematics in the Modern World', 'Credited']] },
    { term: '2nd Year · 1st Semester', items: [['EDUC 203', 'The Teacher and the Community', 'Passed'], ['ENG 205', 'Language and Linguistics', 'Passed'], ['GE 204', 'Ethics', 'Incomplete']] },
    { term: '2nd Year · 2nd Semester', items: [['EDUC 206', 'Assessment of Learning 2', 'Passed'], ['ENG 207', 'Teaching Literature', 'Passed'], ['GE 205', 'The Contemporary World', 'Credited']] },
    { term: '3rd Year · 1st Semester', items: [['EDUC 301', 'Teaching Internship', 'In progress'], ['ENG 307', 'Creative Writing', 'In progress'], ['ENG 310', 'Inclusive Language Assessment', 'Failed']] },
  ]
  return <><PageHeading eyebrow="ACADEMICS · CURRICULUM TRACKER" title="Academic Evaluation" description="Track completed, failed, credited, and incomplete curriculum requirements." /><Panel className="evaluation-progress"><div><span className="metric-label">CURRICULUM COMPLETION</span><strong>36 <small>of 54 subjects</small></strong><span className="metric-foot">66.7% complete · 18 subjects remaining</span></div><div className="evaluation-track"><i style={{ width: '66.7%' }} /></div><div className="evaluation-key"><StatusPill value="Passed" /><StatusPill value="Failed" /><StatusPill value="Credited" /><StatusPill value="Incomplete" /></div></Panel><div className="evaluation-terms">{semesterGroups.map(group => <Panel key={group.term}><div className="evaluation-term-heading"><h3>{group.term}</h3><span>{group.items.filter(item => item[2] === 'Passed' || item[2] === 'Credited').length}/{group.items.length} completed</span></div><DataTable headings={['SUBJECT', 'TITLE', 'STATUS']} rows={group.items.map(([code, name, status]) => [code, name, <StatusPill value={status} />])} /></Panel>)}</div><div className="feature-note"><ShieldCheck size={16} /> Sample curriculum preview; confirm requirements and progress against your official evaluation with your academic adviser.</div></>
}

function MajorsPage({ selectedMajor, majorCounts }) {
  const [query, setQuery] = useState('')
  const majorDetails = [
    ['English', 'ENG', 'violet', 'Aa', 'Language, literature, and communication', 'Language and Linguistics · Teaching Literature · Creative Writing'],
    ['Filipino', 'FIL', 'rose', '文', 'Wika, panitikan, at kulturang Pilipino', 'Istruktura ng Wika · Panitikang Pilipino · Pagtuturo ng Filipino'],
    ['Math', 'MTH', 'blue', 'π', 'Mathematical reasoning and problem solving', 'Algebra · Geometry · Teaching Mathematics'],
    ['Social Science', 'SS', 'amber', '◎', 'History, society, and civic understanding', 'Philippine History · Geography · Economics'],
    ['BEED', 'BEED', 'green', 'B', 'Elementary education and child-centered teaching', 'Child Development · General Education · Teaching Practice'],
  ]
  const filtered = majorDetails.filter(item => item.join(' ').toLowerCase().includes(query.toLowerCase()))
  return <><PageHeading eyebrow="SCHOOL OF EDUCATION" title="Explore Programs" description="Explore the education programs and their focus areas." /><div className="explorer-search"><Search size={16} /><input aria-label="Search programs" placeholder="Search programs and subject areas..." value={query} onChange={event => setQuery(event.target.value)} /></div><div className="major-explorer-grid">{filtered.map(([name, code, color, icon, focus, subjectsList]) => <Panel className={`major-explorer-card ${selectedMajor === name ? 'major-explorer-selected' : ''}`} key={code}><div className="major-explorer-card-top"><span className={`major-icon major-${color}`}>{icon}</span><span>{code}</span></div><h3>{name}</h3><p>{focus}</p><strong>Subject areas</strong><small>{subjectsList}</small><span className="major-student-total">{majorCounts.loading ? 'Loading student count…' : majorCounts.error ? 'Student count unavailable' : `${majorCounts.counts[name] ?? 0} student portal accounts`}</span></Panel>)}</div><div className="feature-note"><ShieldCheck size={16} /> Counts use student accounts currently assigned to each major. Program summaries and subject areas are general descriptions.</div>{filtered.length === 0 && <div className="feature-empty">No programs match “{query}”.</div>}</>
}

function LedgerPage({ onNotice }) {
  return <><PageHeading eyebrow="STUDENT FINANCE · ACCOUNT SUMMARY" title="Student Ledger" description="Review posted charges, payments, and your current account balance." action={<button className="feature-action" onClick={() => { window.print(); onNotice('Choose Save as PDF to keep a copy of your payment certificate.') }}><Printer size={15} /> Payment certificate</button>} /><div className="ledger-summary"><Panel><span className="metric-label">TOTAL ASSESSED</span><strong>₱28,500.00</strong><small>1st Semester, AY 2026–2027</small></Panel><Panel><span className="metric-label">PAYMENTS RECEIVED</span><strong className="green-text">₱32,000.00</strong><small>Posted to your account</small></Panel><Panel><span className="metric-label">CURRENT BALANCE</span><strong>₱0.00</strong><small className="green-text">Account is up to date</small></Panel></div><Panel><div className="panel-title-row"><div><h3>Transaction records</h3><p>Ledger reference and posting date</p></div><PrintExport onExport={() => downloadCsv('student-ledger.csv', [['Date', 'Reference', 'Details', 'Debit', 'Credit', 'Status'], ...transactions.map(item => [item.date, item.id, item.detail, item.debit, item.credit, item.status])])} /></div><DataTable headings={['DATE', 'REFERENCE', 'DETAILS', 'DEBIT', 'CREDIT', 'STATUS']} rows={transactions.map(item => [item.date, item.id, item.detail, item.debit, item.credit, <StatusPill value={item.status} />])} /></Panel><div className="feature-note"><Receipt size={16} /> Sample finance data. Official balances and certificates must come from the school cashier.</div></>
}

function RegistrationPage({ onNotice }) {
  const [selected, setSelected] = useState(['EDUC 301', 'ENG 310'])
  const [submitted, setSubmitted] = useState(false)
  const options = [{ code: 'EDUC 301', name: 'Teaching Internship', units: 6 }, { code: 'ENG 310', name: 'Creative Writing', units: 3 }, { code: 'EDUC 308', name: 'Technology for Teaching and Learning', units: 3 }, { code: 'ENG 312', name: 'Language Assessment', units: 3 }]
  const totalUnits = options.filter(item => selected.includes(item.code)).reduce((total, item) => total + item.units, 0)
  const toggle = code => { setSubmitted(false); setSelected(value => value.includes(code) ? value.filter(item => item !== code) : [...value, code]) }
  return <><PageHeading eyebrow="REGISTRAR · SUBJECT SELECTION" title="Online Registration" description="Choose subjects for the upcoming term and review your draft load." /><div className="feature-note"><ShieldCheck size={16} /> Preview registration only. Final subject availability and submission must be confirmed by the Registrar.</div><Panel className="registration-panel"><div className="panel-title-row"><div><h3>Available subjects</h3><p>Draft term · 2nd Semester, AY 2026–2027</p></div><span className="registration-unit-count">{totalUnits} units selected</span></div><div className="registration-options">{options.map(item => <label className={`registration-option ${selected.includes(item.code) ? 'registration-selected' : ''}`} key={item.code}><input type="checkbox" checked={selected.includes(item.code)} onChange={() => toggle(item.code)} /><span><strong>{item.name}</strong><small>{item.code} · {item.units} units · Subject to section availability</small></span><Check size={16} /></label>)}</div><div className="registration-footer"><span>{selected.length} subjects selected</span><button className="login-submit" disabled={!selected.length} onClick={() => { setSubmitted(true); onNotice('Registration draft saved. Final enrollment is not submitted to the Registrar.') }}>{submitted ? 'Draft saved' : 'Save registration draft'} <ArrowRight size={15} /></button></div></Panel></>
}

function PaymentPage({ onNotice }) {
  const [method, setMethod] = useState('Bank transfer')
  const [reference, setReference] = useState('')
  const [paid, setPaid] = useState(false)
  return <><PageHeading eyebrow="STUDENT FINANCE · PAYMENT PREVIEW" title="Online Payment" description="Review the demo checkout flow for your student account." /><div className="payment-warning"><ShieldCheck size={17} /><span><strong>Demo only:</strong> no money will be collected. A real payment requires the school's payment provider and cashier reconciliation.</span></div><div className="payment-layout"><Panel><h3>Amount due</h3><div className="payment-amount">₱0.00</div><p className="feature-muted">Sample ledger shows no outstanding balance.</p><div className="payment-methods"><strong>Payment method preview</strong>{['Bank transfer', 'E-wallet', 'Over-the-counter'].map(value => <label key={value}><input type="radio" name="payment-method" value={value} checked={method === value} onChange={() => setMethod(value)} />{value}</label>)}</div><label className="reference-label" htmlFor="payment-reference">Reference number (optional demo)</label><input className="feature-text-input" id="payment-reference" placeholder="Enter a sample reference" value={reference} onChange={event => setReference(event.target.value)} /><button className="login-submit" onClick={() => { setPaid(true); onNotice('Demo payment recorded locally only; no charge was made.') }}>{paid ? <><Check size={15} /> Demo submitted</> : <><CreditCard size={15} /> Preview payment</>}</button></Panel><Panel className="payment-summary"><span className="metric-label">PAYMENT SUMMARY</span><div><span>Current balance</span><strong>₱0.00</strong></div><div><span>Payment fee</span><strong>₱0.00</strong></div><div className="payment-total"><span>Total</span><strong>₱0.00</strong></div><small>Payment certification is issued by the cashier after a real transaction is confirmed.</small></Panel></div></>
}

function DatabaseAttendancePage() {
  const [records, setRecords] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/student/attendance', { credentials: 'include' }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load attendance records.'); setRecords(result.records) }).catch(loadError => setError(loadError.message)).finally(() => setLoading(false)) }, [])
  const total = records.length
  const attended = records.filter(item => ['Present', 'Late', 'Excused'].includes(item.status)).length
  return <><PageHeading eyebrow="ACADEMICS · CLASS RECORDS" title="Attendance Records" description="Attendance submitted by your assigned teachers." action={<PrintExport onExport={() => downloadCsv('attendance-records.csv', [['Date', 'Course', 'Subject', 'Status'], ...records.map(item => [item.date, item.courseCode, item.subject, item.status])])} />} />{loading ? <Panel><div className="feature-empty">Loading attendance...</div></Panel> : error ? <div className="admin-error" role="alert">{error}</div> : <><div className="ledger-summary"><Panel><span className="metric-label">CLASSES RECORDED</span><strong>{total}</strong></Panel><Panel><span className="metric-label">ATTENDANCE RATE</span><strong>{total ? `${Math.round(attended / total * 100)}%` : '—'}</strong></Panel></div>{records.length ? <Panel><DataTable headings={['DATE', 'COURSE', 'SUBJECT', 'STATUS']} rows={records.map(item => [item.date, item.courseCode, item.subject, <StatusPill value={item.status} />])} /></Panel> : <Panel><div className="feature-empty"><Clock3 size={22} /><strong>No attendance has been recorded</strong><span>Your teachers' attendance entries will appear here.</span></div></Panel>}</>}</>
}

function DatabaseEnrollmentHistoryPage() {
  const [records, setRecords] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/student/enrollments', { credentials: 'include' }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load registration history.'); setRecords(result.enrollments) }).catch(loadError => setError(loadError.message)).finally(() => setLoading(false)) }, [])
  return <><PageHeading eyebrow="ACADEMICS · REGISTRAR RECORDS" title="Enrollment History" description="Review your registration submissions and Registrar decisions." action={<PrintExport onExport={() => downloadCsv('enrollment-history.csv', [['Term', 'Submitted', 'Units', 'Status'], ...records.map(item => [item.term, new Date(item.submittedAt).toLocaleDateString(), item.units, item.status])])} />} />{loading ? <Panel><div className="feature-empty">Loading registration history...</div></Panel> : error ? <div className="admin-error" role="alert">{error}</div> : records.length ? <Panel><DataTable headings={['ACADEMIC TERM', 'SUBMITTED', 'UNITS', 'CLASSES', 'STATUS']} rows={records.map(item => [<strong>{item.term}</strong>, new Date(item.submittedAt).toLocaleDateString(), item.units, item.classes.map(classItem => classItem.courseCode).join(', '), <StatusPill value={item.status} />])} /></Panel> : <Panel><div className="feature-empty"><BookOpen size={22} /><strong>No registration submissions yet</strong><span>Choose available official classes to request enrollment.</span></div></Panel>}</>
}

function DatabaseEvaluationPage() {
  const [subjectsData, setSubjectsData] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/student/evaluation', { credentials: 'include' }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load academic evaluation.'); setSubjectsData(result.subjects) }).catch(loadError => setError(loadError.message)).finally(() => setLoading(false)) }, [])
  const completed = subjectsData.filter(item => ['Passed', 'Credited'].includes(item.status)).length
  const percent = subjectsData.length ? Math.round(completed / subjectsData.length * 100) : 0
  const termsList = [...new Set(subjectsData.map(item => `Year ${item.yearLevel} · ${item.term}`))]
  return <><PageHeading eyebrow="ACADEMICS · CURRICULUM TRACKER" title="Academic Evaluation" description="Official curriculum requirements and approved grade records for your major." />{loading ? <Panel><div className="feature-empty">Loading curriculum...</div></Panel> : error ? <div className="admin-error" role="alert">{error}</div> : !subjectsData.length ? <Panel><div className="feature-empty"><BookOpen size={22} /><strong>Curriculum requirements are not set up yet</strong><span>Ask the academic office to add verified requirements for your major.</span></div></Panel> : <><Panel className="evaluation-progress"><div><span className="metric-label">CURRICULUM COMPLETION</span><strong>{completed} <small>of {subjectsData.length} subjects</small></strong><span className="metric-foot">{percent}% complete</span></div><div className="evaluation-track"><i style={{ width: `${percent}%` }} /></div></Panel>{termsList.map(term => { const rows = subjectsData.filter(item => `Year ${item.yearLevel} · ${item.term}` === term); return <Panel key={term}><div className="evaluation-term-heading"><h3>{term}</h3><span>{rows.filter(item => ['Passed', 'Credited'].includes(item.status)).length}/{rows.length} completed</span></div><DataTable headings={['COURSE CODE', 'SUBJECT', 'UNITS', 'GRADE', 'STATUS']} rows={rows.map(item => [item.courseCode, item.subject, item.units, item.grade || '—', <StatusPill value={item.status} />])} /></Panel> })}</>}</>
}

function DatabaseLedgerPage() {
  const [data, setData] = useState({ records: [], totals: { charges: 0, payments: 0, balance: 0 } })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/student/ledger', { credentials: 'include' }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load student ledger.'); setData(result) }).catch(loadError => setError(loadError.message)).finally(() => setLoading(false)) }, [])
  const peso = amount => `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
  const rows = data.records.map(item => [new Date(item.postedAt).toLocaleDateString(), item.reference || '—', `${item.detail} · ${item.term}`, item.type === 'Charge' ? peso(item.amount) : '—', item.type === 'Payment' ? peso(item.amount) : '—', item.status])
  return <><PageHeading eyebrow="STUDENT FINANCE · POSTED ENTRIES" title="Student Ledger" description="Charges and cashier-posted payments recorded for your account." action={<PrintExport onExport={() => downloadCsv('student-ledger.csv', [['Date', 'Reference', 'Details', 'Debit', 'Credit', 'Status'], ...rows])} />} />{loading ? <Panel><div className="feature-empty">Loading ledger...</div></Panel> : error ? <div className="admin-error" role="alert">{error}</div> : <><div className="ledger-summary"><Panel><span className="metric-label">TOTAL ASSESSED</span><strong>{peso(data.totals.charges)}</strong></Panel><Panel><span className="metric-label">PAYMENTS RECEIVED</span><strong>{peso(data.totals.payments)}</strong></Panel><Panel><span className="metric-label">CURRENT BALANCE</span><strong>{peso(data.totals.balance)}</strong></Panel></div>{rows.length ? <Panel><DataTable headings={['DATE', 'REFERENCE', 'DETAILS', 'DEBIT', 'CREDIT', 'STATUS']} rows={rows} /></Panel> : <Panel><div className="feature-empty"><Receipt size={22} /><strong>No ledger entries have been posted</strong><span>Ask the school cashier to post verified charges and payments.</span></div></Panel>}</>}</>
}

function DatabaseRegistrationPage({ onNotice }) {
  const [schedules, setSchedules] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [selected, setSelected] = useState([])
  const [term, setTerm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const load = async () => {
    setLoading(true)
    try { const [scheduleResponse, enrollmentResponse] = await Promise.all([fetch('/api/student/schedules', { credentials: 'include' }), fetch('/api/student/enrollments', { credentials: 'include' })]); const [scheduleData, enrollmentData] = await Promise.all([scheduleResponse.json(), enrollmentResponse.json()]); if (!scheduleResponse.ok || !enrollmentResponse.ok) throw new Error(scheduleData.message || enrollmentData.message || 'Could not load registration options.'); setSchedules(scheduleData.schedules); setEnrollments(enrollmentData.enrollments); const termOptions = [...new Set(scheduleData.schedules.map(item => item.term))]; setTerm(current => termOptions.includes(current) ? current : termOptions[0] || ''); setSelected([]) }
    catch (loadError) { setError(loadError.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  const offerings = schedules.filter(item => item.term === term)
  const units = offerings.filter(item => selected.includes(item.scheduleId)).reduce((sum, item) => sum + item.units, 0)
  const pending = enrollments.find(item => item.term === term && ['Pending', 'Approved'].includes(item.status))
  const submit = async () => { setSaving(true); setError(''); try { const response = await fetch('/api/student/enrollments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ term, scheduleIds: selected }) }); const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not submit registration.'); setEnrollments(current => [result.enrollment, ...current]); setSelected([]); onNotice('Registration submitted for Registrar review.') } catch (submitError) { setError(submitError.message) } finally { setSaving(false) } }
  return <><PageHeading eyebrow="REGISTRAR · CLASS REQUEST" title="Online Registration" description="Select official classes and send your request to the Registrar." />{loading ? <Panel><div className="feature-empty">Loading available classes...</div></Panel> : <><div className="payment-warning"><ShieldCheck size={17} /><span>The Registrar makes the final enrollment decision. Contact the Registrar's office for request status.</span></div>{error && <div className="admin-error" role="alert">{error}</div>}{pending && <Panel>Your {term} request is <strong>{pending.status}</strong>. Contact the Registrar's office for an update.</Panel>}{!schedules.length ? <Panel><div className="feature-empty"><BookOpen size={22} /><strong>No official classes are open for registration</strong><span>Ask the administrator to add verified class schedules first.</span></div></Panel> : <Panel className="registration-panel"><div className="panel-title-row"><div><h3>Available official classes</h3><p>Select the academic term and requested classes.</p></div><label>Term <select value={term} onChange={event => { setTerm(event.target.value); setSelected([]) }}>{[...new Set(schedules.map(item => item.term))].map(value => <option key={value}>{value}</option>)}</select></label></div><div className="registration-options">{offerings.map(item => <label className={`registration-option ${selected.includes(item.scheduleId) ? 'registration-selected' : ''}`} key={item.scheduleId}><input type="checkbox" disabled={Boolean(pending)} checked={selected.includes(item.scheduleId)} onChange={() => setSelected(current => current.includes(item.scheduleId) ? current.filter(id => id !== item.scheduleId) : current.length >= 12 ? current : [...current, item.scheduleId])} /><span><strong>{item.courseCode} · {item.subject}</strong><small>{item.section || 'All sections'} · {item.units} units · {item.day} · {item.time} · {item.room}</small></span><Check size={16} /></label>)}</div><div className="registration-footer"><span>{selected.length} classes · {units} units selected</span><button className="login-submit" disabled={!selected.length || units > 24 || Boolean(pending) || saving} onClick={submit}>{saving ? 'Submitting...' : 'Submit registration request'} <ArrowRight size={15} /></button></div>{units > 24 && <div className="admin-error">Selected course load is over 24 units. Contact the Registrar for an overload review.</div>}</Panel>}</>}</>
}

function DatabaseAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/student/announcements', { credentials: 'include' }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load announcements.'); setAnnouncements(result.announcements) }).catch(loadError => setError(loadError.message)).finally(() => setLoading(false)) }, [])
  return <><PageHeading eyebrow="SCHOOL UPDATES · OFFICIAL NOTICES" title="Announcements" description="Official updates from the school administrator." />{loading ? <Panel><div className="feature-empty">Loading announcements...</div></Panel> : error ? <div className="admin-error" role="alert">{error}</div> : announcements.length ? <div className="notification-list">{announcements.map(item => <Panel key={item.announcementId}><span className="notification-date">{item.authorName || 'School Administrator'} · {new Date(item.updatedAt || item.createdAt).toLocaleString()}</span><h3>{item.title}</h3><p>{item.body}</p></Panel>)}</div> : <Panel><div className="feature-empty"><BellRing size={22} /><strong>No announcements yet</strong><span>Official school updates will appear here when they are posted.</span></div></Panel>}</>
}


function DatabasePaymentPage() {
  const [balance, setBalance] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { fetch('/api/student/ledger', { credentials: 'include' }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not load amount due.'); setBalance(result.totals.balance) }).catch(loadError => setError(loadError.message)) }, [])
  return <><PageHeading eyebrow="STUDENT FINANCE · CASHIER SERVICE" title="Online Payment" description="Check the posted balance on your student ledger." />{error && <div className="admin-error" role="alert">{error}</div>}<div className="payment-warning"><ShieldCheck size={17} /><span><strong>No payment gateway is connected.</strong> This portal cannot collect or confirm money. Pay through the school's official cashier instructions; the cashier can post verified payments to your ledger.</span></div><Panel><h3>Current ledger balance</h3><div className="payment-amount">{balance === null ? 'Loading...' : `₱${Number(balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}</div><p className="feature-muted">A successful payment must be confirmed by the cashier before it appears as a credit on your ledger.</p></Panel></>
}


function NotificationsPage() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    const endpoints = [
      ['/api/student/advisories', 'advisories'],
      ['/api/student/announcements', 'announcements'],
    ]
    Promise.all(endpoints.map(async ([url, key]) => {
      const response = await fetch(url, { credentials: 'include' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not load portal updates.')
      return result[key] || []
    }))
      .then(([advisories, announcements]) => {
        const merged = [
          ...advisories.map(item => ({ ...item, updateType: 'advisory', sortDate: item.createdAt })),
          ...announcements.map(item => ({ ...item, updateType: 'announcement', sortDate: item.updatedAt || item.createdAt })),
        ].sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
        if (!cancelled) setUpdates(merged)
      })
      .catch(loadError => { if (!cancelled) setError(loadError.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])
  return <><PageHeading eyebrow="PORTAL UPDATES" title="Notifications" description="School announcements and updates from teachers in your major." />
    {error ? <div className="admin-error" role="alert">{error}</div> : loading ? <Panel><div className="feature-empty">Loading announcements and advisories...</div></Panel> : updates.length === 0 ? <Panel><div className="feature-empty"><BellRing size={22} /><strong>No portal updates yet</strong><span>School announcements and major advisories will appear here.</span></div></Panel> : <div className="notification-list">{updates.map((item, index) => <Panel key={item.announcementId || `${item.updateType}-${item.createdAt}-${index}`}><span className="notification-marker" /><div><span className="notification-date">{item.updateType === 'announcement' ? 'SCHOOL ANNOUNCEMENT' : 'MAJOR ADVISORY'} - {new Date(item.sortDate).toLocaleString()}</span><h3>{item.title}</h3><p>{item.body}</p><span className="notification-tag">{item.updateType === 'announcement' ? item.authorName || 'School Administrator - All students' : `${item.teacherName} - ${item.major}`}</span></div></Panel>)}</div>}
  </>
}

function AccountSettingsPage({ student, onNotice }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const isStaff = ['admin', 'teacher'].includes(student?.role)
  const minimumLength = isStaff ? 12 : 10
  const updatePassword = async event => {
    event.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      const response = await fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ currentPassword, newPassword }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not update the password.')
      setCurrentPassword('')
      setNewPassword('')
      setSaved(true)
      onNotice('Password updated. Other sessions have been signed out.')
    } catch (saveError) { setError(saveError.message) }
    finally { setSaving(false) }
  }
  return <><PageHeading eyebrow="ACCOUNT SECURITY" title="Account Settings" description="Update the password for your student portal account." /><Panel className="settings-panel"><div className="admin-panel-title"><span className="admin-panel-icon"><ShieldCheck size={17} /></span><div><h3>Change password</h3><p>Signed in as {student?.name} · {student?.role === 'admin' ? 'Administrator' : student?.role === 'teacher' ? 'Teacher' : student?.studentId}</p></div></div><form className="admin-form" onSubmit={updatePassword}><label htmlFor="current-password-settings">Current password</label><input id="current-password-settings" required type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /><label htmlFor="new-password-settings">New password</label><input id="new-password-settings" required minLength={minimumLength} type="password" autoComplete="new-password" placeholder={`At least ${minimumLength} characters`} value={newPassword} onChange={event => setNewPassword(event.target.value)} />{error && <div className="admin-error" role="alert">{error}</div>}{saved && <div className="password-saved"><Check size={14} /> Password updated successfully.</div>}<button className="login-submit" disabled={saving}>{saving ? 'Updating...' : 'Update password'} {!saving && <ArrowRight size={15} />}</button></form></Panel></>
}

export default function PortalPage({ active, student, onNotice, selectedMajor, majorCounts }) {
  const pages = useMemo(() => ({
    'Class Schedule': <ClassSchedulePage student={student} />,
    'My Schedule': <ClassSchedulePage student={student} />,
    'Enrolled Subjects': <EnrolledSubjectsPage />,
    'Enrollment History': <DatabaseEnrollmentHistoryPage />,
    'Attendance Records': <DatabaseAttendancePage />,
    'Report of Grades': <GradesPage />,
    'Academic Evaluation': <DatabaseEvaluationPage />,
    Announcements: <DatabaseAnnouncementsPage />,
    'BSED Majors': <MajorsPage selectedMajor={selectedMajor} majorCounts={majorCounts} />,
    Notifications: <NotificationsPage />,
    'Account Settings': <AccountSettingsPage student={student} onNotice={onNotice} />,
  }), [active, student, onNotice, selectedMajor, majorCounts])
  return pages[active] || <DashboardDetails student={student} />
}
