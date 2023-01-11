<script>
  export let otherAccount
</script>

<section id='charge-profile'>
  <img id='customer-photo' src={ otherAccount.photo } alt='{ otherAccount.photoAlt }' />
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
