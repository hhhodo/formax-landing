# FORMAX — 정밀 제조 운영 인텔리전스 랜딩페이지

**Live: https://hhhodo.github.io/formax-landing/**

제조(스마트팩토리 운영 데이터 플랫폼) 주제의 원페이지 랜딩입니다. 브랜드명(FORMAX)은 영어, 본문 콘텐츠는
한글로 작성했습니다.

## 레퍼런스 취득 경로

Figma MCP `get_design_context`를 **8개 콘텐츠 섹션 전부** 개별 노드로(`forceCode=true`) 조회해 실제
구조·타이포·색상·간격을 확인하고 그대로 이식했습니다. 노드 매핑:

| 섹션 | Figma 노드 | 확인한 실측값 |
|---|---|---|
| Header/Nav | `142:17` | 세그먼트형 버튼 내비(각짐, 반투명 블러 bg, gap 2px) |
| Hero | `142:87` | 헤드라인(88px) 상단 / 인증+본문+최신소식카드 하단(구분선 아래) 2단 구성 |
| Platform | `142:3419` | 헤딩(68px)+본문 / 비주얼+스탯패널 / 3단 넘버카드 |
| Stack | `142:241` | 헤딩(68px) + 4행 라벨(32px)/본문 리스트 |
| CTA | `142:861` | 2줄 헤딩(44px, 2번째 줄 40% 투명도) 좌측 + 대형 이미지 우측(12컬럼 중 8/13), 6px 코너 마커 |
| Quote | `142:1088` | 풀블리드 사진 배경, 좌측 정렬 대형 카피(센터 정렬 아님), 상단 eyebrow+버튼 |
| News | `142:1137` | **근백색 배경**(다크 카드 아님), 이미지+아웃라인 태그/날짜+제목+버튼 카드 3장 |
| FAQ | `142:1216` | 타이틀 col1-4 + 리스트는 col5-13로 오프셋(비대칭), 넘버칩+질문+답변 플랫 리스트 |
| Footer | `142:1364` | 뉴스레터+내비+소셜 3열, 하단 대형 오렌지 워드마크 |

공통 타이포는 Pretendard Regular(헤드라인)/Medium(본문·라벨), 액센트 `#ff6d0e`, 다크 표면 텍스트
`#f3f3f3`, 섹션 마진 160px(디자인 키트 `--space-11`과 정확히 일치)를 확인 후 CHEATSHEET_18_EN 규칙에
맞춰 디자인 키트 토큰으로 스냅했습니다. 카피·이미지 소재만 제조/산업 테마로 교체했습니다.

**의도적으로 벗어난 부분** (CHEATSHEET Hard Rules 준수):
- FAQ는 원본이 클릭 확장형(아코디언 추정)이지만, 아코디언은 금지 규칙이라 항상 펼쳐진 flat 리스트로 구현.
- 화살표 아이콘 버튼("Read more →" 등)은 금지 규칙이라 텍스트만 사용.
- 실사진 대신 `.img`(디자인 키트 placeholder, `--color-placeholder`) 사용 — 원본 SharpLink 자산을
  그대로 쓸 수 없어 이 팩토리의 기존 관례를 따름.

## Variant

```
variant: typo=loud / image=medium / color=dominant /
         image-radius=sharp / card-radius=sharp / button-radius=sharp /
         border=hairline / button-style=solid+outline / fw=700/400 / spacing=space-11
```

## 컨테이너 / 그리드

`.container`(1440, 기본) / `.container--wide`(1600, Platform·Stack·FAQ) / `.container--narrow`(1280,
미사용 — 실측 결과 Quote·FAQ도 wide였음). `.container > .grid > .gcell`에 인라인 `grid-column`으로
스플릿을 지정했습니다.

## 반응형

- `≤1024px`: Platform/Stack/Footer/News-head/FAQ 그리드가 단일 컬럼으로 스택, Stack 섹션은 비주얼이
  텍스트 위로 오도록 순서 반전.
- `≤768px`: 네비게이션이 햄버거 토글 메뉴로 전환, News 카드가 단일 컬럼.

## 기술 스택

Pretendard 기반 디자인 키트(`css/styles.css`, 수정하지 않음) + 컴포넌트 전용 `css/site.css`. 프레임워크
없이 시맨틱 HTML + Vanilla JS(스크롤 리빌, 모바일 내비 토글)로만 구성했습니다.

## 배포

GitHub Pages(GitHub Actions) 자동 배포. `main` 브랜치 푸시 시 `.github/workflows/deploy.yml`이 실행됩니다.
