// watch 모드 — 디자인/문구 즉각 확인용. npm 의존성 0.
// 실행: node marketing/watch.mjs
// card-news-generator.mjs를 저장하면 HTML을 자동 재생성하고,
// 미리보기 HTML은 1초마다 스스로 새로고침(WATCH=1 주입)되어 브라우저에 바로 반영된다.
// PNG는 안 뽑는다 → 빠름. 최종 확정 후 export-png.mjs로 1회만.

import { execFileSync } from 'node:child_process'
import { watch } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const gen = join(__dirname, 'card-news-generator.mjs')

function build() {
  try {
    execFileSync(process.execPath, [gen], { stdio: 'inherit', env: { ...process.env, WATCH: '1' } })
  } catch {
    /* 편집 중 일시적 문법 오류는 무시하고 다음 저장 때 재시도 */
  }
}

build()
console.log('\n👀 watch 중 — card-news-generator.mjs 저장하면 자동 재생성.')
console.log('   미리보기 열기: marketing/output/summer-bestsellers-4x5.html (1초마다 자동 새로고침)')
console.log('   종료: Ctrl+C\n')

let timer
watch(gen, () => {
  clearTimeout(timer)
  timer = setTimeout(build, 150)   // 저장 시 다중 이벤트 디바운스
})
