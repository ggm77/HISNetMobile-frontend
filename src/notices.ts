import { useMemo } from 'react'
import { BOARD_LABEL, DEPT_CODE_BY_NAME, deptNoticesList, noticesList, type NoticeBoard, type SimpleNotice } from './api'
import { useFetch } from './hooks'

export type BoardKey = NoticeBoard | 'department'
export type FeedNotice = SimpleNotice & { boardKey: BoardKey; boardLabel: string; dept?: string }
export type SelectedNotice = { boardKey: BoardKey; id: string; dept?: string } | null

const BOARDS: NoticeBoard[] = ['general', 'scholarship', 'dormitory']

export const deptCodeFor = (departmentName?: string | null) => (departmentName ? DEPT_CODE_BY_NAME[departmentName] : undefined)

export const withBoard = (notices: SimpleNotice[], b: NoticeBoard): FeedNotice[] => notices.map((n) => ({ ...n, boardKey: b, boardLabel: BOARD_LABEL[b] }))
export const withDept = (notices: SimpleNotice[], departmentName: string): FeedNotice[] =>
  notices.map((n) => ({ ...n, boardKey: 'department' as const, boardLabel: '학부', dept: departmentName }))

// 일반·장학·생활관 게시판 1페이지를 모은 피드. 서버에 통합 조회 API 가 없어 게시판별로 받아 합친다.
export async function fetchBoardFeed(): Promise<FeedNotice[]> {
  const lists = await Promise.all(BOARDS.map(async (b) => withBoard((await noticesList(b, 1)).notices, b)))
  return lists.flat()
}

export async function fetchDeptFeed(deptCode: string, departmentName: string): Promise<FeedNotice[]> {
  return withDept((await deptNoticesList(deptCode, 1)).notices, departmentName)
}

const byNewest = (a: FeedNotice, b: FeedNotice) => (b.time ?? '').localeCompare(a.time ?? '')

// 게시판 피드와 학부 피드를 합친 "전체" 피드.
// 게시판 피드는 바로 받고, 학부 피드는 학적 정보(학부명)가 도착한 뒤 따로 받아 합친다. 학적 정보를 기다리느라
// 피드 전체가 늦어지지도, 학부명이 도착했을 때 게시판 피드를 한 번 더 받지도 않는다.
export function useMergedFeed(departmentName: string | null | undefined, enabled = true) {
  const deptCode = deptCodeFor(departmentName)
  const boards = useFetch(enabled ? 'feed' : null, fetchBoardFeed)
  const dept = useFetch(enabled && deptCode ? `feed:dept:${deptCode}` : null, async () =>
    deptCode && departmentName ? fetchDeptFeed(deptCode, departmentName) : [],
  )
  const feed = useMemo(() => (boards.data ? [...boards.data, ...(dept.data ?? [])].sort(byNewest) : null), [boards.data, dept.data])
  return { feed, loading: boards.loading, error: boards.error }
}
