import { appProxy } from '$lib/server/app-api'

// A transaction (or its undo) from the app, sent now or from the queue of ones made offline; the proof is the old transaction API's.
// manager and managerProof: a cash register's payment after a manager's card unlocked it (see PHP's cgpayTx). dupOk: the member confirmed a likely duplicate. cash: an exchange for cash, not for goods.
export const POST = appProxy('tx', ['token', 'actorId', 'otherId', 'amount', 'description', 'created', 'proof', 'offline', 'pending', 'tip', 'manager', 'managerProof', 'dupOk', 'cash'])
