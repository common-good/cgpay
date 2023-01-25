<script>
  export let otherAccount
  export let photo
</script>

<section id='charge-profile'>
  <img src={ otherAccount.photo } alt='{ otherAccount.photoAlt }' />
  <p class="agent">{ otherAccount.agent }</p>
  <p>{ otherAccount.name }</p>
  <p>{ otherAccount.location }</p>
</section>

<style lang='stylus'>
  section
    display flex
    flex-direction column
    align-items center
    margin-bottom $s3

  img
    height: 200px
    margin-bottom $s2

  .agent
    text(lg)
    margin-bottom $s1

</style>
