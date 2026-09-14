import { useEffect, useState } from 'react'
import { ApiError, logout as apiLogout, me, studentInfo, type StudentInfo } from './api'
import { AcademicHub, Graduation, Grades, Profile } from './screens/Academic'
import Home from './screens/Home'
import Login from './screens/Login'
import Meals from './screens/Meals'
import Notices from './screens/Notices'
import type { SelectedNotice } from './notices'
import { MyReservations, Reserve } from './screens/Reserve'
import { SessionContext } from './session'
import Timetable from './screens/Timetable'
import { Icon, Sidebar, TabBar, TopBar, type Route } from './ui'

const SESSION_MIN = 30

export default function App() {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [guestMeals, setGuestMeals] = useState(false)
  const [route, setRoute] = useState<Route>('home')
  const [notice, setNotice] = useState<SelectedNotice>(null)
  const [toastMsg, setToastMsg] = useState('')
  const [sessionMin, setSessionMin] = useState(SESSION_MIN)

  useEffect(() => {
    me()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (!authed) return
    studentInfo()
      .then(setStudent)
      .catch((e) => {
        if (e instanceof ApiError && e.code === 'SESSION_EXPIRED') setSessionMin(0)
      })
  }, [authed])

  useEffect(() => {
    if (!authed) return
    const t = setInterval(() => setSessionMin((m) => Math.max(0, m - 1)), 60_000)
    return () => clearInterval(t)
  }, [authed])

  const go = (r: Route) => {
    setRoute(r)
    if (r !== 'notices') setNotice(null)
    window.scrollTo(0, 0)
  }
  const toast = (s: string) => {
    setToastMsg(s)
    setTimeout(() => setToastMsg(''), 2000)
  }
  const doLogout = () => {
    apiLogout().catch(() => {})
    setAuthed(false)
    setStudent(null)
    setRoute('home')
  }

  if (checking) {
    return (
      <div className="login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="logo" style={{ width: 54, height: 54, borderRadius: 17, fontSize: 25 }}>H</div>
      </div>
    )
  }

  if (!authed) {
    if (guestMeals) return <div className="login" style={{ display: 'block', background: 'var(--bg)' }}><Meals back={() => setGuestMeals(false)} /></div>
    return <Login onLogin={() => { setAuthed(true); setSessionMin(SESSION_MIN); go('home') }} onMeals={() => setGuestMeals(true)} />
  }

  const toAcademic = () => go('academic')
  const screen = {
    home: <Home go={go} openNotice={(n) => { go('notices'); setNotice({ boardKey: n.boardKey, id: n.id, dept: n.dept }) }} />,
    timetable: <Timetable />,
    academic: <AcademicHub go={go} />,
    grades: <Grades back={toAcademic} />,
    graduation: <Graduation back={toAcademic} />,
    profile: <Profile back={toAcademic} onLogout={doLogout} />,
    meals: <Meals back={() => go('home')} />,
    notices: <Notices selected={notice} setSelected={setNotice} />,
    reserve: <Reserve go={go} toast={toast} />,
    myReservations: <MyReservations back={() => go('reserve')} toast={toast} />,
  }[route]

  return (
    <SessionContext.Provider value={{ student, expire: () => setSessionMin(0) }}>
      <div className="app">
        <Sidebar route={route} go={go} sessionMin={sessionMin} />
        <main className="main">
          <TopBar />
          {sessionMin === 0 ? <SessionExpired onLogin={doLogout} onClose={() => setSessionMin(SESSION_MIN)} /> : screen}
        </main>
        <TabBar route={route} go={go} />
        {toastMsg && <div className="toast">{toastMsg}</div>}
      </div>
    </SessionContext.Provider>
  )
}

function SessionExpired({ onLogin, onClose }: { onLogin: () => void; onClose: () => void }) {
  return (
    <div className="page">
      <div className="card" style={{ padding: 20, borderRadius: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="timer_off" size={20} color="var(--warn)" />
          <span style={{ fontSize: 15, fontWeight: 800 }}>세션 만료</span>
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', marginTop: 10 }}>히즈넷 세션이 만료되었습니다. 다시 로그인해주세요.</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn sm" onClick={onLogin}>다시 로그인</button>
          <button className="btn sm secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}
