<template>
  <q-page class="q-pa-lg">
    <q-card>
      <q-card-section>
        <div class="text-h6">Ziyaretçi Raporları</div>
        <div class="text-grey-7 q-mt-sm">
          Tarih aralığına, kampüse ve duruma göre ziyaretçi raporu alabilirsiniz.
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div :class="isAdmin ? 'col-12 col-md-3' : 'col-12 col-md-4'">
            <q-input v-model="startDate" outlined dense type="date" label="Başlangıç Tarihi" />
          </div>

         <div :class="isAdmin ? 'col-12 col-md-3' : 'col-12 col-md-4'">
            <q-input v-model="endDate" outlined dense type="date" label="Bitiş Tarihi" />
          </div>

<div
  v-if="isAdmin"
  class="col-12 col-md-3"
>
  <q-select
    v-model="selectedCampus"
    outlined
    dense
    label="Kampüs"
    :options="campusOptions"
  />
</div>

         <div :class="isAdmin ? 'col-12 col-md-3' : 'col-12 col-md-4'">
            <q-select
              v-model="selectedStatus"
              outlined
              dense
              label="Durum"
              :options="statusOptions"
            />
          </div>
        </div>

        <div class="row q-gutter-sm q-mt-md">
          <q-btn color="primary" label="Filtrele" @click="getVisitors" />
          <q-btn flat color="primary" label="Temizle" @click="clearFilters" />

          <q-btn
            color="positive"
            icon="download"
            label="Excel'e Aktar"
            @click="exportExcel"
          />
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-lg q-mt-lg">
      <div class="col-12 col-md-4">
        <q-card class="bg-blue-1">
          <q-card-section>
            <div class="text-subtitle1">{{ getCampusTitle() }}</div>
            <div class="text-h4 text-weight-bold">{{ filteredVisitors.length }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="bg-green-1">
          <q-card-section>
            <div class="text-subtitle1">İçeride</div>
            <div class="text-h4 text-weight-bold">{{ insideCount }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="bg-orange-1">
          <q-card-section>
            <div class="text-subtitle1">Çıkış Yaptı</div>
            <div class="text-h4 text-weight-bold">{{ exitedCount }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card class="q-mt-lg">
      <q-card-section>
        <div class="text-h6">Rapor Sonuçları</div>
      </q-card-section>

      <q-table :rows="filteredVisitors" :columns="columns" row-key="_id" flat bordered>
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
import { computed, onMounted, ref } from 'vue'
import { useQuasar, type QTableColumn } from 'quasar'
import axiosInstance from 'src/boot/axios'
import * as XLSX from 'xlsx'

interface Visitor {
  _id: string
  firstName: string
  lastName: string
  tcNo: string
  phone: string
  plateNumber: string
  visitTo: string
  campus: string
  entryTime: string
  exitTime: string | null
  status: string
}

const $q = useQuasar()

const visitors = ref<Visitor[]>([])

const startDate = ref('')
const endDate = ref('')
const selectedCampus = ref('Tümü')
const selectedStatus = ref('Tümü')

const user = JSON.parse(localStorage.getItem('user') || '{}')
const isAdmin = user.role === 'admin'

const campusOptions = ['Tümü', 'Kutlubey', 'Ağdacı', 'Ulus', 'Kurucaşile', 'OSB']
const statusOptions = ['Tümü', 'İÇERİDE', 'ÇIKIŞ YAPTI']

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

const getCampusTitle = () => {
  if (isAdmin) return 'Toplam Kayıt'

  switch (user.role) {
    case 'kutlubey':
      return 'Kutlubey Kayıtları'
    case 'agdaci':
      return 'Ağdacı Kayıtları'
    case 'ulus':
      return 'Ulus Kayıtları'
    case 'kurucasile':
      return 'Kurucaşile Kayıtları'
    case 'osb':
      return 'OSB Kayıtları'
    default:
      return 'Toplam Kayıt'
  }
}

const isDateInRange = (entryTime: string) => {
  const entryDate = new Date(entryTime)

  if (startDate.value) {
    const start = new Date(startDate.value)
    start.setHours(0, 0, 0, 0)
    if (entryDate < start) return false
  }

  if (endDate.value) {
    const end = new Date(endDate.value)
    end.setHours(23, 59, 59, 999)
    if (entryDate > end) return false
  }

  return true
}

const filteredVisitors = computed(() => {
  return visitors.value.filter((visitor) => {
    const status = normalizeStatus(visitor.status)
    const campus = formatCampus(visitor.campus)

    if (!isDateInRange(visitor.entryTime)) return false

    if (selectedCampus.value !== 'Tümü' && campus !== selectedCampus.value) {
      return false
    }

    if (selectedStatus.value !== 'Tümü' && status !== selectedStatus.value) {
      return false
    }

    return true
  })
})

const insideCount = computed(() => {
  return filteredVisitors.value.filter(
    (visitor) => normalizeStatus(visitor.status) === 'İÇERİDE',
  ).length
})

const exitedCount = computed(() => {
  return filteredVisitors.value.filter(
    (visitor) => normalizeStatus(visitor.status) === 'ÇIKIŞ YAPTI',
  ).length
})

const formatDateTime = (dateValue: string | null) => {
  if (!dateValue) return '-'

  return new Date(dateValue).toLocaleString('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const calculateDuration = (entryTime: string, exitTime: string | null) => {
  if (!exitTime) return 'Devam ediyor'

  const entry = new Date(entryTime).getTime()
  const exit = new Date(exitTime).getTime()
  const diffMs = exit - entry
  const totalMinutes = Math.floor(diffMs / 1000 / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes} dk`

  return `${hours} saat ${minutes} dk`
}

const exportExcel = () => {
  const data = filteredVisitors.value.map((visitor) => ({
    'Ad Soyad': `${visitor.firstName} ${visitor.lastName}`,
    'TC Kimlik No': visitor.tcNo,
    Telefon: visitor.phone,
    Plaka: visitor.plateNumber || '-',
    'Kime Geldi': visitor.visitTo,
    Kampüs: formatCampus(visitor.campus),
    'Geliş Saati': formatDateTime(visitor.entryTime),
    'Çıkış Saati': formatDateTime(visitor.exitTime),
    'Kaldığı Süre': calculateDuration(visitor.entryTime, visitor.exitTime),
    Durum: normalizeStatus(visitor.status),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Raporlar')

  XLSX.writeFile(
    workbook,
    `ziyaretci_raporu_${new Date().toISOString().split('T')[0]}.xlsx`,
  )

  $q.notify({
    type: 'positive',
    message: 'Excel raporu oluşturuldu.',
  })
}

const columns: QTableColumn<Visitor>[] = [
  {
    name: 'fullName',
    label: 'Ad Soyad',
    field: (row) => `${row.firstName} ${row.lastName}`,
    align: 'left',
  },
  {
    name: 'tcNo',
    label: 'TC Kimlik No',
    field: 'tcNo',
    align: 'left',
  },
  {
    name: 'phone',
    label: 'Telefon',
    field: 'phone',
    align: 'left',
  },
  {
    name: 'plateNumber',
    label: 'Plaka',
    field: (row) => row.plateNumber || '-',
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
    name: 'exitTime',
    label: 'Çıkış Saati',
    field: (row) => formatDateTime(row.exitTime),
    align: 'left',
  },
  {
    name: 'duration',
    label: 'Kaldığı Süre',
    field: (row) => calculateDuration(row.entryTime, row.exitTime),
    align: 'left',
  },
  {
    name: 'status',
    label: 'Durum',
    field: (row) => normalizeStatus(row.status),
    align: 'left',
  },
]

const getVisitors = async () => {
  const token = localStorage.getItem('token')

  const response = await axiosInstance.get<Visitor[]>('/visitors', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  visitors.value = response.data
}

const clearFilters = () => {
  startDate.value = ''
  endDate.value = ''
  selectedCampus.value = 'Tümü'
  selectedStatus.value = 'Tümü'
}

onMounted(() => {
  void getVisitors()
})
</script>