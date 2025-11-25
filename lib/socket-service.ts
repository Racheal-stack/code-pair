import { io, type Socket } from "socket.io-client"

class SocketService {
  private socket: Socket | null = null

  connect(sessionId: string, userId: string, role: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

    this.socket = io(apiUrl, {
      auth: {
        token: localStorage.getItem("token"),
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    this.socket.emit("join-session", {
      sessionId,
      userId,
      role,
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  emitCodeChange(sessionId: string, code: string, language: string) {
    this.socket?.emit("code-change", { sessionId, code, language })
  }

  onCodeUpdate(callback: (data: { code: string; language: string }) => void) {
    this.socket?.on("code-updated", callback)
  }

  emitCursorMove(sessionId: string, cursorPosition: { line: number; column: number }) {
    this.socket?.emit("cursor-move", { sessionId, cursorPosition })
  }

  onCursorMove(callback: (data: { userId: string; cursorPosition: { line: number; column: number } }) => void) {
    this.socket?.on("cursor-updated", callback)
  }

  onUserJoined(callback: (data: { userId: string; role: string; email: string }) => void) {
    this.socket?.on("user-joined", callback)
  }

  onUserLeft(callback: (data: { userId: string }) => void) {
    this.socket?.on("user-left", callback)
  }

  emitMessage(sessionId: string, message: string) {
    this.socket?.emit("chat-message", { sessionId, message })
  }

  onMessage(callback: (data: { message: string; sender: string; timestamp: Date }) => void) {
    this.socket?.on("new-message", callback)
  }

  onSessionUpdate(callback: (data: { status: string }) => void) {
    this.socket?.on("session-updated", callback)
  }

  emitRunTests(sessionId: string, code: string, language: string) {
    this.socket?.emit("run-tests", { sessionId, code, language })
  }

  onTestResults(callback: (data: { passed: number; failed: number; results: any[] }) => void) {
    this.socket?.on("test-results", callback)
  }

  onError(callback: (error: string) => void) {
    this.socket?.on("error", callback)
  }

  getSocket() {
    return this.socket
  }
}

export const socketService = new SocketService()
