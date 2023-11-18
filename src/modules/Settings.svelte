<script>
  import st from '#store.js'
  import StoreToggle from './StoreToggle.svelte'
  import Radios from './Radios.svelte'

  const payOkOptions = { always:'always', scan:'only if a manager scans in', never:'never' }
  let payOk = $st.payOk

  function setPayOk() { st.setPayOk(payOk) }

</script>

<svelte:head>
  <title>CGPay - Settings</title>
</svelte:head>

<section class="page" id="settings">
  <div class='top'>
    <h1 class="page-title">Settings</h1>

    {#if $st.me.isCo}
    <p>Allow payments from this account:</p>
    <Radios name="payOk" options={payOkOptions} bind:value={payOk} on:click={setPayOk} required="required" />
    {/if}

    <StoreToggle k="selfServe" op={st.setSelf} label="Self-serve mode"/>
    <StoreToggle k="showDash" op={st.setShowDash} label="Show transactions on Home Page"/>
    {#if $st.cameraCount > 1}
    <StoreToggle k="frontCamera" op={st.setFrontCamera} label="Use front camera"/>
    {/if}
    <StoreToggle k="allowType" op={st.setAllowType} label="Allow type-to-transact"/>
    <StoreToggle k="allowShow" op={st.setAllowShow} label="Show a QR to pay or charge"/>
    <StoreToggle k="locked" op={st.setLocked} label="Require sign-in to change account or settings"/>

  </div>
</section>
