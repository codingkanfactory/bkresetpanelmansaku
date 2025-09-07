// Firebase Configuration and Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js"

const firebaseConfig = {
  apiKey: "AIzaSyDX882cvhwQgfhbsLFn69Q2l-TUQUR5IBk",
  authDomain: "codingkan-factory-apps.firebaseapp.com",
  databaseURL: "https://codingkan-factory-apps-default-rtdb.firebaseio.com",
  projectId: "codingkan-factory-apps",
  storageBucket: "codingkan-factory-apps.firebasestorage.app",
  messagingSenderId: "188856222342",
  appId: "1:188856222342:android:ae0e1873684da414cec707",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getDatabase(app)

// Global Variables
let countdownTimer = null
let currentAction = null

// Authentication Functions
window.login = async () => {
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  if (!email || !password) {
    showStatus("❌ Harap isi email dan password!", "error")
    return
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    if (result.user.email === "admin@example.com") {
      document.getElementById("loginForm").style.display = "none"
      document.getElementById("adminPanel").style.display = "block"
      showStatus("🔐 Login berhasil sebagai administrator", "success")
      window.loadUsers()
      window.loadCases()
    } else {
      showStatus("❌ Akses hanya untuk admin@example.com", "error")
    }
  } catch (error) {
    showStatus("❌ Login gagal: " + error.message, "error")
  }
}

// Confirmation Modal Functions
window.showResetAllConfirmation = () => {
  currentAction = "resetAll"
  showConfirmationModal(
    "Reset Semua Data",
    "Anda akan mereset point seluruh siswa ke 100 dan menghapus semua kasus pelanggaran!",
    "restart_alt",
  )
}

window.showDeleteAllUsersConfirmation = () => {
  currentAction = "deleteAllUsers"
  showConfirmationModal("Hapus Semua Siswa", "Anda akan menghapus seluruh data siswa dari sistem!", "group_remove")
}

window.showDeleteAllCasesConfirmation = () => {
  currentAction = "deleteAllCases"
  showConfirmationModal(
    "Hapus Semua Kasus",
    "Anda akan menghapus seluruh data kasus dari sistem!",
    "assignment_turned_in",
  )
}

function showConfirmationModal(title, message, icon) {
  document.getElementById("modalTitle").textContent = title
  document.getElementById("modalMessage").textContent = message
  document.getElementById("modalIcon").textContent = icon
  document.getElementById("confirmationModal").style.display = "block"
  startCountdown()
}

window.closeModal = () => {
  document.getElementById("confirmationModal").style.display = "none"
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  // Reset countdown
  document.getElementById("countdown").textContent = "10"
  document.getElementById("confirmBtn").disabled = true
  currentAction = null
}

window.executeAction = async () => {
  window.closeModal()

  switch (currentAction) {
    case "resetAll":
      await resetAllData()
      break
    case "deleteAllUsers":
      await deleteAllUsers()
      break
    case "deleteAllCases":
      await deleteAllCases()
      break
  }
}

// Reset Functions
async function resetAllData() {
  try {
    showStatus("🔄 Sedang mereset semua data...", "info")

    // Reset all user points
    const usersRef = ref(db, "users")
    const usersSnap = await get(usersRef)

    if (usersSnap.exists()) {
      const allUsers = usersSnap.val()
      const resetPromises = []

      for (const uid in allUsers) {
        const user = allUsers[uid]
        const updatedUser = {
          ...user,
          points: 100,
          poin: 100,
          pointsDeducted: 0,
          lastCaseType: "Anda Bersih",
          updatedBy: "admin@example.com",
          lastResetDate: new Date().toISOString(),
        }
        resetPromises.push(set(ref(db, `users/${uid}`), updatedUser))
      }

      await Promise.all(resetPromises)
    }

    // Delete all cases
    const casesRef = ref(db, "cases")
    await remove(casesRef)

    showStatus("✅ Berhasil mereset semua data siswa dan menghapus semua kasus!", "success")
    window.loadUsers()
    window.loadCases()
  } catch (error) {
    showStatus("❌ Gagal mereset data: " + error.message, "error")
  }
}

async function deleteAllUsers() {
  try {
    showStatus("🔄 Sedang menghapus semua siswa...", "info")

    const usersRef = ref(db, "users")
    await remove(usersRef)

    showStatus("✅ Berhasil menghapus semua data siswa!", "success")
    window.loadUsers()
  } catch (error) {
    showStatus("❌ Gagal menghapus siswa: " + error.message, "error")
  }
}

async function deleteAllCases() {
  try {
    showStatus("🔄 Sedang menghapus semua kasus...", "info")

    const casesRef = ref(db, "cases")
    await remove(casesRef)

    showStatus("✅ Berhasil menghapus semua data kasus!", "success")
    window.loadCases()
  } catch (error) {
    showStatus("❌ Gagal menghapus kasus: " + error.message, "error")
  }
}

// Data Loading Functions
window.loadUsers = async () => {
  try {
    showStatus("🔄 Memuat daftar siswa...", "info")

    const usersRef = ref(db, "users")
    const usersSnap = await get(usersRef)

    const usersList = document.getElementById("usersList")

    if (usersSnap.exists()) {
      const allUsers = usersSnap.val()
      let html = ""
      let totalUsers = 0

      for (const uid in allUsers) {
        const user = allUsers[uid]
        totalUsers++

        const isClean = user.lastCaseType === "Anda Bersih" || user.points >= 100
        const userClass = isClean ? "user-clean" : "user-violation"
        const icon = isClean ? "✅" : "⚠️"

        html += `
                    <div class="user-item ${userClass}">
                        <div class="user-info">
                            <div class="user-name">${icon} ${user.name || "Nama tidak tersedia"}</div>
                            <div class="user-details">
                                NISN: ${user.nisn || "N/A"} | Poin: ${user.points || user.poin || 0} | 
                                Status: ${user.lastCaseType || "Tidak ada data"}
                            </div>
                        </div>
                        <button class="delete-btn" onclick="window.deleteUser('${uid}', '${user.name || "User"}')">
                            <span class="material-icons">delete</span>
                            <span>Hapus</span>
                        </button>
                    </div>
                `
      }

      usersList.innerHTML = `
                <div class="mb-4 p-3 bg-teal-50 rounded-lg">
                    <p class="font-semibold text-teal-800">📊 Total Siswa: ${totalUsers}</p>
                </div>
                ${html}
            `
      showStatus("✅ Berhasil memuat daftar siswa", "success")
    } else {
      usersList.innerHTML = `
                <div class="flex items-center justify-center py-8 text-gray-500">
                    <span class="material-icons mr-2">person_off</span>
                    <p>Tidak ada data siswa</p>
                </div>
            `
      showStatus("⚠️ Tidak ada data siswa", "warning")
    }
  } catch (error) {
    showStatus("❌ Gagal memuat siswa: " + error.message, "error")
    document.getElementById("usersList").innerHTML = `
            <div class="flex items-center justify-center py-8 text-red-500">
                <span class="material-icons mr-2">error</span>
                <p>Gagal memuat data</p>
            </div>
        `
  }
}

window.loadCases = async () => {
  try {
    showStatus("🔄 Memuat daftar kasus...", "info")

    const casesRef = ref(db, "cases")
    const casesSnap = await get(casesRef)

    const casesList = document.getElementById("casesList")

    if (casesSnap.exists()) {
      const allCases = casesSnap.val()
      let html = ""
      let totalCases = 0

      for (const caseId in allCases) {
        const caseData = allCases[caseId]
        totalCases++

        const isClean = caseData.caseType === "Anda Bersih"
        const caseClass = isClean ? "case-clean" : "case-violation"
        const icon = isClean ? "✅" : "⚠️"

        html += `
                    <div class="case-item ${caseClass}">
                        <div class="case-info">
                            <div class="case-name">${icon} ${caseData.name || "Nama tidak tersedia"}</div>
                            <div class="case-details">
                                NISN: ${caseData.nisn || "N/A"} | Kasus: ${caseData.caseType || "N/A"} | 
                                Tanggal: ${caseData.date || "N/A"} | Poin: ${caseData.finalPoints || 0}
                            </div>
                        </div>
                        <button class="delete-btn" onclick="window.deleteCase('${caseId}', '${caseData.name || "Case"}')">
                            <span class="material-icons">delete</span>
                            <span>Hapus</span>
                        </button>
                    </div>
                `
      }

      casesList.innerHTML = `
                <div class="mb-4 p-3 bg-teal-50 rounded-lg">
                    <p class="font-semibold text-teal-800">📋 Total Kasus: ${totalCases}</p>
                </div>
                ${html}
            `
      showStatus("✅ Berhasil memuat daftar kasus", "success")
    } else {
      casesList.innerHTML = `
                <div class="flex items-center justify-center py-8 text-gray-500">
                    <span class="material-icons mr-2">assignment_turned_in</span>
                    <p>Tidak ada data kasus</p>
                </div>
            `
      showStatus("⚠️ Tidak ada data kasus", "warning")
    }
  } catch (error) {
    showStatus("❌ Gagal memuat kasus: " + error.message, "error")
    document.getElementById("casesList").innerHTML = `
            <div class="flex items-center justify-center py-8 text-red-500">
                <span class="material-icons mr-2">error</span>
                <p>Gagal memuat data</p>
            </div>
        `
  }
}

// Individual Delete Functions
window.deleteUser = async (userId, userName) => {
  if (confirm(`🗑️ Apakah Anda yakin ingin menghapus siswa ${userName}?\n\nAksi ini tidak dapat dibatalkan!`)) {
    try {
      showStatus("🔄 Menghapus siswa...", "info")
      await remove(ref(db, `users/${userId}`))
      showStatus(`✅ Berhasil menghapus siswa ${userName}`, "success")
      window.loadUsers()
    } catch (error) {
      showStatus("❌ Gagal menghapus siswa: " + error.message, "error")
    }
  }
}

window.deleteCase = async (caseId, studentName) => {
  if (confirm(`🗑️ Apakah Anda yakin ingin menghapus kasus untuk ${studentName}?\n\nAksi ini tidak dapat dibatalkan!`)) {
    try {
      showStatus("🔄 Menghapus kasus...", "info")
      await remove(ref(db, `cases/${caseId}`))
      showStatus(`✅ Berhasil menghapus kasus untuk ${studentName}`, "success")
      window.loadCases()
    } catch (error) {
      showStatus("❌ Gagal menghapus kasus: " + error.message, "error")
    }
  }
}

// Utility Functions
function startCountdown() {
  let count = 10
  document.getElementById("countdown").textContent = count
  document.getElementById("confirmBtn").disabled = true

  countdownTimer = setInterval(() => {
    count--
    document.getElementById("countdown").textContent = count

    if (count <= 0) {
      clearInterval(countdownTimer)
      document.getElementById("countdown").textContent = "Siap!"
      document.getElementById("confirmBtn").disabled = false
      countdownTimer = null
    }
  }, 1000)
}

function showStatus(message, type = "info") {
  const statusEl = document.getElementById("status")
  statusEl.textContent = message
  statusEl.className = `mt-6 p-4 rounded-lg status-${type}`
  statusEl.style.display = "block"

  // Auto hide after 5 seconds
  setTimeout(() => {
    statusEl.style.display = "none"
  }, 5000)
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Check auth state on page load
  onAuthStateChanged(auth, (user) => {
    if (user && user.email === "admin@example.com") {
      document.getElementById("loginForm").style.display = "none"
      document.getElementById("adminPanel").style.display = "block"
      showStatus("🔐 Sudah login sebagai administrator", "success")
      window.loadUsers()
      window.loadCases()
    }
  })

  // Close modal when clicking outside
  window.onclick = (event) => {
    const modal = document.getElementById("confirmationModal")
    if (event.target === modal) {
      window.closeModal()
    }
  }

  // Enter key login
  document.getElementById("password").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      window.login()
    }
  })
})
