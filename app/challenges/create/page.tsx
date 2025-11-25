"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Code, FileText, Clock, Tag, Plus, X } from "lucide-react"
import DashboardLayout from "@/components/dashboard/dashboard-layout"

export default function CreateChallengePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Medium",
    category: "Algorithm",
    estimatedTime: "30 minutes",
    starterCode: "",
    tags: [""],
    testCases: [{ input: "", expectedOutput: "", description: "" }]
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...formData.tags]
    newTags[index] = value
    setFormData({ ...formData, tags: newTags })
  }

  const addTag = () => {
    setFormData({ ...formData, tags: [...formData.tags, ""] })
  }

  const removeTag = (index: number) => {
    const newTags = formData.tags.filter((_, i) => i !== index)
    setFormData({ ...formData, tags: newTags })
  }

  const handleTestCaseChange = (index: number, field: string, value: string) => {
    const newTestCases = [...formData.testCases]
    newTestCases[index] = { ...newTestCases[index], [field]: value }
    setFormData({ ...formData, testCases: newTestCases })
  }

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: "", expectedOutput: "", description: "" }]
    })
  }

  const removeTestCase = (index: number) => {
    const newTestCases = formData.testCases.filter((_, i) => i !== index)
    setFormData({ ...formData, testCases: newTestCases })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const currentSession = localStorage.getItem('currentSession')
      const userStr = currentSession ? localStorage.getItem(`user_${currentSession}`) : null
      const userData = userStr ? JSON.parse(userStr) : null
      
      const challengeData = {
        ...formData,
        tags: formData.tags.filter(tag => tag.trim() !== ''),
        testCases: formData.testCases.filter(tc => tc.input.trim() !== '' || tc.expectedOutput.trim() !== ''),
        createdBy: userData?.email || 'Anonymous'
      }
      
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(challengeData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create challenge')
      }
      
      router.push('/dashboard?tab=challenges&created=true')
      
    } catch (error) {
      console.error('Error creating challenge:', error)
      alert('Failed to create challenge. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Challenge</h1>
          <p className="text-foreground/60">Create a coding challenge for interviews</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-secondary/50 border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Challenge Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Two Sum Problem"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                >
                  <option value="Algorithm">Algorithm</option>
                  <option value="Data Structure">Data Structure</option>
                  <option value="System Design">System Design</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Database">Database</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Estimated Time</label>
                <select
                  name="estimatedTime"
                  value={formData.estimatedTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                >
                  <option value="15 minutes">15 minutes</option>
                  <option value="30 minutes">30 minutes</option>
                  <option value="45 minutes">45 minutes</option>
                  <option value="1 hour">1 hour</option>
                  <option value="1.5 hours">1.5 hours</option>
                  <option value="2 hours">2 hours</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the problem, requirements, and any constraints..."
                rows={4}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="space-y-2">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => handleTagChange(index, e.target.value)}
                      placeholder={`Tag ${index + 1}`}
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                    />
                    {formData.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="px-3 py-2 text-red-400 hover:text-red-300 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 text-primary hover:text-accent transition border border-primary/30 rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Tag
                </button>
              </div>
            </div>
          </div>

          {/* Code Section */}
          <div className="bg-secondary/50 border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Code Setup
            </h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Starter Code (Optional)</label>
              <textarea
                name="starterCode"
                value={formData.starterCode}
                onChange={handleChange}
                placeholder="function twoSum(nums, target) {
    // Your code here
}"
                rows={8}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition font-mono text-sm"
              />
            </div>
          </div>

          {/* Test Cases */}
          <div className="bg-secondary/50 border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
            
            <div className="space-y-4">
              {formData.testCases.map((testCase, index) => (
                <div key={index} className="border border-border/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Test Case {index + 1}</h3>
                    {formData.testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(index)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Input</label>
                      <textarea
                        value={testCase.input}
                        onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                        placeholder="[2, 7, 11, 15], 9"
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-primary transition font-mono text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Expected Output</label>
                      <textarea
                        value={testCase.expectedOutput}
                        onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                        placeholder="[0, 1]"
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-primary transition font-mono text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={testCase.description}
                      onChange={(e) => handleTestCaseChange(index, 'description', e.target.value)}
                      placeholder="Basic case with two numbers"
                      className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addTestCase}
                className="px-4 py-2 text-primary hover:text-accent transition border border-primary/30 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Test Case
              </button>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}