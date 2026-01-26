# Group Session Feature - Technical Design

## Overview
This document outlines the design for a collaborative group session feature in OpenCode, allowing multiple users to share and work together in the same coding session.

## Requirements
1. Allow users to share their session with others
2. Enable multiple users to prompt agents simultaneously
3. Keep sessions synchronized across all participants
4. Handle agent/provider access (two approaches analyzed below)
5. Ensure secure session sharing

## Architecture Analysis

### Approach 1: Shared Agents (Host-Provided)
The session host shares their configured agents and providers with participants.

**Pros:**
- Simpler to implement - single source of truth for providers
- Guaranteed consistency - all participants use the same model responses
- Cost control - host pays and controls usage
- No setup required for participants
- Ideal for pair programming or mentoring scenarios

**Cons:**
- Host bears all costs, which could be significant
- Potential for abuse if host's API keys are compromised
- Limited flexibility - participants can't use their preferred models
- Rate limiting affects all users equally

**Security Concerns:**
- Host API keys must never be exposed to participants
- All API calls must be proxied through host's server
- Need usage quotas/limits per session to prevent abuse

### Approach 2: Own Agents (Each User's Providers)
Each participant uses their own configured providers and agents.

**Pros:**
- Fair cost distribution - each user pays for their own usage
- More flexible - users can choose their preferred models
- No risk of API key exposure
- Better for long-term collaborations
- Scales better for larger teams

**Cons:**
- More complex implementation
- Potential inconsistencies if users use different models
- Requires all participants to have provider access configured
- More difficult to debug when issues arise

**Security Concerns:**
- Need to ensure one user's API calls don't interfere with others
- Message ordering and attribution must be clear
- Potential for model disagreements to cause conflicts

### Recommended Approach: **Approach 2 (Own Agents)**

**Rationale:**
1. **Cost Fairness**: Prevents host from bearing all costs in large teams
2. **Scalability**: Better for long-term collaborative work
3. **Security**: No risk of API key sharing or proxy vulnerabilities
4. **Flexibility**: Users maintain control over their model choices
5. **OpenCode Philosophy**: Aligns with the provider-agnostic nature of OpenCode

The additional complexity is manageable and worth the benefits.

## Plugin-Based Implementation

### Why a Plugin?
1. **Modularity**: Optional feature that doesn't bloat core
2. **Flexibility**: Users can customize behavior via plugin hooks
3. **Experimentation**: Easier to iterate without affecting core
4. **Community**: Can be maintained by community if needed
5. **Existing Infrastructure**: Plugin system already supports tools, events, and custom behavior

### Architecture Components

#### 1. Group Session Plugin (`@opencode-ai/group-session-plugin`)

```typescript
// Core plugin structure
export const GroupSessionPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      // Tool to create/join/leave group sessions
      group_session: tool({...}),
    },
    event: async ({ event }) => {
      // Sync events across participants
    },
    "chat.message": async (input, output) => {
      // Handle message attribution
    },
  }
}
```

#### 2. WebSocket Communication Layer
- Real-time bidirectional communication between participants
- Built on top of existing Hono WebSocket support
- Message types: `join`, `leave`, `sync`, `message`, `part`, `diff`

#### 3. Session Coordinator
- Manages participant list
- Handles invitation tokens
- Coordinates message ordering
- Resolves conflicts

#### 4. Storage Extension
- Extend existing storage to support multi-user metadata
- Track message authorship
- Store participant info

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create plugin package structure
2. Implement WebSocket sync protocol
3. Add invitation token system
4. Create participant management

### Phase 2: Session Synchronization
1. Sync session metadata
2. Sync messages and parts
3. Sync file diffs
4. Handle edge cases (late joiners, disconnects)

### Phase 3: Security & Access Control
1. Implement invitation token validation
2. Add permission checks for actions
3. Rate limiting per participant
4. Audit logging

### Phase 4: User Experience
1. Add TUI components for group sessions
2. Show participant list
3. Message attribution UI
4. Connection status indicators

## API Design

### REST Endpoints (via Plugin Tools)

```typescript
// Create a group session
POST /group-session/create
{
  sessionID: string
  maxParticipants?: number
  permissions?: {
    canPrompt: boolean
    canEdit: boolean
    canViewOnly: boolean
  }
}
Response: {
  inviteToken: string
  inviteUrl: string
}

// Join a group session
POST /group-session/join
{
  inviteToken: string
}
Response: {
  sessionID: string
  participants: User[]
}

// Leave a group session
POST /group-session/leave
{
  sessionID: string
}
```

### WebSocket Protocol

