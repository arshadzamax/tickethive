import { getClientId } from './constants.js'

/**
 * Returns the effective user ID for seat ownership checks.
 *
 * When a user is logged in via JWT, the backend stores the JWT user's DB id
 * as `locked_by` in the seats table.  The frontend must therefore compare
 * seat.lockedBy against that same DB id — NOT the random anonymous clientId.
 *
 * If *no* JWT user is present (legacy / anon flow), we fall back to the
 * anonymous clientId so things still work without auth.
 */
export const selectEffectiveUserId = state => {
    const user = state.auth?.user
    if (user && user.id != null) {
        // The backend stores locked_by as a string in Postgres, but the id might
        // come back as a number from JSON.  Normalise to string for safe comparison.
        return String(user.id)
    }
    // Anonymous / legacy fallback
    return typeof window !== 'undefined' ? getClientId() : 'server'
}
