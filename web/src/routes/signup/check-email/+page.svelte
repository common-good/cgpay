<script lang="ts">
  import Brand from '$lib/components/Brand.svelte'
</script>

<svelte:head><title>Check your email - Common Good</title></svelte:head>

<main class="auth">
  <div class="auth-card">
    <div class="auth-head">
      <h1>Check your email</h1>
      <p>We just sent you a message with a short code. Click the link in the email, or enter the code below to finish setting up your account.</p>
    </div>

    <a class="btn btn-primary btn-block" href="/signup/verify">Enter your code</a>

    <p class="muted">Didn't get the email? Check your spam folder, or <a class="link" href="/signup">try signing up again</a>.</p>

    <div class="auth-foot">
      <a class="link" href="/login">Back to sign in</a>
    </div>
  </div>
</main>

