<script>
  import { navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import store from '#store.js'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  let myName, erMsg

  function handleOkay() {
    erMsg = null
    store.erMsg.set(null)
  }

  onMount(async () => {
    store.erMsg.set('Test error message. If this had been a real error message, you would have been instructed.')
    erMsg = store.erMsg.get()
    myName = $store.myAccount.name
  })
</script>

<svelte:head>
  <title>CG Pay</title>
</svelte:head>

<section id='home'>
  <h2>{ myName }</h2>

  { #if erMsg }
    <h1>Error</h1>
    <p>{ erMsg }</p>
    <button on:click={ handleOkay }>Okay</button>
  { :else }
    <h2>Ready to charge customers</h2>
    <a href='/scan'>Scan QR</a>
  { /if }
</section>

<style lang='stylus'>
  button, a
    cgButton()
    margin $s2 0 0

  .content
    cgCard()
    background-color $c-green
</style>
