import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { ICON_NAMES } from './src/icons.ts'

// Material Symbols 전체 폰트는 5MB 가 넘는다. Google Fonts 의 icon_names 파라미터로 실제 쓰는 아이콘
// (src/icons.ts)만 담은 서브셋(수십 KB)을 받도록 <link rel="stylesheet"> 를 index.html <head> 에 주입한다.
function materialSymbolsSubset(): Plugin {
  const names = [...new Set<string>(ICON_NAMES)].sort().join(',')
  const href = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${names}`
  return {
    name: 'material-symbols-subset',
    transformIndexHtml: () => [{ tag: 'link', attrs: { rel: 'stylesheet', href }, injectTo: 'head' }],
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), materialSymbolsSubset()],
  server: {
    proxy: {
      '/api': {
        target: 'https://hisnet.seohamin.com',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        // 백엔드 세션 쿠키는 Secure + SameSite=None (운영은 HTTPS라 정상 동작).
        // 로컬 dev 서버는 http://localhost 라 Secure 쿠키를 브라우저가 저장하지 않으므로,
        // 로컬 프록시를 통과하는 응답에서만 두 속성을 완화한다. 운영 빌드는 이 dev 서버 설정 자체가 적용되지 않는다.
        configure: (proxy) => {
          // changeOrigin 은 Host 헤더만 바꾸고 Origin 헤더는 그대로 통과시킨다.
          // 브라우저가 보낸 Origin: http://localhost:5173 이 그대로 백엔드까지 전달되면
          // 백엔드의 CORS 허용 오리진 목록에 없어 403 으로 거부된다(자격 증명 오류인 401과 다름).
          // 프록시를 통과할 때는 백엔드가 허용하는 오리진으로 덮어써서 이 문제를 피한다.
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', 'https://hisnet.seohamin.com')
          })
          proxy.on('proxyRes', (proxyRes) => {
            const setCookie = proxyRes.headers['set-cookie']
            if (setCookie) {
              proxyRes.headers['set-cookie'] = setCookie.map((c) =>
                c.replace(/;\s*Secure/gi, '').replace(/SameSite=None/gi, 'SameSite=Lax'),
              )
            }
          })
        },
      },
    },
  },
})
