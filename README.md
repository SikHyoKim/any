# Social Media MVP App

React Native와 Firebase를 활용한 간단한 소셜 미디어 MVP 애플리케이션

## 📱 프로젝트 개요

소셜 미디어의 핵심 기능을 구현한 크로스플랫폼 모바일 앱입니다. 사용자는 사진과 함께 게시글을 작성하고, 댓글을 통해 소통할 수 있습니다.

### 주요 기능
- 🔐 사용자 인증 (회원가입/로그인)
- 📝 게시글 작성 (이미지 최대 3장 + 텍스트)
- 📷 갤러리/카메라 이미지 선택
- 💬 댓글 시스템
- ✏️ 게시글 수정/삭제 (본인만)
- 📱 반응형 UI

## 🛠 기술 스택

### Frontend
- **React Native** 0.79.2
- **Expo** SDK 53
- **TypeScript**
- **Expo Router** (파일 기반 라우팅)

### Backend
- **Firebase Authentication** (이메일/비밀번호)
- **Firebase Firestore** (NoSQL 데이터베이스)
- **Firebase Storage** (이미지 스토리지)

### Development Tools
- **EAS Build** (클라우드 빌드)
- **Expo CLI**
- **Git/GitHub**

## 📋 주요 기능 상세

### 1. 사용자 인증
- 이메일/비밀번호 기반 회원가입 및 로그인
- Firebase Authentication 연동
- AsyncStorage를 통한 로그인 상태 유지
- 한국어 에러 메시지 제공

### 2. 게시글 관리
- **작성**: 이미지(최대 3장) + 텍스트
- **읽기**: 시간순 정렬된 게시글 목록
- **수정**: 본인 게시글만 수정 가능
- **삭제**: 본인 게시글만 삭제 가능

### 3. 이미지 처리
- `expo-image-picker`를 통한 갤러리/카메라 접근
- Firebase Storage 업로드
- 이미지 압축 및 최적화
- 플랫폼별 권한 처리

### 4. 댓글 시스템
- 실시간 댓글 작성/읽기
- 댓글 수 자동 업데이트
- 상대 시간 표시 (방금 전, N분 전)
