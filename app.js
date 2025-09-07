// Firebase configuration and data management
import { FirebaseManager } from "./firebase.js"
import { UIManager } from "./ui.js"
import lucide from "lucide" // Declare the lucide variable

class AdminApp {
  constructor() {
    this.firebase = new FirebaseManager()
    this.ui = new UIManager()
    this.users = {}
    this.cases = {}
    this.isLoggedIn = false
    this.loading = false

    this.init()
  }

  init() {
    this.setupEventListeners()
    lucide.createIcons()
  }

  setupEventListeners() {
    // Login functionality
    document.getElementById("loginBtn").addEventListener("click", () => this.handleLogin())
    document.getElementById("email").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleLogin()
    })
    document.getElementById("password").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleLogin()
    })

    // Refresh buttons
    document.getElementById("refreshStudents").addEventListener("click", () => this.loadData())
    document.getElementById("refreshCases").addEventListener("click", () => this.loadData())

    // Modal functionality
    document.getElementById("modalCancel").addEventListener("click", () => this.ui.hideModal())
    document.getElementById("confirmModal").addEventListener("click", (e) => {
      if (e.target.id === "confirmModal") this.ui.hideModal()
    })
  }

  async handleLogin() {
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    if (!email || !password) {
      this.ui.showStatus("Please enter email and password", "error")
      return
    }

    this.setLoading(true)
    try {
      await this.firebase.login(email, password)
      this.isLoggedIn = true
      this.ui.showStatus("Login successful", "success")
      this.showAdminPanel()
      await this.loadData()
    } catch (error) {
      this.ui.showStatus("Login failed: Invalid credentials", "error")
    } finally {
      this.setLoading(false)
    }
  }

  showAdminPanel() {
    document.getElementById("loginScreen").classList.add("hidden")
    document.getElementById("adminPanel").classList.remove("hidden")
  }

  async loadData() {
    this.setLoading(true)
    try {
      const [usersData, casesData] = await Promise.all([this.firebase.loadUsers(), this.firebase.loadCases()])

      this.users = usersData
      this.cases = casesData

      this.renderStudents()
      this.renderCases()

      this.ui.showStatus("Data loaded successfully", "success")
    } catch (error) {
      this.ui.showStatus("Failed to load data", "error")
    } finally {
      this.setLoading(false)
    }
  }

  renderStudents() {
    const container = document.getElementById("studentsList")
    const count = document.getElementById("studentCount")

    count.textContent = Object.keys(this.users).length

    if (Object.keys(this.users).length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-gray-500">No students found</div>'
      return
    }

    container.innerHTML = Object.entries(this.users)
      .map(([uid, user]) => {
        const isClean = user.lastCaseType === "Anda Bersih" || user.points >= 100
        return `
                <div class="flex items-center justify-between p-3 border rounded-lg">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2">
                            <h4 class="font-medium">${user.name}</h4>
                            <span class="badge ${isClean ? "badge-default" : "badge-destructive"}">
                                ${isClean ? "Clean" : "Violation"}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600">
                            NISN: ${user.nisn} • Points: ${user.points}
                        </p>
                    </div>
                </div>
            `
      })
      .join("")
  }

  renderCases() {
    const container = document.getElementById("casesList")
    const count = document.getElementById("caseCount")

    count.textContent = Object.keys(this.cases).length

    if (Object.keys(this.cases).length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-gray-500">No cases found</div>'
      return
    }

    container.innerHTML = Object.entries(this.cases)
      .map(([caseId, caseData]) => {
        const isClean = caseData.caseType === "Anda Bersih"
        return `
                <div class="flex items-center justify-between p-3 border rounded-lg">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2">
                            <h4 class="font-medium">${caseData.name}</h4>
                            <span class="badge ${isClean ? "badge-default" : "badge-destructive"}">
                                ${caseData.caseType}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600">
                            NISN: ${caseData.nisn} • Date: ${caseData.date} • Points: ${caseData.finalPoints}
                            ${caseData.pointsDeducted > 0 ? `<span class="text-red-600"> (-${caseData.pointsDeducted})</span>` : ""}
                        </p>
                    </div>
                    <button 
                        class="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        onclick="app.confirmDeleteCase('${caseId}', '${caseData.name}')"
                        ${this.loading ? "disabled" : ""}
                    >
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `
      })
      .join("")

    // Re-create icons for new elements
    lucide.createIcons()
  }

  confirmDeleteCase(caseId, studentName) {
    const caseData = this.cases[caseId]
    const pointsMessage =
      caseData?.pointsDeducted > 0 ? ` ${caseData.pointsDeducted} points will be restored to the student.` : ""

    this.ui.showModal(
      "Delete Case",
      `Are you sure you want to delete the case for ${studentName}?${pointsMessage} This action cannot be undone.`,
      () => this.handleDeleteCase(caseId),
    )
  }

  async handleDeleteCase(caseId) {
    const caseData = this.cases[caseId]
    if (!caseData) return

    try {
      this.setLoading(true)

      // Delete the case
      await this.firebase.deleteCase(caseId)

      if (caseData.pointsDeducted > 0) {
        const user = this.users[caseData.uid]
        if (user) {
          const newPoints = user.points + caseData.pointsDeducted
          await this.firebase.updateUserPoints(caseData.uid, newPoints)

          // Update local state
          this.users[caseData.uid] = {
            ...this.users[caseData.uid],
            points: newPoints,
            poin: newPoints,
          }
        }
      }

      // Remove case from local state
      delete this.cases[caseId]

      // Re-render both lists
      this.renderStudents()
      this.renderCases()

      this.ui.showStatus(`Case deleted and ${caseData.pointsDeducted} points restored to ${caseData.name}`, "success")
    } catch (error) {
      this.ui.showStatus("Failed to delete case", "error")
    } finally {
      this.setLoading(false)
    }
  }

  setLoading(loading) {
    this.loading = loading
    const loginBtn = document.getElementById("loginBtn")
    const refreshBtns = document.querySelectorAll("#refreshStudents, #refreshCases")

    if (loading) {
      loginBtn.textContent = "Logging in..."
      loginBtn.disabled = true
      refreshBtns.forEach((btn) => {
        btn.classList.add("loading")
        const icon = btn.querySelector("i")
        if (icon) icon.classList.add("animate-spin")
      })
    } else {
      loginBtn.textContent = "Login"
      loginBtn.disabled = false
      refreshBtns.forEach((btn) => {
        btn.classList.remove("loading")
        const icon = btn.querySelector("i")
        if (icon) icon.classList.remove("animate-spin")
      })
    }
  }
}

// Initialize the app
const app = new AdminApp()
window.app = app // Make it globally accessible for onclick handlers
