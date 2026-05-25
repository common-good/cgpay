// MariaDB connection pool. Reads connection info from env so the same code works against
// the local dev DB, the staging DB (via SSH tunnel), and eventually production.

import mysql from 'mysql2/promise'
import { env } from '$env/dynamic/private'

const pool = mysql.createPool({
  host: env.DB_HOST ?? '127.0.0.1',
  port: Number(env.DB_PORT ?? 3306),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  enableKeepAlive: true
})

export default pool
