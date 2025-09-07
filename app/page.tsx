"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, RefreshCw, Shield, Users, FileText, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Firebase types
interface User {
  uid: string
  name: string
  nisn: string
  points: number
  poin: number
  jenisKasus?: string
  tanggalKasus?: string
  lastCaseType?: string
}

interface Case {
  uid: string
  name: string
  nisn: string
  caseType: string
  date: string
  details: string
  initialPoints: number
  finalPoints: number
  pointsDeducted: number
  timestamp: number
}

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [users, setUsers] = useState<Record<string, User>>({})
  const [cases, setCases] = useState<Record<string, Case>>({})
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "info" }>()
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
  }>({ open: false, title: "", description: "", action: () => {} })

  // Mock Firebase functions - replace with actual Firebase implementation
  const mockLogin = async (email: string, password: string) => {
    if (email === "admin@example.com" && password === "admin123") {
      return { success: true }
    }
    throw new Error("Invalid credentials")
  }

  const mockLoadUsers = async (): Promise<Record<string, User>> => {
    // Mock data based on the structure you provided
    return {
      "-OYU8HPbSOPTX7gRECQQ": {
        uid: "-OYU8HPbSOPTX7gRECQQ",
        name: "MUHAMMAD ABDURRAHMAN AS - SYAUQI",
        nisn: "1234567890",
        points: 100,
        poin: 100,
        jenisKasus: "",
        tanggalKasus: "2025-08-25",
        lastCaseType: "Anda Bersih",
      },
    }
  }

  const mockLoadCases = async (): Promise<Record<string, Case>> => {
    return {
      "-OYU8HPcJu93xYiRbeQR": {
        uid: "-OYU8HPbSOPTX7gRECQQ",
        name: "MUHAMMAD ABDURRAHMAN AS - SYAUQI",
        nisn: "1234567890",
        caseType: "Anda Bersih",
        date: "2025-08-25",
        details: "",
        initialPoints: 100,
        finalPoints: 100,
        pointsDeducted: 0,
        timestamp: 1756090409616,
      },
    }
  }

  const mockDeleteCase = async (caseId: string) => {
    // Simulate deletion
    console.log(`Deleting case: ${caseId}`)
  }

  const mockUpdateUserPoints = async (userId: string, newPoints: number) => {
    // Simulate updating user points
    console.log(`Updating user ${userId} points to: ${newPoints}`)
  }

  const showStatus = (message: string, type: "success" | "error" | "info") => {
    setStatus({ message, type })
    setTimeout(() => setStatus(undefined), 5000)
  }

  const handleLogin = async () => {
    if (!email || !password) {
      showStatus("Please enter email and password", "error")
      return
    }

    setLoading(true)
    try {
      await mockLogin(email, password)
      setIsLoggedIn(true)
      showStatus("Login successful", "success")
      await loadData()
    } catch (error) {
      showStatus("Login failed: Invalid credentials", "error")
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersData, casesData] = await Promise.all([mockLoadUsers(), mockLoadCases()])
      setUsers(usersData)
      setCases(casesData)
      showStatus("Data loaded successfully", "success")
    } catch (error) {
      showStatus("Failed to load data", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCase = async (caseId: string) => {
    const caseData = cases[caseId]
    if (!caseData) return

    try {
      setLoading(true)

      // Delete the case
      await mockDeleteCase(caseId)

      // Restore points to user if points were deducted
      if (caseData.pointsDeducted > 0) {
        const user = users[caseData.uid]
        if (user) {
          const newPoints = user.points + caseData.pointsDeducted
          await mockUpdateUserPoints(caseData.uid, newPoints)

          // Update local state
          setUsers((prev) => ({
            ...prev,
            [caseData.uid]: {
              ...prev[caseData.uid],
              points: newPoints,
              poin: newPoints,
            },
          }))
        }
      }

      // Remove case from local state
      setCases((prev) => {
        const newCases = { ...prev }
        delete newCases[caseId]
        return newCases
      })

      showStatus(`Case deleted and ${caseData.pointsDeducted} points restored to ${caseData.name}`, "success")
    } catch (error) {
      showStatus("Failed to delete case", "error")
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteCase = (caseId: string, studentName: string) => {
    const caseData = cases[caseId]
    const pointsMessage =
      caseData?.pointsDeducted > 0 ? ` ${caseData.pointsDeducted} points will be restored to the student.` : ""

    setConfirmDialog({
      open: true,
      title: "Delete Case",
      description: `Are you sure you want to delete the case for ${studentName}?${pointsMessage} This action cannot be undone.`,
      action: () => handleDeleteCase(caseId),
    })
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Student Management Admin Panel</CardTitle>
                <CardDescription>Manage student data and cases</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Status Alert */}
        {status && (
          <Alert
            className={
              status.type === "error"
                ? "border-red-200 bg-red-50"
                : status.type === "success"
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
            }
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Students List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <CardTitle>Students ({Object.keys(users).length})</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(users).map(([uid, user]) => {
                  const isClean = user.lastCaseType === "Anda Bersih" || user.points >= 100
                  return (
                    <div key={uid} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{user.name}</h4>
                          <Badge variant={isClean ? "default" : "destructive"}>{isClean ? "Clean" : "Violation"}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          NISN: {user.nisn} • Points: {user.points}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {Object.keys(users).length === 0 && (
                  <div className="text-center py-8 text-gray-500">No students found</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cases List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <CardTitle>Cases ({Object.keys(cases).length})</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(cases).map(([caseId, caseData]) => {
                  const isClean = caseData.caseType === "Anda Bersih"
                  return (
                    <div key={caseId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{caseData.name}</h4>
                          <Badge variant={isClean ? "default" : "destructive"}>{caseData.caseType}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          NISN: {caseData.nisn} • Date: {caseData.date} • Points: {caseData.finalPoints}
                          {caseData.pointsDeducted > 0 && (
                            <span className="text-red-600"> (-{caseData.pointsDeducted})</span>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => confirmDeleteCase(caseId, caseData.name)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}
                {Object.keys(cases).length === 0 && (
                  <div className="text-center py-8 text-gray-500">No cases found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialog.title}</DialogTitle>
              <DialogDescription>{confirmDialog.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  confirmDialog.action()
                  setConfirmDialog((prev) => ({ ...prev, open: false }))
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
