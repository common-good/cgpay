<script lang="ts">
  import { Capacitor } from '@capacitor/core'
  import { App as CapApp } from '@capacitor/app'
  import { call, token } from './lib/auth'
  import { logText } from './lib/log'

  let message = $state(''), sent = $state(false), err = $state(''), busy = $state(false)

  // The message goes with the app's recent log, so the tech team can see what went wrong, if anything.
  async function send(e: Event) {
    e.preventDefault(); err = ''; busy = true
    try {
      const version = Capacitor.isNativePlatform() ? (await CapApp.getInfo()).version : 'web'
      const { status } = await call('feedback', { token: await token(), message, log: await logText(), version, platform: Capacitor.getPlatform() })
      if (status === 200) sent = true; else err = 'Your message could not be sent. Try again later.'
    } catch { err = 'Feedback needs a connection. Try again when you have a signal.' }
    busy = false
  }
</script>

<section class="page">
  <h1>Feedback</h1>
  {#if sent}
    <p data-testid="feedback-sent">Thank you! Your message is on its way to Common Good.</p>
  {:else}
    <form onsubmit={send}>
      <label for="message">What would you like to tell us? Ideas, praise and problems are all welcome.</label>
      <textarea id="message" data-testid="input-message" rows="6" bind:value={message} required></textarea>
      <p class="note">The app's recent log goes with your message, to help us fix any problem. It holds no passwords or card codes.</p>
      {#if err}<p class="err" role="alert" data-testid="feedback-error">{err}</p>{/if}
      <button data-testid="btn-send" type="submit" disabled={busy}>Send</button>
    </form>
  {/if}
</section>

<style>
  form { display: flex; flex-direction: column; gap: 8px; }
  textarea { font: inherit; padding: 12px; border: 1px solid #9aa39d; border-radius: 8px; }
  .note { font-size: 0.85rem; }
  .err { color: #b3261e; }
</style>
