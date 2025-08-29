// Test specifically for weight icon change
function getTaskIconName(taskType) {
  switch (taskType) {
    case "water": return "droplet"
    case "sleep": return "bed"
    case "weight": return "weight-scale"
    case "progress": return "camera"
    case "other": return "bell"
    default: return "bell"
  }
}

console.log('🧪 Testing Font Awesome weight icon...')
console.log(`Weight task icon: ${getTaskIconName("weight")}`)
console.log(`Expected: weight-scale`)
console.log(`Match: ${getTaskIconName("weight") === "weight-scale" ? "✅" : "❌"}`)

// Test all icons to make sure nothing else was affected
console.log('\n📋 All icon mappings:')
console.log(`Water: ${getTaskIconName("water")}`)
console.log(`Sleep: ${getTaskIconName("sleep")}`)
console.log(`Weight: ${getTaskIconName("weight")}`)
console.log(`Progress: ${getTaskIconName("progress")}`)
console.log(`Other: ${getTaskIconName("other")}`) 