<script>
  export let other
</script>

<section id='charge-profile'>
  <img id='customer-photo' src={ other.photo } alt='{ other.photoAlt }' />
  <p id='confirmation-customer-agent'>{ other.agent }</p>
  <p id='confirmation-customer-name'>{ other.name }</p>
  <p id='confirmation-customer-location'>{ other.location }</p>
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
