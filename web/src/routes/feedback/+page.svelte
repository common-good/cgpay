<script lang="ts">
  let message = $state(''), sent = $state(false), err = $state(''), busy = $state(false)

  async function send(e: Event) {
    e.preventDefault(); err = ''; busy = true
    try {
      const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) })
      if (res.ok) sent = true; else err = (await res.json().catch(() => ({}))).message || 'Your message could not be sent. Try again later.'
    } catch { err = 'Your message could not be sent. Check your connection and try again.' }
    busy = false
  }
</script>

<svelte:head><title>Feedback</title></svelte:head>

<section class="page">
  <h1>Feedback</h1>
  {#if sent}
    <p data-testid="feedback-sent">Thank you! Your message is on its way to Common Good.</p>
  {:else}
    <form data-testid="feedback-form" onsubmit={send}>
      <label for="message">What would you like to tell us? Ideas, praise and problems are all welcome.</label>
      <textarea id="message" data-testid="input-message" rows="6" bind:value={message} required></textarea>
      {#if err}<p class="err" role="alert" data-testid="feedback-error">{err}</p>{/if}
      <button data-testid="btn-send" type="submit" disabled={busy}>Send</button>
    </form>
  {/if}
</section>

<style>
  .page { max-width: 560px; margin: 0 auto; padding: 16px; }
  form { display: flex; flex-direction: column; gap: 8px; }
  textarea { font: inherit; padding: 12px; border: 1px solid #9aa39d; border-radius: 8px; }
  .err { color: #b3261e; }
</style>
