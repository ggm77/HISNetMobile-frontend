import { useState } from 'react'
import { grades as fetchGrades, graduation as fetchGraduation } from '../api'
import { isGraduationPass, parseNumeric } from '../graduation'
import { useFetch } from '../hooks'
import type { IconName } from '../icons'
import { useSession } from '../session'
import { Bar, Icon, PageHeader, type Route } from '../ui'

function LoadingCard() {
  return <div className="card empty-state"><Icon name="hourglass_empty" /><div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>불러오는 중…</div></div>
}
function ErrorCard({ message, reload }: { message: string; reload: () => void }) {
  return (
    <div className="card empty-state">
      <Icon name="error" />
      <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>{message}</div>
      <button className="btn sm" style={{ marginTop: 12 }} onClick={reload}>다시 시도</button>
    </div>
  )
}

export function AcademicHub({ go }: { go: (r: Route) => void }) {
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

export function Grades({ back }: { back: () => void }) {
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

export function Graduation({ back }: { back: () => void }) {
  const { data, loading, error, reload } = useFetch('graduation', fetchGraduation)

  return (
    <>
      <PageHeader title="졸업심사" back={back} />
      <div className="page" style={{ gap: 12 }}>
        {loading && <LoadingCard />}
        {error && !loading && <ErrorCard message={error} reload={reload} />}

        {!loading && !error && data && !data.available && (
          <>
            <div className="card empty-state">
              <Icon name="info" />
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>졸업심사 결과를 조회할 수 없습니다</div>
            </div>
            {data.notices.map((n, i) => (
              <div className="card dashed" key={i}>
                <Icon name="campaign" size={19} />
                <span>{n}</span>
              </div>
            ))}
          </>
        )}

        {!loading && !error && data?.available && (() => {
          const pass = isGraduationPass(data.finalVerdict)
          const failed = data.criteria.filter((c) => c.verdict !== '합격').length
          const tags = [data.certificationType, data.requiredCredits ? `기준 ${data.requiredCredits}학점` : null, data.student?.registeredTerms ? `등록 ${data.student.registeredTerms}학기` : null].filter(Boolean) as string[]
          return (
            <>
              <div className={pass ? 't-pass' : 't-fail'} style={{ borderRadius: 22, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name={pass ? 'check_circle' : 'error'} size={20} />
                  <span style={{ fontSize: 12.5, fontWeight: 800 }}>최종 졸업판정</span>
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: pass ? undefined : 'var(--fail-ink)', marginTop: 10 }}>{data.finalVerdict ?? '-'}</div>
                {tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 7, marginTop: 14, flexWrap: 'wrap' }}>
                    {tags.map((t) => (
                      <span key={t} style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fail-ink)', background: 'color-mix(in srgb, var(--surface) 70%, transparent)', padding: '6px 11px', borderRadius: 999 }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {data.notices.length > 0 && (
                <div className="card" style={{ padding: 14, display: 'flex', gap: 9, borderRadius: 16 }}>
                  <Icon name="campaign" size={18} color="var(--ink-3)" />
                  <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-2)', whiteSpace: 'pre-line' }}>{data.notices.join('\n')}</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-2)' }}>항목별 판정</span>
                {failed > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fail)' }}>{failed}개 미충족</span>}
              </div>

              {data.criteria.map((it) => {
                const itPass = it.verdict === '합격'
                const base = parseNumeric(it.standard)
                const got = parseNumeric(it.earned)
                const showBar = base !== null && got !== null && base > 0
                return (
                  <div className="card" key={it.category} style={{ padding: '14px 15px', borderRadius: 16 }}>
                    <div className="card-head">
                      <span className="card-title">{it.category}</span>
                      {it.verdict && <span className={itPass ? 't-pass' : 't-fail'} style={{ flex: 'none', fontSize: 11.5, fontWeight: 800, padding: '5px 10px', borderRadius: 8 }}>{it.verdict}</span>}
                    </div>
                    {showBar && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)' }}>기준 {it.standard}</span>
                        <Bar pct={Math.min(100, (got! / base!) * 100)} tone={itPass ? undefined : 'fail'} style={{ flex: 1 }} />
                        <span style={{ fontSize: 13, fontWeight: 800 }}>취득 {it.earned}</span>
                      </div>
                    )}
                    {!showBar && it.earned && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 9 }}>
                        <span style={{ fontSize: 20, fontWeight: 800 }}>{it.earned}</span>
                        {it.standard && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)' }}>기준 · {it.standard.replace('※ ', '')}</span>}
                      </div>
                    )}
                    {it.note && <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>{it.note}</div>}
                  </div>
                )
              })}
            </>
          )
        })()}
      </div>
    </>
  )
}

export function Profile({ back, onLogout }: { back: () => void; onLogout: () => void }) {
  const { student } = useSession()
  const [copied, setCopied] = useState('')
  const copy = (v: string) => {
    navigator.clipboard?.writeText(v)
    setCopied(v)
    setTimeout(() => setCopied(''), 1500)
  }
  if (!student) {
    return (
      <>
        <PageHeader title="학적 정보" back={back} />
        <div className="page"><LoadingCard /></div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="학적 정보" back={back} />
      <div className="page" style={{ gap: 12 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="avatar" style={{ width: 58, height: 58, borderRadius: 20, fontSize: 21 }}>{student.name?.[0] ?? '?'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="h1">{student.name ?? '-'}</span>
                <span className="muted" style={{ fontSize: 12 }}>{student.nameEnglish}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginTop: 4 }}>{student.studentNo} · {student.department}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            {student.academicStatus && <span className="pill t-pass" style={{ fontWeight: 800 }}>{student.academicStatus}</span>}
            {student.grade && <span className="pill">{student.grade}학년</span>}
            {student.rcInfo && <span className="pill" style={{ background: 'var(--fill)', color: 'var(--ink-2)' }}>{student.rcInfo}</span>}
          </div>
        </div>

        <div className="card" style={{ padding: '4px 16px' }}>
          <div className="kv"><span>전공</span><span>{student.major ?? '-'}</span></div>
          {student.doubleMajor && <div className="kv"><span>복수전공</span><span>{student.doubleMajor}</span></div>}
          {student.minor && <div className="kv"><span>부전공</span><span>{student.minor}</span></div>}
          <div className="kv"><span>실무전산</span><span>{student.practicalComputing ?? '-'}</span></div>
          <div className="kv"><span>공학인증</span><span>{student.engineeringCertification ?? '-'}</span></div>
          <div className="kv"><span>교육과정</span><span>{student.curriculumType ?? '-'}</span></div>
        </div>

        <div className="card" style={{ padding: '4px 16px' }}>
          {[['휴대폰', student.mobile], ['이메일', student.email]].map(([k, v]) => (
            v ? (
              <div className="kv" key={k}>
                <span>{k}</span><span>{v}</span>
                <button onClick={() => copy(v)} aria-label={`${k} 복사`} style={{ display: 'flex', color: 'var(--main-ink)' }}>
                  <Icon name={copied === v ? 'check' : 'content_copy'} size={19} />
                </button>
              </div>
            ) : null
          ))}
          <div className="kv"><span>주소</span><span>{student.address ?? '-'}</span></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '2px 4px', color: 'var(--ink-3)' }}>
          <Icon name="lock" size={18} />
          <span style={{ fontSize: 12.5, lineHeight: 1.55 }}>읽기 전용 정보입니다. 변경은 교무팀에 문의하세요.</span>
        </div>

        <button className="btn danger" onClick={onLogout}>로그아웃</button>
      </div>
    </>
  )
}
