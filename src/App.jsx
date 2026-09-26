import { useEffect, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpen, CalendarDays,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, Clock3,
  Eye, EyeOff, GraduationCap, LayoutDashboard, Library, LockKeyhole, LogOut, Menu,
  MoreHorizontal, Moon, Search, Settings2, Sparkles, Sun, Users, UserPlus, ShieldCheck,
  CalendarRange, BookMarked, ChartNoAxesCombined, Receipt, CreditCard,
  Wifi as WifiIcon, Bot as BotIcon, HeartPulse, BellRing, X,
} from 'lucide-react'
import PortalPage, { DashboardDetails } from './PortalPages.jsx'

const majors = [
  { name: 'English', code: 'ENG', students: 128, color: 'violet', icon: 'Aa' },
  { name: 'Filipino', code: 'FIL', students: 96, color: 'rose', icon: '文' },
  { name: 'Mathematics', code: 'MTH', students: 112, color: 'blue', icon: 'π' },
  { name: 'Science', code: 'SCI', students: 84, color: 'green', icon: '⚛' },
  { name: 'Social Studies', code: 'SST', students: 103, color: 'amber', icon: '◎' },
  { name: 'MAPEH', code: 'MPH', students: 76, color: 'pink', icon: '♫' },
]

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
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ studentId: '', name: '', major: 'English', password: '' })

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

  const submitStudent = async event => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const response = await fetch('/api/admin/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not create the account.')
      setStudents(current => [...current, result.student].sort((a, b) => a.name.localeCompare(b.name)))
      setForm({ studentId: '', name: '', major: 'English', password: '' })
      setNotice(`Student account created for ${result.student.name}.`)
    } catch (saveError) { setError(saveError.message) }
    finally { setSaving(false) }
  }

  return <section className="admin-students-view"><div className="admin-intro"><div><span className="section-kicker">ADMINISTRATION</span><h2>Student accounts</h2><p>Create accounts for BSED students and manage the student directory.</p></div><span className="admin-count"><Users size={16} /> {students.length} students</span></div><div className="admin-layout"><article className="panel admin-form-panel"><div className="admin-panel-title"><span className="admin-panel-icon"><UserPlus size={17} /></span><div><h3>Add a student</h3><p>Set the student's initial password.</p></div></div><form className="admin-form" onSubmit={submitStudent}><label htmlFor="new-student-id">Student ID</label><input id="new-student-id" required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" placeholder="8-digit ID, e.g. 61212024" value={form.studentId} onChange={event => setForm({ ...form, studentId: event.target.value.replace(/\D/g, '').slice(0, 8) })} /><label htmlFor="new-student-name">Full name</label><input id="new-student-name" required minLength={2} placeholder="Student's full name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /><label htmlFor="new-student-major">BSED major</label><select id="new-student-major" value={form.major} onChange={event => setForm({ ...form, major: event.target.value })}>{majors.map(major => <option key={major.code} value={major.name}>{major.name}</option>)}</select><label htmlFor="new-student-password">Initial password</label><input id="new-student-password" required minLength={10} type="password" autoComplete="new-password" placeholder="At least 10 characters" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />{error && <div className="admin-error" role="alert">{error}</div>}<button className="login-submit" disabled={saving}>{saving ? 'Creating account...' : 'Create student account'} {!saving && <ArrowRight size={15} />}</button></form></article><article className="panel admin-directory"><div className="admin-directory-heading"><div><h3>Student directory</h3><p>Registered student portal accounts</p></div><button className="admin-refresh" onClick={loadStudents} aria-label="Refresh student list"><Sparkles size={15} /></button></div>{loading ? <div className="admin-empty">Loading students...</div> : students.length === 0 ? <div className="admin-empty"><Users size={22} /><strong>No student accounts yet</strong><span>Add the first BSED student with the form.</span></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>MAJOR</th></tr></thead><tbody>{students.map(item => <tr key={item.studentId}><td><strong>{item.name}</strong></td><td>{item.studentId}</td><td><span className="admin-major-pill">{item.major}</span></td></tr>)}</tbody></table></div>}</article></div></section>
}

