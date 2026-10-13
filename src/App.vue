<template>
  <div>
    <nav v-if="!isLoginPage" style="background:#1a1a1a;color:#fff;padding:0.75rem 1.5rem;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:1.125rem;font-weight:600;letter-spacing:0.02em;">Gear Engine</span>
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <RouterLink
          to="/change-password"
          class="btn"
          style="background:transparent;color:#fff;border:1px solid #555;padding:0.375rem 0.875rem;cursor:pointer;border-radius:4px;font-size:0.875rem;text-decoration:none;"
        >
          Change Password
        </RouterLink>
        <button
          class="btn"
          style="background:#fff;color:#1a1a1a;border:1px solid #ccc;padding:0.375rem 0.875rem;cursor:pointer;border-radius:4px;font-size:0.875rem;"
          @click="authStore.logout()"
        >
          Logout
        </button>
      </div>
    </nav>
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
