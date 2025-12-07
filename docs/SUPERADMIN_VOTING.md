# SuperAdmin Voting System

## Overview

The SuperAdmin voting system enables democratic decision-making for removing SuperAdmins or Admins from their roles. This prevents any single SuperAdmin from having absolute power.

## Features

### Role Hierarchy
- **SUPERADMIN**: Highest privilege level, very few users
- **ADMIN**: Regular administrator
- **USER**: Standard user

### Voting Rules

1. **Only SuperAdmins can create votes**
2. **Only SuperAdmins can participate in votes**
3. **SuperAdmins cannot remove themselves**
4. **Votes require majority approval** (50% + 1 of all SuperAdmins)
5. **Votes expire after 24 hours** if not completed
6. **Target users cannot vote on their own demotion**

### Vote Types

1. **REMOVE_SUPERADMIN**: Demote SuperAdmin → Admin
2. **REMOVE_ADMIN**: Demote Admin → User

### Vote Lifecycle

1. **Creation** (24-hour voting period)
   - SuperAdmin initiates vote against another SuperAdmin or Admin
   - Optionally provides reason
   - Required votes calculated: ceil(total_superadmins / 2)

2. **Active Voting**
   - SuperAdmins can cast vote: APPROVE or REJECT
   - Each SuperAdmin can add optional comments
   - Real-time countdown timer displayed
   - Vote closes when:
     - Approval threshold reached → APPROVED
     - Rejection threshold reached → REJECTED
     - 24 hours expire → EXPIRED

3. **Post-Vote** (1-hour cleanup period)
   - Vote status locked
   - Comments remain visible for 1 hour
   - Timer shows time until cleanup
   - If APPROVED: target user's role automatically changed

4. **Cleanup** (after 1 hour)
   - All vote data deleted
   - Comments removed
   - Vote record archived

### Automated Tasks

The system runs scheduled cleanup every 10 minutes:
- Expires active votes past 24 hours
- Deletes votes+comments past cleanup time

## API Endpoints

### Create Vote
```http
POST /voting
Authorization: Bearer <superadmin-token>
Content-Type: application/json

{
  "targetUserId": "user-id",
  "type": "REMOVE_SUPERADMIN" | "REMOVE_ADMIN",
  "reason": "Optional explanation"
}
```

### Cast Vote
```http
POST /voting/:voteId/cast
Authorization: Bearer <superadmin-token>
Content-Type: application/json

{
  "decision": "APPROVE" | "REJECT",
  "comment": "Optional comment"
}
```

### Get Active Votes
```http
GET /voting/active
Authorization: Bearer <superadmin-token>
```

### Get Vote History
```http
GET /voting/history
Authorization: Bearer <superadmin-token>
```

### Get Specific Vote
```http
GET /voting/:voteId
Authorization: Bearer <superadmin-token>
```

## Frontend UI

### SuperAdmin Dashboard
- **Voting button** appears in navbar for SuperAdmins only
- **Role badge** shows SUPERADMIN in pink color
- **"Initiate Vote" link** on user rows for Admins/SuperAdmins

### Voting Page (`/admin/voting`)

#### Active Votes Tab
- Lists all ongoing votes
- Shows real-time countdown timer
- Displays vote progress (approvals vs rejections)
- Shows all comments from SuperAdmins
- Vote buttons (Approve/Reject) if user hasn't voted
- "Already voted" indicator if user has voted
- Optional comment field when casting vote

#### History Tab
- Shows completed/expired votes
- Status badges (APPROVED, REJECTED, EXPIRED)
- Final vote counts
- Comments (if still within 1-hour cleanup window)
- Cleanup countdown timer

### Real-Time Updates
- Page auto-refreshes every 10 seconds
- Timers update in real-time
- Vote counts update automatically

## Database Schema

### Vote Model
```prisma
model Vote {
  id              String      @id @default(cuid())
  type            VoteType
  status          VoteStatus  @default(ACTIVE)
  targetUserId    String
  targetUser      User
  createdById     String
  createdBy       User
  reason          String?
  requiredVotes   Int         @default(2)
  approveCount    Int         @default(0)
  rejectCount     Int         @default(0)
  expiresAt       DateTime
  closedAt        DateTime?
  cleanupAt       DateTime?   // Set to closedAt + 1 hour
  createdAt       DateTime    @default(now())

  participants    VoteParticipant[]
  comments        VoteComment[]
}
```

