<script lang="ts">
  let message = $state('Tiny Planet 🌍');
</script>

<main class="shell">
  <div class="title">
    <h1>{message}</h1>
    <p>Spherical Tower Defense — coming soon</p>
  </div>
</main>

<style>
  .shell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: radial-gradient(ellipse at center, #0d1b2a 0%, #050510 100%);
  }
  .title {
    text-align: center;
  }
  h1 {
    font-size: 4rem;
    background: linear-gradient(135deg, #44aaff, #88ccff, #44aa88);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 16px;
  }
  p {
    font-size: 1.2rem;
    color: #6688aa;
  }
</style>
