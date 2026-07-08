<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-sm">
      <div>
        <div class="text-h4">Giriş - Çıkış Hareketleri</div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn color="positive" icon="download" label="Excel'e Aktar" @click="exportExcel" />

        <q-btn
          v-if="!isAdmin"
          color="primary"
          icon="person_add"
          label="Yeni Ziyaretçi"
          @click="dialogOpen = true"
        />
      </div>
    </div>

    <q-banner rounded class="bg-blue-1 text-primary q-mb-lg">
      <template #avatar>
        <q-icon name="info" color="primary" />
      </template>

      <div class="text-weight-medium">
        Bu ekranda <b>bugün giriş yapan</b>, <b>bugün çıkış yapan</b> ve
        <b>halen içeride bulunan</b> ziyaretçiler görüntülenir.
      </div>

      <div class="text-grey-8 q-mt-xs">
        Ziyaretçi çıkış işlemleri yalnızca bu sayfadan yapılabilir.
      </div>
    </q-banner>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-input
          v-model="searchText"
          outlined
          dense
          clearable
          label="Ad, soyad, TC, telefon, plaka, kart veya açıklama ara"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <div class="col-12 col-md-2 flex items-center">
        <q-checkbox v-model="onlyInside" label="Sadece içeridekiler" />
      </div>

      <div class="col-12 col-md-2 flex items-center">
        <q-btn flat color="primary" label="Filtreleri Temizle" @click="clearFilters" />
      </div>
    </div>

    <q-table :rows="filteredVisitors" :columns="columns" row-key="_id" flat bordered>
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="normalizeStatus(props.row.status) === 'İÇERİDE' ? 'green' : 'grey'"
            :label="normalizeStatus(props.row.status)"
          />
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            v-if="!isAdmin && normalizeStatus(props.row.status) === 'İÇERİDE'"
            color="negative"
            size="sm"
            label="Çıkış Yap"
            @click="confirmExitVisitor(props.row)"
          />
          <span v-else>-</span>
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogOpen">
      <q-card style="width: 500px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">Yeni Ziyaretçi Kaydı</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="form.firstName" label="Ad" outlined />
          <q-input v-model="form.lastName" label="Soyad" outlined class="q-mt-md" />

          <q-input
            v-model="form.tcNo"
            label="TC Kimlik No"
            outlined
            class="q-mt-md"
            maxlength="11"
            counter
            mask="###########"
          />

          <div v-if="visitorInsideWarning" class="text-negative text-caption q-mt-xs">
            {{ visitorInsideWarning }}
          </div>

          <div v-else-if="visitorFoundMessage" class="text-positive text-caption q-mt-xs">
            {{ visitorFoundMessage }}
          </div>

          <q-input
            v-model="form.phone"
            label="Telefon (İsteğe Bağlı)"
            outlined
            class="q-mt-md"
            maxlength="14"
            placeholder="0555 123 45 67 (İsteğe bağlı)"
            @update:model-value="formatPhoneInput"
          />

          <q-input
            v-model="form.plateNumber"
            label="Araç Plakası (Varsa)"
            outlined
            class="q-mt-md"
            @blur="formatPlate"
          />

          <q-input
            v-model="form.visitTo"
            label="Kime Ziyarete Geldi"
            outlined
            class="q-mt-md"
          />

          <q-input
            v-model="form.description"
            label="Ziyaret Nedeni / Açıklama (İsteğe Bağlı)"
            outlined
            type="textarea"
            rows="2"
            class="q-mt-md"
          />

          <q-checkbox
            v-model="form.cardGiven"
            label="Ziyaretçi kartı verildi"
            class="q-mt-md"
          />

          <q-input
            v-if="form.cardGiven"
            v-model="form.cardNumber"
            label="Ziyaretçi Kart Numarası"
            outlined
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="İptal" @click="closeDialog" />
          <q-btn
            color="primary"
            label="Kaydet"
            :disable="!!visitorInsideWarning"
            @click="createVisitor"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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
  description: string
  cardGiven: boolean
  cardNumber: string
  campus: string
  entryTime: string
  exitTime: string | null
  status: string
}

interface User {
  id: string
  username: string
  role: string
}

const $q = useQuasar()

const savedUser = localStorage.getItem('user')
const user: User | null = savedUser ? JSON.parse(savedUser) : null
const isAdmin = user?.role === 'admin'

const visitors = ref<Visitor[]>([])
const dialogOpen = ref(false)
const searchText = ref('')
const onlyInside = ref(false)
const lastSearchedTc = ref('')
const visitorFoundMessage = ref('')
const visitorInsideWarning = ref('')

