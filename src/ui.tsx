import type { ReactNode } from 'react'
import { useSession } from './session'


export type Route =
  | 'home' | 'timetable' | 'grades' | 'graduation' | 'notices'
  | 'reserve' | 'myReservations' | 'meals' | 'profile' | 'academic'

export const Icon = ({ name, fill, size, color, className = '' }: { name: string; fill?: boolean; size?: number; color?: string; className?: string }) => (
  <span className={`icon ${fill ? 'fill' : ''} ${className}`} style={{ fontSize: size, color }} aria-hidden>
    {name}
  </span>
)

const TABS: { route: Route; icon: string; label: string; match: Route[] }[] = [
  { route: 'home', icon: 'home', label: '홈', match: ['home', 'meals'] },
  { route: 'timetable', icon: 'calendar_view_week', label: '시간표', match: ['timetable'] },
  { route: 'notices', icon: 'campaign', label: '공지', match: ['notices'] },
  { route: 'reserve', icon: 'event_available', label: '예약', match: ['reserve', 'myReservations'] },
  { route: 'academic', icon: 'school', label: '학사', match: ['academic', 'grades', 'graduation', 'profile'] },
]

const NAV: { route: Route; icon: string; label: string; badge?: number }[] = [
  { route: 'home', icon: 'home', label: '홈' },
  { route: 'timetable', icon: 'calendar_view_week', label: '시간표' },
  { route: 'grades', icon: 'bar_chart', label: '성적' },
  { route: 'graduation', icon: 'workspace_premium', label: '졸업심사' },
  { route: 'notices', icon: 'campaign', label: '공지' },
  { route: 'reserve', icon: 'event_available', label: '시설 예약' },
  { route: 'myReservations', icon: 'event_note', label: '내 예약' },
  { route: 'meals', icon: 'restaurant', label: '식단표' },
  { route: 'profile', icon: 'badge', label: '학적 정보' },
]

export function TabBar({ route, go }: { route: Route; go: (r: Route) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => {
        const on = t.match.includes(route)
        return (
          <button key={t.route} className={`tab ${on ? 'on' : ''}`} onClick={() => go(t.route)}>
            <Icon name={t.icon} fill={on} />
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}

export function Sidebar({ route, go, sessionMin }: { route: Route; go: (r: Route) => void; sessionMin: number }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">H</div>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>HISNet</span>
      </div>
      <div className="nav">
        {NAV.map((n) => {
          const on = n.route === route || (route === 'academic' && n.route === 'grades')
          return (
            <button key={n.route} className={`nav-item ${on ? 'on' : ''}`} onClick={() => go(n.route)}>
              <Icon name={n.icon} />
              {n.label}
              {n.badge ? <span className="badge-count">{n.badge}</span> : null}
            </button>
          )
        })}
      </div>
      <div className="session">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name="timer" size={17} color="var(--ink-3)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>세션 {sessionMin}분 남음</span>
        </div>
        <Bar pct={(sessionMin / 30) * 100} style={{ height: 5, marginTop: 9 }} />
      </div>
    </aside>
  )
}

export function TopBar() {
  const { student } = useSession()
  return (
    <header className="topbar" style={{ justifyContent: 'flex-end' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="avatar">{student?.name?.[0] ?? '?'}</div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800 }}>{student?.name ?? '…'}</div>
          <div className="muted" style={{ fontSize: 11.5 }}>{student?.studentNo ?? ''}</div>
        </div>
      </div>
    </header>
  )
}

export function Bar({ pct, tone, style }: { pct: number; tone?: 'soft' | 'fail'; style?: React.CSSProperties }) {
  return (
    <span className={`bar ${tone ?? ''}`} style={style}>
      <span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </span>
  )
}

export function PageHeader({ title, back, right, children, flat, mobileOnly = true }: {
  title: ReactNode; back?: () => void; right?: ReactNode; children?: ReactNode; flat?: boolean; mobileOnly?: boolean
}) {
  return (
    <div className={`header ${flat ? 'flat' : ''} ${mobileOnly ? '' : ''}`}>
      <div className="header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {back && (
            <button onClick={back} aria-label="뒤로" style={{ display: 'flex' }}>
              <Icon name="arrow_back" size={24} />
            </button>
          )}
          <h1 className="h1">{title}</h1>
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

export function UnderlineTabs<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T; onChange: (v: T) => void; label?: (v: T) => string }) {
  return (
    <div className="utabs">
      {options.map((o) => (
        <button key={o} className={`utab ${o === value ? 'on' : ''}`} onClick={() => onChange(o)}>{label ? label(o) : o}</button>
      ))}
    </div>
  )
}

