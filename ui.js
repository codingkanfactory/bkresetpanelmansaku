// UI management module
export class UIManager {
  showStatus(message, type) {
    const alert = document.getElementById("statusAlert")
    const messageEl = document.getElementById("statusMessage")

    alert.className = `p-4 rounded-md border alert-${type}`
    messageEl.textContent = message
    alert.classList.remove("hidden")

    setTimeout(() => {
      alert.classList.add("hidden")
    }, 5000)
  }

  showModal(title, description, confirmAction) {
    const modal = document.getElementById("confirmModal")
    const titleEl = document.getElementById("modalTitle")
    const descEl = document.getElementById("modalDescription")
    const confirmBtn = document.getElementById("modalConfirm")

    titleEl.textContent = title
    descEl.textContent = description

    // Remove existing event listeners and add new one
    const newConfirmBtn = confirmBtn.cloneNode(true)
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn)

    newConfirmBtn.addEventListener("click", () => {
      confirmAction()
      this.hideModal()
    })

    modal.classList.remove("hidden")
  }

  hideModal() {
    document.getElementById("confirmModal").classList.add("hidden")
  }
}
