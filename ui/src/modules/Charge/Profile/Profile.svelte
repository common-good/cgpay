<script>
  export let otherAccount
  export let photo
</script>

<section id='charge-profile'>
  <img src={ photo.blob } alt='{ photo.alt }' />
  <p class="agent">{ otherAccount.agent }</p>
  <p>{ otherAccount.name }</p>
  <p>{ otherAccount.location }</p>
</section>

<style lang='stylus'>
  section
    display flex
    flex-direction column
    align-items center
    margin-bottom $ss

  img
    height: 120px
    margin-bottom $s1

  .agent
    text(lg)

</style>
