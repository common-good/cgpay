<script>
  import u from '#utils.js'
  import st from'#store.js'

  const msg = 'Thank you for your feedback! We very much appreciate your participation in creating a Common Good economy.'
  let text

  async function submit() { await st.comment(text); u.alert(msg, u.goBack) }
</script>

<svelte:head>
  <title>CGPay - Comments and Suggestions</title>
  <div></div>
</svelte:head>

<section class="page" id="comment">
  <div class="top">
    <h1>Comments and Suggestions</h1>
      <p>We love feedback! Please type your comment and/or suggestion below in as much detail as you you think we might need.</p>
      <form id="feedback" on:submit|preventDefault={submit}>
        <label class='visuallyhidden' for='input-comment'>Type here</label>
        <textarea data-testid='input-comment' id='input-comment' name='comment' placeholder='Type here...' bind:value={ text } required></textarea> 
      </form>
  </div>
  <div class="bottom">
    <button data-testid='submit-comment' type='submit' form='feedback'>Submit</button>
  </div>
</section>

<style lang='stylus'>
  button
    cgButton()

  h1
    margin-bottom $s-1

  form
   height 100%
   width 100%
   overflow clip

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
    overflow scroll

  .top
    height 100%
    display flex
    flex-direction column
    margin-bottom $s0
</style>
