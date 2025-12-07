# F1 Spots

A community platform for F1 enthusiasts to save and share their favorite spots - whether it's watching locations, meetup places, or anything F1-related.

## About

If you don't F1, that's okay. But if you do, wouldn't it be great to save your favorite F1 spots for later or share them with the community (or keep them private in personal groups)?

This project aims to create a safe, community-driven platform where F1 fans can:

- Save and organize their favorite F1-related locations
- Share spots with the community or keep them private
- Discover new places through trusted community members
- Connect with fellow F1 enthusiasts

## Project Status

Currently developing the **website** version. Once we reach our milestone of saved spots (tracked on the stats page), we'll develop a mobile application - likely for **Android first**.

### Stats Page

The platform includes a public statistics page showing:

- Total number of spots saved (both private and public)
- Community growth metrics
- *Note: Only aggregate numbers are displayed to respect privacy*

## Access & Privacy

### Account Approval Required

To maintain a quality community and protect our favorite spots from overcrowding or misuse:

- New accounts require admin approval
- Instagram handle required for verification during signup
- This helps ensure the community stays respectful and trustworthy

### Privacy Levels

Users can control the visibility of their saved spots:

- **Private**: Only you can see
- **Group**: Share with selected friends/groups
- **Public**: Share with the entire community

## Philosophy

We don't want problems, and we don't want to expose cool places to people who might bring trouble. Let's F1 and relax.

## Tech Stack

### Backend
- **NestJS** - Node.js framework
- **PostgreSQL** - Database
- **Prisma** - ORM
- **JWT** - Authentication
- **bcrypt** - Password encryption

### Frontend
- **SvelteKit 2** - Web framework
- **Svelte 5** - UI library with runes
- **TypeScript** - Type safety

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- npm or yarn

### 1. Start with Docker (Easiest)

```bash
# Clone the repository
git clone <your-repo-url>
cd f1+spots

# Start everything (database + backend)
docker compose up -d

# Install frontend dependencies
cd frontend
npm install

# Start frontend dev server
npm run dev
```

Visit:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### 2. Local Development

#### Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Start database only
docker compose up postgres -d

# Install dependencies
npm install

# Run migrations
npx prisma generate
npx prisma migrate dev

# Start backend
npm run start:dev
```

#### Frontend

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Create First Admin User

1. Start Prisma Studio:
   ```bash
   cd backend
   npx prisma studio
   ```

2. In Prisma Studio, create an Invite manually with:
   - `code`: any unique string (e.g., "first-admin-invite")
   - `email`: your email
   - `expiresAt`: a future date
   - `isUsed`: false
   - `createdBy`: any string (e.g., "system")

3. Use the invite code to register (or create user directly in Prisma Studio)

4. Update the user in Prisma Studio:
   - Set `role` to `ADMIN`
   - Set `isApproved` to `true`

5. Now you can login to the admin dashboard!

## Project Structure

```
f1+spots/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── auth/        # Authentication & JWT
│   │   ├── admin/       # Admin & invite management
│   │   ├── prisma/      # Database service
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── Dockerfile
│   └── README.md
├── frontend/             # SvelteKit app
│   ├── src/
│   │   ├── routes/      # Pages
│   │   └── lib/         # API client
│   └── README.md
├── docker-compose.yml    # Docker services
└── README.md
```

## Documentation

- [Backend Documentation](backend/README.md) - API endpoints, database schema, deployment
- [Frontend Documentation](frontend/README.md) - Components, routing, styling

## Features Implemented

- ✅ JWT Authentication with bcrypt password hashing
- ✅ Role-based access control (ADMIN, USER)
- ✅ Invite system (5-hour expiration, single-use)
- ✅ Admin dashboard for user management
- ✅ User approval workflow
- ✅ Username validation (must start with @)
- ✅ Instagram handle verification
- ✅ Privacy levels for spots (Private, Group, Public)
- ✅ Statistics tracking
- ✅ Docker setup for easy deployment

## Roadmap

- [x] Project concept
- [x] Backend API with authentication
- [x] Database schema & Prisma setup
- [x] Admin dashboard
- [x] Invite system
- [ ] User spots management
- [ ] Map integration
- [ ] Group functionality
- [ ] Reach milestone number of saved spots
- [ ] Android application development
- [ ] iOS application (future consideration)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built by F1 fans, for F1 fans.*
