import { useState } from 'react'
import { meals as fetchMeals } from '../api'
import { useFetch } from '../hooks'
import { cornerMeals, type CornerSlot } from '../meals'
import { Icon, PageHeader, UnderlineTabs } from '../ui'

const WEEK = ['일', '월', '화', '수', '목', '금', '토']

function CornerCard({ corner, slots }: { corner: string; slots: CornerSlot[] }) {
  const [sel, setSel] = useState(slots.find((s) => s.slot === '점심')?.slot ?? slots[0].slot)
  const active = slots.find((s) => s.slot === sel) ?? slots[0]

  return (
    <div className="card" style={{ padding: 17 }}>
      <div className="card-head">
        <span style={{ fontSize: 16, fontWeight: 800 }}>{corner}</span>
      </div>
      {slots.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {slots.map((s) => (
            <button key={s.slot} onClick={() => setSel(s.slot)} className={`chip ${s.slot === active.slot ? 'on' : ''}`} style={{ flex: 1, height: 34, borderRadius: 12, justifyContent: 'center', fontSize: 13 }}>{s.slot}</button>
          ))}
        </div>
      )}
      <div style={{ marginTop: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {active.menu.map((x, i) => <div key={i} style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.5 }}>{x}</div>)}
      </div>
    </div>
  )
}

export default function Meals({ back }: { back?: () => void }) {
  const { data, loading, error, reload } = useFetch('meals', fetchMeals)
  const cafeterias = data?.cafeterias ?? []
  const [placeSel, setPlaceSel] = useState<string | null>(null)

  const place = placeSel && cafeterias.some((c) => c.name === placeSel) ? placeSel : (cafeterias[0]?.name ?? null)
  const current = cafeterias.find((c) => c.name === place)
  const corners = cornerMeals(current)
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
            {corners.length === 0 && (
              <div className="card empty-state">
                <Icon name="no_meals" />
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>등록된 메뉴가 없습니다</div>
              </div>
            )}

            {corners.map((c) => <CornerCard key={c.corner} corner={c.corner} slots={c.slots} />)}

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
