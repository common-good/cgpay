<script>
  import { navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import store from '#store.js'
  import { dlg } from '#utils.js'
  import Modal from '../Modal.svelte'; let m0, m1, m2

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  function er(msg) { 
    ({ m0, m1 } = dlg('Alert', msg, 'OK', () => m0 = false)); m0=m0; m1=m1
    store.erMsg.set(null)
  }

  onMount(async () => {
    store.qr.set(null) // no going back to previous customer
    const erMsg = await store.erMsg.get()
    if (erMsg) er(erMsg)
  })
</script>

<Modal m0={m0} on:m1={m1} on:m2={m2} />

<svelte:head>
  <title>CG Pay</title>
</svelte:head>

<section id='home'>
    <h1>Home</h1>
    <p>Ready to charge or pay.</p>
    <div class="actions">
      <a class="secondary" href="/show-qr">Show QR</a>
      <a href='/scan'>Scan QR</a>
    </div>
</section>

<style lang='stylus'>
  h1
    font-weight 600
    text lg
  section
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between
  .actions
    width 100%
  a
    cgButton()
    margin-bottom $ss
    &.secondary
      cgButtonSecondary()
    &:last-of-type
      margin-bottom 0
</style>
