import type { Timetable } from './api'

export const DAYS = ['월', '화', '수', '목', '금', '토'] as const
const TONES = ['main', 'soft', 'mute'] as const

export type Block = { day: number; start: number; end: number; title: string; short?: string; room: string | null; meta: string | null; section: string | null; tone: (typeof TONES)[number] }

export function todayIndex(): number {
  const idx = new Date().getDay() - 1
  return idx >= 0 && idx <= 5 ? idx : -1
}

export function flattenTimetable(tt: Timetable | null): Block[] {
  if (!tt) return []
  const blocks: Block[] = []
  tt.courses.forEach((c, ci) => {
    const tone = TONES[ci % TONES.length]
    c.slots.forEach((s) => {
      const day = DAYS.indexOf(s.day)
      if (day === -1) return
      blocks.push({ day, start: s.startPeriod, end: s.endPeriod, title: c.name, room: s.room, meta: c.professor, section: c.section, tone })
    })
  })
  return blocks
}

export const periodLabel = (l: { start: number; end: number }) => (l.start === l.end ? `${l.start}교시` : `${l.start}–${l.end}`)
