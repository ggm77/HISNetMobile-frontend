import { useSyncExternalStore } from 'react'

const DESKTOP = '(min-width: 960px)'
export const useIsDesktop = () =>
  useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(DESKTOP)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(DESKTOP).matches,
  )

// 브라우저가 한가할 때 cb 를 한 번 실행한다. 반환값을 호출하면 취소된다. (requestIdleCallback 이 없는 Safari 는 타이머로 대신한다)
export function onIdle(cb: () => void): () => void {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(cb)
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(cb, 1000)
  return () => clearTimeout(id)
}

export const boardTone = (b: string) => (b === '학부' ? 't-main' : b === '장학' ? 't-pass' : '')
export const extTone = (ext: string) => (ext === 'PDF' ? 't-fail' : 't-main')
export const shortDate = (d: string) => d.slice(5).replace('-', '.')
