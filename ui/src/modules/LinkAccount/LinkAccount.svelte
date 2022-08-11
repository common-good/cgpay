<script>
  import queryString from 'query-string'
  import { onMount } from 'svelte'

  import store from '#app.store.js'

  // --------------------------------------------

  let business
  let ready = false

  // --------------------------------------------

  onMount(async () => {
    // Should these requests be in a helper for
    // easier testing?
    try {
      const { identifier } = $store.auth.account
      const query = queryString.stringify({ identifier })
      const response = await fetch(`${ __membersApi__ }/businesses?${ query }`)

      if (response.ok) {
        const { businesses } = await response.json()
        business = businesses[0]
        ready = true
      }

      else {
        throw new Error()
      }
    }

    catch (error) {
      // TODO: Handle and test no server access.
      console.error(error)
    }
  })
</script>

<section id='link-account'>
  { #if ready }
    <h1>{ business.name }</h1>
    <p>Your account has been automatically linked.</p>
  { :else }
    <p>Finding your business...</p>
  { /if }
</section>
