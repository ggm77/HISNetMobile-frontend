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

export const boardTone = (b: string) => (b === '학부' ? 't-main' : b === '장학' ? 't-pass' : '')
export const extTone = (ext: string) => (ext === 'PDF' ? 't-fail' : 't-main')
export const shortDate = (d: string) => d.slice(5).replace('-', '.')
