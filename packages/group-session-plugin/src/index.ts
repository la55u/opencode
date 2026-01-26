import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { ulid } from "ulid"

/**
 * Group Session Plugin for OpenCode
 * Enables collaborative coding sessions with multiple participants
 */

// Types
export interface GroupSessionConfig {
  enabled?: boolean
  maxParticipants?: number
  defaultPermissions?: {
    canPrompt?: boolean
    canEdit?: boolean
    canViewOnly?: boolean
  }
  inviteTokenExpiry?: number
  requireAuthentication?: boolean
}

export interface Participant {
  id: string
  username: string
  joinedAt: number
  permissions: {
    canPrompt: boolean
    canEdit: boolean
    canViewOnly: boolean
  }
  connected: boolean
}

export interface GroupSession {
  id: string
  sessionID: string
  host: {
    id: string
    username: string
  }
  participants: Participant[]
  inviteToken: string
  maxParticipants: number
  createdAt: number
  updatedAt: number
  status: "active" | "ended"
}

// In-memory storage for group sessions (can be persisted to disk later)
const groupSessions = new Map<string, GroupSession>()
const sessionToGroup = new Map<string, string>() // maps sessionID -> groupSessionID
const userSessions = new Map<string, string>() // maps userID -> groupSessionID

/**
 * Generate a secure invite token
 */
function generateInviteToken(): string {
  return `gs_${ulid()}`
}

/**
 * Get default configuration
 */
function getDefaultConfig(): Required<GroupSessionConfig> {
  return {
    enabled: true,
    maxParticipants: 5,
    defaultPermissions: {
      canPrompt: true,
      canEdit: false,
      canViewOnly: false,
    },
    inviteTokenExpiry: 86400000, // 24 hours
    requireAuthentication: false,
  }
}

/**
 * Main plugin export
 */
