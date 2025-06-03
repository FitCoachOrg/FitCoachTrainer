import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  Filter,
  Plus,
  Share2,
  ChevronDown,
  HelpCircle,
} from "lucide-react"

const dummyOptions = {
  modality: ["Strength", "Conditioning", "Mobility"],
  muscleGroup: ["Chest", "Back", "Shoulders", "Biceps", "Quads", "Core"],
  movementPattern: [
    "Upper Body Horizontal Push",
    "Upper Body Horizontal Pull",
    "Core Flexion / Extension",
    "Static Stretch",
    "Locomotion",
  ],
  category: ["Strength", "Bodyweight", "Timed"],
}

const initialExercises = [
  {
    id: 1,
    name: "Dumbbell Floor Press",
    image: "/placeholder.svg?height=60&width=60",
    tags: "",
    modality: "Strength",
    muscleGroup: "Chest",
    movementPattern: "Upper Body Horizontal Push",
    category: "Strength",
    time: "3d",
    primaryFocus: {
      modality: "Strength",
      muscleGroup: "Chest, Triceps",
      movementPattern: "Upper Body Horizontal Push",
    },
    trackingFields: ["Weight", "Reps"],
    instructions: [
      "Lay on the floor holding dumbbells in your hands.",
      "Your knees can be bent.",
      "Begin with the weights fully extended above you.",
      "Lower the weights until your upper arms touch the floor.",
      "Press the weights back up to the starting position.",
    ],
  },
  {
    id: 2,
    name: "Jumping Jacks",
    image: "/placeholder.svg?height=60&width=60",
    tags: "",
    modality: "Conditioning",
    muscleGroup: "Quads",
    movementPattern: "Locomotion",
    category: "Bodyweight",
    time: "3d",
    primaryFocus: {
      modality: "Conditioning",
      muscleGroup: "Full Body",
      movementPattern: "Locomotion",
    },
    trackingFields: ["Time", "Reps"],
    instructions: [
      "Stand with feet together and arms at your sides.",
      "Jump while spreading legs shoulder-width apart.",
      "Simultaneously raise arms overhead.",
      "Jump back to starting position.",
      "Maintain a steady rhythm throughout.",
    ],
  },
]

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState(initialExercises)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedExercise, setSelectedExercise] = useState<typeof exercises[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newModality, setNewModality] = useState("")
const [newMuscleGroup, setNewMuscleGroup] = useState("")
const [newMovementPattern, setNewMovementPattern] = useState("")
const [newCategory, setNewCategory] = useState("")
const [newTime, setNewTime] = useState("")

  const [newExerciseName, setNewExerciseName] = useState("")

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const filteredExercises = exercises.filter((exercise) => {
    const matchName = exercise.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) =>
        exercise.muscleGroup.toLowerCase().includes(tag.toLowerCase())
      )
    return matchName && matchTags
  })

  const handleExerciseClick = (exercise: typeof exercises[0]) => {
    setSelectedExercise(exercise)
    setIsModalOpen(true)
  }
const handleAddExercise = () => {
  const newExercise = {
    id: exercises.length + 1,
    name: newExerciseName,
    image: "/placeholder.svg?height=60&width=60",
    tags: "",
    modality: newModality,
    muscleGroup: newMuscleGroup,
    movementPattern: newMovementPattern,
    category: newCategory,
    time: newTime,
    primaryFocus: {
      modality: newModality,
      muscleGroup: newMuscleGroup,
      movementPattern: newMovementPattern,
    },
    trackingFields: ["Reps"],
    instructions: ["Do your reps!"],
  }
  setExercises((prev) => [...prev, newExercise])
  setIsAddModalOpen(false)
  setNewExerciseName("")
  setNewModality("")
  setNewMuscleGroup("")
  setNewMovementPattern("")
  setNewCategory("")
  setNewTime("")
}


  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search exercise name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          {dummyOptions.muscleGroup.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "secondary"}
              onClick={() => toggleTag(tag)}
              className="flex items-center gap-1 cursor-pointer"
            >
              {tag}
            </Badge>
          ))}
          <Button
            className="flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add New Exercise
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12"></TableHead>
              <TableHead>Exercise Name</TableHead>
              <TableHead>Modality</TableHead>
              <TableHead>Muscle Group</TableHead>
              <TableHead>Movement Pattern</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExercises.map((exercise) => (
              <TableRow
                key={exercise.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleExerciseClick(exercise)}
              >
                <TableCell>
                  <img
                    src={exercise.image}
                    className="object-cover rounded w-12 h-12"
                  />
                </TableCell>
                <TableCell className="font-medium">{exercise.name}</TableCell>
                <TableCell>{exercise.modality}</TableCell>
                <TableCell>{exercise.muscleGroup}</TableCell>
                <TableCell>{exercise.movementPattern}</TableCell>
                <TableCell>{exercise.category}</TableCell>
                <TableCell>{exercise.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Placeholder */}
      <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500">
        <Button variant="ghost" size="sm">
          {"<"}
        </Button>
        <span>1 - {filteredExercises.length} of {exercises.length}</span>
        <Button variant="ghost" size="sm">
          {">"}
        </Button>
      </div>

      {/* View Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedExercise && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle className="text-2xl font-bold text-gray-800">
                  {selectedExercise.name}
                </DialogTitle>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </DialogHeader>

              <div className="space-y-6">
                {/* Primary Focus Dropdowns */}
                {(["modality", "muscleGroup", "movementPattern"] as const).map(
                  (key) => (
                    <div key={key}>
                      <h3 className="text-sm font-medium text-gray-500 mb-1 capitalize">
                        {key}
                      </h3>
                      <select className="w-full border p-2 rounded-lg">
                        {dummyOptions[key].map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  )
                )}
                {/* Instructions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">
                    INSTRUCTIONS
                  </h3>
                  <Card>
                    <CardContent className="p-4">
                      {selectedExercise.instructions.map((ins, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <span className="text-gray-400">{i + 1}.</span>
                          <span>{ins}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Add New Exercise</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <Input
        placeholder="Exercise name"
        value={newExerciseName}
        onChange={(e) => setNewExerciseName(e.target.value)}
      />
      <select
        value={newModality}
        onChange={(e) => setNewModality(e.target.value)}
        className="w-full border p-2 rounded-lg"
      >
        <option value="">Select Modality</option>
        {dummyOptions.modality.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <select
        value={newMuscleGroup}
        onChange={(e) => setNewMuscleGroup(e.target.value)}
        className="w-full border p-2 rounded-lg"
      >
        <option value="">Select Muscle Group</option>
        {dummyOptions.muscleGroup.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <select
        value={newMovementPattern}
        onChange={(e) => setNewMovementPattern(e.target.value)}
        className="w-full border p-2 rounded-lg"
      >
        <option value="">Select Movement Pattern</option>
        {dummyOptions.movementPattern.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <select
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
        className="w-full border p-2 rounded-lg"
      >
        <option value="">Select Category</option>
        {dummyOptions.category.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <Input
        placeholder="Time (e.g. 3d)"
        value={newTime}
        onChange={(e) => setNewTime(e.target.value)}
      />
      <Button onClick={handleAddExercise} disabled={!newExerciseName || !newModality || !newMuscleGroup || !newMovementPattern || !newCategory || !newTime}>
        Save Exercise
      </Button>
    </div>
  </DialogContent>
</Dialog>

    </div>
  )
}
