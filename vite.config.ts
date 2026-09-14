import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
