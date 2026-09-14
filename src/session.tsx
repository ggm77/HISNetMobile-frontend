import { createContext, useContext } from 'react'
import type { StudentInfo } from './api'

export type SessionValue = { student: StudentInfo | null; expire: () => void }

export const SessionContext = createContext<SessionValue>({ student: null, expire: () => {} })
export const useSession = () => useContext(SessionContext)