function SuperadminAccounts({ setNotice }) {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ studentId: '', username: '', name: '', password: '' })

  const loadAdmins = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/superadmin/admins', { credentials: 'include' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not load admin accounts.')
      setAdmins(result.admins)
    } catch (loadError) { setError(loadError.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadAdmins() }, [])

  const submitAdmin = async event => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const response = await fetch('/api/superadmin/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not create the admin account.')
      setAdmins(current => [...current, result.admin].sort((a, b) => a.name.localeCompare(b.name)))
      setForm({ studentId: '', username: '', name: '', password: '' })
      setNotice(`Admin account created for ${result.admin.name}.`)
    } catch (saveError) { setError(saveError.message) }
    finally { setSaving(false) }
  }

  return <section className="admin-students-view"><div className="admin-intro"><div><span className="section-kicker">SUPERADMIN</span><h2>Administrator accounts</h2><p>Create and review admin accounts for the BSED portal.</p></div><span className="admin-count"><ShieldCheck size={16} /> {admins.length} accounts</span></div><div className="admin-layout"><article className="panel admin-form-panel"><div className="admin-panel-title"><span className="admin-panel-icon"><UserPlus size={17} /></span><div><h3>Add an administrator</h3><p>Admins can create student accounts.</p></div></div><form className="admin-form" onSubmit={submitAdmin}><label htmlFor="new-admin-id">Staff ID</label><input id="new-admin-id" required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" placeholder="8-digit staff ID" value={form.studentId} onChange={event => setForm({ ...form, studentId: event.target.value.replace(/\D/g, '').slice(0, 8) })} /><label htmlFor="new-admin-username">Username</label><input id="new-admin-username" required minLength={3} maxLength={32} pattern="[a-zA-Z][a-zA-Z0-9._-]*" placeholder="e.g. registrar" value={form.username} onChange={event => setForm({ ...form, username: event.target.value.toLowerCase() })} /><label htmlFor="new-admin-name">Full name</label><input id="new-admin-name" required minLength={2} placeholder="Administrator's full name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /><label htmlFor="new-admin-password">Initial password</label><input id="new-admin-password" required minLength={12} type="password" autoComplete="new-password" placeholder="At least 12 characters" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />{error && <div className="admin-error" role="alert">{error}</div>}<button className="login-submit" disabled={saving}>{saving ? 'Creating account...' : 'Create admin account'} {!saving && <ArrowRight size={15} />}</button></form></article><article className="panel admin-directory"><div className="admin-directory-heading"><div><h3>Admin directory</h3><p>Administrator accounts, including superadmins</p></div><button className="admin-refresh" onClick={loadAdmins} aria-label="Refresh admin list"><Sparkles size={15} /></button></div>{loading ? <div className="admin-empty">Loading admin accounts...</div> : admins.length === 0 ? <div className="admin-empty"><ShieldCheck size={22} /><strong>No admin accounts found</strong></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>NAME</th><th>USERNAME</th><th>STAFF ID</th><th>ROLE</th></tr></thead><tbody>{admins.map(item => <tr key={item.studentId}><td><strong>{item.name}</strong></td><td>{item.username || item.studentId}</td><td>{item.studentId}</td><td><span className="admin-major-pill">{item.role}</span></td></tr>)}</tbody></table></div>}</article></div></section>
}

