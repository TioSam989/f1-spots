# Quick Reference Guide

## Role Hierarchy

```
SUPERADMIN (highest)
    ↓
  ADMIN
    ↓
  USER (lowest)
```

## Common Commands

### Development
```bash
# Start everything
docker compose up -d

# Backend only
cd backend && npm run start:dev

# Frontend only
cd frontend && npm run dev

# Database GUI
cd backend && npx prisma studio

# Run migrations
cd backend && npx prisma migrate dev
```

### Useful URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Admin Dashboard: http://localhost:5173/admin
- Voting Page: http://localhost:5173/admin/voting
- Prisma Studio: http://localhost:5555

## User Workflows

### New User Registration
1. Admin creates invite code
2. User receives invite link (expires in 5 hours)
3. User registers with invite code
4. Admin approves/rejects user
5. User can login (if approved)

### Admin Approving User
1. Login as Admin
2. Go to "Pending Users" tab
3. Review Instagram handle
4. Click "Approve" or "Reject"

### SuperAdmin Creating Vote
1. Login as SuperAdmin
2. Click "Voting" button
3. Go to "All Users" or click "Create Vote"
4. Select target user (Admin or SuperAdmin)
5. Choose vote type
6. Add reason (optional)
7. Submit

### SuperAdmin Casting Vote
1. Login as SuperAdmin
2. Click "Voting" button
3. View active vote
4. Read reason and comments
5. Add comment (optional)
6. Click "Approve" or "Reject"

## API Quick Reference

### Authentication
```http
POST /auth/login
POST /auth/register
```

### Admin Only
```http
POST /admin/invites
GET  /admin/invites
GET  /admin/users/pending
GET  /admin/users
PATCH /admin/users/:id/approve
DELETE /admin/users/:id
GET  /admin/stats
```

### SuperAdmin Only
```http
POST /voting
POST /voting/:id/cast
GET  /voting/active
GET  /voting/history
GET  /voting/:id
```

## Database Models

### User
- id, email, username (@required)
- role: USER | ADMIN | SUPERADMIN
- isApproved: boolean
- passwordHash (bcrypt)
- instagramHandle (optional)

### Invite
- code (unique, random)
- email
- expiresAt (+5 hours)
- isUsed (boolean)

### Vote
- type: REMOVE_SUPERADMIN | REMOVE_ADMIN
- status: ACTIVE | APPROVED | REJECTED | EXPIRED
- expiresAt (+24 hours)
- cleanupAt (+1 hour after close)
- requiredVotes (50% + 1)

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use strong database password
- [ ] Enable HTTPS in production
- [ ] Set proper CORS origins
- [ ] Create first SuperAdmin manually
- [ ] Keep .env files secret
- [ ] Don't commit sensitive data

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Can't login | Check user is approved |
| Port 3000 in use | Change PORT in .env |
| Database won't start | Run `docker compose up postgres -d` |
| Migrations fail | Run `npx prisma migrate reset` |
| Vote creation fails | Check user is SUPERADMIN |
| Frontend can't reach API | Check VITE_API_URL in .env |

## Feature Flags

| Feature | Role Required | Description |
|---------|---------------|-------------|
| Login | Any | Login to platform |
| Approve Users | ADMIN+ | Approve pending users |
| Create Invites | ADMIN+ | Create invite codes |
| View Stats | ADMIN+ | View platform stats |
| Create Votes | SUPERADMIN | Initiate role removal votes |
| Cast Votes | SUPERADMIN | Vote on role removals |

## Timers Reference

| Event | Duration |
|-------|----------|
| Invite expiration | 5 hours |
| Vote duration | 24 hours |
| Vote cleanup | 1 hour after close |
| JWT token | 7 days (configurable) |
| Auto-refresh (voting page) | 10 seconds |

## Important Files

```
.env                    # Environment variables
docker-compose.yml      # Docker services
backend/prisma/schema.prisma  # Database schema
frontend/src/lib/api.ts       # API client
```

## Next Steps After Setup

1. [ ] Create first SuperAdmin in Prisma Studio
2. [ ] Login and test admin features
3. [ ] Create test invite
4. [ ] Register test user
5. [ ] Test approval workflow
6. [ ] If multiple SuperAdmins: test voting
7. [ ] Configure production environment
8. [ ] Set up proper domain/SSL
9. [ ] Configure email notifications (future)
10. [ ] Deploy to production

## Support

- Documentation: [docs/README.md](./README.md)
- Backend API: [../backend/README.md](../backend/README.md)
- Frontend: [../frontend/README.md](../frontend/README.md)
- Voting System: [SUPERADMIN_VOTING.md](./SUPERADMIN_VOTING.md)
