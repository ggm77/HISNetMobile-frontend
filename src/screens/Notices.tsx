import { useState } from 'react'
import type { Notice, NoticeBoard } from '../api'
import { deptNoticeAttachmentUrl, deptNoticeDetail, deptNoticesList, noticeAttachmentUrl, noticeDetail, noticesList } from '../api'
import { useFetch } from '../hooks'
import { boardTone, useIsDesktop } from '../lib'
import { deptCodeFor, fetchMergedFeed, type FeedNotice, type SelectedNotice } from '../notices'
import { useSession } from '../session'
import { Icon, PageHeader } from '../ui'

const BOARD_TABS = ['전체', '일반', '장학', '생활관', '학부'] as const
type BoardTab = (typeof BOARD_TABS)[number]
const TAB_TO_KEY: Record<BoardTab, NoticeBoard | 'department' | 'all'> = { 전체: 'all', 일반: 'general', 장학: 'scholarship', 생활관: 'dormitory', 학부: 'department' }

type ListResult = { notices: FeedNotice[]; page: number; totalPages: number; hasNext: boolean; hasPrevious: boolean }

function extOf(name: string) {
  const i = name.lastIndexOf('.')
  return i === -1 ? '' : name.slice(i + 1).toUpperCase()
}

function attachmentUrl(sel: { boardKey: string; id: string; dept?: string }, index: number, name: string) {
  return sel.boardKey === 'department'
    ? deptNoticeAttachmentUrl(sel.dept ?? '', sel.id, index, name)
    : noticeAttachmentUrl(sel.boardKey as NoticeBoard, sel.id, index, name)
}

function Detail({ sel, n, onBack }: { sel: SelectedNotice; n: Notice; onBack?: () => void }) {
  if (!sel) return null
  return (
    <article>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        {onBack ? (
          <button onClick={onBack} aria-label="목록으로" style={{ display: 'flex' }}><Icon name="arrow_back" size={24} /></button>
        ) : <span />}
        <div style={{ display: 'flex', gap: 16, color: 'var(--ink-2)' }}>
          <button aria-label="북마크" style={{ display: 'flex' }}><Icon name="bookmark_border" size={22} /></button>
          <button aria-label="인쇄" className="desktop-only" style={{ display: 'flex' }} onClick={() => window.print()}><Icon name="print" size={22} /></button>
          <button aria-label="공유" style={{ display: 'flex' }} onClick={() => navigator.share?.({ title: n.subject })}><Icon name="ios_share" size={22} /></button>
        </div>
      </div>
      <span className="pill" style={{ fontWeight: 800 }}>{n.category ?? (sel.boardKey === 'department' ? 'General Info(전체 공지)' : `${sel.boardKey}공지`)}</span>
      <h2 className="title" style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.35, margin: '14px 0 0', textWrap: 'pretty' }}>{n.subject}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12 }} className="muted">
        {n.writer && <><span>{n.writer}</span><span style={{ color: 'var(--line-3)' }}>·</span></>}
        <span>{n.time}</span>
        {n.read !== null && <><span style={{ color: 'var(--line-3)' }}>·</span><span>조회 {n.read?.toLocaleString()}</span></>}
      </div>
      {n.body && <div className="body-text" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--line-2)' }}>{n.body}</div>}
      {n.images.length > 0 && (
        <div style={{ marginTop: n.body ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {n.images.map((src) => <img key={src} src={src} alt="" style={{ borderRadius: 12 }} />)}
        </div>
      )}
      {n.files.length > 0 && (
        <div style={{ marginTop: 22, border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '11px 14px', background: 'var(--bg)', fontSize: 12.5, fontWeight: 800, color: 'var(--ink-2)' }}>첨부파일 {n.files.length}</div>
          {n.files.map((f) => (
            <a key={f.index} className="file" style={{ width: '100%', textAlign: 'left' }} href={attachmentUrl(sel, f.index, f.name)} target="_blank" rel="noreferrer">
              <span className="file-ext t-main">{extOf(f.name)}</span>
              <span className="ellipsis" style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{f.name}</span>
              <Icon name="download" size={21} color="var(--main-ink)" />
            </a>
          ))}
        </div>
      )}
    </article>
  )
}

