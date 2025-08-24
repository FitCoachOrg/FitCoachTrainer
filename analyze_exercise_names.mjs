import fs from 'fs';
import path from 'path';

// Function to read and parse the CSV file
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index] ? values[index].trim() : '';
            });
            data.push(row);
        }
    }
    
    return data;
}

// Function to extract base exercise names
function extractBaseExerciseNames(exercises) {
    const baseNames = new Map();
    const patterns = new Map();
    
    exercises.forEach(exercise => {
        const name = exercise.exercise_name;
        if (!name) return;
        
        // Split by common equipment prefixes
        const equipmentPrefixes = [
            'Bodyweight', 'Barbell', 'Dumbbell', 'Kettlebell', 'Cable', 'Machine',
            'Stability Ball', 'Medicine Ball', 'Slam Ball', 'Ring', 'Parallette',
            'Suspension', 'Slider', 'Miniband', 'Superband', 'Resistance Band',
            'Landmine', 'EZ Bar', 'Trap Bar', 'Clubbell', 'Macebell', 'Indian Club',
            'Bulgarian Bag', 'Heavy Sandbag', 'Battle Rope', 'Tire', 'Ab Wheel',
            'Weight Plate', 'Bar', 'Double', 'Single Arm', 'Alternating'
        ];
        
        let baseName = name;
        let equipment = '';
        
        // Extract equipment prefix
        for (const prefix of equipmentPrefixes) {
            if (name.startsWith(prefix + ' ')) {
                equipment = prefix;
                baseName = name.substring(prefix.length + 1);
                break;
            }
        }
        
        // Handle "Double" and "Single Arm" prefixes
        if (baseName.startsWith('Double ')) {
            equipment = 'Double ' + equipment;
            baseName = baseName.substring(7);
        } else if (baseName.startsWith('Single Arm ')) {
            equipment = 'Single Arm ' + equipment;
            baseName = baseName.substring(11);
        } else if (baseName.startsWith('Alternating ')) {
            equipment = 'Alternating ' + equipment;
            baseName = baseName.substring(12);
        }
        
        // Clean up the base name
        baseName = baseName.trim();
        
        if (baseName) {
            if (!baseNames.has(baseName)) {
                baseNames.set(baseName, {
                    count: 0,
                    variations: [],
                    equipment: new Set()
                });
            }
            
            const entry = baseNames.get(baseName);
            entry.count++;
            entry.variations.push(name);
            if (equipment) {
                entry.equipment.add(equipment);
            }
        }
    });
    
    return baseNames;
}

// Function to find common patterns
function findCommonPatterns(exercises) {
    const patterns = new Map();
    
    exercises.forEach(exercise => {
        const name = exercise.exercise_name;
        if (!name) return;
        
        // Look for common suffixes
        const commonSuffixes = [
            'Squat', 'Deadlift', 'Press', 'Row', 'Curl', 'Extension', 'Crunch',
            'Plank', 'Bridge', 'Lunge', 'Step Up', 'Carry', 'March', 'Clean',
            'Snatch', 'Jerk', 'Thruster', 'Burpee', 'Push Up', 'Pull Up',
            'Dip', 'Muscle Up', 'Handstand', 'L Sit', 'Tuck', 'Pike', 'Hollow',
            'Bird Dog', 'Dead Bug', 'Russian Twist', 'Windmill', 'Turkish Get Up',
            'Bear Crawl', 'Mountain Climber', 'Flutter Kicks', 'Leg Raise',
            'Knee Raise', 'Hip Thrust', 'Glute Bridge', 'Fire Hydrant',
            'Clamshell', 'Monster Walk', 'Lateral Walk', 'Skater Jump',
            'Box Jump', 'Tuck Jump', 'Nordic', 'Hamstring Curl', 'Pistol',
            'Dragon', 'Sissy', 'Cossack', 'Cyclist', 'Bulgarian', 'Split',
            'Reverse', 'Forward', 'Lateral', 'Walking', 'Alternating',
            'Seated', 'Standing', 'Kneeling', 'Lying', 'Prone', 'Supine',
            'Half', 'Full', 'Tall', 'Low', 'High', 'Overhead', 'Front Rack',
            'Back Rack', 'Suitcase', 'Bottoms Up', 'Goblet', 'Horn Grip',
            'Order', 'Torch', 'Shield', 'Mill', 'Swipe', 'Pullover',
            'Inside Circle', 'Outside Circle', 'Pendulum', 'Halo', '360',
            '10 to 2', 'Barbarian', 'Zercher', 'Lu Raise', 'Steering Wheel'
        ];
        
        for (const suffix of commonSuffixes) {
            if (name.includes(suffix)) {
                if (!patterns.has(suffix)) {
                    patterns.set(suffix, {
                        count: 0,
                        exercises: []
                    });
                }
                patterns.get(suffix).count++;
                patterns.get(suffix).exercises.push(name);
            }
        }
    });
    
    return patterns;
}

// Main analysis
function analyzeExercises() {
    const filePath = 'attached_assets/exercises_raw_rows.csv';
    
    if (!fs.existsSync(filePath)) {
        console.error('CSV file not found:', filePath);
        return;
    }
    
    console.log('Analyzing exercise names...\n');
    
    const exercises = parseCSV(filePath);
    console.log(`Total exercises found: ${exercises.length}\n`);
    
    // Extract base exercise names
    const baseNames = extractBaseExerciseNames(exercises);
    
    // Find common patterns
    const patterns = findCommonPatterns(exercises);
    
    // Display results
    console.log('=== MOST COMMON BASE EXERCISE NAMES ===');
    const sortedBaseNames = Array.from(baseNames.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20);
    
    sortedBaseNames.forEach(([name, data]) => {
        console.log(`${name}: ${data.count} variations`);
        console.log(`  Equipment: ${Array.from(data.equipment).join(', ')}`);
        console.log(`  Examples: ${data.variations.slice(0, 3).join(', ')}`);
        console.log('');
    });
    
    console.log('=== MOST COMMON EXERCISE PATTERNS ===');
    const sortedPatterns = Array.from(patterns.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20);
    
    sortedPatterns.forEach(([pattern, data]) => {
        console.log(`${pattern}: ${data.count} exercises`);
        console.log(`  Examples: ${data.exercises.slice(0, 3).join(', ')}`);
        console.log('');
    });
    
    // Equipment analysis
    console.log('=== EQUIPMENT ANALYSIS ===');
    const equipmentCount = new Map();
    exercises.forEach(exercise => {
        const name = exercise.exercise_name;
        if (!name) return;
        
        const equipment = exercise.equipment;
        if (equipment) {
            equipmentCount.set(equipment, (equipmentCount.get(equipment) || 0) + 1);
        }
    });
    
    const sortedEquipment = Array.from(equipmentCount.entries())
        .sort((a, b) => b[1] - a[1]);
    
    sortedEquipment.forEach(([equipment, count]) => {
        console.log(`${equipment}: ${count} exercises`);
    });
}

// Run the analysis
analyzeExercises();
