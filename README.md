# Snapchat Clone

Một ứng dụng web mô phỏng Snapchat với đầy đủ tính năng: chat, gọi video, stories, và AI filters.

## Mục tiêu

Xây dựng một web app hoàn chỉnh mô phỏng Snapchat, cho phép người dùng:

- Chụp ảnh/video và áp dụng bộ lọc AI
- Chat và gọi video thời gian thực
- Chia sẻ stories tạm thời
- Gửi tin nhắn tự hủy

## Tính năng chính

### Xác thực (Authentication)

- Đăng ký/Đăng nhập với Email và Password
- Đăng nhập với Google OAuth
- Quản lý tài khoản và profile
- Protected routes (redirect đến 404 nếu chưa đăng nhập)
- Quên mật khẩu (Password reset)

### Camera & AI Filters

- Chụp ảnh và quay video trực tiếp từ webcam
- 9+ AI Filters với MediaPipe Face Mesh:
  - Normal, Yapper, Buggin, Schnoz, Wacky
  - Kitty, Boss, Alien, Cyber
- Chuyển đổi camera trước/sau
- Snapshot với filters

### Chat (Messaging)

- Chat 1-1 (peer-to-peer)
- Group chat với quản lý thành viên
- Tin nhắn thời gian thực với Socket.io
- Snap image messages (tự hủy sau khi xem)
- Gửi file (images, documents, etc.)
- Message reactions (emoji reactions)
- Xóa tin nhắn
- Typing indicator (hiển thị ai đang gõ)

### Video & Audio Calls

- Video calls với WebRTC (peer-to-peer)
- Audio-only calls
- Incoming call dialog (thông báo cuộc gọi đến)
- Call controls (mute, camera off/on)
- Auto timeout (10 giây nếu không trả lời)
- Call declined/ended messages trong chat

### Stories

- Tạo stories với camera và filters
- Xem stories của bạn bè
- Stories tự động hết hạn sau 24h
- Popular/Trending stories

### Friends Management

- Gửi lời mời kết bạn (send friend request)
- Chấp nhận/Từ chối lời mời kết bạn
- Danh sách bạn bè
- Block/Unblock người dùng
- Tìm kiếm người dùng

### Profile & Settings

- Xem và chỉnh sửa profile
- Cập nhật thông tin người dùng

### UI/UX

- Landing page với Hero, Features, About, Testimonials
- Responsive design (mobile, tablet, desktop)
- Dark mode support

## Công nghệ sử dụng

### Frontend

- **Framework:** React 19.1.1
- **Build Tool:** Vite 7.1.7
- **Styling:** TailwindCSS 4.1.16, Framer Motion
- **UI Components:** Radix UI, Ant Design Icons
- **Routing:** React Router DOM 7.9.4
- **State Management:** Redux, React Context API
- **Real-time:** Socket.io Client 4.7.5
- **Video/Camera:** WebRTC, react-webcam
- **AI/ML:** MediaPipe Face Mesh, OpenCV.js
- **Storage:** Firebase Storage
- **Authentication:** Firebase Authentication

### Backend

- **Runtime:** Node.js
- **Framework:** Express 5.2.1
- **Real-time:** Socket.io 4.7.5
- **Database:** Firebase Firestore
- **Authentication:** Firebase Admin SDK
- **API:** REST API với Express
- **Middleware:** CORS, Express Rate Limit
- **Video:** WebRTC (peer-to-peer)

### Infrastructure

- **Frontend Deployment:** Vercel
- **Backend Deployment:** Google Cloud Run
- **Database:** Firebase Firestore
- **File Storage:** Firebase Storage
- **Authentication:** Firebase Authentication

## Cấu trúc dự án

