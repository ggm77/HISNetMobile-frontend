import { grades as fetchGrades, graduation as fetchGraduation } from '../api'
import { useFetch } from '../hooks'
import type { IconName } from '../icons'
import { useSession } from '../session'
import { Icon, PageHeader, type Route } from '../ui'

export default function AcademicHub({ go }: { go: (r: Route) => void }) {
  const { student } = useSession()
  const { data: g } = useFetch('grades', fetchGrades)
  const { data: grad } = useFetch('graduation', fetchGraduation)
  const items: { r: Route; icon: IconName; label: string; sub: string }[] = [
    { r: 'grades', icon: 'bar_chart', label: '성적', sub: g?.summary ? `누적 평점 ${g.summary.gpa ?? '-'} · ${g.summary.earnedCredits ?? '-'}학점` : '불러오는 중…' },
    { r: 'graduation', icon: 'workspace_premium', label: '졸업심사', sub: grad ? (grad.available ? grad.finalVerdict ?? '-' : '조회 불가') : '불러오는 중…' },
    { r: 'meals', icon: 'restaurant', label: '식단표', sub: '학생식당 · 한동라운지' },
    { r: 'profile', icon: 'badge', label: '학적 정보', sub: student ? `${student.studentNo ?? ''} · ${student.department ?? ''}` : '불러오는 중…' },
  ]
  return (
    <>
      <PageHeader title="학사" />
      <div className="page">
        <div className="card" style={{ padding: '4px 16px' }}>
          {items.map((it, i) => (
            <button key={it.r} onClick={() => go(it.r)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '14px 0', borderTop: i ? '1px solid var(--line-2)' : 0 }}>
              <span className="t-main" style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={it.icon} size={21} /></span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{it.label}</span>
                <span className="muted" style={{ fontSize: 12 }}>{it.sub}</span>
              </span>
              <Icon name="chevron_right" size={22} color="var(--ink-3)" />
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