### VoteParticipant Model
```prisma
model VoteParticipant {
  id          String        @id @default(cuid())
  voteId      String
  vote        Vote
  userId      String
  user        User
  decision    VoteDecision
  votedAt     DateTime      @default(now())

  @@unique([voteId, userId])
}
```

### VoteComment Model
```prisma
model VoteComment {
  id          String    @id @default(cuid())
  voteId      String
  vote        Vote
  userId      String
  user        User
  comment     String
  createdAt   DateTime  @default(now())
}
```

## Security Considerations

1. **Role Verification**: All endpoints protected by SuperAdmin guard
2. **Self-Vote Prevention**: Users cannot vote on their own demotion
3. **Duplicate Vote Prevention**: One vote per user per vote session
4. **Active Vote Limit**: Only one active vote per target user
5. **Auto-Cleanup**: Sensitive vote data automatically deleted after 1 hour

## Example Scenarios

### Scenario 1: Successful SuperAdmin Removal
1. SuperAdmin A creates vote to remove SuperAdmin B
2. 3 SuperAdmins total, requires 2 approvals
3. SuperAdmin C votes APPROVE with comment "Agreed"
4. Vote automatically closes (APPROVED)
5. SuperAdmin B demoted to Admin
6. 1-hour countdown starts
7. Comments visible for review
8. After 1 hour: all vote data cleaned up

### Scenario 2: Rejected Admin Removal
1. SuperAdmin A creates vote to remove Admin X
2. 4 SuperAdmins total, requires 2 votes
3. SuperAdmin B votes REJECT
4. SuperAdmin C votes REJECT
5. Vote closes immediately (REJECTED)
6. Admin X keeps their role
7. Data cleaned up after 1 hour

### Scenario 3: Expired Vote
1. Vote created but not enough SuperAdmins participate
2. 24 hours pass
3. Automated task marks vote as EXPIRED
4. Target user keeps their role
5. Data cleaned up 1 hour after expiration

## Usage Instructions

### For SuperAdmins

#### Creating a Vote
1. Navigate to Admin Dashboard
2. Go to "All Users" tab
3. Find the Admin or SuperAdmin to demote
4. Click "Initiate Vote"
5. Click purple "Voting" button in navbar
6. Fill in vote details (select user, provide reason)
7. Submit

#### Casting a Vote
1. Click "Voting" in navbar
2. View active votes
3. Read reason and existing comments
4. Optionally add your comment
5. Click "Approve" or "Reject"

#### Monitoring Votes
- Check "Active Votes" tab for ongoing votes
- Watch real-time timer countdown
- See vote progress and comments
- Review "History" tab for past decisions

## Timer Display

### Active Vote Timer
- Format: `23h 45m 30s`
- Updates every second
- Shows "Expired" when time runs out

### Cleanup Timer
- Format: `59m 30s`
- Appears on closed votes in history
- Shows "Cleaning up..." when time expires

## Best Practices

1. **Provide Clear Reasons**: Always explain why a vote is necessary
2. **Add Comments**: Share your perspective when voting
3. **Act Promptly**: Don't let important votes expire
4. **Review History**: Learn from past decisions
5. **Communicate**: Discuss significant votes with the team

## Troubleshooting

### "Only SuperAdmins can create votes"
- Your role is not SUPERADMIN
- Contact an existing SuperAdmin

### "You have already voted"
- You can only vote once per vote session
- Your decision is final

### "Vote has expired"
- 24 hours have passed
- A new vote must be created

### "Target user is not a SuperAdmin/Admin"
- Verify the user's current role
- They may have already been demoted

## Future Enhancements

- Email notifications when votes are created
- Slack/Discord integration for vote alerts
- Configurable voting periods
- Vote delegation
- Multi-step demotion (SuperAdmin → Admin → User)
- Vote templates for common scenarios
