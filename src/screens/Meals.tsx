import { useState } from 'react'
import { meals as fetchMeals } from '../api'
import { useFetch } from '../hooks'
import { itemsForSlot, slotOptions } from '../meals'
import { Icon, PageHeader, UnderlineTabs } from '../ui'

const WEEK = ['일', '월', '화', '수', '목', '금', '토']

export default function Meals({ back }: { back?: () => void }) {
  const { data, loading, error, reload } = useFetch(fetchMeals, [])
  const cafeterias = data?.cafeterias ?? []
  const [placeSel, setPlaceSel] = useState<string | null>(null)
  const [timeSel, setTimeSel] = useState<string | null>(null)

  const place = placeSel && cafeterias.some((c) => c.name === placeSel) ? placeSel : (cafeterias[0]?.name ?? null)
  const current = cafeterias.find((c) => c.name === place)
  const times = slotOptions(current)
  const time = timeSel && times.includes(timeSel) ? timeSel : (times.includes('점심') ? '점심' : (times[0] ?? null))

  const list = time ? itemsForSlot(current, time) : []
  const date = data?.date ? new Date(data.date) : null
  const label = date ? `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} (${WEEK[date.getDay()]})` : ''

  return (
    <>
      <PageHeader
        title="식단표"
        back={back}
        flat
        right={label ? <span style={{ whiteSpace: 'nowrap', fontSize: 14, fontWeight: 800 }}>{label}</span> : null}
      >
        {cafeterias.length > 0 && place && <UnderlineTabs options={cafeterias.map((c) => c.name)} value={place} onChange={setPlaceSel} />}
      </PageHeader>

      <div className="page" style={{ gap: 12 }}>
        {loading && <div className="card empty-state"><Icon name="hourglass_empty" /><div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>불러오는 중…</div></div>}

        {error && !loading && (
          <div className="card empty-state">
            <Icon name="error" />
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>{error}</div>
            <button className="btn sm" style={{ marginTop: 12 }} onClick={reload}>다시 시도</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {times.length > 1 && (
              <div style={{ display: 'flex', gap: 6 }}>
                {times.map((t) => (
                  <button key={t} onClick={() => setTimeSel(t)} className={`chip ${t === time ? 'on' : ''}`} style={{ flex: 1, height: 38, borderRadius: 12, justifyContent: 'center', fontSize: 13.5 }}>{t}</button>
                ))}
              </div>
            )}

            {list.length === 0 && (
              <div className="card empty-state">
                <Icon name="no_meals" />
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>등록된 메뉴가 없습니다</div>
              </div>
            )}

            {list.map((m) => (
              <div className="card" key={m.corner} style={{ padding: 17 }}>
                <div className="card-head">
                  <span style={{ fontSize: 16, fontWeight: 800 }}>{m.corner}</span>
                </div>
                <div style={{ marginTop: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {m.menu.map((x, i) => <div key={i} style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.5 }}>{x}</div>)}
                </div>
              </div>
            ))}

            <div className="card dashed">
              <Icon name="info" size={19} />
              <span>오늘 메뉴가 등록되지 않은 식당은 표시하지 않습니다. 식단표는 당일 기준으로만 제공됩니다.</span>
            </div>
          </>
        )}
      </div>
    </>
  )
}
