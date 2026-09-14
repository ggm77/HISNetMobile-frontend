import type { CafeteriaMeal } from './api'

export type MealItem = { corner: string; menu: string[]; soloTag: boolean }

export function slotOptions(cafeteria: CafeteriaMeal | undefined): string[] {
  if (!cafeteria) return []
  const set = new Set<string>()
  cafeteria.corners.forEach((c) => c.meals.forEach((m) => set.add(m.slot)))
  return [...set]
}

export function itemsForSlot(cafeteria: CafeteriaMeal | undefined, slot: string): MealItem[] {
  if (!cafeteria) return []
  return cafeteria.corners
    .map((c) => {
      const m = c.meals.find((x) => x.slot === slot)
      if (!m) return null
      return { corner: c.name, menu: m.items, soloTag: c.meals.length === 1 }
    })
    .filter((x): x is MealItem => x !== null)
}
