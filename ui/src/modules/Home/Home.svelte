<script>
  import { navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import store from '#store.js'
  import { dlg } from '#utils.js'
  import Modal from '../Modal.svelte'; let m0, m1, m2

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  let myName
  
  function er(msg) { 
    ({ m0, m1 } = dlg('Alert', msg, 'OK', () => m0 = false)); m0=m0; m1=m1
    store.erMsg.set(null)
  }

  onMount(async () => {
    store.qr.set(null) // no going back to previous customer
    const erMsg = await store.erMsg.get()
    if (erMsg) er(erMsg)
    myName = $store.myAccount.name
  })
</script>

<Modal m0={m0} on:m1={m1} on:m2={m2} />

<svelte:head>
  <title>CG Pay</title>
</svelte:head>

<section id='home'>
  <h2>{ myName }</h2>
  <h2>Ready to charge customers</h2>
  <a href='/scan'>Scan QR</a>
</section>

<style lang='stylus'>
  a
    cgButton()
    margin $s2 0 0
</style>
