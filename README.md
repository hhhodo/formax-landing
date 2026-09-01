# FORMAX — 정밀 제조 운영 인텔리전스 랜딩페이지

**Live: https://hhhodo.github.io/formax-landing/**

제조(스마트팩토리 운영 데이터 플랫폼) 주제의 원페이지 랜딩입니다. 브랜드명(FORMAX)은 영어, 본문 콘텐츠는
한글로 작성했습니다.

## 레퍼런스 취득 경로

Figma MCP `get_design_context`를 섹션별로(`142:87` Hero, `142:3419` Platform, `142:1364` Footer,
`142:17` Navigation 등, `forceCode=true`) 개별 조회해 실제 타이포그래피(Pretendard Regular/Medium,
88px/68px 헤드라인, 13px uppercase 라벨), 색상(`#ff6d0e` 액센트, `#f3f3f3` 다크 배경 위 텍스트, 카드
`rgba(0,0,0,.03)` 틴트), 여백(섹션 마진 160px = `--space-11`과 정확히 일치), 버튼/카드 형태(각지고
둥글리지 않은 사각형, 블러 반투명 아웃라인 버튼)를 확인 후 CHEATSHEET_18_EN 규칙에 맞춰 디자인 키트
토큰으로 스냅했습니다. 카피·이미지 소재만 제조/산업 테마로 교체했습니다.

| 항목 | Figma 관찰값 | 판정 |
|---|---|---|
| 히어로 | 다크 배경 + 좌상단 오렌지 글로우, 좌측 정렬 대형 헤드라인 + 배지 + 2버튼 | full-bleed dark |
| 스탯 바 | 근백색 배경, 2카드 좌우 분할, 얇은 구분선 | `6-6` |
| 대시보드 섹션 | 좌측 텍스트(3) + 중앙 다크 차트 카드(5) + 우측 피처 리스트(4) | `3-5-4` |
| 스택 섹션 | 다크 배경, 좌측 텍스트 스택(6) + 우측 원통형 제품 비주얼(6) | `6-6` |
| CTA | 다크 밴드, 좌측 카피+버튼 / 우측 라인 아트 비주얼 | flex split |
| 인용구 | 다크 + 상단 오렌지 글로우, 센터 정렬 대형 카피 | full-bleed |
| 뉴스 | 근백색 배경 + 다크 카드 3장 | `4-4-4` |
| FAQ | `<details>` 아코디언, 근백색 배경 | `container--narrow` |
| 푸터 | 다크 + 하단 오렌지 글로우 + 대형 오렌지 워드마크 | `4-2-2-3` |

## Variant

```
variant: typo=medium / image=low(vector illustration only) / color=dominant(dark+orange) /
         image-radius=soft / card-radius=soft / button-radius=round / border=hairline /
         button-style=solid+ghost / fw=800/400 / spacing=space-11
```

이미지 슬롯은 실사진 대신 인라인 SVG 라인 아트(차트, 프레스 설비, 배관 다이어그램)로 대체해 제조·설비
톤을 표현했습니다.

## 컨테이너 / 그리드

`.container`(1440, 기본) / `.container--wide`(1600, 대시보드·스택) / `.container--narrow`(1280, 인용구·FAQ).
`.container > .grid > .gcell`에 인라인 `grid-column`으로 스플릿을 지정했습니다.

## 반응형

- `≤1024px`: 대시보드/스택/푸터 그리드가 단일 컬럼으로 스택, 스택 섹션은 비주얼이 텍스트 위로 오도록 순서 반전.
- `≤768px`: 네비게이션이 햄버거 토글 메뉴로 전환, 스탯·뉴스 카드가 단일 컬럼.

## 기술 스택

Pretendard 기반 디자인 키트(`css/styles.css`, 수정하지 않음) + 컴포넌트 전용 `css/site.css`. 프레임워크
없이 시맨틱 HTML + Vanilla JS(스크롤 리빌, 모바일 내비 토글)로만 구성했습니다.

## 배포

GitHub Pages(GitHub Actions) 자동 배포. `main` 브랜치 푸시 시 `.github/workflows/deploy.yml`이 실행됩니다.
