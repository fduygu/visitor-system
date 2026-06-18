<template>
  <q-page class="login-page flex flex-center">
    <q-card class="login-card">

      <q-card-section class="text-center">
        <div class="text-h4 text-weight-bold q-mt-md">
          Ziyaretçi Takip Sistemi
        </div>
      </q-card-section>

      <q-card-section>

        <q-input
          v-model="username"
          label="Kullanıcı Adı"
          outlined
          rounded
          class="login-input"
        >
          <template #prepend>
            <q-icon name="person" />
          </template>
        </q-input>

        <q-input
          v-model="password"
          label="Şifre"
          type="password"
          outlined
          rounded
          class="q-mt-md login-input"
          @keyup.enter="login"
        >
          <template #prepend>
            <q-icon name="lock" />
          </template>
        </q-input>

      </q-card-section>

      <q-card-actions>
        <q-btn
          color="primary"
          label="Giriş Yap"
          class="full-width login-btn"
          unelevated
          @click="login"
        />
      </q-card-actions>

    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axiosInstance from 'src/boot/axios'

const router = useRouter()

const username = ref('')
const password = ref('')

const login = async () => {
  try {
    const response = await axiosInstance.post('/auth/login', {
      username: username.value,
      password: password.value,
    })

    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))

    await router.push('/dashboard')
  } catch (error) {
    console.error(error)
    alert('Kullanıcı adı veya şifre hatalı')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;

  background:
    linear-gradient(
      rgba(0, 0, 0, 0.12),
      rgba(0, 0, 0, 0.12)
    ),
    url('../assets/login-bg.jpg');

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-card {

  margin-top: 110px;
  width: 380px;
  max-width: 90vw;

  padding: 20px;

  border-radius: 30px;

  background: rgba(255, 255, 255, 0.90);

  backdrop-filter: blur(12px);

  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.18);
}


.login-input :deep(.q-field__control) {
  border-radius: 30px !important;
  background: #edf4ff !important;
}

.login-input :deep(.q-field__prepend) {
  padding-left: 14px;
  padding-right: 6px;
}

.login-input :deep(.q-icon) {
  color: #1976d2;
}

.login-btn {
  height: 52px;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
}
</style>