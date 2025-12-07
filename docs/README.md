# F1 Spots Documentation

Complete documentation for the F1 Spots platform.

## Table of Contents

### Getting Started
- [⚡ Quick Reference](./QUICK_REFERENCE.md) - Commands, URLs, and quick fixes
- [Main README](../README.md) - Project overview and quick start
- [Backend Setup](../backend/README.md) - Backend API documentation and setup
- [Frontend Setup](../frontend/README.md) - Frontend application documentation

### Features Documentation

#### Authentication & User Management
- **User Registration**: Invite-based registration system
- **Login**: JWT authentication
- **Roles**: USER, ADMIN, SUPERADMIN hierarchy
- **User Approval**: Admin approval workflow for new users

#### Admin Features
- **User Management**: Approve/reject pending users
- **Invite System**: Create time-limited invite codes (5-hour expiration)
- **Statistics Dashboard**: Platform metrics and analytics

#### SuperAdmin Features
- [**Voting System**](./SUPERADMIN_VOTING.md) - Democratic role removal voting

### API Documentation

#### Authentication Endpoints
- `POST /auth/register` - Register with invite code
- `POST /auth/login` - Login and get JWT token

#### Admin Endpoints
- `POST /admin/invites` - Create invite
- `GET /admin/invites` - List all invites
- `GET /admin/users/pending` - Get pending users
- `GET /admin/users` - Get all users
- `PATCH /admin/users/:id/approve` - Approve user
- `DELETE /admin/users/:id` - Reject/delete user
- `GET /admin/stats` - Get platform statistics

#### Voting Endpoints (SuperAdmin only)
- `POST /voting` - Create vote
- `POST /voting/:id/cast` - Cast vote with comment
- `GET /voting/active` - Get active votes
- `GET /voting/history` - Get vote history
- `GET /voting/:id` - Get specific vote

### Database Schema

#### Core Models
- **User**: User accounts with roles and approval status
- **Invite**: Time-limited invitation codes
- **Spot**: F1 location spots with privacy levels

#### Voting Models
- **Vote**: Voting sessions for role removal
- **VoteParticipant**: Vote participation tracking
- **VoteComment**: Vote discussion comments

### Security

#### Password Security
- All passwords hashed with bcrypt (10 rounds)
- Minimum 8 characters required

#### JWT Authentication
- Token-based authentication
- Configurable expiration (default: 7 days)
- Bearer token in Authorization header

#### Role-Based Access Control
- **USER**: Basic access
- **ADMIN**: User management, invite creation
- **SUPERADMIN**: All admin features + voting rights

#### Invite System Security
- 5-hour expiration
- Single-use only
- Email verification
- Admin approval required after registration

#### Voting System Security
- SuperAdmin-only access
- Self-vote prevention
- Duplicate vote prevention
- Automatic cleanup after 1 hour

### Development

#### Project Structure
```
f1+spots/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── auth/        # Authentication module
│   │   ├── admin/       # Admin management
│   │   ├── voting/      # Voting system
│   │   └── prisma/      # Database service
│   └── prisma/
│       └── schema.prisma
├── frontend/            # SvelteKit application
│   ├── src/
│   │   ├── routes/      # Pages and routes
│   │   └── lib/         # Shared code
│   └── static/
├── docs/                # Documentation
└── docker-compose.yml   # Docker services
```

#### Tech Stack
- **Backend**: NestJS, PostgreSQL, Prisma, JWT
- **Frontend**: SvelteKit 2, Svelte 5, TypeScript
- **DevOps**: Docker, Docker Compose

### Deployment

#### Docker Deployment
```bash
docker compose up -d
```

#### Local Development
See individual setup guides:
- [Backend Setup](../backend/README.md)
- [Frontend Setup](../frontend/README.md)

### Troubleshooting

#### Common Issues

**Database Connection Failed**
- Check PostgreSQL is running: `docker compose ps`
- Verify DATABASE_URL in `.env`
- Check logs: `docker compose logs postgres`

**Authentication Errors**
- Verify JWT_SECRET is set
- Check token expiration
- Ensure user is approved (for non-admins)

**Vote Creation Failed**
- Verify user has SUPERADMIN role
- Check no active vote exists for target user
- Ensure target user has correct role

#### Getting Help
- Check specific feature documentation
- Review API endpoint documentation
- Check application logs
- Open an issue on GitHub

### Contributing

When adding new features:
1. Create feature branch from `main`
2. Update relevant documentation
3. Add API documentation if new endpoints
4. Update this index if adding major features
5. Test thoroughly
6. Submit pull request

### License

MIT License - See [LICENSE](../LICENSE) file for details.
