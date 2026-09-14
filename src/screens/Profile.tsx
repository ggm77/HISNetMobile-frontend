import { useState } from 'react'
import { useSession } from '../session'
import { Icon, LoadingCard, PageHeader } from '../ui'

export default function Profile({ back, onLogout }: { back: () => void; onLogout: () => void }) {
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
