// HISNet 모바일 백엔드 API 클라이언트 (베이스: https://hisnet.seohamin.com/api/v1)

// 상대 경로로 호출한다. 운영 환경은 https://hisnet.seohamin.com 같은 오리진에서 프런트가 함께 서빙되고,
// 로컬 개발 환경은 vite.config.ts 의 dev 서버 프록시가 /api 요청을 백엔드로 중계한다.
// (백엔드 CORS 허용 오리진이 제한적이라 브라우저에서 절대 URL로 직접 호출하면 로컬 개발 중 차단된다.)
const API_BASE = '/api/v1'

export class ApiError extends Error {
  status: number
  code?: string
  constructor(status: number, body: Record<string, unknown> | null) {
    const message = (body?.message as string) || (body?.error as string) || `요청에 실패했습니다 (${status})`
    super(message)
    this.status = status
    this.code = body?.code as string | undefined
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, credentials: 'include' })
  if (res.status === 204) return undefined as T
  const text = await res.text()
  let body: Record<string, unknown> | null = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }
  if (!res.ok) throw new ApiError(res.status, body)
  return body as T
}

const qs = (params: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined) p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

// ── 인증 ──────────────────────────────────────────────

export async function login(username: string, password: string): Promise<void> {
  await request<void>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }).toString(),
  })
}

export async function logout(): Promise<void> {
  await request<void>('/auth/logout', { method: 'POST' })
}

export type AuthMe = { username: string }
export const me = () => request<AuthMe>('/auth/me')

// ── 학적 ──────────────────────────────────────────────

export type StudentInfo = {
  studentNo: string | null
  name: string | null
  nameEnglish: string | null
  academicStatus: string | null
  grade: string | null
  nationality: string | null
  birthDate: string | null
  curriculumType: string | null
  admissionDate: string | null
  highSchool: string | null
  graduationDate: string | null
  degreeNumber: string | null
  department: string | null
  major: string | null
  doubleMajor: string | null
  minor: string | null
  engineeringCertification: string | null
  combinedDegree: string | null
  practicalComputing: string | null
  rcInfo: string | null
  mobile: string | null
  phone: string | null
  email: string | null
  address: string | null
  raw: Record<string, string>
}
export const studentInfo = () => request<StudentInfo>('/students/me')

// ── 시간표 ──────────────────────────────────────────────

export type TimetableSlot = { day: '월' | '화' | '수' | '목' | '금' | '토'; startPeriod: number; endPeriod: number; room: string | null }
export type TimetableCourse = { name: string; section: string | null; courseCode: string | null; professor: string | null; slots: TimetableSlot[] }
export type Timetable = { courses: TimetableCourse[] }
export const timetable = () => request<Timetable>('/timetable')

// ── 성적 ──────────────────────────────────────────────

export type GradeSummary = {
  requestedCredits: number | null
  earnedCredits: number | null
  gpa: number | null
  majorGpa: number | null
  conversionScore: number | null
  totalGradePoints: number | null
  pfCredits: number | null
  creditsByType: Record<string, number>
  raw: Record<string, string>
}
export type CourseGrade = { code: string; name: string; type: string | null; credits: number | null; grade: string | null; gradePoints: number | null; retake: boolean; note: string | null }
export type SemesterGrade = { year: number; term: number; requestedCredits: number | null; earnedCredits: number | null; gpa: number | null; note: string | null; courses: CourseGrade[] }
export type GradeResponse = { summary: GradeSummary | null; semesters: SemesterGrade[] }
export const grades = () => request<GradeResponse>('/grades')

// ── 졸업심사 ──────────────────────────────────────────────

export type GraduationStudent = {
  department: string | null
  name: string | null
  studentNo: string | null
  academicStatus: string | null
  registeredTerms: number | null
  major: string | null
  minor: string | null
  subMajor: string | null
  raw: Record<string, string>
}
export type GraduationCriterion = { category: string; standard: string | null; earned: string | null; verdict: string | null; note: string | null }
export type GraduationResponse = {
  available: boolean
  certificationType: string | null
  requiredCredits: number | null
  notices: string[]
  student: GraduationStudent | null
  criteria: GraduationCriterion[]
  finalVerdict: string | null
}
export const graduation = () => request<GraduationResponse>('/graduation')

// ── 식단표 ──────────────────────────────────────────────

export type MealSlot = { slot: string; items: string[] }
export type MealCorner = { name: string; meals: MealSlot[] }
export type CafeteriaMeal = { id: string; name: string; corners: MealCorner[] }
export type MealResponse = { date: string | null; cafeterias: CafeteriaMeal[] }
export const meals = () => request<MealResponse>('/meals')

// ── 공지 ──────────────────────────────────────────────

