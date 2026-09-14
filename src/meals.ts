import type { CafeteriaMeal } from './api'

export type MealItem = { corner: string; menu: string[] }

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
      return { corner: c.name, menu: m.items }
    })
    .filter((x): x is MealItem => x !== null)
}

export type CornerSlot = { slot: string; menu: string[] }
export type CornerMeals = { corner: string; slots: CornerSlot[] }

// 코너별로 묶어서, 그 코너가 가진 끼니(아침/점심/저녁)만 순서대로 담는다.
export function cornerMeals(cafeteria: CafeteriaMeal | undefined): CornerMeals[] {
  if (!cafeteria) return []
  return cafeteria.corners
    .map((c) => ({ corner: c.name, slots: c.meals.map((m) => ({ slot: m.slot, menu: m.items })) }))
    .filter((c) => c.slots.length > 0)
}
