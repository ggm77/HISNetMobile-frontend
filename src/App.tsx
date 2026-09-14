import { lazy, startTransition, Suspense, useEffect, useState } from 'react'
import { ApiError, logout as apiLogout, me, studentInfo, type StudentInfo } from './api'
import { clearCache } from './hooks'
import { onIdle } from './lib'
import type { FeedNotice, SelectedNotice } from './notices'
import Home from './screens/Home'
import Login from './screens/Login'
import { SessionContext } from './session'
import { ErrorBoundary, Icon, LoadingCard, Sidebar, TabBar, TopBar, type Route } from './ui'

const SESSION_MIN = 30

// 홈과 로그인은 첫 화면이라 메인 번들에 두고, 나머지 화면은 각각 별도 청크로 나눠 처음 열 때 받는다.
// 첫 렌더 뒤 브라우저가 한가할 때 미리 받아 두므로(prefetch) 탭을 눌렀을 때는 대개 이미 캐시에 있다.
// 화면 전환은 startTransition 으로 감싸서, 청크가 아직 없으면 빈 화면 대신 이전 화면을 유지한 채 기다린다.
const screens = {
  timetable: () => import('./screens/Timetable'),
  notices: () => import('./screens/Notices'),
  reserve: () => import('./screens/Reserve'),
  myReservations: () => import('./screens/MyReservations'),
  meals: () => import('./screens/Meals'),
  academic: () => import('./screens/AcademicHub'),
  grades: () => import('./screens/Grades'),
  graduation: () => import('./screens/Graduation'),
  profile: () => import('./screens/Profile'),
}
const Timetable = lazy(screens.timetable)
const Notices = lazy(screens.notices)
const Reserve = lazy(screens.reserve)
const MyReservations = lazy(screens.myReservations)
const Meals = lazy(screens.meals)
const AcademicHub = lazy(screens.academic)
const Grades = lazy(screens.grades)
const Graduation = lazy(screens.graduation)
const Profile = lazy(screens.profile)
const prefetchScreens = () => Object.values(screens).forEach((load) => load().catch(() => {}))

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

  useEffect(() => onIdle(prefetchScreens), [])

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
    startTransition(() => {
      setRoute(r)
      if (r !== 'notices') setNotice(null)
    })
    window.scrollTo(0, 0)
  }
  const openNotice = (n: FeedNotice) => {
    startTransition(() => {
      setRoute('notices')
      setNotice({ boardKey: n.boardKey, id: n.id, dept: n.dept })
    })
    window.scrollTo(0, 0)
  }
  const toast = (s: string) => {
    setToastMsg(s)
    setTimeout(() => setToastMsg(''), 2000)
  }
  const doLogout = () => {
    apiLogout().catch(() => {})
    clearCache()
    setAuthed(false)
    setStudent(null)
    setRoute('home')
  }

  if (checking) return <Splash />

  if (!authed) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<Splash />}>
          {guestMeals ? (
            <div className="login" style={{ display: 'block', background: 'var(--bg)' }}><Meals back={() => setGuestMeals(false)} /></div>
          ) : (
            <Login onLogin={() => { setAuthed(true); setSessionMin(SESSION_MIN); go('home') }} onMeals={() => startTransition(() => setGuestMeals(true))} />
          )}
        </Suspense>
      </ErrorBoundary>
    )
  }

  const toAcademic = () => go('academic')
  const screen = {
    home: <Home go={go} openNotice={openNotice} />,
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
          <ErrorBoundary>
            <Suspense fallback={<div className="page"><LoadingCard /></div>}>
              {sessionMin === 0 ? <SessionExpired onLogin={doLogout} onClose={() => setSessionMin(SESSION_MIN)} /> : screen}
            </Suspense>
          </ErrorBoundary>
        </main>
        <TabBar route={route} go={go} />
        {toastMsg && <div className="toast">{toastMsg}</div>}
      </div>
    </SessionContext.Provider>
  )
}

function Splash() {
  return (
    <div className="login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="logo" style={{ width: 54, height: 54, borderRadius: 17, fontSize: 25 }}>H</div>
    </div>
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
