<script lang="ts">
  import { goto } from '$app/navigation'

  let name = $state('')
  let password = $state('')
  let error = $state<string | null>(null)
  let submitting = $state(false)

  async function submit(e: Event) {
    e.preventDefault()
    error = null
    submitting = true
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, password })
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        error = body.message ?? `login failed (${res.status})`
        return
      }
      const { token } = await res.json()
      localStorage.setItem('cg_token', token)
      await goto('/')
    } finally {
      submitting = false
    }
  }
</script>

<main>
  <h1>Sign in</h1>
  <form onsubmit={submit}>
    <label>
      Username
      <input type="text" bind:value={name} autocomplete="username" required />
    </label>
    <label>
      Password
      <input type="password" bind:value={password} autocomplete="current-password" required />
    </label>
    {#if error}<p class="error">{error}</p>{/if}
    <button type="submit" disabled={submitting}>
      {submitting ? 'Signing in…' : 'Sign in'}
    </button>
  </form>
</main>

<style>
  main { max-width: 320px; margin: 4rem auto; font-family: system-ui, sans-serif; }
  h1 { margin-bottom: 1.5rem; }
  form { display: grid; gap: 1rem; }
  label { display: grid; gap: 0.25rem; font-size: 0.9rem; }
  input { padding: 0.5rem; font-size: 1rem; }
  button { padding: 0.6rem; font-size: 1rem; cursor: pointer; }
  .error { color: #b00020; margin: 0; }
</style>
