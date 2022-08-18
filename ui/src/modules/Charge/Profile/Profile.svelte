<script>
  export let account
</script>

<section id='charge-profile'>
  <img id='customer-photo' src={ account.photo } alt='Customer Photo' />
  <p id='confirmation-customer-name'>{ account.name }</p>
  <p id='confirmation-customer-location'>{ account.location }</p>
</section>

<style lang='stylus'>
  #charge-profile
    img
      clampSize(25vw, 150px)
      margin $s2 auto

    p
      text-align center

    #customer-name, #confirmation-customer-name
      text lg
</style>
