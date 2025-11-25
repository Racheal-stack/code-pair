import fs from 'fs'
import path from 'path'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: 'CANDIDATE' | 'INTERVIEWER'
}

const usersFilePath = path.join(process.cwd(), 'users.json')

const defaultUsers: User[] = []

function loadUsers(): User[] {
  try {
    if (fs.existsSync(usersFilePath)) {
      const data = fs.readFileSync(usersFilePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading users:', error)
  }
  return [...defaultUsers]
}

function saveUsers(users: User[]): void {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('Error saving users:', error)
  }
}

let users: User[] = loadUsers()

export const userStorage = {
  getAll: () => users,
  findByEmail: (email: string) => users.find(user => user.email === email),
  findById: (id: string) => users.find(user => user.id === id),
  add: (user: User) => {
    users.push(user)
    saveUsers(users)
    return user
  },
  update: (id: string, updates: Partial<User>) => {
    const index = users.findIndex(user => user.id === id)
    if (index !== -1) {
      users[index] = { ...users[index], ...updates }
      saveUsers(users)
      return users[index]
    }
    return null
  },
  delete: (id: string) => {
    const index = users.findIndex(user => user.id === id)
    if (index !== -1) {
      const deleted = users[index]
      users.splice(index, 1)
      saveUsers(users)
      return deleted
    }
    return null
  }
}