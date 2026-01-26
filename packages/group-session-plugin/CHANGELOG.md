# Changelog

All notable changes to the Group Session Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-01-08

### Added
- Initial release of Group Session Plugin
- Core functionality for creating and joining collaborative sessions
- Custom `group_session` tool with actions: create, join, leave, list, kick, status
- Invitation token system for secure session sharing
- Participant management and permissions
- Configuration support via `opencode.json`
- Event handling for session synchronization
- Message attribution for multi-user scenarios
- Basic in-memory storage for group sessions

### Features
- **Session Management**: Create, join, and leave group sessions
- **Participant Control**: Host can kick participants and manage permissions
- **Security**: Invite tokens for controlled access
- **Flexibility**: Each user uses their own AI providers and API keys
- **Configuration**: Customizable max participants, permissions, and token expiry

### Documentation
- Comprehensive README with installation and usage instructions
- Technical design document outlining architecture decisions
- Example configurations for common use cases
- TypeScript type definitions

### Notes
- This is an initial implementation focusing on core functionality
- WebSocket real-time sync is planned for future release
- Persistent storage (disk/database) planned for future release
- Authentication integration planned for future release

## [Unreleased]

### Planned Features
- WebSocket-based real-time synchronization
- Persistent storage for sessions
- User authentication integration
- Rate limiting per participant
- Conflict resolution for concurrent edits
- Connection status indicators
- Presence indicators (typing, viewing)
- Session recording and replay
- Advanced permissions system
- TUI components for group session UI
