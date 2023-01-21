<script>
  import { navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import store from '#store.js'
  import Modal from '../Modal.svelte'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  let myName, erMsg

  function handleOkay() {
    erMsg = null
    store.erMsg.set(null)
  }

  onMount(async () => {
    erMsg = store.erMsg.get()
    myName = $store.myAccount.name
  })
</script>

<Modal show={erMsg}
  title="Alert" text={erMsg} labels="OK, "
  on:fn1={ handleOkay }
/>

<svelte:head>
  <title>CG Pay</title>
</svelte:head>

<section id='home'>
  <h2>{ myName }</h2>
  <h2>Ready to charge customers</h2>
  <a href='/scan'>Scan QR</a>
</section>

<style lang='stylus'>
  button, a
    cgButton()
    margin $s2 0 0

  .content
    cgCard()
    background-color $c-green
</style>
