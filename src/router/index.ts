import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      redirect: '/secrets',
    },
    {
      path: '/secrets',
      name: 'secrets',
      component: () => import('@/views/Secrets.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/secrets/:path(.*)',
      name: 'secret-detail',
      component: () => import('@/views/SecretDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tokens',
      name: 'tokens',
      component: () => import('@/views/Tokens.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/policies',
      name: 'policies',
      component: () => import('@/views/Policies.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/audit',
      name: 'audit',
      component: () => import('@/views/AuditLog.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('../views/ChangePassword.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  // All routes require auth by default; only opt-out via meta.requiresAuth === false
  if (to.meta.requiresAuth !== false && !authStore.token) {
    return { name: 'login' }
  }

  // Already logged in — no need to show the login page again
  if (to.name === 'login' && authStore.token) {
    return { name: 'secrets' }
  }
})

export default router
