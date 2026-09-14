import { useState, type FormEvent } from 'react'
import { ApiError, login, meals as fetchMeals } from '../api'
import { useFetch } from '../hooks'
import { itemsForSlot } from '../meals'
import { Icon } from '../ui'

export default function Login({ onLogin, onMeals }: { onLogin: () => void; onMeals: () => void }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { data: mealData } = useFetch(fetchMeals, [])
  const studentCafeteria = mealData?.cafeterias.find((c) => c.name === '학생식당')
  const lunch = itemsForSlot(studentCafeteria, '점심')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id || !pw) return setError('아이디와 비밀번호를 확인해주세요.')
    setError('')
    setSubmitting(true)
    try {
      await login(id, pw)
      onLogin()
    } catch (err) {
      if (err instanceof ApiError && err.status === 502) setError('히즈넷 서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.')
      else setError('아이디와 비밀번호를 확인해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login">
      <form className="login-inner" onSubmit={submit}>
        <div className="logo" style={{ width: 54, height: 54, borderRadius: 17, fontSize: 25 }}>H</div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 20 }}>HISNet</div>
        <div style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 6 }}>학사 정보를 한 곳에서</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 30 }}>
          <label>
            <span className="field-label">학번</span>
            <div className={`field ${error && !id ? 'error' : ''}`}>
              <input value={id} onChange={(e) => setId(e.target.value)} inputMode="numeric" autoComplete="username" placeholder="22000000" />
            </div>
          </label>
          <label>
            <span className="field-label">비밀번호</span>
            <div className={`field ${error && !pw ? 'error' : ''}`}>
              <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" style={{ letterSpacing: show ? 0 : '0.18em' }} />
              <button type="button" onClick={() => setShow(!show)} aria-label="비밀번호 표시" style={{ display: 'flex' }}>
                <Icon name={show ? 'visibility' : 'visibility_off'} />
              </button>
            </div>
          </label>
        </div>

        {error ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, color: 'var(--fail)' }}>
            <Icon name="info" size={16} />
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{error}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 14, color: 'var(--ink-3)' }}>
            <Icon name="info" size={16} />
            <span style={{ fontSize: 12.5, lineHeight: 1.45 }}>로그인 상태는 30분간 유지됩니다. 만료되면 다시 로그인 안내가 표시됩니다.</span>
          </div>
        )}

        <button className="btn" type="submit" disabled={submitting} style={{ marginTop: 18 }}>{submitting ? '로그인 중…' : '로그인'}</button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 16, fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>
          <span>학번 찾기</span>
          <span style={{ color: 'var(--line-3)' }}>|</span>
          <span>비밀번호 재설정</span>
        </div>

        <div className="divider">로그인 없이 볼 수 있어요</div>

        <div className="card" style={{ marginTop: 18, background: 'var(--bg)' }}>
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="restaurant" size={19} color="var(--main)" />
              <span className="card-title">오늘 식단</span>
            </div>
            {mealData?.date && <span className="muted" style={{ fontSize: 12 }}>{mealData.date.slice(5).replace('-', '.')}</span>}
          </div>
          {lunch.length === 0 ? (
            <div className="muted" style={{ marginTop: 13, fontSize: 13.5 }}>등록된 점심 메뉴가 없습니다</div>
          ) : (
            lunch.map((m, i) => (
              <div key={m.corner} style={i ? { marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line-2)' } : { marginTop: 13 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--main-ink)' }}>학생식당 · {m.corner} 점심</div>
                <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6 }}>{m.menu.join(' · ')}</div>
              </div>
            ))
          )}
          <button type="button" className="link" onClick={onMeals} style={{ marginTop: 14, fontSize: 13.5 }}>식단표 전체 보기</button>
        </div>
      </form>
    </div>
  )
}
