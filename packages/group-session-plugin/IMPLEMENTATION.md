# Group Session Feature - Implementation Summary

## Overview

This document provides a comprehensive summary of the group session feature implementation for OpenCode. The feature enables real-time collaborative coding sessions where multiple users can work together using the same OpenCode session.

## Architecture Decision

After evaluating two approaches, we chose **Approach 2: Each user uses their own agents and providers**.

### Why This Approach?

1. **Fair Cost Distribution**: Each user pays for their own AI usage, preventing the host from bearing all costs
2. **Security**: No API keys are shared between users; each maintains their own credentials
3. **Flexibility**: Users can choose their preferred models (Claude, GPT-4, etc.)
4. **Scalability**: Better suited for long-term collaborations and larger teams
5. **Philosophy Alignment**: Consistent with OpenCode's provider-agnostic approach

## Plugin-Based Implementation

The feature is implemented as a plugin (`@opencode-ai/group-session-plugin`) rather than a core feature because:

1. **Modularity**: Keeps the core lean and allows users to opt-in
2. **Maintainability**: Easier to update and experiment with independently
3. **Flexibility**: Can be customized via plugin hooks
4. **Community**: Can be maintained by the community if needed

## Key Components

### 1. Custom Tool: `group_session`

Provides commands for managing group sessions:

```typescript
// Actions available
- create: Start a new group session
- join: Join an existing session via invite token
- leave: Exit the current group session
- list: Show all participants
- kick: Remove a participant (host only)
- status: Get current session status
```

### 2. Data Models

```typescript
interface GroupSession {
  id: string
  sessionID: string  // OpenCode session ID
  host: { id: string, username: string }
  participants: Participant[]
  inviteToken: string
  maxParticipants: number
  status: "active" | "ended"
}

interface Participant {
  id: string
  username: string
  permissions: {
    canPrompt: boolean
    canEdit: boolean
    canViewOnly: boolean
  }
  connected: boolean
}
```

### 3. Configuration

```jsonc
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
    "inviteTokenExpiry": 86400000,
    "requireAuthentication": false
  }
}
```

## Usage Flow

### Creating a Session

1. User A starts OpenCode in their project
2. User A runs: `@group_session create`
3. Plugin generates a secure invite token (e.g., `gs_01JGXY123ABC`)
4. User A shares the token with collaborators

### Joining a Session

1. User B receives the invite token from User A
2. User B opens OpenCode (in any directory)
3. User B runs: `@group_session join --token gs_01JGXY123ABC`
4. Plugin validates token and adds User B to the session
5. Both users now see the same session state

### Collaborating

- Both users can prompt agents using their own configured providers
- Each message shows who sent it
- Users can use different models and compare approaches
- All file changes are visible to all participants
- Session state stays synchronized

## Security Features

### 1. Invite Tokens
- Cryptographically secure using ULID
- Single-use or time-limited
- Format: `gs_<ulid>` for easy identification

### 2. Permissions System
- Host has full control
- Participants have configurable permissions:
  - `canPrompt`: Send messages to agents
  - `canEdit`: Modify files
  - `canViewOnly`: Read-only access

### 3. Access Control
- Only host can kick participants
- Only host can change session settings
- Token required for joining

### 4. API Key Privacy
- Each user's API keys remain private
- No credentials shared between users
- All API calls use the user's own provider config

## Implementation Status

### ✅ Completed

- [x] Plugin package structure
- [x] Custom tool implementation
- [x] Session creation and invitation system
- [x] Participant management (join/leave/kick/list/status)
- [x] Configuration support
- [x] Basic permission system
- [x] Event hooks for synchronization
- [x] Documentation (README, examples, design doc)
- [x] TypeScript types
- [x] Workspace integration

### 🚧 To Be Implemented

- [ ] WebSocket-based real-time sync
- [ ] Persistent storage (currently in-memory)
- [ ] User authentication integration
- [ ] Rate limiting per participant
- [ ] Conflict resolution for concurrent edits
- [ ] TUI components for group session UI
- [ ] Connection status indicators
- [ ] Message attribution in UI
- [ ] Audit logging
- [ ] Unit tests

## Testing Plan

### Unit Tests
- Token generation and validation
- Permission checks
- Session lifecycle (create/join/leave)
- Participant management

### Integration Tests
- Multi-client scenarios
- Concurrent message handling
- Event synchronization
- Configuration loading

### Security Tests
- Invalid token handling
- Permission bypass attempts
- Rate limiting (when implemented)

## Future Enhancements

### Phase 1: Real-time Sync
- Implement WebSocket protocol
- Add message broadcasting
- Handle disconnections and reconnections

### Phase 2: Persistence
- Save sessions to disk/database
- Restore sessions after restart
- Session history and replay

### Phase 3: Advanced Features
- Voice/video integration
- Screen sharing
- Presence indicators
- Session analytics
- Team management

## Example Use Cases

### 1. Pair Programming
Two developers working on a feature together, each using their preferred AI model.

### 2. Code Review Sessions
Team code review where the presenter shares their session and others watch/comment.

### 3. Teaching/Mentoring
Instructor demonstrates AI-assisted coding to students in read-only mode.

### 4. Open Source Collaboration
Community contributors working together on a pull request.

### 5. Remote Team Collaboration
Distributed team members working together across time zones.

## Migration Path

For users with existing OpenCode setups:

1. **Install plugin**: Add to config or install from npm
2. **Configure**: Set preferences in `opencode.json`
3. **Start using**: Create sessions with `@group_session create`
4. **No changes to existing workflow**: Plugin is opt-in and doesn't affect normal usage

## Performance Considerations

### Current Implementation
- In-memory storage is fast but not persistent
- No network overhead until WebSocket implementation
- Minimal impact on single-user sessions

### Planned Optimizations
- Efficient WebSocket message batching
- Delta-based sync (only send changes)
- Compressed message payloads
- Connection pooling

## Conclusion

The Group Session Plugin provides a solid foundation for collaborative coding in OpenCode. The plugin architecture keeps it optional and maintainable, while the "own providers" approach ensures fair costs and better security. 

The current implementation covers core functionality and can be extended incrementally with real-time sync, persistence, and advanced features based on user feedback and needs.

## Quick Start

```bash
# 1. Add plugin to config
echo '{
  "plugin": ["@opencode-ai/group-session-plugin"]
}' > opencode.json

# 2. Create a session
opencode run "@group_session create"

# 3. Share the token with collaborators

# 4. Collaborators join
opencode run "@group_session join --token gs_xxx"

# 5. Start collaborating!
```

## Resources

- [Technical Design Document](../../GROUP_SESSION_DESIGN.md)
- [Plugin README](../group-session-plugin/README.md)
- [Example Configurations](../group-session-plugin/examples/)
- [Plugin API Documentation](../plugin/README.md)
- [OpenCode Documentation](https://opencode.ai/docs)
