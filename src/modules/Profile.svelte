<script>
  import ProfileSvg from '#modules/ProfileSvg.svelte'

  export let otherAccount
  export let photo
</script>

<section id="charge-profile" data-testid="charge-profile">
  <div class="photo">
    {#if photo.blob == "none"}
      <!--no image when paying-->
    {:else if photo.blob}
      <img src={photo.blob} alt="{photo.alt}" data-testid="theirPhoto" />
    {:else}
      <ProfileSvg />
    {/if}
  </div>
  <div class="info">
    {#if otherAccount.agent}
      <h2 data-testid="theirAgent">{otherAccount.agent}</h2>
      <p data-testid="theirCompany">{otherAccount.name}</p>
    {:else}
      <h2 data-testid="theirName">{otherAccount.name}</h2>
    {/if}
    <p data-testid="theirLocation">{otherAccount.location}</p>
  </div>
</section>

<style lang="stylus">
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
