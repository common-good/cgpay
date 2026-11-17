// The live site the bundled screens talk to and return to (the tests point it at the server under test).
export const live = (import.meta.env.VITE_LIVE_URL || 'https://pay.test.commongood.earth').replace(/\/$/, '')
