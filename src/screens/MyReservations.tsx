import { useState } from 'react'
import { cancelReservation, reservationsList, type ReservationStatus } from '../api'
import { invalidate, useFetch } from '../hooks'
import { Icon, PageHeader, UnderlineTabs } from '../ui'

const STATUSES: { label: string; value: ReservationStatus }[] = [
  { label: '진행중', value: 'active' },
  { label: '이용완료', value: 'completed' },
  { label: '취소', value: 'cancelled' },
  { label: '노쇼', value: 'noshow' },
]

export default function MyReservations({ back, toast }: { back?: () => void; toast: (s: string) => void }) {
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
