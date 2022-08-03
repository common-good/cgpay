<script>
  import { navigateTo } from 'svelte-router-spa'
  import { onMount } from 'svelte'

  import accountStore from '../Account/account.store.js'

  // --------------------------------------------

  onMount(() => {
    if (!$accountStore.account) {
      navigateTo('/sign-in')
    }
  })
</script>

<svelte:head>
  <title>CG Pay - Collect Payment</title>
</svelte:head>

<section id='pay'>
  <h1>Pay</h1>
</section>
