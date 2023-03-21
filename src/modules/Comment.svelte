<script>
  import { goHome } from '#utils.js'
  import store from '#store.js'

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)

  let text

  async function submit() {
    store.comment(text)
    goHome('Thank you for your feedback! We very much appreciate your participation in creating a Common Good economy.')
  }
</script>

<svelte:head>
  <title>CGPay - Comments and Suggestions</title>
</svelte:head>

<section id='comment'>
  <div class="top">
    <h1>Comments and Suggestions</h1>
      <p>We love feedback! Please type your comment and/or suggestion below in as much detail as you you think we might need, in order to correct a problem or make your suggested improvement.</p>
      <form id="feedback" on:submit|preventDefault={ submit }>
        <!--label class='visuallyhidden' for='account-id'></label-->
        <textarea name='comment' placeholder='Type here...' bind:value={ text } required></textarea> 
      </form>
  </div>
  <button type='submit' form="feedback">Submit</button>
</section>

<style lang='stylus'>
  button
    cgButton()

  h1
    margin-bottom $s0
    text-align center

  form
   height 100%
   width 100%

  p 
    margin-bottom $s0

  section
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content: space-between

  textarea
    border 1px solid darkgray
    height 100%
    width 100%
    padding $s-2

  .top
    height 100%
    display flex
    flex-direction column
    margin-bottom $s0
</style>
