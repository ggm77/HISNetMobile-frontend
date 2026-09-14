import { useState } from 'react'
import { timetable as fetchTimetable } from '../api'
import { useFetch } from '../hooks'
import { DAYS, flattenTimetable, periodLabel, todayIndex } from '../timetable'
import { Icon, PageHeader } from '../ui'

const ROW = 50 // 46px 칸 + 4px 간격

export default function Timetable() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const { data, loading, error, reload } = useFetch('timetable', fetchTimetable)
  const TODAY = todayIndex()
  const blocks = flattenTimetable(data)
  const courses = [...new Map(blocks.map((l) => [l.title, l])).values()]
  const PERIODS = Math.max(9, ...blocks.map((b) => b.end), 0)

  return (
    <>
      <PageHeader
        title={<span style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>시간표 <span className="pill" style={{ fontSize: 12.5, padding: '4px 9px' }}>현재 학기</span></span>}
        right={
          <div className="seg icons">
            <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} aria-label="격자"><Icon name="grid_view" /></button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="목록"><Icon name="format_list_bulleted" /></button>
          </div>
        }
      >
        {view === 'grid' && !loading && !error && <div className="sub" style={{ fontSize: 12, marginTop: 6 }}>교시 단위로 표시합니다 · 총 {courses.length}과목</div>}
      </PageHeader>

      <div className="page">
        {loading && <div className="card empty-state"><Icon name="hourglass_empty" /><div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>불러오는 중…</div></div>}

        {error && !loading && (
          <div className="card empty-state">
            <Icon name="error" />
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>{error}</div>
            <button className="btn sm" style={{ marginTop: 12 }} onClick={reload}>다시 시도</button>
          </div>
        )}

        {!loading && !error && (view === 'grid' ? (
          <>
            <div className="tt">
              <div className="tt-periods">
                {Array.from({ length: PERIODS }, (_, i) => <span key={i}>{i + 1}</span>)}
              </div>
              <div className="tt-days">
                <div className="tt-head">
                  {DAYS.map((d, i) => <span key={d} className={i === TODAY ? 'today' : ''}>{d}</span>)}
                </div>
                <div className="tt-cols">
                  {DAYS.map((d, di) => (
                    <div key={d} className="tt-col">
                      {blocks.filter((l) => l.day === di).map((l, i) => (
                        <div key={i} className="tt-block" style={{ top: (l.start - 1) * ROW, height: (l.end - l.start + 1) * ROW - 4 }} title={`${l.title} · ${l.room ?? ''}`}>
                          <b>{l.title}</b>
                          <small>{(l.room ?? '').replace('HCA ', '')}</small>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-2)', marginBottom: 8 }}>수강 과목</div>
              {courses.map((c) => (
                <div className="row" key={c.title} style={{ gap: 10, padding: '9px 0' }}>
                  <span style={{ flex: 'none', width: 8, height: 8, borderRadius: 3, background: 'var(--main)' }} />
                  <span className="row-title" style={{ fontSize: 14 }}>{c.title} <span className="muted" style={{ fontSize: 12 }}>{c.section}</span></span>
                  <span className="muted">{c.meta}</span>
                </div>
              ))}
              {courses.length === 0 && <div className="muted" style={{ fontSize: 13, padding: '8px 0' }}>수강 중인 과목이 없습니다</div>}
            </div>
          </>
        ) : (
          <>
            {DAYS.map((d, di) => {
              const items = blocks.filter((l) => l.day === di)
              if (!items.length) return null
              const today = di === TODAY
              return (
                <div key={d} className="card" style={{ padding: '15px 16px', ...(today ? { border: '1.5px solid var(--main)' } : {}) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: today ? 'var(--main)' : 'var(--ink-3)' }}>{d}요일</span>
                    {today && <span className="tag" style={{ background: 'var(--main)', color: '#fff' }}>오늘</span>}
                  </div>
                  {items.map((l, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', ...(i ? { marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line-2)' } : {}) }}>
                      <span className={`period ${today && i === 0 ? 'solid' : ''}`} style={{ width: 46, height: 28, fontSize: 11.5 }}>{periodLabel(l)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{l.title}</div>
                        <div className="muted" style={{ marginTop: 3 }}>{l.room} · {l.meta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
            {blocks.length === 0 && (
              <div className="card empty-state">
                <Icon name="event_busy" />
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>수강 중인 과목이 없습니다</div>
              </div>
            )}
            {blocks.length > 0 && (
              <div className="muted" style={{ textAlign: 'center', padding: '4px 0' }}>
                {DAYS.filter((_, i) => !blocks.some((l) => l.day === i)).join(' · ')} 수업 없음
              </div>
            )}
          </>
        ))}
      </div>
    </>
  )
}
