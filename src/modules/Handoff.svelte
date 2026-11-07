<script>
  import { onMount } from 'svelte'
  import st from '#store.js'
  import u from '#utils.js'
  import { saveHandoffDashboardUrl } from '../handoff.js'

  let error = ''
  const dashboardUrl = import.meta.env.VITE_CGPAY_DASHBOARD_URL ?? ''

  onMount(startHandoff)

  async function startHandoff() {
    const intent = new URLSearchParams(location.hash.slice(1)).get('intent')
    if (intent !== 'pay' && intent !== 'charge') {
      error = 'This payment link is invalid. Return to the dashboard and try again.'
      return
    }

    try {
      const result = await u.postRequest('handoff', {}, { credentials: 'include' })
      const account = result.accounts?.[0]
      if (!account || !result.dashboardUrl) throw new Error('The handoff response is incomplete.')

      st.setAcctChoices([account])
      st.setMe($st.choices[0])
      st.setShowDash(!account.isCo)
      st.setPayOk(account.isCo ? 'never' : true)
      st.setAllowShow(!account.isCo)
      st.setAcctChoices(null) // like LinkAccount (its 'lock' default)
      st.setCoPaying(false)
      st.setTimeout(null)
      saveHandoffDashboardUrl(result.dashboardUrl)
      st.setIntent(intent)
      u.go(($st.allowShow || $st.allowType) ? 'tx-start' : 'scan') // same rule as the Home screen: a company has nothing to show, so it goes straight to scan
    } catch (er) {
      if (Number(er.message) === 401) {
        if (dashboardUrl) {
          window.location.assign(`${dashboardUrl.replace(/\/$/, '')}/login`)
        } else {
          error = 'Please sign in to the Common Good dashboard, then try again.'
        }
        return
      }
      console.error('Could not complete the cgpay handoff.', er)
      error = 'Could not open the payment screen. Return to the dashboard and try again.'
    }
  }
</script>

<svelte:head>
  <title>CGPay - Opening Transaction</title>
</svelte:head>

<section class="page card" id="handoff" aria-live="polite">
  {#if error}
    <h1>Unable to open CGPay</h1>
    <p>{error}</p>
  {:else}
    <p>Connecting to your account...</p>
  {/if}
</section>

<style lang="stylus">
  .card
    display flex
    flex-direction column
    align-items center
    justify-content center
    height 100%

  p
    text-align center
</style>