const form = ref({
  firstName: '',
  lastName: '',
  tcNo: '',
  phone: '',
  plateNumber: '',
  visitTo: '',
  description: '',
  cardGiven: false,
  cardNumber: '',
})

const normalizeText = (value: string) => {
  return value
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
}

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

const formatPhoneInput = (value: string | number | null) => {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 4) {
    form.value.phone = digits
  } else if (digits.length <= 7) {
    form.value.phone = `${digits.slice(0, 4)} ${digits.slice(4)}`
  } else if (digits.length <= 9) {
    form.value.phone = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  } else {
    form.value.phone = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`
  }
}

const formatPlate = () => {
  form.value.plateNumber = form.value.plateNumber.toUpperCase()
}

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

const isValidTcNo = (tcNo: string) => {
  if (!/^[1-9][0-9]{10}$/.test(tcNo)) return false

  const digits = tcNo.split('').map(Number)

  const d1 = digits[0]!
  const d2 = digits[1]!
  const d3 = digits[2]!
  const d4 = digits[3]!
  const d5 = digits[4]!
  const d6 = digits[5]!
  const d7 = digits[6]!
  const d8 = digits[7]!
  const d9 = digits[8]!
  const d10 = digits[9]!
  const d11 = digits[10]!

  const oddSum = d1 + d3 + d5 + d7 + d9
  const evenSum = d2 + d4 + d6 + d8

  const check10 = ((oddSum * 7) - evenSum) % 10
  const check11 = (d1 + d2 + d3 + d4 + d5 + d6 + d7 + d8 + d9 + d10) % 10

  return d10 === check10 && d11 === check11
}

const filteredVisitors = computed(() => {
  const search = normalizeText(searchText.value.trim())

  return visitors.value.filter((visitor) => {
    const status = normalizeStatus(visitor.status)

    const isEntryExitRecord =
      isToday(visitor.entryTime) ||
      isToday(visitor.exitTime) ||
      status === 'İÇERİDE'

    if (!isEntryExitRecord) return false
    if (onlyInside.value && status !== 'İÇERİDE') return false
    if (!search) return true

    const searchableText = normalizeText(
      [
        visitor.firstName,
        visitor.lastName,
        visitor.tcNo,
        visitor.phone,
        visitor.plateNumber,
        visitor.visitTo,
        visitor.description,
        visitor.cardGiven ? 'kart verildi' : 'kart verilmedi',
        visitor.cardNumber,
        formatCampus(visitor.campus),
        status,
      ].join(' '),
    )

    return searchableText.includes(search)
  })
})

const exportExcel = () => {
  const data = filteredVisitors.value.map((visitor) => ({
    'Ad Soyad': `${visitor.firstName} ${visitor.lastName}`,
    'TC Kimlik No': visitor.tcNo,
    Telefon: visitor.phone || '-',
    Plaka: visitor.plateNumber || '-',
    'Kime Geldi': visitor.visitTo,
    Açıklama: visitor.description || '-',
    'Ziyaretçi Kartı': visitor.cardGiven
      ? `Verildi - No: ${visitor.cardNumber || '-'}`
      : 'Verilmedi',
    Kampüs: formatCampus(visitor.campus),
    'Geliş Saati': formatDateTime(visitor.entryTime),
    'Çıkış Saati': formatDateTime(visitor.exitTime),
    'Kaldığı Süre': calculateDuration(visitor.entryTime, visitor.exitTime),
    Durum: normalizeStatus(visitor.status),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Giriş Çıkış')

  XLSX.writeFile(
    workbook,
    `giris_cikis_${new Date().toISOString().split('T')[0]}.xlsx`,
  )

  $q.notify({
    type: 'positive',
    message: 'Excel dosyası oluşturuldu.',
  })
}

const clearFilters = () => {
  searchText.value = ''
  onlyInside.value = false
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
    field: (row) => row.phone || '-',
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
    name: 'description',
    label: 'Açıklama',
    field: (row) => row.description || '-',
    align: 'left',
  },
  {
    name: 'cardInfo',
    label: 'Ziyaretçi Kartı',
    field: (row) => row.cardGiven ? `Verildi - No: ${row.cardNumber || '-'}` : 'Verilmedi',
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
  {
    name: 'actions',
    label: 'İşlem',
    field: '_id',
    align: 'center',
  },
]

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return {
    Authorization: `Bearer ${token}`,
  }
}

const resetForm = () => {
  form.value = {
    firstName: '',
    lastName: '',
    tcNo: '',
    phone: '',
    plateNumber: '',
    visitTo: '',
    description: '',
    cardGiven: false,
    cardNumber: '',
  }

  lastSearchedTc.value = ''
  visitorFoundMessage.value = ''
  visitorInsideWarning.value = ''
}

const closeDialog = () => {
  dialogOpen.value = false
  resetForm()
}

const getVisitors = async () => {
  const response = await axiosInstance.get<Visitor[]>('/visitors', {
    headers: getAuthHeader(),
  })

  visitors.value = response.data
}

const fillVisitorByTc = async (tcNo: string) => {
  try {
    const response = await axiosInstance.get<Visitor & { isInside?: boolean }>(
      `/visitors/by-tc/${tcNo}`,
      {
        headers: getAuthHeader(),
      },
    )

    form.value.firstName = response.data.firstName
    form.value.lastName = response.data.lastName
    form.value.phone = response.data.phone || ''
    form.value.plateNumber = response.data.plateNumber || ''
    form.value.description = response.data.description || ''

    if (response.data.isInside) {
      visitorInsideWarning.value =
        'Bu ziyaretçi hâlen içeride görünüyor. Önce çıkış işlemi yapılmalıdır.'
      visitorFoundMessage.value = ''
      return
    }

    visitorInsideWarning.value = ''
    visitorFoundMessage.value = 'Bu ziyaretçi daha önce kayıtlı. Bilgiler otomatik dolduruldu.'
  } catch {
    visitorFoundMessage.value = ''
    visitorInsideWarning.value = ''
  }
}

watch(
  () => form.value.tcNo,
  async (newTc) => {
    const cleanTc = newTc.trim()

    if (cleanTc.length !== 11) {
      visitorFoundMessage.value = ''
      visitorInsideWarning.value = ''
      return
    }

    if (cleanTc === lastSearchedTc.value) return

    lastSearchedTc.value = cleanTc

    await fillVisitorByTc(cleanTc)
  },
)

const createVisitor = async () => {
  if (isAdmin) {
    alert('Admin kullanıcısı ziyaretçi kaydı oluşturamaz.')
    return
  }

  const cleanTc = form.value.tcNo.trim()

  if (!isValidTcNo(cleanTc)) {
    $q.notify({
      type: 'negative',
      message: 'Geçerli bir TC Kimlik No giriniz.',
    })
    return
  }

  if (form.value.cardGiven && !form.value.cardNumber.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Ziyaretçi kartı verildiyse kart numarası girilmelidir.',
    })
    return
  }

  try {
    const response = await axiosInstance.post(
      '/visitors',
      {
        ...form.value,
        tcNo: cleanTc,
        phone: form.value.phone || '',
        plateNumber: form.value.plateNumber || '',
        description: form.value.description || '',
        cardGiven: form.value.cardGiven,
        cardNumber: form.value.cardGiven ? form.value.cardNumber.trim() : '',
      },
      {
        headers: getAuthHeader(),
      },
    )

    visitors.value.unshift(response.data)

    dialogOpen.value = false
    resetForm()

    await getVisitors()

    $q.notify({
      type: 'positive',
      message: 'Ziyaretçi başarıyla kaydedildi.',
    })
  } catch (error) {
    console.error(error)

    $q.notify({
      type: 'negative',
      message: 'Ziyaretçi kaydedilirken hata oluştu.',
    })
  }
}

const doExitVisitor = async (id: string) => {
  await axiosInstance.put(
    `/visitors/exit/${id}`,
    {},
    {
      headers: getAuthHeader(),
    },
  )

  await getVisitors()

  $q.notify({
    type: 'positive',
    message: 'Ziyaretçi çıkışı başarıyla yapıldı.',
  })
}

const confirmExitVisitor = (visitor: Visitor) => {
  if (isAdmin) {
    alert('Admin kullanıcısı çıkış işlemi yapamaz.')
    return
  }

  const message = visitor.cardGiven
    ? `Bu ziyaretçiye ${visitor.cardNumber || '-'} numaralı kart verilmiş. Kart teslim alındıysa çıkış yapılsın mı?`
    : 'Bu ziyaretçinin çıkışı yapılsın mı?'

  $q.dialog({
    title: 'Çıkış İşlemi',
    message,
    cancel: {
      label: 'Hayır',
      flat: true,
    },
    ok: {
      label: 'Evet',
      color: 'negative',
    },
    persistent: true,
  }).onOk(() => {
    void doExitVisitor(visitor._id)
  })
}

onMounted(() => {
  void getVisitors()
})
</script>