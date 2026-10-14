<template>
  <div>
    <header v-if="!isLoginPage" class="app-header">
      <RouterLink to="/secrets" class="app-brand">Gear Secret Management</RouterLink>

      <nav class="app-nav" aria-label="Navigasi utama">
        <RouterLink to="/secrets" class="nav-link">Secrets</RouterLink>
        <RouterLink to="/tokens" class="nav-link">Access Tokens</RouterLink>
        <RouterLink to="/policies" class="nav-link">Access Policies</RouterLink>
        <RouterLink to="/audit" class="nav-link">Audit Log</RouterLink>
      </nav>

      <div class="account-actions">
        <RouterLink to="/change-password" class="nav-link nav-link--secondary">
          Change Password
        </RouterLink>
        <button class="logout-button" type="button" @click="authStore.logout()">
          Logout
        </button>
      </div>
    </header>

    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const authStore = useAuthStore()

const isLoginPage = computed(() => route.name === 'login')
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.75rem 1.5rem;
  background: #1a1a1a;
  color: #fff;
}

.app-brand {
  color: #fff;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-decoration: none;
  white-space: nowrap;
}

.app-nav,
.account-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.nav-link,
.logout-button {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0.4rem 0.65rem;
  color: #eee;
  background: transparent;
  font: inherit;
  font-size: 0.875rem;
  text-decoration: none;
  white-space: nowrap;
}

.nav-link:hover,
.nav-link.router-link-active {
  border-color: #555;
  background: #303030;
  color: #fff;
}

.nav-link--secondary {
  border-color: #555;
}

.logout-button {
  border-color: #ccc;
  background: #fff;
  color: #1a1a1a;
  cursor: pointer;
}

.logout-button:hover {
  background: #e8e8e8;
}

@media (max-width: 760px) {
  .app-header {
    align-items: flex-start;
    padding: 0.75rem 1rem;
  }

  .app-nav {
    order: 3;
    width: 100%;
  }

  .account-actions {
    margin-left: auto;
  }
}
</style>