export type NoticeBoard = 'general' | 'scholarship' | 'dormitory'
export const BOARD_LABEL: Record<NoticeBoard, string> = { general: '일반', scholarship: '장학', dormitory: '생활관' }

export type SimpleNotice = { id: string; subject: string; files: number; writer: string | null; time: string | null; read: number | null; pinned: boolean }
export type NoticeList = { notices: SimpleNotice[]; page: number; totalPages: number; hasNext: boolean; hasPrevious: boolean }

export type Attachment = { index: number; name: string }
export type Notice = { id: string; subject: string; files: Attachment[]; writer: string | null; time: string | null; read: number | null; category: string | null; body: string; images: string[] }

export const noticesList = (board: NoticeBoard, page = 1) => request<NoticeList>(`/notices/${board}${qs({ page })}`)
export const noticeDetail = (board: NoticeBoard, id: string) => request<Notice>(`/notices/${board}/${id}`)
export const noticeAttachmentUrl = (board: NoticeBoard, id: string, index: number, name?: string) =>
  `${API_BASE}/notices/${board}/${id}/attachments/${index}${qs({ name })}`

export const deptNoticesList = (dept: string, page = 1) => request<NoticeList>(`/notices/department${qs({ dept, page })}`)
export const deptNoticeDetail = (dept: string, id: string) => request<Notice>(`/notices/department/${id}${qs({ dept })}`)
export const deptNoticeAttachmentUrl = (dept: string, id: string, index: number, name?: string) =>
  `${API_BASE}/notices/department/${id}/attachments/${index}${qs({ dept, name })}`

// HISNet list.php 좌측 메뉴 기준 학부 게시판 코드
export const DEPT_CODE_BY_NAME: Record<string, string> = {
  글로벌리더십학부: 'B0020',
  국제어문학부: 'B0021',
  경영경제학부: 'B0022',
  법학부: 'B0023',
  커뮤니케이션학부: 'B0024',
  상담심리사회복지학부: 'B0102',
  생명과학부: 'B0028',
  공간환경시스템공학부: 'B0025',
  AI컴퓨터전자공학부: 'B0029',
  콘텐츠융합디자인학부: 'B0027',
  기계제어공학부: 'B0026',
  언어교육원: 'B0031',
  창의융합교육원: 'B0427',
  ICT창업학부: 'B0419',
  AI융합교육원: 'B0431',
  'AI융합학부(신설)': 'B0434',
  신앙교육원: 'B0432',
  대학원공지: 'B0113',
  대학원양식: 'B0114',
  학과공지: 'B0430',
}

// ── 시설/공간 예약 ──────────────────────────────────────────────

export type FacilityCategory = 'sports' | 'meeting' | 'convenience'
export type Facility = { id: number; name: string }
export type CategoryGroup = { category: FacilityCategory; categoryName: string; facilities: Facility[] }
export type FacilityCatalog = { categories: CategoryGroup[] }
export const facilities = () => request<FacilityCatalog>('/facilities')

export type SlotStatus = 'AVAILABLE' | 'RESERVED_MINE' | 'RESERVED_OTHER' | 'UNAVAILABLE'
export type Slot = { start: string; end: string; status: SlotStatus }
export type DayAvailability = { date: string; weekday: string; slots: Slot[] }
export type Quota = { totalRemainingMinutes: number | null; totalLimitMinutes: number | null; dailyRemainingMinutes: number | null; dailyLimitMinutes: number | null; resetDate: string | null }
export type FacilityAvailability = {
  facilityId: number
  facilityName: string
  slotMinutes: number
  operatingStart: string | null
  operatingEnd: string | null
  rangeFrom: string
  rangeTo: string
  quota: Quota | null
  days: DayAvailability[]
}
export const facilityAvailability = (facilityId: number, date?: string) => request<FacilityAvailability>(`/facilities/${facilityId}/availability${qs({ date })}`)

export type ReservationStatus = 'active' | 'completed' | 'cancelled' | 'noshow'
export type Reservation = { bookingCode: number | null; title: string | null; facilityName: string | null; date: string | null; startTime: string | null; endTime: string | null; cancelableUntil: string | null }
export type ReservationList = { status: ReservationStatus; reservations: Reservation[] }
export const reservationsList = (status: ReservationStatus = 'active') => request<ReservationList>(`/facilities/reservations${qs({ status })}`)

export const createReservation = (facilityId: number, date: string, startTime: string, endTime: string) =>
  request<Reservation>(`/facilities/${facilityId}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, startTime, endTime }),
  })

export const cancelReservation = (bookingCode: number) => request<void>(`/facilities/reservations/${bookingCode}`, { method: 'DELETE' })
