import { useMemo, useState } from 'react'
import {
  ArrowDownToLine, ArrowRight, BookOpen, Bot, CalendarDays, Check, ChevronDown,
  Clock3, CreditCard, Download, FileText, HeartPulse, Library, MessageCircle,
  Printer, Receipt, Search, Send, ShieldCheck, Sparkles, Wifi,
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

const faqItems = [
  { question: 'When is enrollment?', answer: 'Enrollment dates are posted by the Registrar under Notifications. Check your student portal announcements for the current schedule.' },
  { question: 'How can I request a certificate of grades?', answer: 'Open Report of Grades and use Print / Save as PDF. For an official signed copy, contact the Registrar.' },
  { question: 'Where do I pay tuition?', answer: 'Open Student Ledger to review your balance. Online Payment here is a preview only; use the official cashier instructions to make a real payment.' },
  { question: 'How do I contact the clinic?', answer: 'Use Community & Services to see clinic hours and request a callback from the campus health desk.' },
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
  const gwaByTerm = [1.82, 1.71, 1.65, 1.58, 1.52, 1.48]
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())
  const todaySubjects = subjects.filter(item => item.day === todayName && item.status !== 'Failed')
  const max = Math.max(...gwaByTerm)
  const points = gwaByTerm.map((gwa, index) => `${30 + index * 86},${115 - ((max - gwa) / 0.5) * 75}`).join(' ')
  const subjectSegments = 'conic-gradient(#55b784 0 81.8%, #ef827f 81.8% 86.3%, #8592de 86.3% 93.1%, #f0b761 93.1% 100%)'
  return <>
    <div className="student-overview-grid"><Panel className="student-profile-card"><div className="student-profile-top"><div className="student-profile-avatar">{student?.name?.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'BS'}</div><div><span className="section-kicker">STUDENT PROFILE</span><h3>{student?.name || 'BSED Student'}</h3><p>{student?.studentId || '61212024'}</p></div><StatusPill value="Enrolled" /></div><div className="profile-facts"><div><span>PROGRAM</span><strong>Bachelor of Secondary Education</strong></div><div><span>MAJOR</span><strong>{student?.major || 'English'}</strong></div><div><span>YEAR LEVEL</span><strong>3rd Year</strong></div><div><span>ACADEMIC YEAR</span><strong>2026–2027</strong></div></div></Panel><Panel className="gwa-card"><div className="metric-label">CUMULATIVE GWA</div><div className="gwa-number">1.58 <span>Very Good</span></div><div className="gwa-subline">Across 5 completed semesters</div><div className="gwa-chart"><svg viewBox="0 0 500 145" role="img" aria-label="GWA improved from 1.82 to 1.48 over six semesters"><line x1="25" y1="115" x2="480" y2="115" /><line x1="25" y1="75" x2="480" y2="75" /><line x1="25" y1="35" x2="480" y2="35" /><polyline points={points} /><circle cx="460" cy={points.split(' ').at(-1).split(',')[1]} r="5" /><text x="25" y="138">1st Sem</text><text x="194" y="138">1st Sem</text><text x="370" y="138">1st Sem</text></svg></div><div className="gwa-legend"><span>Grade trend per semester</span><strong>Improving ↗</strong></div></Panel></div>
    <div className="student-metrics-grid"><Panel><div className="metric-label">SEMESTERS COMPLETED</div><div className="small-metric">5 <span>of 8</span></div><div className="mini-track"><i style={{ width: '62.5%' }} /></div><span className="metric-foot">On track for graduation</span></Panel><Panel><div className="metric-label">SUBJECTS PASSED</div><div className="small-metric green-text">36 <span>subjects</span></div><span className="metric-foot">Across all completed terms</span></Panel><Panel><div className="metric-label">SUBJECTS FAILED</div><div className="small-metric red-text">2 <span>subjects</span></div><span className="metric-foot">Available for retake</span></Panel><Panel><div className="metric-label">CURRENT LOAD</div><div className="small-metric">21 <span>units</span></div><span className="metric-foot">6 enrolled subjects</span></Panel></div>
    <div className="dashboard-lower-grid"><Panel><PageHeading eyebrow="ACADEMIC SNAPSHOT" title="Subject status" description="Your overall curriculum progress." /><div className="subject-status-chart"><div className="pie-chart" style={{ background: subjectSegments }}><div><strong>44</strong><span>subjects</span></div></div><div className="pie-legend"><span><i className="legend-green" />Passed <strong>36</strong></span><span><i className="legend-red" />Failed <strong>2</strong></span><span><i className="legend-blue" />Credited <strong>3</strong></span><span><i className="legend-amber" />Incomplete <strong>3</strong></span></div></div></Panel><Panel><PageHeading eyebrow={`TODAY · ${todayName.toUpperCase()}`} title="Schedule for today" /><div className="today-classes">{todaySubjects.map(item => <div className="today-class" key={item.code}><time>{item.time}</time><div><strong>{item.name}</strong><span>{item.code} · {item.room}</span></div></div>)}{todayName === 'Thursday' && <div className="today-class"><time>1:00–2:30 PM</time><div><strong>Teaching Internship</strong><span>EDUC 301 · Lab 1</span></div></div>}{todaySubjects.length === 0 && todayName !== 'Thursday' && <div className="today-empty">No classes are scheduled for today.</div>}</div></Panel></div>
  </>
}

