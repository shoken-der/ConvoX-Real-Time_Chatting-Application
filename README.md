# ConvoX

ConvoX is a full-stack real-time chat application built with React and Spring Boot. It focuses on the parts interviewers usually care about in a serious product build: secure authentication, real-time communication, clean frontend state management, production-style API structure, and a polished responsive chat experience.

The project started as a chat platform and has been migrated into a modern Spring Boot backend with a React client, JWT-secured APIs, STOMP-over-WebSocket messaging, email OTP verification, profile setup, message reactions, edits, deletes, seen status, and online presence.

## Why This Project Stands Out

- Real-time messaging using Spring WebSocket, STOMP, SockJS, and topic-based subscriptions.
- JWT authentication with Spring Security, stateless sessions, BCrypt password hashing, and protected routes.
- Email OTP verification flow for account activation, resend OTP, forgot password, and password reset.
- Chat room lifecycle management with room creation, retrieval, deletion, hiding, and automatic unhide on new messages.
- Message features beyond basic send/receive: replies, media payload support, reactions, editing, soft delete, and seen tracking.
- Presence system that tracks online users through WebSocket connect/disconnect events and stores last-seen data.
- Responsive React UI with protected routing, profile setup, toast feedback, chat sidebar, room list, mobile drawer, and reusable chat views.
- Layered backend architecture using controllers, services, repositories, DTOs, mappers, entities, global exception handling, and OpenAPI support.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, React Router, Context API, Tailwind CSS, Axios, Lucide React, Headless UI |
| Realtime | STOMP.js, SockJS, Spring WebSocket |
| Backend | Java 17, Spring Boot 3.2, Spring Web, Spring Security, Spring Data JPA, Spring Validation |
| Database | MySQL with Hibernate ORM |
| Auth | JWT, BCrypt, email OTP verification |
| Tooling | Maven, npm, concurrently, Swagger/OpenAPI |

## Architecture Overview

```text
ConvoX
|-- backend/
|   |-- src/main/java/com/convox/
|   |   |-- config/          # Security and WebSocket configuration
|   |   |-- controller/      # REST and STOMP controllers
|   |   |-- dto/             # Request/response contracts
|   |   |-- entity/          # JPA domain models
|   |   |-- exception/       # Global API error handling
|   |   |-- listener/        # WebSocket connect/disconnect presence events
|   |   |-- mapper/          # Entity to DTO mapping
|   |   |-- repository/      # Spring Data JPA repositories
|   |   |-- security/        # JWT filter, token provider, user principal
|   |   `-- service/         # Business logic interfaces and implementations
|   `-- src/main/resources/
|       `-- application.properties
|-- frontend/
|   |-- src/components/      # Account, chat, layout, and UI views
|   |-- src/contexts/        # Auth, chat, and toast state providers
|   |-- src/hooks/           # Message and socket hooks
|   |-- src/services/        # API and WebSocket client logic
|   `-- src/utils/           # Route protection and presence helpers
`-- package.json             # Root scripts for running both apps
```

## Core Features

### Authentication and Account Flow

- Register with email and password.
- Receive OTP by email before the account is activated.
- Verify email, resend OTP, and auto-login after successful verification.
- Login with JWT-backed authentication.
- Forgot password and reset password using OTP.
- Protected frontend routes with profile completion checks.

### Chat Experience

- Create or retrieve one-to-one chat rooms.
- Load user-specific chat rooms.
- Search users and start new conversations.
- Send text messages in real time.
- Send media/file payloads as Base64-backed client uploads.
- Reply to messages.
- Edit sent messages.
- Soft-delete sent messages while preserving conversation history.
- React to messages with emoji.
- Mark messages as seen.
- Hide or delete chat rooms.

### Realtime System

- WebSocket endpoint: `/ws`
- Application destination prefix: `/app`
- Broker destinations: `/topic`, `/queue`, `/user`
- Chat room subscription pattern: `/topic/chat/{chatRoomId}`
- Typing subscription pattern: `/topic/chat/{chatRoomId}/typing`
- User update subscription pattern: `/topic/user/{userId}`
- Presence broadcast topic: `/topic/presence`

## API Overview

### Auth

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Start registration and send verification OTP |
| POST | `/api/auth/verify-email` | Verify email using OTP |
| POST | `/api/auth/resend-otp` | Resend verification OTP |
| POST | `/api/auth/login` | Authenticate and return JWT |
| POST | `/api/auth/forgot-password` | Send password reset OTP |
| POST | `/api/auth/reset-password` | Reset password using OTP |
| GET | `/api/auth/me` | Get the authenticated user |

### Users

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/user` | Get all users |
| GET | `/api/user/{id}` | Get a user by id |
| POST | `/api/user/search` | Search users |
| POST | `/api/user/update-profile` | Update display name and profile photo |

### Chat Rooms

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/room` | Create a chat room |
| GET | `/api/room/{userId}` | Get rooms for a user |
| GET | `/api/room/{firstUserId}/{secondUserId}` | Get room between two users |
| DELETE | `/api/room/{id}` | Delete a room |
| PATCH | `/api/room/{id}/hide` | Hide a room for a user |

### Messages

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/message` | Create and broadcast a message |
| GET | `/api/message/{chatRoomId}` | Get paginated room messages |
| POST | `/api/message/{messageId}/react` | Toggle message reaction |
| PUT | `/api/message/{messageId}` | Edit a message |
| DELETE | `/api/message/{messageId}` | Soft-delete a message |
| PATCH | `/api/message/{messageId}/seen` | Mark a message as seen |

## Local Setup

### Prerequisites

- Java 17+
- Maven or the included Maven wrapper
- Node.js 18+
- MySQL 8+
- Gmail app password or SMTP credentials for OTP email

### 1. Clone and Install

```bash
git clone <your-repository-url>
cd ConvoX
npm run install-all
```

### 2. Configure MySQL

Create a local database:

```sql
CREATE DATABASE convox_db;
```

The backend can also create the database automatically when the configured MySQL user has permission because the JDBC URL includes `createDatabaseIfNotExist=true`.

### 3. Configure Backend Environment

Set these environment variables before starting the backend:

```env
PORT=8080
DB_URL=jdbc:mysql://localhost:3306/convox_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=replace_with_a_long_secure_secret
ALLOWED_ORIGINS=http://localhost:3000
SHOW_SQL=false
```

For email OTP support, configure SMTP credentials:

```env
SPRING_MAIL_USERNAME=your_email@gmail.com
SPRING_MAIL_PASSWORD=your_gmail_app_password
```

If you use environment-based mail configuration in deployment, map these to the Spring mail properties used by the backend.

### 4. Configure Frontend Environment

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8080
```

### 5. Run the App

Run backend and frontend together from the root:

```bash
npm run dev
```

Or run them separately:

```bash
cd backend
mvnw spring-boot:run
```

```bash
cd frontend
npm start
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`

## Build

Build the full project from the root:

```bash
npm run build
```

Build only the frontend:

```bash
npm run build --prefix frontend
```

Build only the backend:

```bash
cd backend
mvnw clean package
```

## What This Demonstrates

This project is useful in interviews because it shows more than CRUD. It demonstrates:

- Designing a full-stack system with separate frontend and backend responsibilities.
- Building authenticated REST APIs with Spring Security and JWT.
- Handling real-time message delivery with WebSocket topics and STOMP destinations.
- Managing complex chat UI state with React Context, custom hooks, and service modules.
- Modeling relational chat data with users, rooms, messages, reactions, OTP codes, and seen status.
- Thinking about product behavior: verification, profile completion, online presence, typing events, room visibility, and message lifecycle.

## Author

Shokendra Singh
