"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Trophy,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  Clock,
  Play,
  Star,
  Trash2,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

// Mock data - these should be moved to a separate data file or fetched from API
const mockPrograms = [
  {
    id: 1,
    title: "Weight Loss Program",
    description: "Comprehensive 12-week weight loss program focusing on nutrition and cardio",
    tag: "Weight Loss",
    difficulty: "Medium",
    color: "#10B981",
    startDay: "Monday",
    created: "2024-01-15",
    lastEdited: "2 days ago",
  },
  {
    id: 2,
    title: "Strength Building",
    description: "Progressive strength training program for muscle building and toning",
    tag: "Strength",
    difficulty: "Hard",
    color: "#3B82F6",
    startDay: "Wednesday",
    created: "2024-01-10",
    lastEdited: "1 week ago",
  },
  {
    id: 3,
    title: "Beginner Fitness",
    description: "Gentle introduction to fitness for beginners with low-impact exercises",
    tag: "Beginner",
    difficulty: "Easy",
    color: "#8B5CF6",
    startDay: "Friday",
    created: "2024-01-20",
    lastEdited: "Just now",
  },
]

const programTags = ["All", "Weight Loss", "Strength", "Beginner", "Cardio", "Flexibility"]
const sortOptions = ["Recently updated", "Alphabetically", "Difficulty"]

const difficultyColors = {
  Easy: "#10B981",
  Medium: "#F59E0B",
  Hard: "#EF4444",
}

// Props interface for the component
interface ProgramManagementSectionProps {
  clientId?: number
  isActive?: boolean
}

/**
 * ProgramManagementSection Component
 * 
 * This component provides a comprehensive program management interface with:
 * - Search and filtering capabilities
 * - Grid and list view modes
 * - Program cards with detailed information
 * - CRUD operations for programs
 * - Loading states and responsive design
 * 
 * Features:
 * - Advanced filtering by tags and difficulty
 * - Sorting options (recently updated, alphabetical, difficulty)
 * - Search functionality across program titles and descriptions
 * - Grid and list view toggle
 * - Program duplication and deletion
 * - Responsive design with proper loading states
 */
export function ProgramManagementSection({ clientId, isActive }: ProgramManagementSectionProps) {
  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [filteredPrograms, setFilteredPrograms] = useState(mockPrograms)
  const [selectedTag, setSelectedTag] = useState("All")
  const [sortBy, setSortBy] = useState("Recently updated")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Filter and sort programs
  useEffect(() => {
    let filtered = mockPrograms

    // Filter by tag
    if (selectedTag !== "All") {
      filtered = filtered.filter((program) => program.tag === selectedTag)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (program) =>
          program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          program.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Sort programs
    switch (sortBy) {
      case "Alphabetically":
        filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title))
        break
      case "Difficulty":
        const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 }
        filtered = [...filtered].sort(
          (a, b) =>
            (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 4) -
            (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 4),
        )
        break
      default: // Recently updated
        filtered = [...filtered].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    }

    setFilteredPrograms(filtered)
  }, [mockPrograms, selectedTag, sortBy, searchQuery])

  const handleDeleteProgram = (id: number) => {
    setPrograms(programs.filter((p) => p.id !== id))
  }

  const handleDuplicateProgram = (program: any) => {
    const newProgram = {
      ...program,
      id: Math.max(...programs.map((p) => p.id)) + 1,
      title: `${program.title} (Copy)`,
      created: new Date().toISOString().split("T")[0],
      lastEdited: "Just now",
    }
    setPrograms([...programs, newProgram])
  }

  // Data loading effect - placed after all hooks
  useEffect(() => {
    if (clientId && isActive && !dataLoaded) {
      setLoading(true)
      // Simulate API call - replace with actual programs fetching
      setTimeout(() => {
        setPrograms([
          // Mock data - replace with actual programs
          { id: 1, name: "Weight Loss Program", status: "active" },
          { id: 2, name: "Strength Building", status: "completed" }
        ])
        setDataLoaded(true)
        setLoading(false)
      }, 1100)
    }
  }, [clientId, isActive, dataLoaded])

  // Early return for loading state
  if (loading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <LoadingSpinner />
            <p className="text-gray-600 dark:text-gray-400">Loading programs...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Program Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredPrograms.length} of {mockPrograms.length} programs
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64 border-2 border-gray-200 focus:border-indigo-400 rounded-xl"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-32 border-2 border-gray-200 focus:border-indigo-400 rounded-xl">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {programTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 border-2 border-gray-200 focus:border-indigo-400 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-none border-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none border-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Programs Display */}
      {filteredPrograms.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">No programs found</p>
          <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrograms.map((program) => (
            <Card
              key={program.id}
              className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 dark:bg-gray-900/90 hover:scale-105"
            >
              {/* Color accent */}
              <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: program.color }} />

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium"
                        style={{
                          backgroundColor: `${program.color}20`,
                          color: program.color,
                          border: `1px solid ${program.color}40`,
                        }}
                      >
                        {program.tag}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: difficultyColors[program.difficulty as keyof typeof difficultyColors],
                          color: difficultyColors[program.difficulty as keyof typeof difficultyColors],
                        }}
                      >
                        {program.difficulty}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {program.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">{program.description}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Starts {program.startDay}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>Last edited {program.lastEdited}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicateProgram(program)}
                    className="border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteProgram(program.id)}
                    className="border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 dark:border-red-800 dark:hover:border-red-700 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Enhanced List View */
        <div className="space-y-4">
          {filteredPrograms.map((program) => (
            <Card
              key={program.id}
              className="group bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-900/90"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="w-4 h-16 rounded-full flex-shrink-0" style={{ backgroundColor: program.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate">{program.title}</h4>
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium flex-shrink-0"
                        style={{
                          backgroundColor: `${program.color}20`,
                          color: program.color,
                          border: `1px solid ${program.color}40`,
                        }}
                      >
                        {program.tag}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0"
                        style={{
                          borderColor: difficultyColors[program.difficulty as keyof typeof difficultyColors],
                          color: difficultyColors[program.difficulty as keyof typeof difficultyColors],
                        }}
                      >
                        {program.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{program.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Starts {program.startDay}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Last edited {program.lastEdited}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicateProgram(program)}
                      className="border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteProgram(program.id)}
                      className="border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 dark:border-red-800 dark:hover:border-red-700 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 