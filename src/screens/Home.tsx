import { useState } from 'react'
import { grades as fetchGrades, graduation as fetchGraduation, meals as fetchMeals, reservationsList, timetable as fetchTimetable } from '../api'
import { useFetch } from '../hooks'
import { boardTone, shortDate } from '../lib'
import { itemsForSlot, slotOptions } from '../meals'
import { fetchMergedFeed, type FeedNotice } from '../notices'
import { useSession } from '../session'
import { DAYS, flattenTimetable, periodLabel, todayIndex } from '../timetable'
import { Bar, Icon, Segmented, type Route } from '../ui'

const BOARD_FILTERS = ['전체', '일반', '장학', '생활관', '학부'] as const

export default function Home({ go, openNotice }: { go: (r: Route) => void; openNotice: (n: FeedNotice) => void }) {
  const { student } = useSession()
  const [boardFilter, setBoardFilter] = useState<(typeof BOARD_FILTERS)[number]>('전체')
  const TODAY = todayIndex()

  const { data: tt } = useFetch(fetchTimetable, [])
  const blocks = flattenTimetable(tt).filter((l) => l.day === TODAY).sort((a, b) => a.start - b.start)
  const next = blocks[0]

  const { data: mealData } = useFetch(fetchMeals, [])
  const [time, setTime] = useState('점심')
  const studentCafeteria = mealData?.cafeterias.find((c) => c.name === '학생식당')
  const availTimes = slotOptions(studentCafeteria)
  const activeTime = availTimes.includes(time) ? time : (availTimes[0] ?? time)
  const todayMeals = itemsForSlot(studentCafeteria, activeTime)

  const { data: feed } = useFetch(() => fetchMergedFeed(student?.department), [student?.department])
  const filteredFeed = (feed ?? []).filter((n) => boardFilter === '전체' || n.boardLabel === boardFilter)

  const { data: reservationData } = useFetch(() => reservationsList('active'), [])
  const { data: gradeData } = useFetch(fetchGrades, [])
  const { data: gradData } = useFetch(fetchGraduation, [])

  return (
    <>
      <div className="header desktop-hide" style={{ padding: '14px 20px 16px' }}>
        <div className="header-row">
          <div>
            <div className="h1">{student?.name ?? '…'}님</div>
            <div className="sub" style={{ marginTop: 3 }}>{student?.studentNo} · {student?.department} {student?.grade}학년</div>
          </div>
          <button className="avatar" onClick={() => go('profile')}>{student?.name?.[0] ?? '?'}</button>
        </div>
      </div>

      <div className="page">
        <div className="grid-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {next && (
              <button className="hero" onClick={() => go('timetable')} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="pill">다음 수업</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--on-main-2)' }}>
                      {DAYS[TODAY]}요일 {periodLabel(next)}{next.start === next.end ? '' : '교시'}
                    </span>
                  </div>
                  <div style={{ fontSize: 'clamp(21px, 2.4vw, 30px)', fontWeight: 800, letterSpacing: '-0.02em', marginTop: 14 }}>{next.title}</div>
                  <div className="hero-meta">
                    <span><Icon name="location_on" />{next.room}</span>
                    <span><Icon name="person" />{next.meta}</span>
                    <span className="desktop-only"><Icon name="tag" />{next.section} 분반</span>
                  </div>
                </div>
                <div className="desktop-only" style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-main-2)' }}>오늘 남은 수업</div>
                  <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 8 }}>{blocks.length}</div>
                </div>
              </button>
            )}

            <div className="card" style={{ paddingBottom: 6 }}>
              <div className="card-head" style={{ marginBottom: 12 }}>
                <span className="card-title">오늘 수업</span>
                <span className="pill">{TODAY >= 0 ? `${DAYS[TODAY]}요일` : '주말'}</span>
              </div>
              {blocks.map((l, i) => (
                <div className="row" key={i}>
                  <span className={`period ${i === 0 ? 'solid' : ''}`}>{periodLabel(l)}</span>
                  <span className="row-title">{l.title}</span>
                  <span className="muted">{l.room}</span>
                  <span className="muted desktop-only" style={{ width: 80, textAlign: 'right' }}>{l.meta}</span>
                </div>
              ))}
              {blocks.length === 0 && <div className="muted" style={{ fontSize: 13, padding: '10px 0' }}>오늘 수업이 없습니다</div>}
            </div>

            <div className="card" style={{ paddingBottom: 8 }}>
              <div className="card-head" style={{ marginBottom: 10 }}>
                <span className="card-title">새 공지</span>
                <div className="chips desktop-only">
                  {BOARD_FILTERS.map((b) => (
                    <button key={b} className={`chip ${b === boardFilter ? 'on' : ''}`} style={{ height: 30, padding: '0 12px', fontSize: 12.5 }} onClick={() => setBoardFilter(b)}>{b}</button>
                  ))}
                </div>
                <button className="link desktop-hide" onClick={() => go('notices')}>모두 보기</button>
              </div>
              {filteredFeed.slice(0, 4).map((n, i) => (
                <button key={`${n.boardKey}-${n.id}`} onClick={() => openNotice(n)} className={`row notice-row ${i >= 2 ? 'desktop-only' : ''}`} style={{ width: '100%', textAlign: 'left' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 'none' }}>
                    {n.pinned && <span className="tag t-fail">고정</span>}
                    <span className={`tag ${boardTone(n.boardLabel)}`}>{n.boardLabel}</span>
                  </span>
                  <span className="row-title ellipsis">{n.subject}</span>
                  <span className="muted desktop-only">{n.writer ?? '—'}</span>
                  <span className="muted" style={{ fontSize: 11.5 }}>{n.time ? shortDate(n.time) : ''}</span>
                </button>
              ))}
              {filteredFeed.length === 0 && <div className="muted" style={{ fontSize: 13, padding: '10px 0' }}>공지가 없습니다</div>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div className="card">
              <div className="card-head">
                <span className="card-title">오늘 식단</span>
                {availTimes.length > 0 && <Segmented options={availTimes} value={activeTime} onChange={setTime} />}
              </div>
              {todayMeals.map((m, i) => (
                <div key={m.corner} style={{ display: 'flex', gap: 12, ...(i ? { marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line-2)' } : { marginTop: 13 }) }}>
                  <span style={{ flex: 'none', width: 76, fontSize: 12.5, fontWeight: 800, color: 'var(--main-ink)' }}>{m.corner}</span>
                  <span style={{ flex: 1, fontSize: 14, lineHeight: 1.55 }}>{m.menu.join(' · ')}</span>
                </div>
              ))}
              {todayMeals.length === 0 && <div className="muted" style={{ fontSize: 13, marginTop: 13 }}>등록된 메뉴가 없습니다</div>}
              <button className="link" style={{ marginTop: 12 }} onClick={() => go('meals')}>식단표 전체 보기</button>
            </div>

            <div className="card desktop-only">
              <div className="card-head" style={{ marginBottom: 14 }}>
                <span className="card-title" style={{ fontSize: 16 }}>다가오는 예약</span>
                <button className="link" onClick={() => go('myReservations')}>전체</button>
              </div>
              {(reservationData?.reservations ?? []).slice(0, 3).map((r, i) => (
                <div key={r.bookingCode ?? i} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 13, marginTop: i ? 13 : 0, borderTop: '1px solid var(--line-2)' }}>
                  <div className={i === 0 ? 't-main' : ''} style={{ flex: 'none', width: 44, height: 44, borderRadius: 13, background: i ? 'var(--fill)' : undefined, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.1 }}>{r.date?.slice(5)}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{r.facilityName}</div>
                    <div className="muted" style={{ marginTop: 2 }}>{r.startTime} – {r.endTime}</div>
                  </div>
                </div>
              ))}
              {(reservationData?.reservations ?? []).length === 0 && <div className="muted" style={{ fontSize: 13 }}>예약된 시설이 없습니다</div>}
            </div>

            <div className="card desktop-only">
              <div className="card-head">
                <span className="card-title" style={{ fontSize: 16 }}>성적 요약</span>
                <button className="link" onClick={() => go('grades')}>자세히</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginTop: 14 }}>
                <div>
                  <div className="muted" style={{ fontSize: 11.5 }}>누적 평점</div>
                  <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{gradeData?.summary?.gpa ?? '-'}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11.5 }}>전공 평점</div>
                  <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.4 }}>{gradeData?.summary?.majorGpa ?? '-'}</div>
                </div>
              </div>
              {gradData?.available && gradData.requiredCredits && gradeData?.summary?.earnedCredits != null && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>
                    <span>취득학점</span>
                    <span>{gradeData.summary.earnedCredits} / {gradData.requiredCredits}</span>
                  </div>
                  <Bar pct={(gradeData.summary.earnedCredits / gradData.requiredCredits) * 100} style={{ height: 8, marginTop: 8 }} />
                </>
              )}
              {gradData?.available && (
                <div style={{ marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`pill ${gradData.finalVerdict === '졸업가능' ? 't-pass' : 't-fail'}`}>{gradData.finalVerdict}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{gradData.criteria.filter((x) => x.verdict !== '합격').length}개 항목 미충족</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
