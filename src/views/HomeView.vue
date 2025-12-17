<script setup>
async function logout() {
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include' // Cookie wird vom Backend gelöscht
    })
  } finally {
    window.location.href = '/login'
  }
}
</script>

<template>
  <section style="max-width: 640px; margin: 2rem auto;">
    <h1>Startseite</h1>
    <p>Erfolgreich angemeldet. Dies ist die einfache Home-Seite.</p>
    <button @click="logout" style="margin-top: 1.5rem; padding: 0.5rem 1rem;">Abmelden</button>
  </section>
</template>
