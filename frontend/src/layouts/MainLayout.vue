<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />

        <q-toolbar-title>
          Üniversite Ziyaretçi Takip Sistemi
        </q-toolbar-title>

        <q-btn flat no-caps>
          <q-icon name="account_circle" class="q-mr-sm" />
          {{ userTitle }}

          <q-menu>
            <q-list style="min-width: 220px">
              <q-item>
                <q-item-section avatar>
                  <q-icon name="account_circle" color="primary" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>{{ userTitle }}</q-item-label>
                  <q-item-label caption>{{ userSubtitle }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable v-close-popup @click="logout">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section>Çıkış Yap</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>Menü</q-item-label>

        <q-item clickable to="/dashboard">
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable to="/visitors">
          <q-item-section avatar>
            <q-icon name="groups" />
          </q-item-section>
          <q-item-section>Giriş - Çıkış</q-item-section>
        </q-item>

        <q-item clickable to="/reports">
          <q-item-section avatar>
            <q-icon name="assessment" />
          </q-item-section>
          <q-item-section>Raporlar</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

interface User {
  id: string
  username: string
  role: string
}

const leftDrawerOpen = ref(false)
const router = useRouter()

const savedUser = localStorage.getItem('user')
const user: User | null = savedUser ? JSON.parse(savedUser) : null

const formatRole = (role?: string) => {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'kutlubey':
      return 'Kutlubey'
    case 'agdaci':
      return 'Ağdacı'
    case 'ulus':
      return 'Ulus'
    case 'kurucasile':
      return 'Kurucaşile'
    case 'osb':
      return 'OSB'
    default:
      return 'Kullanıcı'
  }
}

const userTitle = computed(() => {
  return formatRole(user?.role)
})

const userSubtitle = computed(() => {
  if (user?.role === 'admin') {
    return 'Sistem Yöneticisi'
  }

  return `${formatRole(user?.role)} Kampüsü`
})

const logout = async () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  await router.push('/login')
}
</script>