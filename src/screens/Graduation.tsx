import { graduation as fetchGraduation } from '../api'
import { isGraduationPass, parseNumeric } from '../graduation'
import { useFetch } from '../hooks'
import { Bar, ErrorCard, Icon, LoadingCard, PageHeader } from '../ui'

export default function Graduation({ back }: { back: () => void }) {
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
