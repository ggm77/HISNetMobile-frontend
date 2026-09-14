import { lazy, startTransition, Suspense, useEffect, useState } from 'react'
import { ApiError, logout as apiLogout, me, studentInfo, type StudentInfo } from './api'
import { clearCache } from './hooks'
import { onIdle } from './lib'
import type { BoardKey, FeedNotice, SelectedNotice } from './notices'
import Home from './screens/Home'
import Login from './screens/Login'
import { SessionContext } from './session'
import { ErrorBoundary, Icon, LoadingCard, Sidebar, TabBar, TopBar, type Route } from './ui'

const SESSION_MIN = 30

// 화면(Route)마다 실제 주소창 URL이 대응되도록 하는 아주 얇은 라우터. 별도 라이브러리 없이
// history API(pushState/popstate)만으로 구현한다 — 새로고침·뒤로가기·북마크가 모두 동작해야 하므로
// 배포 서버(nginx 등)도 이 경로들을 전부 index.html 로 돌려주는 SPA 폴백이 되어 있어야 한다.
const ROUTE_PATHS: Record<Route, string> = {
  home: '/',
  timetable: '/timetable',
  grades: '/grades',
  graduation: '/graduation',
  notices: '/notices',
  reserve: '/reserve',
  myReservations: '/reserve/my',
  meals: '/meals',
  profile: '/profile',
  academic: '/academic',
}
const PATH_ROUTES: Record<string, Route> = Object.fromEntries(
  Object.entries(ROUTE_PATHS).map(([r, p]) => [p, r as Route]),
)
const routeFromPath = (pathname: string): Route => PATH_ROUTES[pathname] ?? 'home'

function noticeToSearch(n: SelectedNotice) {
  if (!n) return ''
  const p = new URLSearchParams({ board: n.boardKey, id: n.id })
  if (n.dept) p.set('dept', n.dept)
  return `?${p}`
}
function noticeFromSearch(search: string): SelectedNotice {
  const p = new URLSearchParams(search)
  const board = p.get('board')
  const id = p.get('id')
  if (!board || !id) return null
  return { boardKey: board as BoardKey, id, dept: p.get('dept') ?? undefined }
}

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
  const [guestMeals, setGuestMeals] = useState(() => window.location.pathname === '/meals')
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname))
  const [notice, setNotice] = useState<SelectedNotice>(() =>
    routeFromPath(window.location.pathname) === 'notices' ? noticeFromSearch(window.location.search) : null,
  )
  const [toastMsg, setToastMsg] = useState('')
  const [sessionMin, setSessionMin] = useState(SESSION_MIN)

  useEffect(() => {
    me()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => onIdle(prefetchScreens), [])

  // 뒤로/앞으로가기: 주소만 바뀌고 컴포넌트 상태는 그대로이므로 직접 동기화해야 한다.
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname
      const r = routeFromPath(path)
      startTransition(() => {
        setRoute(r)
        setNotice(r === 'notices' ? noticeFromSearch(window.location.search) : null)
        setGuestMeals(path === '/meals')
      })
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
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

  const pushUrl = (path: string) => {
    if (window.location.pathname + window.location.search !== path) window.history.pushState(null, '', path)
  }
  const go = (r: Route) => {
    pushUrl(ROUTE_PATHS[r])
    startTransition(() => {
      setRoute(r)
      if (r !== 'notices') setNotice(null)
    })
    window.scrollTo(0, 0)
  }
  const selectNotice = (n: SelectedNotice) => {
    pushUrl(`/notices${noticeToSearch(n)}`)
    setNotice(n)
  }
  const openNotice = (n: FeedNotice) => {
    const sel: SelectedNotice = { boardKey: n.boardKey, id: n.id, dept: n.dept }
    pushUrl(`/notices${noticeToSearch(sel)}`)
    startTransition(() => {
      setRoute('notices')
      setNotice(sel)
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
    pushUrl(ROUTE_PATHS.home)
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
            <div className="login" style={{ display: 'block', background: 'var(--bg)' }}>
              <Meals back={() => { pushUrl(ROUTE_PATHS.home); setGuestMeals(false) }} />
            </div>
          ) : (
            <Login
              onLogin={() => { setAuthed(true); setSessionMin(SESSION_MIN); go('home') }}
              onMeals={() => { pushUrl(ROUTE_PATHS.meals); startTransition(() => setGuestMeals(true)) }}
            />
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
    notices: <Notices selected={notice} setSelected={selectNotice} />,
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
