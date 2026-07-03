<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">Dashboard</div>

<q-banner
  v-if="longStayVisitors.length > 0"
  class="bg-red-1 text-red-10 q-mb-lg"
  rounded
>
  <template #avatar>
    <q-icon name="warning" color="red" />
  </template>

  <div class="text-weight-bold">
    24 saatten uzun süredir içeride görünen ziyaretçi var.
  </div>

  <div class="q-mt-xs">
    {{ longStayVisitors.length }} ziyaretçi için çıkış kontrolü yapılması önerilir.
    Çıkış işlemi ilgili kampüs kullanıcısı tarafından yapılmalıdır.
  </div>
</q-banner>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-3">
        <q-card class="bg-blue-1">
          <q-card-section>
            <div class="text-subtitle1">Bugünkü Giriş</div>
            <div class="text-h4 text-weight-bold">{{ todayEntries }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-green-1">
          <q-card-section>
            <div class="text-subtitle1">Şu An İçeride</div>
            <div class="text-h4 text-weight-bold">{{ insideVisitors }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-orange-1">
          <q-card-section>
            <div class="text-subtitle1">Bugünkü Çıkış</div>
            <div class="text-h4 text-weight-bold">{{ todayExits }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-purple-1">
          <q-card-section>
            <div class="text-subtitle1">Bugün İçeride Kalan</div>
            <div class="text-h4 text-weight-bold">{{ todayInsideRemaining }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card v-if="longStayVisitors.length > 0" class="q-mt-xl">
      <q-card-section>
        <div class="text-h6">Uzun Süredir İçeride Görünenler</div>
        <div class="text-grey-7 q-mt-xs">
          24 saatten uzun süredir çıkış yapılmamış ziyaretçiler.
        </div>
      </q-card-section>

      <q-table
        :rows="longStayVisitors"
        :columns="longStayColumns"
        row-key="_id"
        flat
        bordered
        hide-pagination
        :pagination="{ rowsPerPage: 5 }"
      />
    </q-card>

    <q-card v-if="isAdmin" class="q-mt-xl">
      <q-card-section>
        <div class="text-h6">Bugünkü Kampüs Dağılımı</div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div
            v-for="campus in campusStats"
            :key="campus.key"
            class="col-12 col-sm-6 col-md"
          >
            <q-card bordered flat>
              <q-card-section>
                <div class="text-subtitle2">{{ campus.label }}</div>
                <div class="text-h5 text-weight-bold">
                  {{ campus.count }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card class="q-mt-xl">
      <q-card-section>
        <div class="text-h6">Son Ziyaretçiler</div>
      </q-card-section>

      <q-table
        :rows="lastVisitors"
        :columns="columns"
        row-key="_id"
        flat
        bordered
        hide-pagination
        :pagination="{ rowsPerPage: 5 }"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="normalizeStatus(props.row.status) === 'İÇERİDE' ? 'green' : 'grey'"
              :label="normalizeStatus(props.row.status)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { QTableColumn } from 'quasar'
import axiosInstance from 'src/boot/axios'

interface Visitor {
  _id: string
  firstName: string
  lastName: string
  visitTo: string
  campus: string
  status: string
  entryTime: string
  exitTime: string | null
  createdAt: string
}

interface CampusStat {
  key: string
  label: string
  count: number
}

interface User {
  id: string
  username: string
  role: string
}

const savedUser = localStorage.getItem('user')
const user: User | null = savedUser ? JSON.parse(savedUser) : null
const isAdmin = user?.role === 'admin'

const todayEntries = ref(0)
const insideVisitors = ref(0)
const todayExits = ref(0)
const todayInsideRemaining = ref(0)
const lastVisitors = ref<Visitor[]>([])
const longStayVisitors = ref<Visitor[]>([])

const campusStats = ref<CampusStat[]>([
  { key: 'kutlubey', label: 'Kutlubey', count: 0 },
  { key: 'agdaci', label: 'Ağdacı', count: 0 },
  { key: 'ulus', label: 'Ulus', count: 0 },
  { key: 'kurucasile', label: 'Kurucaşile', count: 0 },
  { key: 'osb', label: 'OSB', count: 0 },
])

const normalizeStatus = (status: string) => {
  if (status === 'ACTIVE') return 'İÇERİDE'
  if (status === 'COMPLETED') return 'ÇIKIŞ YAPTI'
  return status
}

const formatCampus = (campus: string) => {
  switch (campus) {
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
      return campus
  }
}

const isToday = (dateValue: string | null) => {
  if (!dateValue) return false

  return new Date(dateValue).toDateString() === new Date().toDateString()
}

const isLongStay = (visitor: Visitor) => {
  if (normalizeStatus(visitor.status) !== 'İÇERİDE') return false

  const entryTime = new Date(visitor.entryTime).getTime()
  const now = new Date().getTime()

  const diffHours = (now - entryTime) / 1000 / 60 / 60

  return diffHours >= 24
}

const formatDateTime = (dateValue: string) => {
  return new Date(dateValue).toLocaleString('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const calculateStayDuration = (entryTime: string) => {
  const entry = new Date(entryTime).getTime()
  const now = new Date().getTime()

  const diffMs = now - entry
  const totalHours = Math.floor(diffMs / 1000 / 60 / 60)
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  if (days === 0) return `${hours} saat`

  return `${days} gün ${hours} saat`
}

const columns: QTableColumn<Visitor>[] = [
  {
    name: 'fullName',
    label: 'Ad Soyad',
    field: (row) => `${row.firstName} ${row.lastName}`,
    align: 'left',
  },
  {
    name: 'visitTo',
    label: 'Kime Geldi',
    field: 'visitTo',
    align: 'left',
  },
  {
    name: 'campus',
    label: 'Kampüs',
    field: (row) => formatCampus(row.campus),
    align: 'left',
  },
  {
    name: 'entryTime',
    label: 'Geliş Saati',
    field: (row) => formatDateTime(row.entryTime),
    align: 'left',
  },
  {
    name: 'status',
    label: 'Durum',
    field: (row) => normalizeStatus(row.status),
    align: 'left',
  },
]

const longStayColumns: QTableColumn<Visitor>[] = [
  {
    name: 'fullName',
    label: 'Ad Soyad',
    field: (row) => `${row.firstName} ${row.lastName}`,
    align: 'left',
  },
  {
    name: 'visitTo',
    label: 'Kime Geldi',
    field: 'visitTo',
    align: 'left',
  },
  {
    name: 'campus',
    label: 'Kampüs',
    field: (row) => formatCampus(row.campus),
    align: 'left',
  },
  {
    name: 'entryTime',
    label: 'Geliş Saati',
    field: (row) => formatDateTime(row.entryTime),
    align: 'left',
  },
  {
    name: 'duration',
    label: 'İçeride Kalma Süresi',
    field: (row) => calculateStayDuration(row.entryTime),
    align: 'left',
  },
]

const calculateCampusStats = (todayVisitors: Visitor[]) => {
  campusStats.value = campusStats.value.map((campus) => ({
    ...campus,
    count: todayVisitors.filter((visitor) => visitor.campus === campus.key).length,
  }))
}

const getDashboardData = async () => {
  const token = localStorage.getItem('token')

  const response = await axiosInstance.get<Visitor[]>('/visitors', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const visitors = response.data

  const todayVisitors = visitors.filter((visitor) =>
    isToday(visitor.entryTime),
  )

  todayEntries.value = todayVisitors.length

  insideVisitors.value = visitors.filter(
    (v) => normalizeStatus(v.status) === 'İÇERİDE',
  ).length

  todayExits.value = visitors.filter((visitor) =>
    isToday(visitor.exitTime),
  ).length

  todayInsideRemaining.value = todayVisitors.filter(
    (visitor) => normalizeStatus(visitor.status) === 'İÇERİDE',
  ).length

  longStayVisitors.value = visitors.filter((visitor) =>
    isLongStay(visitor),
  )

  calculateCampusStats(todayVisitors)

  lastVisitors.value = visitors.slice(0, 5)
}

onMounted(() => {
  void getDashboardData()
})
</script>