<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="app-header">
      <q-toolbar class="q-px-md">
        <q-btn
          flat
          dense
          round
          icon="menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title class="row items-center no-wrap">
          <q-avatar size="34px" color="white" class="q-mr-sm">
            <img src="../assets/logo.png" alt="BARÜ" />
          </q-avatar>

          <div>
            <div class="text-subtitle1 text-weight-bold">
              Ziyaretçi Takip Sistemi
            </div>
            <div class="text-caption header-subtitle">
              Bartın Üniversitesi
            </div>
          </div>
        </q-toolbar-title>

        <q-btn flat no-caps class="user-button">
          <q-avatar size="32px" color="white" text-color="primary" class="q-mr-sm">
            <q-icon name="person" />
          </q-avatar>

          <div class="text-left gt-xs">
            <div class="text-weight-medium">{{ userTitle }}</div>
            <div class="text-caption header-subtitle">{{ userSubtitle }}</div>
          </div>

          <q-icon name="expand_more" class="q-ml-xs" />

          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 240px">
              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">
                    <q-icon name="person" />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ userTitle }}</q-item-label>
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

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="app-drawer"
      :width="280"
    >
      <div class="drawer-top">
        <q-avatar size="72px" color="white" class="logo-avatar">
          <img src="../assets/logo.png" alt="BARÜ" />
        </q-avatar>

        <div class="text-h6 text-weight-bold q-mt-md">
          Ziyaretçi Takip Sistemi
        </div>

        <div class="text-caption">
          Bartın Üniversitesi
        </div>
      </div>

      <q-list class="q-pa-md">
        <q-item-label header class="text-grey-7">
          Menü
        </q-item-label>

        <q-item
          clickable
          to="/dashboard"
          exact
          active-class="active-menu-item"
          class="menu-item"
        >
          <q-item-section avatar>
            <q-icon name="space_dashboard" />
          </q-item-section>

          <q-item-section>
            <q-item-label>Dashboard</q-item-label>
            <q-item-label caption>Sistemin genel durumu</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          to="/visitors"
          active-class="active-menu-item"
          class="menu-item"
        >
          <q-item-section avatar>
            <q-icon name="badge" />
          </q-item-section>

          <q-item-section>
            <q-item-label>Giriş - Çıkış</q-item-label>
            <q-item-label caption>Ziyaretçi işlemleri</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          to="/reports"
          active-class="active-menu-item"
          class="menu-item"
        >
          <q-item-section avatar>
            <q-icon name="analytics" />
          </q-item-section>

          <q-item-section>
            <q-item-label>Raporlar</q-item-label>
            <q-item-label caption>Filtreleme ve Excel raporu</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <div class="drawer-user-card q-ma-md">
        <div class="row items-center">
          <q-avatar color="primary" text-color="white" size="42px">
            <q-icon name="person" />
          </q-avatar>

          <div class="q-ml-md">
            <div class="text-weight-bold">{{ userTitle }}</div>
            <div class="text-caption text-grey-7">{{ userSubtitle }}</div>
          </div>
        </div>
      </div>
    </q-drawer>

    <q-page-container class="page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
const $q = useQuasar()

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

const logout = () => {
  $q.dialog({
    title: 'Çıkış Yap',
    message: 'Sistemden çıkış yapmak istediğinize emin misiniz?',
    cancel: {
      label: 'İptal',
      flat: true,
    },
    ok: {
      label: 'Çıkış Yap',
      color: 'negative',
    },
    persistent: true,
  }).onOk(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    void router.push('/login')
  })
}
</script>

<style scoped>
.app-header {
  background: linear-gradient(90deg, #1565c0, #1976d2);
}

.header-subtitle {
  opacity: 0.85;
}

.user-button {
  border-radius: 12px;
  padding: 6px 10px;
  transition: all 0.2s ease;
}

.user-button:hover {
  background: rgba(255, 255, 255, 0.12);
}

.app-drawer {
  background: #f8fafc;
}

.drawer-top {
  background: linear-gradient(135deg, #1565c0, #42a5f5);
  color: white;
  padding: 28px 20px;
  text-align: center;
}

.logo-avatar img {
  object-fit: contain;
  padding: 6px;
}

.menu-item {
  position: relative;
  border-radius: 14px;
  margin-bottom: 8px;
  padding: 10px 12px;
  transition: all 0.22s ease;
}

.menu-item:hover {
  background: #eef5ff;
  transform: translateX(4px);
}

.menu-item .q-icon {
  font-size: 26px;
  color: #1976d2;
  transition: all 0.22s ease;
}

.menu-item:hover .q-icon {
  transform: scale(1.08);
}

.active-menu-item {
  background: #e3f2fd;
  color: #0d47a1;
  font-weight: 600;
}

.active-menu-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 4px;
  border-radius: 8px;
  background: #1565c0;
}

.active-menu-item .q-icon {
  color: #0d47a1;
}

.drawer-user-card {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12px;
  padding: 14px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  transition: all 0.22s ease;
}

.drawer-user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
}

.page-container {
  background: #f3f6fb;
  min-height: 100vh;
}
</style>