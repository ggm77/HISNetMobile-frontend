import { useEffect, useState } from 'react'
import { ApiError } from './api'
import { useSession } from './session'

export type FetchState<T> = { data: T | null; loading: boolean; error: string | null; reload: () => void }

export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[]): FetchState<T> {
  const { expire } = useSession()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await fetcher()
        if (!alive) return
        setData(d)
        setLoading(false)
      } catch (e) {
        if (!alive) return
        if (e instanceof ApiError && e.code === 'SESSION_EXPIRED') {
          expire()
          return
        }
        setError(e instanceof Error ? e.message : '오류가 발생했습니다')
        setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { data, loading, error, reload: () => setTick((t) => t + 1) }
}
