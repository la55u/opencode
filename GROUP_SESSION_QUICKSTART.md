# Group Session Quick Start Guide

Get started with collaborative coding in OpenCode in under 5 minutes!

## Installation

Add the plugin to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@opencode-ai/group-session-plugin"]
}
```

## Basic Usage

### 1. Create a Session (Host)

```bash
opencode run "@group_session create"
```

You'll receive an invite token like: `gs_01JGXY123ABC`

### 2. Join a Session (Participant)

```bash
opencode run "@group_session join --token gs_01JGXY123ABC"
```

### 3. Start Collaborating!

Both users can now:
- See the same session
- Prompt agents using their own providers
- View file changes in real-time

### 4. Manage Participants

```bash
# List all participants
@group_session list

# Check session status
@group_session status

# Kick a participant (host only)
@group_session kick --participantId user_abc123

# Leave the session
@group_session leave
```

## Configuration Options

```json
{
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

## Common Use Cases

### Pair Programming
Two developers collaborating on a feature.

**Config:**
```json
{
  "groupSession": {
    "maxParticipants": 2,
    "defaultPermissions": {
      "canPrompt": true
    }
  }
}
```

### Code Review
Team watching presenter's session.

**Config:**
```json
{
  "groupSession": {
    "maxParticipants": 10,
    "defaultPermissions": {
      "canPrompt": false,
      "canViewOnly": true
    }
  }
}
```

### Teaching
Instructor demonstrating to students.

**Config:**
```json
{
  "groupSession": {
    "maxParticipants": 20,
    "defaultPermissions": {
      "canViewOnly": true
    }
  }
}
```

## Key Features

- 🤝 **Collaborative**: Multiple users in one session
- 🔒 **Secure**: Token-based access control
- ⚡ **Own Providers**: Each user uses their own API keys
- 🎯 **Permissions**: Fine-grained access control
- 📊 **Real-time**: See changes as they happen

## FAQs

**Q: Do I need to share my API keys?**
A: No! Each user uses their own provider configuration.

**Q: Who pays for the AI usage?**
A: Each participant pays for their own model usage.

**Q: Can I use different models than others?**
A: Yes! Each user can use their preferred model.

**Q: How do I kick someone?**
A: Host can use `@group_session kick --participantId <id>`

**Q: Is it secure?**
A: Yes! Invitation tokens control access, and no credentials are shared.

## Troubleshooting

**Can't join session:**
- Verify the token is correct
- Check if session is full
- Ensure plugin is installed

**Not seeing updates:**
- Check internet connection
- Verify both users are connected
- Try reconnecting

## Next Steps

- Read the [full documentation](packages/group-session-plugin/README.md)
- Check out [example configurations](packages/group-session-plugin/examples/)
- Learn about the [architecture](GROUP_SESSION_DESIGN.md)

---

**Happy Collaborating!** 🚀