```
Snapchat/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── layouts/    # Layout components
│   │   │   ├── pages/      # Page components
│   │   │   │   ├── camera/     # Camera & filters
│   │   │   │   ├── chat/       # Chat components
│   │   │   │   ├── home/       # Landing page
│   │   │   │   ├── profile/    # Profile page
│   │   │   │   ├── stories/    # Stories components
│   │   │   │   └── video-chat/ # Video call components
│   │   │   └── ui/         # UI components
│   │   ├── context/        # React Context (Auth, Chat)
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities & services
│   │   │   ├── api/        # API clients & services
│   │   │   ├── firebase.js # Firebase config
│   │   │   ├── websocket.js # WebSocket service
│   │   │   └── peerConnection.js # WebRTC config
│   │   ├── layouts/        # Layout wrappers
│   │   ├── pages/          # Main pages
│   │   ├── routes/         # Route definitions
│   │   ├── store/          # Redux store
│   │   └── styles/         # Global styles
│   └── package.json
│
└── server/                 # Backend Node.js app
    ├── functions/          # Cloud Functions
    │   └── src/
    │       ├── config/     # Firebase config
    │       ├── controllers/ # API controllers
    │       ├── middleware/  # Auth middleware
    │       └── routes/      # API routes
    ├── socket/             # Socket.io handlers
    │   └── handlers/       # Socket event handlers
    ├── index.js            # Express server
    └── package.json
```

## Cài đặt và chạy

### Yêu cầu

- Node.js 18+
- npm hoặc yarn
- Firebase project (với Firestore, Storage, Authentication enabled)

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173`

### Backend Setup

```bash
cd server
npm install
npm start
```

Backend sẽ chạy tại `http://localhost:3000`

### Environment Variables

**Frontend (.env):**

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:3000
```

**Backend (.env):**

```env
PORT=3000
CLIENT_URL=http://localhost:5173
FIREBASE_PROJECT_ID=your_project_id
# Firebase Admin credentials (JSON format hoặc file path)
```

## API Endpoints

### Chat

- `POST /api/chat/create-group` - Tạo group chat
- `POST /api/chat/react` - React to message
- `POST /api/chat/add-member` - Thêm thành viên vào group
- `POST /api/chat/remove-member` - Xóa thành viên khỏi group

### Friends

- `POST /api/friends/send-request` - Gửi lời mời kết bạn
- `POST /api/friends/accept-request` - Chấp nhận lời mời
- `POST /api/friends/reject-request` - Từ chối lời mời
- `POST /api/friends/block` - Chặn người dùng
- `POST /api/friends/unblock` - Bỏ chặn người dùng

### WebSocket Events

**Client → Server:**

- `send-message` - Gửi tin nhắn
- `delete-message` - Xóa tin nhắn
- `view-snap` - Xem snap (đánh dấu đã xem)
- `typing-start` / `typing-stop` - Typing indicator
- `call-initiate` - Bắt đầu cuộc gọi
- `call-accept` / `call-decline` / `call-cancel` / `call-end` - Quản lý cuộc gọi
- `webrtc-offer` / `webrtc-answer` / `webrtc-ice-candidate` - WebRTC signaling

**Server → Client:**

- `new-message` - Tin nhắn mới
- `message-deleted` - Tin nhắn đã xóa
- `snap-viewed` - Snap đã được xem
- `user-typing` - User đang gõ
- `incoming-call` - Cuộc gọi đến
- `call-cancelled` / `call-ended` / `call-declined` - Trạng thái cuộc gọi

## Giới hạn

- **Thời gian phát triển:** 10 tuần
- **Nhân lực:** 3 thành viên
- **Nền tảng:** Web only (chưa có mobile app)

## Tài liệu tham khảo

- **Trello Board:** [Link](https://trello.com/invite/b/68f85a28d1d97a0564e1c588/ATTI00130db788e4aedc26b9e85e1f6b045eAE1B1AF0/snapchat)
- **GitHub:** [Source Code](https://github.com/AnNguyenVan123/BTL_web)

## License

© 2025 Snapchat Clone. All rights reserved.