export const GroupSessionPlugin: Plugin = async ({ client, project, $, directory, worktree, serverUrl }) => {
  const config: Required<GroupSessionConfig> = getDefaultConfig()

  // Initialize plugin
  await client.app.log({
    service: "group-session-plugin",
    level: "info",
    message: "Group Session Plugin initialized",
    extra: { project: project.id, directory },
  })

  return {
    // Apply configuration
    config: async (userConfig: any) => {
      if (userConfig.groupSession) {
        Object.assign(config, userConfig.groupSession)
      }
    },

    // Custom tool for managing group sessions
    tool: {
      group_session: tool({
        description: `Manage collaborative group sessions. Allows multiple users to work together in the same OpenCode session.
        
Actions:
- create: Start a new group session and get an invite token
- join: Join an existing group session using an invite token  
- leave: Leave the current group session
- list: List participants in the current group session
- kick: Remove a participant (host only)
- status: Get current group session status`,
        args: {
          action: tool.schema
            .enum(["create", "join", "leave", "list", "kick", "status"])
            .describe("Action to perform"),
          token: tool.schema.string().optional().describe("Invite token (required for 'join')"),
          participantId: tool.schema.string().optional().describe("Participant ID (required for 'kick')"),
          maxParticipants: tool.schema.number().optional().describe("Maximum participants (for 'create')"),
          permissions: tool.schema
            .object({
              canPrompt: tool.schema.boolean().optional(),
              canEdit: tool.schema.boolean().optional(),
              canViewOnly: tool.schema.boolean().optional(),
            })
            .optional()
            .describe("Participant permissions (for 'create')"),
        },
        async execute(args, ctx) {
          if (!config.enabled) {
            return "Group sessions are disabled in configuration."
          }

          const action = args.action

          // CREATE: Start a new group session
          if (action === "create") {
            const sessionID = ctx.sessionID
            
            // Check if session already has a group
            if (sessionToGroup.has(sessionID)) {
              return "This session is already part of a group session."
            }

            const groupSessionID = ulid()
            const inviteToken = generateInviteToken()
            const hostID = ulid() // In real implementation, get from auth

            const groupSession: GroupSession = {
              id: groupSessionID,
              sessionID,
              host: {
                id: hostID,
                username: "host", // In real implementation, get from auth
              },
              participants: [
                {
                  id: hostID,
                  username: "host",
                  joinedAt: Date.now(),
                  permissions: {
                    canPrompt: true,
                    canEdit: true,
                    canViewOnly: false,
                  },
                  connected: true,
                },
              ],
              inviteToken,
              maxParticipants: args.maxParticipants ?? config.maxParticipants,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              status: "active",
            }

            groupSessions.set(groupSessionID, groupSession)
            sessionToGroup.set(sessionID, groupSessionID)
            userSessions.set(hostID, groupSessionID)

            await client.app.log({
              service: "group-session-plugin",
              level: "info",
              message: "Group session created",
              extra: { groupSessionID, sessionID },
            })

            return JSON.stringify({
              success: true,
              groupSessionID,
              inviteToken,
              inviteUrl: `${serverUrl}/group-session/join?token=${inviteToken}`,
              message: `Group session created! Share this token with collaborators: ${inviteToken}`,
            }, null, 2)
          }

          // JOIN: Join an existing group session
          if (action === "join") {
            if (!args.token) {
              return "Error: 'token' is required for join action."
            }

            // Find group session by invite token
            let targetGroup: GroupSession | undefined
            for (const group of groupSessions.values()) {
              if (group.inviteToken === args.token && group.status === "active") {
                targetGroup = group
                break
              }
            }

            if (!targetGroup) {
              return "Error: Invalid or expired invite token."
            }

            if (targetGroup.participants.length >= targetGroup.maxParticipants) {
              return "Error: Group session is full."
            }

            const participantID = ulid() // In real implementation, get from auth
            const participant: Participant = {
              id: participantID,
              username: `user_${participantID.slice(0, 6)}`, // In real implementation, get from auth
              joinedAt: Date.now(),
              permissions: {
                canPrompt: config.defaultPermissions.canPrompt ?? true,
                canEdit: config.defaultPermissions.canEdit ?? false,
                canViewOnly: config.defaultPermissions.canViewOnly ?? false,
              },
              connected: true,
            }

            targetGroup.participants.push(participant)
            targetGroup.updatedAt = Date.now()
            userSessions.set(participantID, targetGroup.id)

            await client.app.log({
              service: "group-session-plugin",
              level: "info",
              message: "Participant joined group session",
              extra: { groupSessionID: targetGroup.id, participantID },
            })

            return JSON.stringify({
              success: true,
              groupSessionID: targetGroup.id,
              sessionID: targetGroup.sessionID,
              participants: targetGroup.participants.map(p => ({
                username: p.username,
                joinedAt: p.joinedAt,
                connected: p.connected,
              })),
              message: `Joined group session! ${targetGroup.participants.length} participant(s) online.`,
            }, null, 2)
          }

          // LEAVE: Leave current group session
          if (action === "leave") {
            const userID = ulid() // In real implementation, get from auth
            const groupSessionID = userSessions.get(userID)

            if (!groupSessionID) {
              return "You are not in any group session."
            }

            const groupSession = groupSessions.get(groupSessionID)
            if (!groupSession) {
              return "Error: Group session not found."
            }

            // Remove participant
            groupSession.participants = groupSession.participants.filter(p => p.id !== userID)
            userSessions.delete(userID)

            // If host leaves or no participants left, end session
            if (groupSession.host.id === userID || groupSession.participants.length === 0) {
              groupSession.status = "ended"
              groupSessions.delete(groupSessionID)
              sessionToGroup.delete(groupSession.sessionID)
              return "Group session ended."
            }

            groupSession.updatedAt = Date.now()

            await client.app.log({
              service: "group-session-plugin",
              level: "info",
              message: "Participant left group session",
              extra: { groupSessionID, userID },
            })

            return "Left group session."
          }

          // LIST: List participants
          if (action === "list") {
            const sessionID = ctx.sessionID
            const groupSessionID = sessionToGroup.get(sessionID)

            if (!groupSessionID) {
              return "This session is not part of any group session."
            }

            const groupSession = groupSessions.get(groupSessionID)
            if (!groupSession) {
              return "Error: Group session not found."
            }

            return JSON.stringify({
              groupSessionID,
              host: groupSession.host.username,
              participants: groupSession.participants.map(p => ({
                username: p.username,
                joinedAt: new Date(p.joinedAt).toISOString(),
                connected: p.connected,
                permissions: p.permissions,
              })),
              status: groupSession.status,
            }, null, 2)
          }

          // KICK: Remove a participant (host only)
          if (action === "kick") {
            if (!args.participantId) {
              return "Error: 'participantId' is required for kick action."
            }

            const sessionID = ctx.sessionID
            const groupSessionID = sessionToGroup.get(sessionID)

            if (!groupSessionID) {
              return "This session is not part of any group session."
            }

            const groupSession = groupSessions.get(groupSessionID)
            if (!groupSession) {
              return "Error: Group session not found."
            }

            const hostID = ulid() // In real implementation, get from auth
            if (groupSession.host.id !== hostID) {
              return "Error: Only the host can kick participants."
            }

            const participantIndex = groupSession.participants.findIndex(p => p.id === args.participantId)
            if (participantIndex === -1) {
              return "Error: Participant not found."
            }

            const participant = groupSession.participants[participantIndex]
            groupSession.participants.splice(participantIndex, 1)
            userSessions.delete(participant.id)
            groupSession.updatedAt = Date.now()

            await client.app.log({
              service: "group-session-plugin",
              level: "info",
              message: "Participant kicked from group session",
              extra: { groupSessionID, participantId: args.participantId },
            })

            return `Kicked participant: ${participant.username}`
          }

          // STATUS: Get current status
          if (action === "status") {
            const sessionID = ctx.sessionID
            const groupSessionID = sessionToGroup.get(sessionID)

            if (!groupSessionID) {
              return "This session is not part of any group session."
            }

            const groupSession = groupSessions.get(groupSessionID)
            if (!groupSession) {
              return "Error: Group session not found."
            }

            return JSON.stringify({
              groupSessionID,
              sessionID: groupSession.sessionID,
              status: groupSession.status,
              host: groupSession.host.username,
              participantCount: groupSession.participants.length,
              maxParticipants: groupSession.maxParticipants,
              createdAt: new Date(groupSession.createdAt).toISOString(),
              participants: groupSession.participants.map(p => p.username),
            }, null, 2)
          }

          return "Unknown action."
        },
      }),
    },

    // Handle events for synchronization
    event: async ({ event }) => {
      // Sync session events across participants
      if (event.type === "session.updated" && event.properties?.info) {
        const sessionID = event.properties.info.id
        const groupSessionID = sessionToGroup.get(sessionID)
        
        if (groupSessionID) {
          await client.app.log({
            service: "group-session-plugin",
            level: "debug",
            message: "Session updated in group session",
            extra: { groupSessionID, sessionID },
          })
          // In full implementation, broadcast to all participants via WebSocket
        }
      }

      // Handle message events
      if (event.type === "message.updated" && event.properties?.info) {
        const sessionID = event.properties.info.sessionID
        const groupSessionID = sessionToGroup.get(sessionID)
        
        if (groupSessionID) {
          await client.app.log({
            service: "group-session-plugin",
            level: "debug",
            message: "Message updated in group session",
            extra: { groupSessionID, sessionID },
          })
          // In full implementation, broadcast message to all participants
        }
      }
    },

    // Modify messages to include author attribution
    "chat.message": async (input, output) => {
      const groupSessionID = sessionToGroup.get(input.sessionID)
      
      if (groupSessionID) {
        const groupSession = groupSessions.get(groupSessionID)
        if (groupSession) {
          // In full implementation, add author metadata to the message
          await client.app.log({
            service: "group-session-plugin",
            level: "debug",
            message: "Message sent in group session",
            extra: { groupSessionID, sessionID: input.sessionID },
          })
        }
      }
    },
  }
}

export default GroupSessionPlugin
