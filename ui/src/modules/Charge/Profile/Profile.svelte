<script>
  export let otherAccount
  export let photo
</script>

<section id='charge-profile'>
  <img id='customer-photo' src={ photo.blob } alt='{ photo.alt }' />
  <p id='confirmation-customer-agent'>{ otherAccount.agent }</p>
  <p id='confirmation-customer-name'>{ otherAccount.name }</p>
  <p id='confirmation-customer-location'>{ otherAccount.location }</p>
</section>

<style lang='stylus'>
  #charge-profile
    img
      profilePhoto(25vw, 150px)
      margin $s2 auto

    p
      text-align center

    #customer-name, #confirmation-customer-name
      text lg
      
    #confirmation-customer-agent
      text md
</style>
