// Shared chat-moderation helpers. Mirrors the backend's
// utils/messageModeration.js so the admin UI never leaks removed content.

export const REMOVED_MESSAGE_TEXT = 'This message was removed.'

const REMOVED_STATUSES = new Set([
  'user_deleted',
  'admin_removed',
  'deleted',
  'removed',
])

// True when a message has been removed (by sender or admin) and must be
// rendered as a placeholder with no original text/media exposed.
export const isRemovedMessage = (msg) =>
  !!msg && (REMOVED_STATUSES.has(msg.moderationStatus) || msg.type === 'removed')