function App() {
  const [student, setStudent] = useState(null)
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
  const studentName = student?.name || ''
  const studentInitials = studentName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || studentId.slice(-2)
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase()
  const navItems = [
    { title: 'MENU', links: [{ name: 'Overview', icon: LayoutDashboard }, { name: 'Notifications', icon: BellRing }, { name: 'Account Settings', icon: Settings2 }] },
    { title: 'ACADEMICS', links: [{ name: 'Class Schedule', icon: CalendarRange }, { name: 'Enrolled Subjects', icon: BookOpen }, { name: 'Enrollment History', icon: ClipboardList }, { name: 'Report of Grades', icon: BookMarked }, { name: 'Academic Evaluation', icon: ChartNoAxesCombined }] },
    { title: 'STUDENT SERVICES', links: [{ name: 'Student Ledger', icon: Receipt }, { name: 'Online Registration', icon: ClipboardList }, { name: 'Online Payment', icon: CreditCard }, { name: 'WiFi Access', icon: WifiIcon }, { name: 'Virtual Assistant', icon: BotIcon }, { name: 'Community & Services', icon: HeartPulse }, { name: 'BSED Majors', icon: GraduationCap }] },
    ...(student && ['admin', 'superadmin'].includes(student.role) ? [{ title: 'ADMINISTRATION', links: [{ name: 'Students', icon: ShieldCheck }, ...(student.role === 'superadmin' ? [{ name: 'Admin Accounts', icon: Users }] : [])] }] : []),
  ]
  const selectNav = (name) => { setActive(name); setMobileNav(false) }
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async response => { if (response.ok) { const result = await response.json(); setStudent(result.student); if (['admin', 'superadmin'].includes(result.student.role)) setActive('Students') } })
      .catch(() => {})
      .finally(() => setAuthReady(true))
  }, [])

  const signIn = async (event) => {
    event.preventDefault()
    if (!/^\d{8}$/.test(idInput) && !/^[a-zA-Z][a-zA-Z0-9._-]{2,31}$/.test(idInput)) { setLoginError('Enter an 8-digit Student ID or a valid admin username.'); return }
    if (!password.trim()) { setLoginError('Enter your password to continue.'); return }
    setLoginError('')
    setSigningIn(true)
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ login: idInput, password }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not sign in.')
      setStudent(result.student)
      if (['admin', 'superadmin'].includes(result.student.role)) setActive('Students')
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

  if (!authReady) return <div className={`app-shell login-shell ${theme === 'dark' ? 'theme-dark' : ''}`}><main className="login-page"><div className="login-top"><div className="brand login-brand"><span className="brand-mark"><GraduationCap size={22} /></span><span>edu<span className="brand-light">portal</span></span></div></div><div className="login-loading">Checking your student account...</div></main></div>

  if (!studentId) return (
    <div className={`app-shell login-shell ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <main className="login-page">
        <div className="login-top"><div className="brand login-brand"><span className="brand-mark"><GraduationCap size={22} strokeWidth={2.3} /></span><span>edu<span className="brand-light">portal</span></span></div><button className="icon-button theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'} onClick={() => { const nextTheme = theme === 'dark' ? 'light' : 'dark'; setTheme(nextTheme); localStorage.setItem('eduportal-theme', nextTheme) }}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button></div>
        <section className="login-card"><div className="login-emblem"><GraduationCap size={24} /></div><span className="section-kicker">CONCEPCION HOLY CROSS COLLEGE INC. · SCHOOL OF EDUCATION</span><h1>Welcome back</h1><p className="login-intro">Sign in to your BSED student portal and pick up where you left off.</p>
          <form className="login-form" onSubmit={signIn} noValidate><label htmlFor="student-id">Student ID or admin username</label><div className="login-input-wrap"><GraduationCap size={17} /><input id="student-id" autoComplete="username" placeholder="8-digit ID or admin username" value={idInput} onChange={event => { setIdInput(event.target.value.trim().slice(0, 32)); setLoginError('') }} /></div><small className="field-hint">Students use an 8-digit ID. Admins can use their username.</small><label htmlFor="student-password">Password</label><div className="login-input-wrap"><LockKeyhole size={16} /><input id="student-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={event => { setPassword(event.target.value); setLoginError('') }} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{loginError && <div className="login-error" role="alert">{loginError}</div>}<button className="login-submit" type="submit" disabled={signingIn}>{signingIn ? 'Signing in...' : 'Sign in'} {!signingIn && <ArrowRight size={16} />}</button></form>
          <div className="login-demo"><span className="demo-info">i</span><span>Use the credentials provided by your school. Contact the student help desk if your account is not active.</span></div>
        </section><footer className="login-footer">© 2026 Concepcion Holy Cross College Inc. <span>·</span> Made for future educators <span className="footer-heart">♥</span></footer>
      </main>
    </div>
  )

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><GraduationCap size={22} strokeWidth={2.3} /></div><span>edu<span className="brand-light">portal</span></span><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={19} /></button></div>
        <div className="school-pill"><span className="school-seal">C</span><span><strong>Concepcion Holy Cross College Inc.</strong><small>School of Education</small></span><ChevronDown size={15} /></div>
        <div className="student-card"><div className="avatar avatar-student">{studentInitials}</div><div><strong>{studentName}</strong><small>BSED · {student.major} Major</small></div><button className="icon-button" aria-label="Student options"><MoreHorizontal size={18} /></button></div>
        <nav className="side-nav">{navItems.map(group => <div className="nav-group" key={group.title}><p className="nav-label">{group.title}</p>{group.links.map(({ name, icon: Icon }) => <button key={name} onClick={() => selectNav(name)} className={`nav-link ${active === name ? 'nav-active' : ''}`}><Icon size={18} strokeWidth={1.8} /><span>{name}</span>{name === 'Assignments' && <span className="nav-count">3</span>}</button>)}</div>)}</nav>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={18} /></div><div><strong>Need a hand?</strong><span>Visit the student help desk</span></div><ArrowRight size={15} /></div><button className="nav-link settings-link" onClick={signOut}><LogOut size={18} /><span>Sign out</span></button><div className="sidebar-footer">© 2026 Concepcion Holy Cross College Inc.</div></div>
      </aside>
      {mobileNav && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}

      <main className="main-area">
        <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={21} /></button><div className="breadcrumb">Student Portal <ChevronRight size={14} /> <strong>{active}</strong></div><div className="topbar-actions"><label className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search anything..." /><kbd>⌘ K</kbd></label><button className="icon-button theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'} onClick={() => { const nextTheme = theme === 'dark' ? 'light' : 'dark'; setTheme(nextTheme); localStorage.setItem('eduportal-theme', nextTheme) }}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice('You’re all caught up!')}><Bell size={19} /><i /></button><div className="avatar avatar-top">{studentInitials}</div></div></header>

        <div className="page-content">
          {active === 'Overview' && <section className="welcome-row"><div><div className="eyebrow"><span className="live-dot" /> {todayLabel}</div><h1>Welcome, {studentName} <span className="wave">✳</span></h1><p>Ready to inspire the next generation? Here’s your day at a glance.</p></div><button className="term-select">1st Semester 2026–2027 <ChevronDown size={15} /></button></section>}

          {active === 'Students' && ['admin', 'superadmin'].includes(student.role) ? <AdminStudents setNotice={setNotice} /> : active === 'Admin Accounts' && student.role === 'superadmin' ? <SuperadminAccounts setNotice={setNotice} /> : active === 'Overview' ? <>
          <DashboardDetails student={student} />
          <section className="stats-grid" aria-label="Academic summary"><article className="stat-card"><div className="stat-top"><span>MY UNITS</span><span className="stat-icon purple-icon"><BookOpen size={17} /></span></div><div className="stat-value">21 <small>/ 24 units</small></div><div className="progress-track"><span style={{ width: '72%' }} /></div><div className="stat-note">72% of max load <span className="positive"><ArrowUpRight size={13} /> On track</span></div></article><article className="stat-card"><div className="stat-top"><span>GWA THIS SEMESTER</span><span className="stat-icon green-icon"><Activity size={17} /></span></div><div className="stat-value">1.42 <small className="positive-text"><ArrowDownRight size={15} /> 0.08</small></div><div className="stat-note">Current general weighted average <span className="muted-note">vs. last sem.</span></div></article><article className="stat-card"><div className="stat-top"><span>ATTENDANCE</span><span className="stat-icon orange-icon"><Clock3 size={17} /></span></div><div className="stat-value">96<small>%</small><span className="attendance-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i className="bar-empty" /></span></div><div className="stat-note">Excellent! Keep it up <span className="positive">+2% this month</span></div></article></section>

          <section className="content-grid"><div className="left-column"><article className="panel announcements-panel"><div className="panel-heading"><div><span className="section-kicker">FROM YOUR COMMUNITY</span><h2>Latest announcements</h2></div><button className="subtle-link" onClick={() => selectNav('Notifications')}>View all <ArrowRight size={14} /></button></div><div className="announcement-list">{announcements.map(post => <div className="announcement" key={post.name}><div className={`avatar avatar-${post.color}`}>{post.initials}</div><div className="announcement-body"><div className="announcement-meta"><strong>{post.name}</strong><span>·</span><span>{post.time}</span></div><p>{post.text}</p><span className={`tag tag-${post.color}`}>{post.tag}</span></div><button className="icon-button announcement-more" aria-label="More announcement options"><MoreHorizontal size={18} /></button></div>)}</div></article></div>

          <div className="right-column"><article className="panel majors-panel"><div className="panel-heading"><div><span className="section-kicker">FIND YOUR PEOPLE</span><h2>BSED majors</h2></div><button className="icon-button panel-more" aria-label="More major options"><MoreHorizontal size={18} /></button></div><p className="panel-description">Explore your department and connect with fellow future educators.</p><div className="major-list">{majors.map(major => <button key={major.code} className={`major-row ${selectedMajor === major.name ? 'major-selected' : ''}`} onClick={() => { setSelectedMajor(major.name); setNotice(`${major.name} major selected.`) }}><span className={`major-icon major-${major.color}`}>{major.icon}</span><span className="major-copy"><strong>{major.name}</strong><small>{major.students} students</small></span><ArrowRight size={15} className="major-arrow" /></button>)}</div><button className="all-majors-button" onClick={() => selectNav('BSED Majors')}>Explore all majors <ArrowRight size={15} /></button></article>

          <article className="panel quick-panel"><div className="panel-heading"><div><span className="section-kicker">MAKE IT COUNT</span><h2>Up next</h2></div><CalendarDays size={17} className="quick-calendar" /></div><div className="event-list">{events.map(event => <div className="event-row" key={event.title}><div className={`event-date date-${event.color}`}><strong>{event.day}</strong><span>{event.month}</span></div><div className="event-copy"><strong>{event.title}</strong><small>{event.meta}</small></div></div>)}</div><button className="text-link events-link" onClick={() => selectNav('Class Schedule')}>See all events <ArrowRight size={15} /></button></article></div></section>

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
