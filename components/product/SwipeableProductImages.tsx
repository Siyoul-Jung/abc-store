import Image from 'next/image'

type ImageData = { url: string; altText: string | null }

type Props = {
  images: ImageData[]
  title: string
  sizes?: string
}

// 카드 이미지: 대표컷 + (데스크톱) 호버 시 2번째 상품컷으로 크로스페이드.
// 수동 가로 스크롤/스와이프는 제거 — 나머지 컷은 상품 상세에서 확인.
// hover는 CSS만으로 처리(부모 Link의 group-hover) → 클라이언트 JS 불필요(서버 컴포넌트).
export default function SwipeableProductImages({ images, title, sizes = '50vw' }: Props) {
  // 카드 미리보기 정리:
  //  1) 사이즈표(altText="sizechart")는 제외 — 미리보기엔 상품컷만 노출.
  //  2) 메이크샵 대표컷(그레이배경, 파일명 001…)이 0번이면 그 '무배경 쌍둥이'(1번)를 생략.
  //     대표컷은 첫 상품컷을 그레이배경으로 만든 거라, 안 빼면 같은 옷이 그레이/무배경으로 두 번 보임.
  const photos = images.filter((img) => img.url && img.altText !== 'sizechart')
  const hasCover = /\/0\d{5,}[._]/.test(photos[0]?.url ?? '')
  const deduped = hasCover ? [photos[0], ...photos.slice(2)] : photos
  const [main, hover] = deduped

  if (!main) return <div className="w-full h-full bg-surface" />

  // 2번째 상품컷이 없으면 대표컷만 정적으로.
  if (!hover) {
    return (
      <Image src={main.url} alt={main.altText ?? title} fill sizes={sizes} className="object-cover" />
    )
  }

  // 카드 전체(부모 Link의 group)에 마우스를 올리면 2번째 컷이 페이드인.
  // 모바일은 hover가 없어 대표컷만 보인다.
  return (
    <>
      <Image src={main.url} alt={main.altText ?? title} fill sizes={sizes} priority className="object-cover" />
      <Image
        src={hover.url}
        alt={hover.altText ?? title}
        fill
        sizes={sizes}
        className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
    </>
  )
}