function ClassSchedulePage() {
  const [day, setDay] = useState('All days')
  const [term, setTerm] = useState(terms[0])
  const rows = subjects.filter(item => item.status !== 'Failed' && (day === 'All days' || item.day === day))
  return <><PageHeading eyebrow="ACADEMICS · TERM SCHEDULE" title="Class Schedule" description="View the weekly timetable by academic term, then print or export it." action={<PrintExport onExport={() => downloadCsv('class-schedule.csv', [['Term', term], ['Course code', 'Subject', 'Day', 'Time', 'Room'], ...rows.map(item => [item.code, item.name, item.day, item.time, item.room])])} />} /><Panel><div className="table-toolbar"><label>Academic term <select value={term} onChange={event => setTerm(event.target.value)}>{terms.map(value => <option key={value}>{value}</option>)}</select></label><label>Day <select value={day} onChange={event => setDay(event.target.value)}>{['All days', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(value => <option key={value}>{value}</option>)}</select></label></div><DataTable headings={['DAY', 'TIME', 'SUBJECT', 'ROOM', 'UNITS']} rows={rows.map(item => [item.day, item.time, <><strong>{item.name}</strong><small className="table-subline">{item.code}</small></>, item.room, item.units])} /></Panel><div className="feature-note"><CalendarDays size={15} /> Term selection uses sample timetable data until the Registrar schedule is connected.</div></>
}

function EnrolledSubjectsPage() {
  return <><PageHeading eyebrow="ACADEMICS · 21 UNITS" title="Enrolled Subjects" description="Your registered subjects, class details, and online meeting links." /><Panel><DataTable headings={['SUBJECT', 'UNITS', 'SCHEDULE', 'ROOM', 'MS TEAMS']} rows={subjects.filter(item => item.status !== 'Failed').map(item => [<><strong>{item.name}</strong><small className="table-subline">{item.code}</small></>, item.units, `${item.day} · ${item.time}`, item.room, <a className="teams-link" href="https://teams.microsoft.com/" target="_blank" rel="noreferrer">Open Teams <ArrowRight size={13} /></a>])} /></Panel><div className="feature-note"><ShieldCheck size={16} /> Teams links are sample links; ask your instructor for the class-specific meeting URL.</div></>
}

function EnrollmentHistoryPage() {
  return <><PageHeading eyebrow="ACADEMICS · REGISTRAR RECORDS" title="Enrollment History" description="Previous and current registration records for your student account." action={<PrintExport onExport={() => downloadCsv('enrollment-history.csv', [['Term', 'Registration ID', 'Date', 'Units', 'Status'], ...registrationHistory.map(item => [item.term, item.id, item.date, item.units, item.status])])} />} /><Panel><DataTable headings={['ACADEMIC TERM', 'REGISTRATION ID', 'REGISTRATION DATE', 'UNITS', 'STATUS']} rows={registrationHistory.map(item => [<strong>{item.term}</strong>, item.id, item.date, item.units, <StatusPill value={item.status} />])} /></Panel></>
}

function GradesPage() {
  const [term, setTerm] = useState(terms[0])
  const rows = term === terms[0] ? subjects : subjects.slice(0, 4).map(item => ({ ...item, grade: item.grade === '5.00' ? '2.00' : item.grade, status: 'Passed' }))
  const gwa = term === terms[0] ? '1.58' : '1.64'
  return <><PageHeading eyebrow="ACADEMICS · OFFICIAL RECORD PREVIEW" title="Report of Grades" description="Review your grades by term, then print or export a copy." action={<PrintExport onExport={() => downloadCsv('report-of-grades.csv', [['Term', term], ['Course code', 'Subject', 'Units', 'Grade', 'Status'], ...rows.map(item => [item.code, item.name, item.units, item.grade, item.status])])} />} /><div className="term-picker"><CalendarDays size={16} /><select value={term} onChange={event => setTerm(event.target.value)}>{terms.map(value => <option key={value}>{value}</option>)}</select><span>Term GWA <strong>{gwa}</strong></span></div><Panel><DataTable headings={['COURSE CODE', 'SUBJECT', 'UNITS', 'FINAL GRADE', 'RESULT']} rows={rows.map(item => [item.code, item.name, item.units, item.grade, <StatusPill value={item.status} />])} /></Panel><p className="feature-note"><FileText size={15} /> Preview only. Request an official certified report from the Registrar.</p></>
}

function EvaluationPage() {
  const semesterGroups = [
    { term: '1st Year · 1st Semester', items: [['EDUC 101', 'The Child and Adolescent Learner', 'Passed'], ['GE 101', 'Understanding the Self', 'Passed'], ['ENG 101', 'Introduction to Language Study', 'Passed'], ['GE 102', 'Purposive Communication', 'Failed']] },
    { term: '1st Year · 2nd Semester', items: [['EDUC 102', 'The Teaching Profession', 'Passed'], ['ENG 102', 'Survey of English Literature', 'Passed'], ['GE 103', 'Mathematics in the Modern World', 'Credited']] },
    { term: '2nd Year · 1st Semester', items: [['EDUC 203', 'The Teacher and the Community', 'Passed'], ['ENG 205', 'Language and Linguistics', 'Passed'], ['GE 204', 'Ethics', 'Incomplete']] },
    { term: '2nd Year · 2nd Semester', items: [['EDUC 206', 'Assessment of Learning 2', 'Passed'], ['ENG 207', 'Teaching Literature', 'Passed'], ['GE 205', 'The Contemporary World', 'Credited']] },
    { term: '3rd Year · 1st Semester', items: [['EDUC 301', 'Teaching Internship', 'In progress'], ['ENG 307', 'Creative Writing', 'In progress'], ['ENG 310', 'Inclusive Language Assessment', 'Failed']] },
  ]
  return <><PageHeading eyebrow="ACADEMICS · CURRICULUM TRACKER" title="Academic Evaluation" description="Track completed, failed, credited, and incomplete curriculum requirements." /><Panel className="evaluation-progress"><div><span className="metric-label">CURRICULUM COMPLETION</span><strong>36 <small>of 54 subjects</small></strong><span className="metric-foot">66.7% complete · 18 subjects remaining</span></div><div className="evaluation-track"><i style={{ width: '66.7%' }} /></div><div className="evaluation-key"><StatusPill value="Passed" /><StatusPill value="Failed" /><StatusPill value="Credited" /><StatusPill value="Incomplete" /></div></Panel><div className="evaluation-terms">{semesterGroups.map(group => <Panel key={group.term}><div className="evaluation-term-heading"><h3>{group.term}</h3><span>{group.items.filter(item => item[2] === 'Passed' || item[2] === 'Credited').length}/{group.items.length} completed</span></div><DataTable headings={['SUBJECT', 'TITLE', 'STATUS']} rows={group.items.map(([code, name, status]) => [code, name, <StatusPill value={status} />])} /></Panel>)}</div><div className="feature-note"><ShieldCheck size={16} /> Evaluation is a planning preview; confirm graduation requirements with your academic adviser.</div></>
}

function MajorsPage() {
  const [query, setQuery] = useState('')
  const majorDetails = [
    ['English', 'ENG', 'violet', 'Aa', 'Language, literature, and communication', 'Language and Linguistics · Teaching Literature · Creative Writing'],
    ['Filipino', 'FIL', 'rose', '文', 'Wika, panitikan, at kulturang Pilipino', 'Istruktura ng Wika · Panitikang Pilipino · Pagtuturo ng Filipino'],
    ['Mathematics', 'MTH', 'blue', 'π', 'Mathematical reasoning and problem solving', 'Algebra · Geometry · Teaching Mathematics'],
    ['Science', 'SCI', 'green', '⚛', 'Scientific inquiry and laboratory learning', 'Biological Science · Physical Science · Earth Science'],
    ['Social Studies', 'SST', 'amber', '◎', 'History, society, and civic understanding', 'Philippine History · Geography · Economics'],
    ['MAPEH', 'MPH', 'pink', '♫', 'Music, arts, physical education, and health', 'Music and Arts · Physical Education · Health Education'],
  ]
  const filtered = majorDetails.filter(item => item.join(' ').toLowerCase().includes(query.toLowerCase()))
  return <><PageHeading eyebrow="SCHOOL OF EDUCATION · BSED" title="Explore BSED Majors" description="Find your specialization, focus areas, and future educator community." /><div className="explorer-search"><Search size={16} /><input aria-label="Search majors" placeholder="Search majors and subject areas..." value={query} onChange={event => setQuery(event.target.value)} /></div><div className="major-explorer-grid">{filtered.map(([name, code, color, icon, focus, subjectsList]) => <Panel className="major-explorer-card" key={code}><div className="major-explorer-card-top"><span className={`major-icon major-${color}`}>{icon}</span><span>{code}</span></div><h3>{name}</h3><p>{focus}</p><strong>Sample subject areas</strong><small>{subjectsList}</small><span className="major-student-total">{({ English: 128, Filipino: 96, Mathematics: 112, Science: 84, 'Social Studies': 103, MAPEH: 76 })[name]} students in the community</span></Panel>)}</div>{filtered.length === 0 && <div className="feature-empty">No majors match “{query}”.</div>}</>
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

function WifiPage({ onNotice }) {
  const [code, setCode] = useState('')
  const generate = () => { const bytes = new Uint8Array(4); crypto.getRandomValues(bytes); setCode(`EDU-${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`) }
  return <><PageHeading eyebrow="CAMPUS SERVICES · WIFI" title="WiFi Access Generator" description="Generate a sample access request for campus WiFi." /><div className="payment-warning"><Wifi size={17} /><span><strong>Preview mode:</strong> this code is not connected to campus network authentication and will not grant WiFi access.</span></div><Panel className="wifi-card"><div className="wifi-emblem"><Wifi size={26} /></div><h3>Campus WiFi access</h3><p>Student ID: <strong>{'Student account'}</strong></p>{code ? <div className="wifi-code">{code}</div> : <div className="wifi-code wifi-placeholder">Your sample code will appear here</div>}<div className="wifi-code-meta"><span><Clock3 size={14} /> Demo expiry: 8 hours</span><span>One device · Preview</span></div><button className="login-submit" onClick={generate}><Sparkles size={15} /> Generate sample code</button>{code && <button className="feature-action wifi-copy" onClick={async () => { await navigator.clipboard?.writeText(code); onNotice('Sample WiFi code copied.') }}>Copy code</button>}</Panel></>
}

function AssistantPage({ onNotice }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([{ from: 'assistant', text: 'Hi! I can help with common questions about registration, grades, payment, and campus services.' }])
  const ask = text => {
    const prompt = text.trim()
    if (!prompt) return
    const match = faqItems.find(item => prompt.toLowerCase().includes(item.question.split(' ')[0].toLowerCase()) || item.question.toLowerCase().split(' ').some(word => word.length > 4 && prompt.toLowerCase().includes(word.toLowerCase())))
    const answer = match?.answer || 'I do not have that information yet. Please contact the Registrar or Student Affairs office for help.'
    setMessages(current => [...current, { from: 'student', text: prompt }, { from: 'assistant', text: answer }])
    setQuestion('')
  }
  return <><PageHeading eyebrow="STUDENT HELP DESK · FAQ ASSISTANT" title="Virtual Assistant" description="Quick answers to common student questions." /><div className="assistant-layout"><Panel className="assistant-chat"><div className="assistant-title"><span><Bot size={18} /></span><div><strong>Edu Assistant</strong><small><i /> Available · FAQ preview</small></div></div><div className="chat-messages">{messages.map((message, index) => <div className={`chat-bubble chat-${message.from}`} key={index}>{message.text}</div>)}</div><form className="chat-form" onSubmit={event => { event.preventDefault(); ask(question) }}><input placeholder="Ask about enrollment, grades..." value={question} onChange={event => setQuestion(event.target.value)} /><button aria-label="Send question"><Send size={16} /></button></form></Panel><Panel className="faq-panel"><h3>Common questions</h3>{faqItems.map(item => <button key={item.question} onClick={() => ask(item.question)}>{item.question}<ArrowRight size={14} /></button>)}</Panel></div><div className="feature-note"><Bot size={15} /> Automated FAQ preview. For personal records or urgent support, contact the appropriate campus office.</div></>
}

function ServicesPage({ onNotice }) {
  const [posts, setPosts] = useState([{ author: 'BSED Student Council', time: 'Today · 9:30 AM', text: 'Educ Week volunteers: sign-up is open at the College of Education office.', replies: 8 }, { author: 'College of Education', time: 'Yesterday · 3:15 PM', text: 'Peer tutoring sessions for major subjects start next week. Check with your department coordinator.', replies: 4 }])
  const [postText, setPostText] = useState('')
  const publish = event => { event.preventDefault(); if (!postText.trim()) return; setPosts(current => [{ author: 'You', time: 'Just now', text: postText.trim(), replies: 0 }, ...current]); setPostText(''); onNotice('Your community post was added to this local preview.') }
  return <><PageHeading eyebrow="CAMPUS LIFE · STUDENT SUPPORT" title="Community & Services" description="Connect with fellow educators and find campus support resources." /><div className="services-grid"><Panel className="forum-panel"><div className="panel-title-row"><div><h3>Student community</h3><p>Share updates with the BSED community.</p></div><MessageCircle size={18} /></div><form className="forum-compose" onSubmit={publish}><textarea placeholder="Share an update or ask the community..." value={postText} onChange={event => setPostText(event.target.value)} /><button className="feature-action feature-primary"><Send size={14} /> Post</button></form><div className="community-posts">{posts.map((post, index) => <article className="community-post" key={`${post.time}-${index}`}><div className="community-avatar">{post.author.slice(0, 1)}</div><div><strong>{post.author}</strong><small>{post.time}</small><p>{post.text}</p><span>{post.replies} replies · BSED Community</span></div></article>)}</div></Panel><div className="service-cards"><Panel><span className="service-icon library-service"><Library size={19} /></span><h3>College library & study resources</h3><p>Open education research, textbooks, and public domain literature.</p><div className="library-links"><a href="https://eric.ed.gov/" target="_blank" rel="noreferrer">ERIC · Education research <ArrowRight size={13} /></a><a href="https://openstax.org/" target="_blank" rel="noreferrer">OpenStax · Free textbooks <ArrowRight size={13} /></a><a href="https://www.gutenberg.org/" target="_blank" rel="noreferrer">Project Gutenberg · Literature <ArrowRight size={13} /></a></div><button className="feature-action" onClick={() => onNotice('Ask the librarian or school IT office to add the official campus library portal.')}>Campus library portal <ArrowRight size={14} /></button></Panel><Panel><span className="service-icon health-service"><HeartPulse size={19} /></span><h3>Healthcare services</h3><p>Campus clinic hours: Monday–Friday, 8:00 AM–5:00 PM.</p><button className="feature-action" onClick={() => onNotice('Clinic callback request noted in this preview. Contact the campus clinic for urgent care.')}>Request clinic callback <ArrowRight size={14} /></button></Panel></div></div></>
}

function NotificationsPage() {
  const [read, setRead] = useState(false)
  return <><PageHeading eyebrow="PORTAL UPDATES" title="Notifications" description="Academic reminders and student advisories." action={<button className="feature-action" onClick={() => setRead(true)}><Check size={15} /> Mark all as read</button>} /><div className="notification-list"><Panel className={read ? 'notification-read' : ''}><span className="notification-marker" /><div><span className="notification-date">TODAY · 8:00 AM</span><h3>Enrollment advisory for the second semester</h3><p>Review the academic calendar and confirm your advising schedule with your major coordinator.</p><span className="notification-tag">REGISTRAR</span></div></Panel><Panel className={read ? 'notification-read' : ''}><span className="notification-marker" /><div><span className="notification-date">YESTERDAY · 2:30 PM</span><h3>Teaching internship orientation</h3><p>Pre-registration is open. Bring your student ID and latest evaluation form.</p><span className="notification-tag">COLLEGE OF EDUCATION</span></div></Panel><Panel className="notification-read"><div><span className="notification-date">SEP 20 · 11:15 AM</span><h3>Library service hours</h3><p>The library will close at 4:00 PM on Friday for scheduled maintenance.</p><span className="notification-tag">CAMPUS SERVICES</span></div></Panel></div></>
}

function AccountSettingsPage({ student, onNotice }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const isAdmin = ['admin', 'superadmin'].includes(student?.role)
  const minimumLength = isAdmin ? 12 : 10
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
  return <><PageHeading eyebrow="ACCOUNT SECURITY" title="Account Settings" description="Update the password for your student portal account." /><Panel className="settings-panel"><div className="admin-panel-title"><span className="admin-panel-icon"><ShieldCheck size={17} /></span><div><h3>Change password</h3><p>Signed in as {student?.name} · {student?.role === 'superadmin' ? 'Superadmin' : student?.role === 'admin' ? 'Administrator' : student?.studentId}</p></div></div><form className="admin-form" onSubmit={updatePassword}><label htmlFor="current-password-settings">Current password</label><input id="current-password-settings" required type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /><label htmlFor="new-password-settings">New password</label><input id="new-password-settings" required minLength={minimumLength} type="password" autoComplete="new-password" placeholder={`At least ${minimumLength} characters`} value={newPassword} onChange={event => setNewPassword(event.target.value)} />{error && <div className="admin-error" role="alert">{error}</div>}{saved && <div className="password-saved"><Check size={14} /> Password updated successfully.</div>}<button className="login-submit" disabled={saving}>{saving ? 'Updating...' : 'Update password'} {!saving && <ArrowRight size={15} />}</button></form></Panel></>
}

export default function PortalPage({ active, student, onNotice }) {
  const pages = useMemo(() => ({
    'Class Schedule': <ClassSchedulePage />,
    'Enrolled Subjects': <EnrolledSubjectsPage />,
    'Enrollment History': <EnrollmentHistoryPage />,
    'Report of Grades': <GradesPage />,
    'Academic Evaluation': <EvaluationPage />,
    'Student Ledger': <LedgerPage onNotice={onNotice} />,
    'Online Registration': <RegistrationPage onNotice={onNotice} />,
    'Online Payment': <PaymentPage onNotice={onNotice} />,
    'WiFi Access': <WifiPage onNotice={onNotice} />,
    'Virtual Assistant': <AssistantPage />,
    'Community & Services': <ServicesPage onNotice={onNotice} />,
    'BSED Majors': <MajorsPage />,
    Notifications: <NotificationsPage />,
    'Account Settings': <AccountSettingsPage student={student} onNotice={onNotice} />,
  }), [active, student, onNotice])
  return pages[active] || <DashboardDetails student={student} />
}
