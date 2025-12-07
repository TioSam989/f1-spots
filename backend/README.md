# F1 Spots Backend

NestJS backend API for F1 Spots application with PostgreSQL database, Prisma ORM, JWT authentication, and user invite system.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (USER, ADMIN)
- **Invite System**: Temporary invite links that expire in 5 hours and can only be used once
- **User Management**: Admin approval system for new users
- **Password Encryption**: bcrypt for secure password hashing
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: class-validator for DTO validation
- **CORS**: Configured for frontend communication

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL 15
- **ORM**: Prisma 7
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator, class-transformer
- **Password Hashing**: bcrypt

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or yarn

## Getting Started

### 1. Environment Setup

Copy the example environment file and update values:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/f1spots?schema=public"
PORT=3000
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="7d"
NODE_ENV=development
```

### 2. Using Docker (Recommended)

Start both PostgreSQL and the backend:

```bash
# From project root
docker compose up -d
```

This will:
- Start PostgreSQL on port 5432
- Start the backend on port 3000
- Run database migrations automatically

### 3. Local Development (Without Docker)

#### Start PostgreSQL only

```bash
# From project root
docker compose up postgres -d
```

#### Install dependencies

```bash
npm install
```

#### Run database migrations

```bash
npx prisma generate
npx prisma migrate dev
```

#### Start development server

```bash
npm run start:dev
```

The backend will be available at `http://localhost:3000`

## Database Schema

### User Model
- `id`: Unique identifier
- `email`: Unique email address
- `username`: Unique username (must start with @)
- `passwordHash`: Encrypted password
- `instagramHandle`: Optional Instagram handle
- `role`: USER or ADMIN
- `isApproved`: Admin approval status
- `invitedBy`: Reference to invite used

### Invite Model
- `id`: Unique identifier
- `code`: Unique invite code
- `email`: Email for the invite
- `createdBy`: Admin who created it
- `expiresAt`: Expiration time (5 hours from creation)
- `isUsed`: Whether the invite was used
- `usedAt`: When it was used

### Spot Model
- `id`: Unique identifier
- `name`: Spot name
- `description`: Optional description
- `latitude`: GPS latitude
- `longitude`: GPS longitude
- `address`: Optional address
- `privacyLevel`: PRIVATE, GROUP, or PUBLIC
- `userId`: Owner of the spot

## API Endpoints

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "@username",
  "password": "securepassword123",
  "inviteCode": "invite-code-here",
  "instagramHandle": "@instagram_handle"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response:
{
  "access_token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "@username",
    "role": "USER"
  }
}
```

### Admin Endpoints (Requires ADMIN role)

#### Create Invite
```http
POST /admin/invites
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com"
}

Response:
{
  "inviteCode": "abc123...",
  "email": "newuser@example.com",
  "expiresAt": "2024-01-01T12:00:00.000Z",
  "inviteLink": "http://localhost:5173/register?invite=abc123..."
}
```

#### Get All Invites
```http
GET /admin/invites
Authorization: Bearer <token>
```

#### Get Pending Users
```http
GET /admin/users/pending
Authorization: Bearer <token>
```

#### Get All Users
```http
GET /admin/users
Authorization: Bearer <token>
```

#### Approve User
```http
PATCH /admin/users/:id/approve
Authorization: Bearer <token>
```

#### Reject/Delete User
```http
DELETE /admin/users/:id
Authorization: Bearer <token>
```

#### Get Statistics
```http
GET /admin/stats
Authorization: Bearer <token>

Response:
{
  "totalUsers": 10,
  "approvedUsers": 8,
  "pendingUsers": 2,
  "totalSpots": 50,
  "publicSpots": 20
}
```

## Scripts

- `npm run start` - Start production server
- `npm run start:dev` - Start development server with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage

## Prisma Commands

- `npx prisma generate` - Generate Prisma Client
- `npx prisma migrate dev` - Run migrations in development
- `npx prisma migrate deploy` - Run migrations in production
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma db push` - Push schema changes without migrations

## Security Features

1. **Password Encryption**: All passwords are hashed using bcrypt with 10 rounds
2. **JWT Authentication**: Secure token-based authentication
3. **Role-Based Access**: Admin-only endpoints protected by guards
4. **Invite Validation**:
   - Expires in 5 hours
   - Single-use only
   - Email verification
5. **Input Validation**: All DTOs validated with class-validator
6. **CORS**: Configured to accept requests only from frontend

## Project Structure

```
backend/
├── src/
│   ├── auth/                  # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── guards/            # JWT & Roles guards
│   │   ├── strategies/        # Passport strategies
│   │   └── decorators/        # Custom decorators
│   ├── admin/                 # Admin module
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   └── dto/
│   ├── prisma/                # Prisma module
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── prisma.config.ts       # Prisma configuration
├── Dockerfile                 # Docker configuration
├── .dockerignore
└── package.json
```

## Troubleshooting

### Database Connection Issues

If you can't connect to the database:

1. Ensure PostgreSQL is running:
   ```bash
   docker compose ps
   ```

2. Check logs:
   ```bash
   docker compose logs postgres
   ```

3. Verify DATABASE_URL in `.env` matches your setup

### Port Already in Use

If port 3000 is already in use:

1. Change PORT in `.env`
2. Update `docker-compose.yml` port mapping
3. Restart the container

### Migration Issues

If migrations fail:

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or create a new migration
npx prisma migrate dev --name your_migration_name
```

## Creating Your First Admin User

Since the first user needs to be an admin, you'll need to manually create one in the database:

1. Start Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Create an invite manually
3. Register a user with that invite
4. In Prisma Studio, update the user's `role` to `ADMIN` and `isApproved` to `true`

Or use a seed script (create your own in `prisma/seed.ts`)

## Production Deployment

1. Set strong `JWT_SECRET` in environment variables
2. Use proper PostgreSQL credentials
3. Set `NODE_ENV=production`
4. Run `npm run build`
5. Use `npm run start:prod`
6. Consider using PM2 or similar for process management
7. Set up SSL/HTTPS
8. Configure proper CORS origins

## License

MIT
