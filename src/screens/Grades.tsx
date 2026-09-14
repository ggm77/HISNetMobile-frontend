import { useState } from 'react'
import { grades as fetchGrades, graduation as fetchGraduation } from '../api'
import { useFetch } from '../hooks'
import { Bar, ErrorCard, Icon, LoadingCard, PageHeader } from '../ui'

export default function Grades({ back }: { back: () => void }) {
  const [open, setOpen] = useState<number[]>([0])
  const toggle = (i: number) => setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]))
  const { data, loading, error, reload } = useFetch('grades', fetchGrades)
  const { data: grad } = useFetch('graduation', fetchGraduation)
  const summary = data?.summary
  const required = grad?.available ? grad.requiredCredits : null
  const byType = Object.entries(summary?.creditsByType ?? {}).sort((a, b) => b[1] - a[1])
  const maxType = Math.max(1, ...byType.map(([, v]) => v))

  return (
    <>
      <PageHeader title="성적" back={back} />
      <div className="page">
        {loading && <LoadingCard />}
        {error && !loading && <ErrorCard message={error} reload={reload} />}

        {!loading && !error && (
          <>
            <div className="hero" style={{ padding: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--on-main-sub)' }}>누적 평점평균</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1 }}>{summary?.gpa ?? '-'}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--on-main-sub)' }}>/ 4.5</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {[['전공 평점', summary?.majorGpa], ['환산점수', summary?.conversionScore], ['평점계', summary?.totalGradePoints]].map(([k, v]) => (
                  <div key={k as string} style={{ flex: 1, background: 'rgba(255,255,255,0.16)', borderRadius: 12, padding: '10px 11px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-main-2)' }}>{k}</div>
                    <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>{v ?? '-'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-head" style={{ alignItems: 'baseline' }}>
                <span className="card-title">취득학점</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}><span style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>{summary?.earnedCredits ?? '-'}</span>{required ? ` / ${required}` : ''}</span>
              </div>
              {required && summary?.earnedCredits != null && <Bar pct={(summary.earnedCredits / required) * 100} style={{ height: 10, marginTop: 11 }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }} className="muted">
                <span style={{ fontSize: 12 }}>신청 {summary?.requestedCredits ?? '-'} · PF 이수 {summary?.pfCredits ?? '-'}</span>
                {required && summary?.earnedCredits != null && <span style={{ fontSize: 12 }}>졸업까지 {Math.max(0, required - summary.earnedCredits)}학점</span>}
              </div>
              {byType.length > 0 && (
                <div style={{ marginTop: 15, paddingTop: 14, borderTop: '1px solid var(--line-2)', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {byType.map(([label, value], i) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ flex: 'none', width: 72, fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{label}</span>
                      <Bar pct={(value / maxType) * 100} tone={i < 3 ? undefined : 'soft'} style={{ flex: 1 }} />
                      <span style={{ flex: 'none', width: 30, textAlign: 'right', fontSize: 12, fontWeight: 800 }}>{value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(data?.semesters ?? []).map((s, i) => (
              <div className="card" key={`${s.year}-${s.term}`}>
                <button className="card-head" style={{ width: '100%' }} onClick={() => toggle(i)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{s.year}년 {s.term}학기</span>
                    <span className="pill" style={{ fontWeight: 800, padding: '4px 9px' }}>{s.gpa ?? '-'}</span>
                  </span>
                  <Icon name={open.includes(i) ? 'expand_less' : 'expand_more'} size={22} color="var(--ink-3)" />
                </button>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>신청 {s.requestedCredits ?? '-'} · 취득 {s.earnedCredits ?? '-'}</div>
                {open.includes(i) && s.courses.map((c) => (
                  <div key={c.code} style={{ marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{c.code} · {c.type ?? '-'} · {c.credits ?? '-'}학점</div>
                    </div>
                    <span className={c.grade === 'P' ? 't-pass' : 't-main'} style={{ flex: 'none', fontSize: 13, fontWeight: 800, padding: '5px 10px', borderRadius: 8 }}>{c.grade ?? '-'}</span>
                  </div>
                ))}
                {open.includes(i) && s.courses.length === 0 && <div className="muted" style={{ fontSize: 12, marginTop: 11 }}>과목 상세 정보가 없습니다</div>}
              </div>
            ))}
            {(data?.semesters ?? []).length === 0 && (
              <div className="card empty-state"><Icon name="inbox" /><div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>학기별 성적이 없습니다</div></div>
            )}
          </>
        )}
      </div>
    </>
  )
}