export default function Notices({ selected, setSelected }: { selected: SelectedNotice; setSelected: (s: SelectedNotice) => void }) {
  const { student } = useSession()
  const [board, setBoard] = useState<BoardTab>('전체')
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const isDesktop = useIsDesktop()
  const deptCode = deptCodeFor(student?.department)

  const changeBoard = (b: BoardTab) => {
    setBoard(b)
    setPage(1)
  }

  const { data: listData, loading, error } = useFetch<ListResult>(async () => {
    if (board === '전체') {
      const notices = await fetchMergedFeed(student?.department)
      return { notices, page: 1, totalPages: 1, hasNext: false, hasPrevious: false }
    }
    const key = TAB_TO_KEY[board]
    if (key === 'department') {
      if (!deptCode) throw new Error('학부 정보를 확인할 수 없어 학부공지를 불러올 수 없습니다')
      const res = await deptNoticesList(deptCode, page)
      return { ...res, notices: res.notices.map((n) => ({ ...n, boardKey: 'department' as const, boardLabel: '학부', dept: student?.department ?? undefined })) }
    }
    const res = await noticesList(key as NoticeBoard, page)
    return { ...res, notices: res.notices.map((n) => ({ ...n, boardKey: key as NoticeBoard, boardLabel: { general: '일반', scholarship: '장학', dormitory: '생활관' }[key as NoticeBoard] })) }
  }, [board, page, deptCode, student?.department])

  const list = (listData?.notices ?? []).filter((n) => n.subject.includes(q))

  const { data: detail, loading: detailLoading } = useFetch<Notice | null>(async () => {
    if (!selected) return null
    if (selected.boardKey === 'department') {
      const dept = selected.dept ? deptCodeFor(selected.dept) : deptCode
      if (!dept) throw new Error('학부 정보를 확인할 수 없습니다')
      return deptNoticeDetail(dept, selected.id)
    }
    return noticeDetail(selected.boardKey as NoticeBoard, selected.id)
  }, [selected?.boardKey, selected?.id])

  if (selected && !isDesktop) {
    return (
      <div className="page" style={{ background: 'var(--surface)', minHeight: '100%' }}>
        {detailLoading && <div className="card empty-state"><Icon name="hourglass_empty" /><div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>불러오는 중…</div></div>}
        {!detailLoading && detail && <Detail sel={selected} n={detail} onBack={() => setSelected(null)} />}
      </div>
    )
  }

  return (
    <>
      <PageHeader title="공지">
        <label className="search" style={{ marginTop: 12, height: 44 }}>
          <Icon name="search" />
          <input placeholder="제목으로 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="chips" style={{ marginTop: 12 }}>
          {BOARD_TABS.map((b) => (
            <button key={b} className={`chip ${b === board ? 'on' : ''}`} onClick={() => changeBoard(b)}>{b}</button>
          ))}
        </div>
      </PageHeader>

      <div className="page wide">
        <div className="notice-split">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading && <div className="card empty-state"><Icon name="hourglass_empty" /><div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>불러오는 중…</div></div>}
            {error && !loading && <div className="card empty-state"><Icon name="error" /><div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>{error}</div></div>}

            {!loading && !error && list.map((n) => (
              <button key={`${n.boardKey}-${n.id}`} className={`notice-card ${isDesktop && selected?.id === n.id && selected?.boardKey === n.boardKey ? 'on' : ''}`} onClick={() => setSelected({ boardKey: n.boardKey, id: n.id, dept: n.dept })}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {n.pinned && <><Icon name="push_pin" size={15} color="var(--fail)" /><span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--fail)' }}>고정</span></>}
                  <span className={`tag ${boardTone(n.boardLabel)}`}>{n.boardLabel}</span>
                  {n.dept && <span className="muted" style={{ fontSize: 11 }}>{n.dept}</span>}
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.45, marginTop: 9, textWrap: 'pretty' }}>{n.subject}</div>
                <div className="meta">
                  {[n.writer, n.time, n.read !== null ? `조회 ${n.read?.toLocaleString()}` : null]
                    .filter(Boolean)
                    .map((m, i) => <span key={i} style={{ display: 'contents' }}>{i > 0 && <i>·</i>}<span>{m}</span></span>)}
                  {n.files > 0 && <><i>·</i><span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="attach_file" size={14} />{n.files}</span></>}
                </div>
              </button>
            ))}
            {!loading && !error && list.length === 0 && (
              <div className="card empty-state">
                <Icon name="inbox" />
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>검색 결과가 없습니다</div>
              </div>
            )}

            {board !== '전체' && listData && listData.totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '6px 0' }}>
                <button className="btn sm secondary" disabled={!listData.hasPrevious} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</button>
                <span className="muted" style={{ fontSize: 12.5 }}>{listData.page} / {listData.totalPages}</span>
                <button className="btn sm secondary" disabled={!listData.hasNext} onClick={() => setPage((p) => p + 1)}>다음</button>
              </div>
            )}
          </div>
          <div className={`detail ${selected ? '' : 'empty'}`}>
            {selected && detail ? <Detail sel={selected} n={detail} /> : (
              <div className="empty-state"><Icon name="article" /><div className="muted" style={{ marginTop: 10 }}>왼쪽에서 공지를 선택하세요</div></div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
