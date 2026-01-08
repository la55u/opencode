# Group Session Examples

This directory contains example configurations and use cases for the Group Session Plugin.

## Example 1: Basic Collaboration

Two developers working together on a feature:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@opencode-ai/group-session-plugin"],
  "groupSession": {
    "enabled": true,
    "maxParticipants": 2,
    "defaultPermissions": {
      "canPrompt": true,
      "canEdit": false,
      "canViewOnly": false
    }
  }
}
```

**Steps:**
1. Developer A creates session: `@group_session create`
2. Developer A shares token with Developer B
3. Developer B joins: `@group_session join --token gs_xxx`
4. Both can prompt agents using their own providers
5. Both see the same session state in real-time

## Example 2: Team Code Review

One person sharing their screen with the team:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@opencode-ai/group-session-plugin"],
  "groupSession": {
    "enabled": true,
    "maxParticipants": 10,
    "defaultPermissions": {
      "canPrompt": false,
      "canEdit": false,
      "canViewOnly": true
    }
  }
}
```

## Command Reference

```bash
# Create a new group session
@group_session create

# Join a session
@group_session join --token gs_xxx

# Check session status
@group_session status

# List participants
@group_session list

# Leave session
@group_session leave
```

## Tips

1. **Token Security**: Treat invite tokens like passwords. Anyone with the token can join.
2. **Provider Setup**: All participants should have their providers configured before joining.
3. **Model Choice**: Different users can use different models - use this to compare approaches!
4. **Session Size**: Smaller groups (2-3) work best for active collaboration.
