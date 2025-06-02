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

const exercises = [
    {
    id: 1,
    name: "Dumbbell Floor Press",
    image: "/placeholder.svg?height=60&width=60",
    tags: "--",
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
    name: "Dumbbell Rear Delt Row",
    image: "/placeholder.svg?height=60&width=60",
    tags: "--",
    modality: "Strength",
    muscleGroup: "Shoulders",
    movementPattern: "Upper Body Horizontal Pull",
    category: "Strength",
    time: "3d",
    primaryFocus: {
      modality: "Strength",
      muscleGroup: "Shoulders, Rear Delts",
      movementPattern: "Upper Body Horizontal Pull",
    },
    trackingFields: ["Weight", "Reps"],
    instructions: [
      "Hold dumbbells with arms extended in front of you.",
      "Pull elbows back squeezing shoulder blades together.",
      "Focus on rear deltoid engagement.",
      "Return to starting position with control.",
    ],
  },
  {
    id: 3,
    name: "Jumping Jacks",
    image: "/placeholder.svg?height=60&width=60",
    tags: "--",
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
  {
    id: 4,
    name: "Dumbbell Bicep Curl",
    image: "/placeholder.svg?height=60&width=60",
    tags: "--",
    modality: "Strength",
    muscleGroup: "Biceps",
    movementPattern: "Upper Body Vertical Pull",
    category: "Strength",
    time: "3d",
    primaryFocus: {
      modality: "Strength",
      muscleGroup: "Biceps",
      movementPattern: "Upper Body Vertical Pull",
    },
    trackingFields: ["Weight", "Reps"],
    instructions: [
      "Hold dumbbells at your sides with palms facing forward.",
      "Keep elbows close to your torso.",
      "Curl weights up towards shoulders.",
      "Squeeze biceps at the top.",
      "Lower with control to starting position.",
    ],
  },
  {
    id: 5,
    name: "Standing Biceps Stretch",
    image: "/placeholder.svg?height=60&width=60",
    tags: "--",
    modality: "Mobility",
    muscleGroup: "Biceps",
    movementPattern: "--",
    category: "Timed",
    time: "3d",
    primaryFocus: {
      modality: "Mobility",
      muscleGroup: "Biceps, Shoulders",
      movementPattern: "Static Stretch",
    },
    trackingFields: ["Time"],
    instructions: [
      "Extend arm straight out to the side.",
      "Place palm against a wall or doorframe.",
      "Gently turn body away from extended arm.",
      "Feel stretch in bicep and front of shoulder.",
      "Hold for desired duration.",
    ],
  },
  {
    id: 6,
    name: "Hanging Oblique Knee Raise",
    image: "/placeholder.svg?height=60&width=60",
    tags: "--",
    modality: "Strength",
    muscleGroup: "Core",
    movementPattern: "Core Flexion / Extension",
    category: "Bodyweight",
    time: "3d",
    primaryFocus: {
      modality: "Strength",
      muscleGroup: "Core, Obliques",
      movementPattern: "Core Flexion / Extension",
    },
    trackingFields: ["Reps"],
    instructions: [
      "Hang from a pull-up bar with arms extended.",
      "Engage core and lift knees towards one side.",
      "Focus on oblique contraction.",
      "Lower knees with control.",
      "Alternate sides or complete one side at a time.",
    ],
  },

]

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

export default function ExerciseLibrary() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedExercise, setSelectedExercise] = useState<
    (typeof exercises)[0] | null
  >(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

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
      selectedTags.every((tag) => exercise.tags?.includes(tag))
    return matchName && matchTags
  })

  const handleExerciseClick = (exercise: (typeof exercises)[0]) => {
    setSelectedExercise(exercise)
    setIsModalOpen(true)
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
        <div className="flex items-center gap-2">
          {["Upper", "Chest", "Lower", "Mobility"].map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "secondary"}
              onClick={() => toggleTag(tag)}
              className="flex items-center gap-1 cursor-pointer"
            >
              {tag}
            </Badge>
          ))}
          <Button className="flex items-center gap-2">
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
              <TableHead>Tags</TableHead>
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
                  <div className="relative w-12 h-12">
                    <img
                      src={exercise.image}
                      className="object-cover rounded"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{exercise.name}</TableCell>
                <TableCell className="text-gray-500">
                  {(exercise.tags || [])}
                </TableCell>
                <TableCell>{exercise.modality}</TableCell>
                <TableCell>{exercise.muscleGroup}</TableCell>
                <TableCell>{exercise.movementPattern}</TableCell>
                <TableCell>{exercise.category}</TableCell>
                <TableCell className="text-gray-500">{exercise.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500">
        <Button variant="ghost" size="sm">
          {"<"}
        </Button>
        <span>1 - 50 of 2515</span>
        <Button variant="ghost" size="sm">
          {">"}
        </Button>
      </div>

      {/* Exercise Modal */}
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
                      <h3 className="text-sm font-medium text-gray-500 mb-1 tracking-wide capitalize">
                        {key.replace(/([A-Z])/g, " $1").toUpperCase()}
                      </h3>
                      <select className="w-full border p-2 rounded-lg">
                        {dummyOptions[key].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  ),
                )}

                {/* Category Dropdown */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 tracking-wide">
                    CATEGORY
                  </h3>
                  <select className="w-full border p-2 rounded-lg">
                    {dummyOptions.category.map((cat) => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Tracking Fields */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-medium text-gray-500 tracking-wide">
                      TRACKING FIELDS
                    </h3>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {selectedExercise.trackingFields.map((field, index) => (
                      <Badge key={field} variant="secondary" className="px-3 py-2">
                        {index + 1}. {field}
                      </Badge>
                    ))}
                    <Button variant="outline" size="icon" className="h-10 w-10">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4 tracking-wide">
                    INSTRUCTIONS (Separate each step on a new line)
                  </h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {selectedExercise.instructions.map((instruction, index) => (
                          <div key={index} className="flex gap-3">
                            <span className="text-gray-400 font-medium">{index + 1}.</span>
                            <span className="text-gray-700">{instruction}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
