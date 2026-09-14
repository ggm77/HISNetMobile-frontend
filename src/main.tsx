import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 화면은 청크로 나뉘어 처음 열 때 받는다. 배포 직후에는 열려 있던 옛 index.html 이 서버에서 이미 지워진 옛 청크를
// 요청해 실패할 수 있으므로(배포가 옛 파일을 삭제한다) 그때는 한 번 새로고침해서 새 빌드를 받는다.
// 새로고침 직후에도 실패하면 반복하지 않고 화면의 오류 카드(ErrorBoundary)에 맡긴다.
window.addEventListener('vite:preloadError', () => {
  const KEY = 'chunk-reload-at'
  try {
    if (Date.now() - Number(sessionStorage.getItem(KEY) ?? 0) < 10_000) return
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    return
  }
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
