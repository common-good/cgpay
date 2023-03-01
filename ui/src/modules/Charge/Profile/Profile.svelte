<script>
  import ProfileSvg from './ProfileSvg.svelte'

  export let otherAccount
  export let photo

</script>

<section id='charge-profile'>
  <div class='photo'>
    {#if photo.blob}
      <img src={ photo.blob } alt='{ photo.alt }' />
    {:else}
      <ProfileSvg />
    {/if}
  </div>
  <div class='info'>
    {#if otherAccount.agent}
      <h2>{otherAccount.agent}</h2>
      <p>{ otherAccount.name }</p>
    {:else}
      <h2>{ otherAccount.name }</h2>
    {/if}
    <p>{ otherAccount.location }</p>
  </div>
</section>

<style lang='stylus'>
  section
    display flex
    flex-direction column
    align-items center
    margin-bottom $s0

  img
    width 120px

  .photo
    height 160px
    margin-bottom $s0
    background $c-green

  .info
    text-align center
</style>
