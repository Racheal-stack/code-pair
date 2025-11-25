"use client"

interface User {
  userId: string
  role: string
  email: string
  cursorPosition?: { line: number; column: number }
}

interface UserPresenceProps {
  users: User[]
  currentUserId: string
}

const roleColors: Record<string, string> = {
  CANDIDATE: "bg-blue-500",
  INTERVIEWER: "bg-purple-500",
  ADMIN: "bg-red-500",
}

export default function UserPresence({ users, currentUserId }: UserPresenceProps) {
  const otherUsers = users.filter((u) => u.userId !== currentUserId)

  if (otherUsers.length === 0) {
    return (
      <div className="text-center text-foreground/60 py-8">
        <p className="text-sm">Waiting for other participants...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {otherUsers.map((user) => (
        <div key={user.userId} className="p-3 bg-secondary/50 border border-border rounded-lg flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${roleColors[user.role] || "bg-gray-500"}`} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{user.email}</p>
            <p className="text-xs text-foreground/60">{user.role}</p>
          </div>
          {user.cursorPosition && (
            <div className="text-xs text-foreground/50">
              L{user.cursorPosition.line}:C{user.cursorPosition.column}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
