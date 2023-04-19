<script>
  import { createEventDispatcher } from 'svelte'
  import Profile from '#modules/Profile.svelte'
  import store from '#store.js'
  import u from '#utils.js'
  // https://github.com/canutin/svelte-currency-input

  export let otherAccount
  export let photo
  export let tx
  export let limit

  let form

  const action = $store.selfServe ? 'Pay' : 'Charge'
  const dispatch = createEventDispatcher()

  async function charge() {
    if (!tx.proof) { // unless retrying
      tx.created = u.now() // Unix timestamp
      tx.amount = (+tx.amount).toFixed(2)
      tx.proof = u.hash(tx.actorId + tx.amount + tx.otherId + tx.code + tx.created)
      delete tx.code
      tx.offline = false
    }
    store.setMyAccount({ ...$store.myAccount, lastTx:tx.created })

    try {
      const res = await u.postRequest('transactions', tx)
      if (res.ok) dispatch('complete'); else dispatch('error', res.message) // update display
    } catch (er) { // except for syntax errors, queue it and treat it as success
      if (er == 400) { // syntax error
        throw new Error('Program issue: request syntax error')
      } else {
        console.log('saving tx for upload later:',tx)
        store.enqTx(tx)                                                                                                         
        if (!otherAccount.name) otherAccount.name = 'Unidentified Customer'
        dispatch('complete') // update display
      }
    }
  }

  // document.body.addEventListener("focus", event => {
  //     const target = event.target;
  //     console.log(target)
  //     switch (target.tagName) {
  //       case "INPUT":
  //       case "TEXTAREA":
  //       case "SELECT":
  //         document.body.classList.add("keyboard");
  //         // console.log("ELEM: ", target.scrollY)
  //         target.parentElement.scrollIntoView()
  //     }
  //   }, true); 

  //   document.body.addEventListener("blur", () => {
  //     document.body.classList.remove("keyboard");
  //   }, true); 

  let formHasFocus = false;
  function handleFocusIn(e) {
    console.log("TARGET? ", e.target)
    // if (formHasFocus) return;

    formHasFocus = true;
    document.body.classList.add("keyboard")
    e.target.classList.add('focused')
    form.scrollIntoView()

    form.addEventListener('focusout', (e) => {
      document.body.classList.remove("keyboard")
      console.log("BLURRED ", e.target)
    }, true)
  }

  function handleFocusOut() {
    console.log("FOCUS OUT")
    // form.addEventListener('focusout', (e) => {
      document.body.classList.remove("keyboard")
      console.log("BLURRED ", e.target)
    // }, true)
  }
</script>

<section id="submit-charge">
  <h1 data-testid="action">{action}</h1>
  <form on:submit|preventDefault={ charge } on:focusin={handleFocusIn} bind:this={form}>
    { #if !$store.selfServe }<Profile { otherAccount } {photo} />{ /if }
    <div class="bottom">
      <fieldset>
        <label for="amount">Amount</label>
        <input id="amount" data-testid="input-amount" type="number" min="0.01" step="0.01" max={ limit } name="amount" placeholder="$0.00" bind:value={ tx.amount } required />
        <label for="description">Description</label>
        <input id="description" data-testid="input-description" type="text" name="description" placeholder="e.g. lunch, rent, supplies, loan, etc." bind:value={ tx.description } autocomplete required />
      </fieldset>
      <button data-testid="btn-submit" type="submit">{action}</button>
    </div>
  </form>
</section>

<style lang="stylus">
  h1 
   margin-bottom $s1

  form
    height 100%
    display flex
    flex-direction column
    justify-content space-between

  section
    height 100%
    width 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between

  button
    cgButton()
</style>
