export function parseNumeric(s: string | null | undefined): number | null {
  if (!s) return null
  const m = s.match(/-?\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}

export const isGraduationPass = (finalVerdict: string | null) => finalVerdict === '졸업가능'
