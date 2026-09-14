import { useState } from 'react'
import {
  ApiError,
  cancelReservation,
  createReservation,
  facilities as fetchFacilities,
  facilityAvailability,
  reservationsList,
  type Facility,
  type FacilityCategory,
  type ReservationStatus,
  type Slot,
} from '../api'
import { invalidate, useFetch } from '../hooks'
import { Bar, Icon, PageHeader, UnderlineTabs, type Route } from '../ui'

const WEEKDAY_KO: Record<string, string> = { MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일' }

const uiState = (s: Slot['status']) => (s === 'AVAILABLE' ? 'free' : s === 'RESERVED_MINE' ? 'mine' : 'taken')

export function Reserve({ go, toast }: { go: (r: Route) => void; toast: (s: string) => void }) {
  const { data: catalog } = useFetch('facilities', fetchFacilities)
  const categories = catalog?.categories ?? []
  const [catSel, setCatSel] = useState<FacilityCategory | null>(null)
  const [facilitySel, setFacilitySel] = useState<Facility | null>(null)
  const [day, setDay] = useState(0)
  const [range, setRange] = useState<[number, number] | null>(null)
  const [anchor, setAnchor] = useState<number | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [booking, setBooking] = useState(false)

  const cat = catSel && categories.some((c) => c.category === catSel) ? catSel : (categories[0]?.category ?? null)
  const currentCategory = categories.find((c) => c.category === cat)
  const facility = facilitySel && currentCategory?.facilities.some((f) => f.id === facilitySel.id) ? facilitySel : (currentCategory?.facilities[0] ?? null)

  const { data: avail, loading: availLoading, reload: reloadAvail } = useFetch(facility ? `availability:${facility.id}` : null, () => facilityAvailability(facility!.id))
  const days = avail?.days ?? []
  const activeDay = days[day]
  const slots = activeDay?.slots ?? []
  const quota = avail?.quota ?? null

  // 첫 탭으로 시작 슬롯을 고르고, 다른 슬롯을 한 번 더 탭하면 그 사이로 범위가 넓어진다.
  // 같은 슬롯을 다시 탭하면 선택이 취소된다.
  const onSlotClick = (i: number) => {
    if (slots[i]?.status !== 'AVAILABLE') return
    if (anchor === i) {
      setAnchor(null)
      setRange(null)
      return
    }
    if (anchor === null) {
      setAnchor(i)
      setRange([i, i])
      return
    }
    const [a, b] = anchor <= i ? [anchor, i] : [i, anchor]
    let end = b
    for (let s = a; s <= b; s++) if (slots[s]?.status !== 'AVAILABLE') { end = s - 1; break }
    setAnchor(null)
    if (end < a) return
    const maxSlots = quota?.dailyRemainingMinutes ? Math.max(1, Math.floor(quota.dailyRemainingMinutes / 30)) : slots.length
    setRange([a, Math.min(end, a + maxSlots - 1)])
  }

  const start = range ? slots[range[0]].start : ''
  const end = range ? slots[range[1]].end : ''
  const minutes = range ? (range[1] - range[0] + 1) * 30 : 0
  const dateLabel = activeDay ? `${activeDay.date.slice(5).replace('-', '.')} (${WEEKDAY_KO[activeDay.weekday] ?? activeDay.weekday})` : ''

  const book = async () => {
    if (!facility || !activeDay || !range) return
    setBooking(true)
    try {
      await createReservation(facility.id, activeDay.date, start, end)
      setConfirm(false)
      setRange(null)
      setAnchor(null)
      toast('예약이 신청되었습니다')
      // 다른 시설·날짜의 슬롯과 쿼터, 내 예약 목록도 달라졌으므로 캐시를 오래된 것으로 표시한다.
      invalidate('availability')
      invalidate('reservations')
      reloadAvail()
    } catch (e) {
      if (e instanceof ApiError && e.code === 'RESERVATION_SLOT_UNAVAILABLE') {
        toast('선택한 시간대는 예약할 수 없습니다')
        reloadAvail() // 그 사이 다른 사람이 잡은 슬롯을 반영한다
      } else toast(e instanceof Error ? e.message : '예약에 실패했습니다')
      setConfirm(false)
    } finally {
      setBooking(false)
    }
  }

  return (
    <>
      <PageHeader title="시설 예약" flat right={<button className="link" style={{ fontSize: 13 }} onClick={() => go('myReservations')}>내 예약</button>}>
        {categories.length > 0 && (
          <UnderlineTabs
            options={categories.map((c) => c.category)}
            value={cat ?? categories[0].category}
            onChange={(c) => { setCatSel(c); setFacilitySel(null); setDay(0); setRange(null); setAnchor(null) }}
            label={(c) => categories.find((x) => x.category === c)?.categoryName ?? c}
          />
        )}
      </PageHeader>

      <div className="page" style={{ gap: 12 }}>
        {!catalog && <div className="card empty-state"><Icon name="hourglass_empty" /><div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>불러오는 중…</div></div>}

        {currentCategory && (
          <div className="chips">
            {currentCategory.facilities.map((f) => (
              <button key={f.id} className={`chip main ${f.id === facility?.id ? 'on' : ''}`} style={{ height: 32, padding: '0 13px', fontSize: 12.5 }} onClick={() => { setFacilitySel(f); setDay(0); setRange(null); setAnchor(null) }}>{f.name}</button>
            ))}
          </div>
        )}

        {quota && (
          <div className="card" style={{ padding: 14, borderRadius: 16 }}>
            <div className="card-head" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>
              <span>예약 가능 시간</span>
              {quota.resetDate && <span className="muted" style={{ fontSize: 11.5 }}>{quota.resetDate.slice(5).replace('-', '.')} 초기화</span>}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 11 }}>
              {([['총 잔여', quota.totalRemainingMinutes, quota.totalLimitMinutes], ['오늘 잔여', quota.dailyRemainingMinutes, quota.dailyLimitMinutes]] as const).map(([k, v, t]) => (
                v != null && t ? (
                  <div key={k} style={{ flex: 1 }}>
                    <div className="muted" style={{ fontSize: 11.5 }}>{k}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
                      <span style={{ fontSize: 18, fontWeight: 800 }}>{v}</span>
                      <span className="muted" style={{ fontSize: 12 }}>/ {t}분</span>
                    </div>
                    <Bar pct={(v / t) * 100} style={{ height: 6, marginTop: 6 }} />
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}

        {days.length > 0 && (
          <div className="days">
            {days.map((d, i) => (
              <button key={d.date} className={`day ${i === day ? 'on' : ''}`} onClick={() => { setDay(i); setRange(null); setAnchor(null) }}>
                <small className={d.weekday === 'SAT' || d.weekday === 'SUN' ? 'weekend' : ''}>{WEEKDAY_KO[d.weekday] ?? d.weekday}</small>
                <b>{Number(d.date.slice(8))}</b>
              </button>
            ))}
          </div>
        )}

        <div className="legend" style={{ marginTop: 2 }}>
          <span><i style={{ background: 'var(--surface)', border: '1px solid var(--line-3)' }} />가능</span>
          <span><i style={{ background: 'var(--main)' }} />선택</span>
          <span><i style={{ background: 'var(--main-10)', border: '1px solid var(--main-soft)' }} />내 예약</span>
          <span><i style={{ background: 'var(--line-3)' }} />예약됨</span>
        </div>

        {slots.length > 0 && (
          <div className="muted" style={{ fontSize: 12, marginTop: -6 }}>
            {anchor === null ? '시작 시간을 탭하세요' : '종료 시간을 탭하세요 (같은 칸을 다시 탭하면 취소)'}
          </div>
        )}

        {availLoading && <div className="muted" style={{ fontSize: 13, padding: '10px 0' }}>슬롯을 불러오는 중…</div>}

        {!availLoading && slots.length > 0 && (
          <div className="slots">
            {slots.map((s, i) => {
              const sel = range && i >= range[0] && i <= range[1]
              const st = uiState(s.status)
              return (
                <button key={s.start} disabled={st !== 'free'} className={`slot ${sel ? 'sel' : st}`} onClick={() => onSlotClick(i)}>
                  {s.start}
                </button>
              )
            })}
          </div>
        )}
        {!availLoading && facility && slots.length === 0 && <div className="muted" style={{ fontSize: 13, padding: '10px 0' }}>운영 시간이 없는 날입니다</div>}

        <div className="book-bar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
            <span style={{ whiteSpace: 'nowrap', fontSize: 14, fontWeight: 800 }}>{range ? `${dateLabel} ${start} – ${end}` : '위에서 시간을 선택하세요'}</span>
            {range && <span className="muted">{minutes}분</span>}
          </div>
          <button className="btn" style={{ height: 52, fontSize: 16 }} disabled={!range} onClick={() => setConfirm(true)}>예약 신청</button>
        </div>
      </div>

      {confirm && range && facility && (
        <div className="sheet-backdrop" onClick={() => setConfirm(false)}>
          <div className="sheet" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <div className="grip" />
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>이 시간에 예약할까요?</div>
            <div className="card" style={{ marginTop: 18, padding: '0 16px' }}>
              <div className="kv"><span style={{ width: 76 }}>시설</span><span>{facility.name}</span></div>
              <div className="kv"><span style={{ width: 76 }}>이용일</span><span>{activeDay?.date} ({WEEKDAY_KO[activeDay?.weekday ?? ''] ?? activeDay?.weekday})</span></div>
              <div className="kv"><span style={{ width: 76 }}>시간</span><span>{start} – {end} <span className="muted">· {minutes}분</span></span></div>
              {quota?.dailyRemainingMinutes != null && (
                <div className="kv"><span style={{ width: 76 }}>남는 쿼터</span><span>오늘 {quota.dailyRemainingMinutes - minutes}분 {quota.totalRemainingMinutes != null && <span className="muted">· 총 {quota.totalRemainingMinutes - minutes}분</span>}</span></div>
              )}
            </div>
            <div className="warn" style={{ marginTop: 14 }}>
              <Icon name="warning" />
              <div style={{ flex: 1 }}>이용 시작 <b>1시간 전</b>까지는 취소할 수 있습니다. 이후 취소하면 벌점이 부여됩니다.</div>
            </div>
            <button className="btn" style={{ marginTop: 16 }} disabled={booking} onClick={book}>{booking ? '신청 중…' : '예약 신청'}</button>
            <button className="btn text" style={{ marginTop: 4 }} onClick={() => setConfirm(false)}>다시 고르기</button>
          </div>
        </div>
      )}
    </>
  )
}

const STATUSES: { label: string; value: ReservationStatus }[] = [
  { label: '진행중', value: 'active' },
  { label: '이용완료', value: 'completed' },
  { label: '취소', value: 'cancelled' },
  { label: '노쇼', value: 'noshow' },
]

export function MyReservations({ back, toast }: { back?: () => void; toast: (s: string) => void }) {
  const [tab, setTab] = useState<ReservationStatus>('active')
  const [pending, setPending] = useState<number | null>(null)
  const { data, loading, reload } = useFetch(`reservations:${tab}`, () => reservationsList(tab))
  const list = data?.reservations ?? []

  const cancel = async (code: number) => {
    try {
      await cancelReservation(code)
      toast('예약이 취소되었습니다')
      invalidate('reservations')
      invalidate('availability')
      reload()
    } catch (e) {
      toast(e instanceof Error ? e.message : '취소에 실패했습니다')
    } finally {
      setPending(null)
    }
  }

  return (
    <>
      <PageHeader title="내 예약" back={back} flat>
        <UnderlineTabs options={STATUSES.map((s) => s.value)} value={tab} onChange={setTab} label={(v) => STATUSES.find((s) => s.value === v)?.label ?? v} />
      </PageHeader>
      <div className="page" style={{ gap: 12 }}>
        {loading && <div className="card empty-state"><Icon name="hourglass_empty" /><div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>불러오는 중…</div></div>}

        {!loading && list.map((r, i) => (
          <div className="card" key={r.bookingCode ?? i} style={{ borderRadius: 20, padding: 17 }}>
            <div style={{ fontSize: 17.5, fontWeight: 800 }}>{r.facilityName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, fontSize: 14, fontWeight: 600 }}>
              <Icon name="schedule" size={17} color="var(--ink-3)" />
              <span>{r.date} {r.startTime} – {r.endTime}</span>
            </div>
            {tab === 'active' && (
              <div style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span className="muted" style={{ fontSize: 12 }}>{r.cancelableUntil ? `취소 가능 ${r.cancelableUntil}까지` : ''}</span>
                {r.bookingCode != null && (pending === r.bookingCode ? (
                  <span style={{ display: 'flex', gap: 6 }}>
                    <button className="btn secondary" style={{ height: 36, fontSize: 13 }} onClick={() => setPending(null)}>유지</button>
                    <button className="btn" style={{ height: 36, fontSize: 13, width: 'auto', padding: '0 14px', background: 'var(--fail)', borderRadius: 12 }} onClick={() => cancel(r.bookingCode!)}>취소 확정</button>
                  </span>
                ) : (
                  <button onClick={() => setPending(r.bookingCode)} style={{ fontSize: 13, fontWeight: 700, color: 'var(--fail)', border: '1px solid var(--line)', padding: '8px 14px', borderRadius: 12 }}>예약 취소</button>
                ))}
              </div>
            )}
          </div>
        ))}
        {!loading && list.length === 0 && (
          <div className="card empty-state">
            <Icon name="inbox" />
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>{STATUSES.find((s) => s.value === tab)?.label} 내역이 없습니다</div>
          </div>
        )}
        <div className="card dashed">
          <Icon name="info" size={19} />
          <span>이용완료 · 취소 · 노쇼 내역은 원본이 취소 정보를 주지 않아 조회만 가능합니다.</span>
        </div>
      </div>
    </>
  )
}
