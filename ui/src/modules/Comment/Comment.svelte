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

<section id='comments'>
  <h1>Comments and Suggestions</h1>
  <div class='content'>
    <p>We love feedback! Please type your comment and/or suggestion below in as much detail as you you think we might need,
      in order to correct a problem or make your suggested improvement.</p>
    <form on:submit|preventDefault={ submit }>
      <!--label class='visuallyhidden' for='account-id'></label-->
      <textarea name='comment' placeholder='Type here...' bind:value={ text } required></textarea>
       <button type='submit'>Submit</button>
    </form>
  </div>
</section>

<style lang='stylus'>
  textarea
    border 1px solid darkgray
    width 100%
    height 300px
    margin-top $s2
    margin-bottom $s2

  section
    height 100%
    display flex
    flex-direction column
    align-items center

  p
    text(lg)
    text-align left
    height 72px
    margin-bottom $s3

  button
    cgButton()

  h1
    margin-bottom $s1

  form
    height 100%
    margin-bottom $s2

  .content
    width 100%
    height 100%
    display flex
    flex-direction column
    align-items center

</style>
