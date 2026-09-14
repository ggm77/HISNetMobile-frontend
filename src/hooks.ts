import { useEffect, useEffectEvent, useSyncExternalStore } from 'react'
import { ApiError } from './api'
import { useSession } from './session'

export type FetchState<T> = { data: T | null; loading: boolean; error: string | null; reload: () => void }

// 응답을 키별로 메모리에 캐시한다. 같은 키를 쓰는 화면으로 다시 오면 캐시를 즉시 보여주고(스피너 없음),
// FRESH_MS 가 지난 것만 뒤에서 조용히 다시 받아 갱신한다(stale-while-revalidate).
// 진행 중인 요청은 키가 같으면 합쳐지므로, 여러 화면이 같은 API 를 동시에 불러도 요청은 한 번만 나간다.
const FRESH_MS = 60_000

type Entry = { data: unknown; hasData: boolean; error: string | null; time: number; pending: Promise<void> | null }
const store = new Map<string, Entry>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

// 로그아웃 시 호출한다. 다른 사용자의 데이터가 남지 않도록 전부 비운다.
export function clearCache() {
  store.clear()
  emit()
}

// prefix 와 같거나 `${prefix}:` 로 시작하는 키를 오래된 것으로 표시한다.
// 그 키를 쓰는 화면이 다음에 열릴 때 캐시를 보여주면서 바로 다시 받아온다.
export function invalidate(prefix: string) {
  for (const [k, e] of store) if (k === prefix || k.startsWith(`${prefix}:`)) store.set(k, { ...e, time: 0 })
}

function load(key: string, fetcher: () => Promise<unknown>, onExpire: () => void, force: boolean) {
  const cur = store.get(key)
  if (cur?.pending) return
  if (!force && cur?.hasData && Date.now() - cur.time < FRESH_MS) return
  const base = { data: cur?.data, hasData: cur?.hasData ?? false, time: cur?.time ?? 0 }
  const pending: Promise<void> = fetcher()
    .then(
      (data) => {
        if (store.get(key)?.pending !== pending) return // 그 사이 clearCache 됐으면 버린다
        store.set(key, { data, hasData: true, error: null, time: Date.now(), pending: null })
      },
      (e: unknown) => {
        if (store.get(key)?.pending !== pending) return
        if (e instanceof ApiError && e.code === 'SESSION_EXPIRED') {
          store.set(key, { ...base, error: null, pending: null })
          onExpire()
          return
        }
        store.set(key, { ...base, error: e instanceof Error ? e.message : '오류가 발생했습니다', pending: null })
      },
    )
    .finally(emit)
  store.set(key, { ...base, error: null, pending })
  emit()
}

// key 가 null 이면 아무것도 받지 않는다(data null, loading false). fetcher 는 key 가 null 이 아닐 때만 호출된다.
// key 는 요청을 구분하는 값을 전부 담아야 한다(예: `notices:${board}:${page}`). key 가 바뀌면 다시 받는다.
export function useFetch<T>(key: string | null, fetcher: () => Promise<T>): FetchState<T> {
  const { expire } = useSession()
  const entry = useSyncExternalStore(subscribe, () => (key === null ? undefined : store.get(key)))
  const start = useEffectEvent(() => {
    if (key !== null) load(key, fetcher, expire, false)
  })

  useEffect(() => {
    start()
  }, [key])

  return {
    data: entry?.hasData ? (entry.data as T) : null,
    loading: key !== null && !entry?.hasData && !entry?.error,
    // 캐시된 데이터가 있으면 뒤에서 갱신하다 실패해도 화면을 오류로 바꾸지 않고 기존 데이터를 유지한다.
    error: entry?.hasData ? null : (entry?.error ?? null),
    reload: () => {
      if (key !== null) load(key, fetcher, expire, true)
    },
  }
}