```typescript
// Client -> Server messages
{
  type: "join",
  token: string
}
{
  type: "message",
  sessionID: string,
  content: string
}

// Server -> Client messages
{
  type: "participant_joined",
  user: User
}
{
  type: "message_synced",
  message: Message,
  author: User
}
{
  type: "session_updated",
  session: Session
}
```

## Security Measures

### 1. Invitation Tokens
- Cryptographically secure random tokens (using `ulid` or `crypto.randomBytes`)
- Single-use or time-limited tokens
- Stored securely with bcrypt hash
- Revocable by host

### 2. Access Control
- Host has full control (can kick participants, end session)
- Participants have limited permissions based on session config
- All actions require authorization check
- Rate limiting per user to prevent spam

### 3. Data Privacy
- Messages include author metadata
- No API keys shared between users
- Each user's provider config stays private
- Audit log for all actions

### 4. Network Security
- WebSocket connections use WSS (WebSocket Secure) in production
- Token validation on every message
- Connection timeout and heartbeat
- Sanitize all user inputs

## Data Models

### GroupSession
```typescript
{
  id: string
  sessionID: string
  host: {
    userID: string
    username: string
  }
  participants: Array<{
    userID: string
    username: string
    joinedAt: number
    permissions: {
      canPrompt: boolean
      canEdit: boolean
      canViewOnly: boolean
    }
  }>
  inviteToken: string
  inviteTokenHash: string
  maxParticipants: number
  createdAt: number
  updatedAt: number
  status: "active" | "ended"
}
```

### SyncMessage
```typescript
{
  type: "message" | "part" | "session" | "diff"
  sessionID: string
  data: any
  author: {
    userID: string
    username: string
  }
  timestamp: number
}
```

## Edge Cases & Handling

### 1. Concurrent Messages
- Each user's messages include author ID
- Server assigns global ordering based on receipt time
- All participants see the same order
- Visual indicators show who sent what

### 2. Network Disconnections
- Automatic reconnection with exponential backoff
- Sync missed events on reconnect
- Show connection status to user
- Keep local changes until reconnected

### 3. Host Leaves
- Option 1: Transfer host to another participant
- Option 2: End session for all (with warning)
- Configurable behavior

### 4. File Conflicts
- Last-write-wins for now (simplest)
- Future: Operational Transform or CRDT
- Show conflict warnings to users

### 5. Different Model Responses
- Each user's agent uses their own provider
- Messages clearly show which model was used
- Users can learn from different model approaches

## Configuration

```jsonc
// opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@opencode-ai/group-session-plugin"],
  "groupSession": {
    "enabled": true,
    "maxParticipants": 5,
    "defaultPermissions": {
      "canPrompt": true,
      "canEdit": false,
      "canViewOnly": false
    },
    "inviteTokenExpiry": 86400000, // 24 hours
    "requireAuthentication": true
  }
}
```

## Testing Strategy

### Unit Tests
- Token generation and validation
- Permission checks
- Message ordering
- WebSocket protocol

### Integration Tests
- Multi-client scenarios
- Concurrent message handling
- Reconnection logic
- Session lifecycle

### Security Tests
- Token bruteforce prevention
- Rate limiting
- Permission bypass attempts
- XSS/injection attempts

## Future Enhancements

1. **Voice/Video Integration**: Add communication channels
2. **Screen Sharing**: Show what participants are viewing
3. **Presence Indicators**: Show who's typing, viewing, etc.
4. **Session Recording**: Record and replay group sessions
5. **Advanced Permissions**: Fine-grained control per tool
6. **Team Management**: Persistent teams across sessions
7. **Analytics**: Usage metrics and collaboration insights

## Alternatives Considered

### 1. Core Feature (Not Plugin)
**Rejected**: Adds complexity to core that not all users need. Plugin keeps it optional and maintainable.

### 2. Centralized Server
**Rejected**: Goes against OpenCode's client/server architecture. Requires infrastructure.

### 3. P2P Connection
**Rejected**: More complex NAT traversal, harder to implement reliably. Server-mediated is simpler.

## Success Metrics

1. Latency: Message sync < 100ms
2. Reliability: 99.9% message delivery
3. Scalability: Support up to 10 concurrent participants
4. Security: Zero API key leaks
5. Usability: < 2 steps to join a session

## Conclusion

The group session feature is best implemented as a plugin using Approach 2 (each user's own agents). This provides:
- Fair cost distribution
- Better security
- Greater flexibility
- Alignment with OpenCode's philosophy

The plugin architecture allows for iterative development and community contributions while keeping the core lean.
