import { BOARD_LABEL, DEPT_CODE_BY_NAME, deptNoticesList, noticesList, type NoticeBoard, type SimpleNotice } from './api'

export type BoardKey = NoticeBoard | 'department'
export type FeedNotice = SimpleNotice & { boardKey: BoardKey; boardLabel: string; dept?: string }
export type SelectedNotice = { boardKey: BoardKey; id: string; dept?: string } | null

const BOARDS: NoticeBoard[] = ['general', 'scholarship', 'dormitory']

export const deptCodeFor = (departmentName?: string | null) => (departmentName ? DEPT_CODE_BY_NAME[departmentName] : undefined)

// 게시판별 목록을 병합한 "전체" 피드. 서버에 통합 조회 API가 없어 각 게시판의 1페이지만 모아 최신순으로 정렬한다.
export async function fetchMergedFeed(departmentName?: string | null): Promise<FeedNotice[]> {
  const deptCode = deptCodeFor(departmentName)
  const calls: Promise<FeedNotice[]>[] = BOARDS.map(async (b) => {
    const res = await noticesList(b, 1)
    return res.notices.map((n) => ({ ...n, boardKey: b, boardLabel: BOARD_LABEL[b] }))
  })
  if (deptCode) {
    calls.push(
      deptNoticesList(deptCode, 1).then((res) =>
        res.notices.map((n) => ({ ...n, boardKey: 'department' as const, boardLabel: '학부', dept: departmentName ?? undefined })),
      ),
    )
  }
  const lists = await Promise.all(calls)
  return lists.flat().sort((a, b) => (b.time ?? '').localeCompare(a.time ?? ''))
}
