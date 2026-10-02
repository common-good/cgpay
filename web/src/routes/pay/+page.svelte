<script lang="ts">
  import { onMount } from 'svelte'
  import { env } from '$env/dynamic/public'
  import QRCode from 'qrcode'

  let { data } = $props()

  const phpBase = env.PUBLIC_PHP_BASE_URL ?? ''
  function phpUrl(path: string): string {
    if (!phpBase) return '#'
    return phpBase.replace(/\/$/, '') + path
  }

  let qrDataUrl = $state<string>('')
  let qrError = $state<string | null>(null)

  onMount(async () => {
    if (!data.user?.qid) {
      qrError = 'Your account code is not available right now - try reloading the page.'
      return
    }
    try {
      qrDataUrl = await QRCode.toDataURL(data.user.qid, {
        width: 320,
        margin: 1,
        color: { dark: '#0946A6', light: '#ffffff' }
      })
    } catch (e) {
      console.error('[pay] QR render failed:', e)
      qrError = 'Could not render your QR code.'
    }
  })
</script>

<main class="pay-page">
  <h1>Show To Pay</h1>
  <p class="sub">Have another member scan this code to pay you, or use one of the buttons below.</p>

  <div class="qr-wrap">
    {#if qrError}
      <div class="qr-error">{qrError}</div>
    {:else if qrDataUrl}
      <img src={qrDataUrl} alt={`QR code for ${data.user?.qid ?? ''}`} />
      <div class="qr-code">{data.user?.qid}</div>
    {:else}
      <div class="qr-placeholder">Generating QR...</div>
    {/if}
  </div>

  <div class="actions">
    <a class="btn btn-primary" href={phpUrl('/tx/charge')}>Scan To Pay</a>
    <a class="btn btn-primary" href={phpUrl('/tx/pay')}>Type To Pay</a>
  </div>
</main>

<style>
  .pay-page {
    max-width: 480px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 2rem;
    text-align: center;
  }
  h1 {
    margin: 0 0 0.4rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--cg-text);
  }
  .sub {
    margin: 0 0 1.5rem;
    color: var(--cg-text-muted);
    font-size: 0.92rem;
    line-height: 1.4;
  }

  .qr-wrap {
    background: var(--cg-surface);
    border: 1px solid var(--cg-border);
    border-radius: var(--cg-radius);
    box-shadow: var(--cg-shadow);
    padding: 1.25rem;
    margin-bottom: 1.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .qr-wrap img {
    width: 100%;
    max-width: 320px;
    height: auto;
    display: block;
  }
  .qr-placeholder, .qr-error {
    width: 100%;
    aspect-ratio: 1 / 1;
    max-width: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cg-text-muted);
    font-size: 0.9rem;
    background: rgba(0, 0, 0, 0.02);
    border-radius: var(--cg-radius-sm);
  }
  .qr-error { color: var(--cg-error); }
  .qr-code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 1.1rem;
    letter-spacing: 0.08em;
    color: var(--cg-text);
    font-weight: 600;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    flex-direction: column;
  }
  .btn {
    display: block;
    padding: 0.85rem 1rem;
    border-radius: var(--cg-radius-sm);
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    border: none;
  }
  .btn-primary {
    background: var(--cg-navy);
    color: #fff;
  }
  .btn-primary:hover { opacity: 0.92; text-decoration: none; }

  @media (min-width: 480px) {
    .actions { flex-direction: row; }
    .actions .btn { flex: 1; }
  }
</style>
