import { env } from '$env/dynamic/public'

/**
 * Return the full path for a specified endpoint or page on the PHP server.
 * @param target: a valid address on the backend server
 * @returns the full path, based on the PUBLIC_PHP_BASE_URL environment parameter.
 */
export function phpUrl(target: string): string {
  const baseUrl = env.PUBLIC_PHP_BASE_URL as string | undefined
  try {
    if (!baseUrl || baseUrl.endsWith('/')) throw new Error('PUBLIC_PHP_BASE_URL must exist and must not include a trailing slash.')
    const u = new URL(target, baseUrl + '/')
    return u.toString()
  } catch (error) {
    throw new Error(`Failed to generate PHP server URL for target "${target}": ${error}`)
  }
}
