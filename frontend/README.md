# F1 Spots Frontend

Admin dashboard for F1 Spots application built with SvelteKit 2 and Svelte 5.

## Features

- **Admin Dashboard**: Comprehensive admin panel for managing users and invites
- **User Management**: Approve/reject pending users, view all users
- **Invite System**: Create and manage time-limited invite codes
- **Statistics**: View platform statistics at a glance
- **JWT Authentication**: Secure token-based auth
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Framework**: SvelteKit 2
- **UI Library**: Svelte 5 (with runes)
- **Styling**: Tailwind CSS (if configured)
- **Build Tool**: Vite
- **TypeScript**: Full type safety

## Prerequisites

- Node.js 20+
- npm or yarn
- Backend API running (see backend README)

## Getting Started

### 1. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env`:

```env
VITE_API_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── src/
│   ├── routes/                # SvelteKit routes
│   │   ├── +page.svelte      # Login page
│   │   ├── +layout.svelte    # Root layout
│   │   └── admin/
│   │       └── +page.svelte  # Admin dashboard
│   ├── lib/
│   │   └── api.ts            # API client functions
│   └── app.css               # Global styles
├── static/                   # Static assets
├── package.json
└── svelte.config.js
```

## Pages

### Login Page (`/`)

- Admin login form
- Email and password authentication
- Redirects to admin dashboard on successful login
- Only allows admin role access

### Admin Dashboard (`/admin`)

Protected admin-only page with tabs:

1. **Overview**: Platform statistics
   - Total users
   - Approved users
   - Pending approvals
   - Total spots
   - Public spots

2. **Pending Users**: Manage user approval requests
   - View user details (username, email, Instagram)
   - Approve or reject users
   - See registration date

3. **All Users**: View all registered users
   - Username, email, Instagram handle
   - Role and approval status
   - Join date

4. **Invites**: Manage invitation codes
   - Create new invite (email required)
   - Copy invite link
   - View all invites with status
   - Track used/expired invites

## API Integration

The app communicates with the backend API using the `api.ts` module:

### Authentication

```typescript
import { auth } from '$lib/api';

// Login
await auth.login(email, password);

// Logout
auth.logout();

// Check if authenticated
const isAuth = auth.isAuthenticated();

// Check if admin
const isAdmin = auth.isAdmin();

// Get current user
const user = auth.getUser();
```

### Admin Functions

```typescript
import { admin } from '$lib/api';

// Create invite
const invite = await admin.createInvite(email);

// Get all invites
const invites = await admin.getInvites();

// Get pending users
const pending = await admin.getPendingUsers();

// Get all users
const users = await admin.getAllUsers();

// Approve user
await admin.approveUser(userId);

// Reject user
await admin.rejectUser(userId);

// Get statistics
const stats = await admin.getStats();
```

## Authentication Flow

1. User enters email and password on login page
2. Frontend sends credentials to `/auth/login`
3. Backend validates credentials and checks role
4. If successful and user is ADMIN:
   - JWT token saved in localStorage
   - User data saved in localStorage
   - Redirected to `/admin`
5. On admin pages, token is sent in `Authorization` header

## Security

- JWT tokens stored in localStorage
- All admin API calls require valid JWT token
- Frontend validates admin role before showing admin pages
- Backend enforces role-based access control

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run type checking
- `npm run check:watch` - Type checking in watch mode
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Building for Production

```bash
npm run build
```

The build output will be in the `.svelte-kit` directory. You can preview it with:

```bash
npm run preview
```

## Deployment

### Static Deployment (Adapter Static)

If using `@sveltejs/adapter-static`:

1. Build the app
2. Deploy the `build` directory to any static host (Netlify, Vercel, etc.)

### Node Deployment (Adapter Node)

If using `@sveltejs/adapter-node`:

1. Build the app
2. Run `node build` on your server
3. Set environment variables
4. Use PM2 or similar for process management

### Environment Variables for Production

```env
VITE_API_URL=https://api.yourdomain.com
```

## Customization

### Styling

The app uses inline Tailwind classes. To customize:

1. Modify `tailwind.config.js` (if it exists)
2. Update colors, fonts, etc. in `app.css`
3. Adjust component styles in respective `.svelte` files

### Adding New Features

1. Create new routes in `src/routes/`
2. Add API functions to `src/lib/api.ts`
3. Import and use in your components

## Troubleshooting

### Backend Connection Issues

If you see network errors:

1. Check `VITE_API_URL` in `.env`
2. Ensure backend is running on the correct port
3. Check browser console for CORS errors
4. Verify backend CORS configuration allows your frontend origin

### Authentication Problems

If login doesn't work:

1. Check credentials are correct
2. Ensure user has ADMIN role in database
3. Check browser localStorage for token
4. Verify JWT_SECRET matches between frontend expectations and backend

### Build Errors

If build fails:

1. Delete `node_modules` and `.svelte-kit`
2. Run `npm install` again
3. Check for TypeScript errors with `npm run check`
4. Ensure all dependencies are correctly installed

## Development Tips

### Using Svelte 5 Runes

This project uses Svelte 5's new runes syntax:

```svelte
<script lang="ts">
  // State
  let count = $state(0);

  // Derived
  let doubled = $derived(count * 2);

  // Effects
  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
```

### SvelteKit Routing

- `+page.svelte` - Page component
- `+layout.svelte` - Layout component
- `+page.ts` - Page load function
- `+layout.ts` - Layout load function
- `+server.ts` - API route

## License

MIT
