# @opencode-ai/group-session-plugin

A plugin for OpenCode that enables collaborative group sessions, allowing multiple users to work together in real-time on the same coding session.

## Features

- 🤝 **Real-time Collaboration**: Multiple users can work in the same session simultaneously
- 🔒 **Secure Sharing**: Invitation-based access with token authentication
- 💬 **Message Attribution**: See who sent each message and which model they used
- ⚡ **Own Providers**: Each participant uses their own API keys and model preferences
- 🎯 **Permission Control**: Host can configure participant permissions
- 📊 **Session Sync**: All participants see the same session state in real-time

## Installation

### Via npm

```bash
npm install @opencode-ai/group-session-plugin
```

Add to your OpenCode config:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@opencode-ai/group-session-plugin"]
}
```

### Via Local Plugin

Place the plugin in your `.opencode/plugin/` directory.

## Usage

### Starting a Group Session

```bash
# In OpenCode TUI, use the custom tool
@group_session create
```

This will generate an invite token and URL that you can share with collaborators.

### Joining a Group Session

```bash
# Use the invite token received from the host
@group_session join --token <invite-token>
```

### Leaving a Group Session

```bash
@group_session leave
```

## Configuration

Add group session configuration to your `opencode.json`:

```json
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
    "requireAuthentication": true
  }
}
```

## How It Works

### Architecture

1. **Each User's Providers**: Each participant uses their own configured AI providers and pays for their own usage
2. **Real-time Sync**: WebSocket connection keeps all participants synchronized
3. **Message Attribution**: All messages include author information showing who sent them
4. **Secure Tokens**: Cryptographically secure invitation tokens for access control

### Security

- Invitation tokens are single-use or time-limited
- No API keys are shared between participants
- All messages are attributed to the sender
- Host has full control over the session
- Rate limiting prevents abuse

## License

MIT © OpenCode Team
