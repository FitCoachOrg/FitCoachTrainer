import fs from 'fs';

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

// Function to extract the core exercise name by removing equipment and modifiers
function extractCoreExerciseName(exerciseName) {
    if (!exerciseName) return '';
    
    let name = exerciseName;
    
    // Remove equipment prefixes
    const equipmentPrefixes = [
        'Bodyweight', 'Barbell', 'Dumbbell', 'Kettlebell', 'Cable', 'Machine',
        'Stability Ball', 'Medicine Ball', 'Slam Ball', 'Ring', 'Parallette',
        'Suspension', 'Slider', 'Miniband', 'Superband', 'Resistance Band',
        'Landmine', 'EZ Bar', 'Trap Bar', 'Clubbell', 'Macebell', 'Indian Club',
        'Bulgarian Bag', 'Heavy Sandbag', 'Battle Rope', 'Tire', 'Ab Wheel',
        'Weight Plate', 'Bar', 'Wall Ball', 'Climbing Rope', 'Sled'
    ];
    
    for (const prefix of equipmentPrefixes) {
        if (name.startsWith(prefix + ' ')) {
            name = name.substring(prefix.length + 1);
            break;
        }
    }
    
    // Remove common modifiers
    const modifiers = [
        'Double', 'Single Arm', 'Alternating', 'Single', 'Double Arm',
        'Seated', 'Standing', 'Kneeling', 'Lying', 'Prone', 'Supine',
        'Half', 'Full', 'Tall', 'Low', 'High', 'Overhead', 'Front Rack',
        'Back Rack', 'Suitcase', 'Bottoms Up', 'Goblet', 'Horn Grip',
        'Order', 'Torch', 'Shield', 'Mill', 'Swipe', 'Pullover',
        'Inside Circle', 'Outside Circle', 'Pendulum', 'Halo', '360',
        '10 to 2', 'Barbarian', 'Zercher', 'Lu Raise', 'Steering Wheel',
        'Feet Elevated', 'Hand Assisted', 'Wall Facing', 'Face the Wall',
        'Box', 'Bench', 'Decline', 'Incline', 'Close Grip', 'Wide Grip',
        'Reverse Grip', 'Crush Grip', 'Spider', 'Concentration', 'Guillotine',
        'Skull Crusher', 'Preacher', 'Cuban', 'Turkish', 'Bear Hug',
        'Shoulder', 'Bear Crawl', 'Bird Dog', 'Dead Bug', 'Russian Twist',
        'Windmill', 'Turkish Get Up', 'Mountain Climber', 'Flutter Kicks',
        'Fire Hydrant', 'Clamshell', 'Monster Walk', 'Lateral Walk',
        'Skater Jump', 'Box Jump', 'Tuck Jump', 'Nordic', 'Dragon',
        'Sissy', 'Candlestick', 'Cocoon', 'Hollow Body', 'Copenhagen',
        'Ipsilateral', 'Contralateral', 'Unilateral', 'Bilateral',
        'Isometric', 'Ballistic', 'Plyometric', 'Calisthenics', 'Bodybuilding',
        'Powerlifting', 'Olympic Weightlifting', 'Grinds', 'Balance',
        'Mobility', 'Postural', 'Animal Flow', 'Unsorted*'
    ];
    
    for (const modifier of modifiers) {
        if (name.startsWith(modifier + ' ')) {
            name = name.substring(modifier.length + 1);
        }
    }
    
    // Remove common suffixes that are variations
    const variationSuffixes = [
        'Jump', 'Burpee', 'Thruster', 'Clean', 'Snatch', 'Jerk',
        'March', 'Carry', 'Walk', 'Crawl', 'Flow', 'Sequence',
        'Complex', 'Circuit', 'Superset', 'Drop Set', 'Pyramid',
        'Ladder', 'EMOM', 'AMRAP', 'Tabata', 'Interval', 'Tempo',
        'Eccentric', 'Concentric', 'Isometric', 'Plyometric',
        'Ballistic', 'Explosive', 'Dynamic', 'Static', 'Hold',
        'Pause', 'Pulse', 'Bounce', 'Rock', 'Swing', 'Rocking',
        'Alternating', 'Seesaw', 'Rotational', 'Spinning', 'Twisting',
        'Bending', 'Reaching', 'Touching', 'Tapping', 'Kicking',
        'Punching', 'Striking', 'Slamming', 'Throwing', 'Catching',
        'Passing', 'Receiving', 'Transferring', 'Switching', 'Changing',
        'Progression', 'Regression', 'Variation', 'Modification',
        'Adaptation', 'Alternative', 'Substitute', 'Replacement'
    ];
    
    for (const suffix of variationSuffixes) {
        if (name.endsWith(' ' + suffix)) {
            name = name.substring(0, name.length - suffix.length - 1);
        }
    }
    
    return name.trim();
}

// Function to identify the most common base exercises
function findCommonBaseExercises(exercises) {
    const baseExercises = new Map();
    
    exercises.forEach(exercise => {
        const coreName = extractCoreExerciseName(exercise.exercise_name);
        if (coreName && coreName.length > 2) { // Filter out very short names
            if (!baseExercises.has(coreName)) {
                baseExercises.set(coreName, {
                    count: 0,
                    variations: [],
                    equipment: new Set(),
                    categories: new Set()
                });
            }
            
            const entry = baseExercises.get(coreName);
            entry.count++;
            entry.variations.push(exercise.exercise_name);
            
            if (exercise.equipment) {
                entry.equipment.add(exercise.equipment);
            }
            
            if (exercise.category) {
                entry.categories.add(exercise.category);
            }
        }
    });
    
    return baseExercises;
}

// Function to categorize exercises by type
function categorizeExercises(exercises) {
    const categories = {
        'Squat': [],
        'Deadlift': [],
        'Press': [],
        'Row': [],
        'Curl': [],
        'Extension': [],
        'Crunch': [],
        'Plank': [],
        'Bridge': [],
        'Lunge': [],
        'Step Up': [],
        'Carry': [],
        'March': [],
        'Clean': [],
        'Snatch': [],
        'Jerk': [],
        'Thruster': [],
        'Burpee': [],
        'Push Up': [],
        'Pull Up': [],
        'Dip': [],
        'Muscle Up': [],
        'Handstand': [],
        'L Sit': [],
        'Tuck': [],
        'Pike': [],
        'Hollow': [],
        'Bird Dog': [],
        'Dead Bug': [],
        'Russian Twist': [],
        'Windmill': [],
        'Turkish Get Up': [],
        'Bear Crawl': [],
        'Mountain Climber': [],
        'Flutter Kicks': [],
        'Leg Raise': [],
        'Knee Raise': [],
        'Hip Thrust': [],
        'Glute Bridge': [],
        'Fire Hydrant': [],
        'Clamshell': [],
        'Monster Walk': [],
        'Lateral Walk': [],
        'Skater Jump': [],
        'Box Jump': [],
        'Tuck Jump': [],
        'Nordic': [],
        'Hamstring Curl': [],
        'Pistol': [],
        'Dragon': [],
        'Sissy': [],
        'Cossack': [],
        'Cyclist': [],
        'Bulgarian': [],
        'Split': [],
        'Reverse': [],
        'Forward': [],
        'Lateral': [],
        'Walking': [],
        'Alternating': [],
        'Seated': [],
        'Standing': [],
        'Kneeling': [],
        'Lying': [],
        'Prone': [],
        'Supine': [],
        'Half': [],
        'Full': [],
        'Tall': [],
        'Low': [],
        'High': [],
        'Overhead': [],
        'Front Rack': [],
        'Back Rack': [],
        'Suitcase': [],
        'Bottoms Up': [],
        'Goblet': [],
        'Horn Grip': [],
        'Order': [],
        'Torch': [],
        'Shield': [],
        'Mill': [],
        'Swipe': [],
        'Pullover': [],
        'Inside Circle': [],
        'Outside Circle': [],
        'Pendulum': [],
        'Halo': [],
        '360': [],
        '10 to 2': [],
        'Barbarian': [],
        'Zercher': [],
        'Lu Raise': [],
        'Steering Wheel': []
    };
    
    exercises.forEach(exercise => {
        const name = exercise.exercise_name.toLowerCase();
        
        for (const [category, list] of Object.entries(categories)) {
            if (name.includes(category.toLowerCase())) {
                list.push(exercise.exercise_name);
            }
        }
    });
    
    return categories;
}

// Main analysis
function analyzeExercises() {
    const filePath = 'attached_assets/exercises_raw_rows.csv';
    
    if (!fs.existsSync(filePath)) {
        console.error('CSV file not found:', filePath);
        return;
    }
    
    console.log('Comprehensive Exercise Name Analysis\n');
    console.log('=====================================\n');
    
    const exercises = parseCSV(filePath);
    console.log(`Total exercises analyzed: ${exercises.length}\n`);
    
    // Find common base exercises
    const baseExercises = findCommonBaseExercises(exercises);
    
    // Display top base exercises
    console.log('=== TOP 30 MOST COMMON BASE EXERCISE NAMES ===\n');
    const sortedBaseExercises = Array.from(baseExercises.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 30);
    
    sortedBaseExercises.forEach(([name, data], index) => {
        console.log(`${index + 1}. ${name} (${data.count} variations)`);
        console.log(`   Equipment: ${Array.from(data.equipment).slice(0, 5).join(', ')}`);
        console.log(`   Categories: ${Array.from(data.categories).join(', ')}`);
        console.log(`   Examples: ${data.variations.slice(0, 3).join(', ')}`);
        console.log('');
    });
    
    // Categorize exercises
    const categories = categorizeExercises(exercises);
    
    console.log('=== EXERCISE CATEGORIES BY FREQUENCY ===\n');
    const sortedCategories = Object.entries(categories)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 20);
    
    sortedCategories.forEach(([category, exercises]) => {
        if (exercises.length > 0) {
            console.log(`${category}: ${exercises.length} exercises`);
            console.log(`  Examples: ${exercises.slice(0, 3).join(', ')}`);
            console.log('');
        }
    });
    
    // Equipment distribution
    console.log('=== EQUIPMENT DISTRIBUTION ===\n');
    const equipmentCount = new Map();
    exercises.forEach(exercise => {
        if (exercise.equipment) {
            equipmentCount.set(exercise.equipment, (equipmentCount.get(exercise.equipment) || 0) + 1);
        }
    });
    
    const sortedEquipment = Array.from(equipmentCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
    
    sortedEquipment.forEach(([equipment, count]) => {
        console.log(`${equipment}: ${count} exercises`);
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total unique base exercises: ${baseExercises.size}`);
    console.log(`Most common base exercise: ${sortedBaseExercises[0] ? sortedBaseExercises[0][0] : 'N/A'}`);
    console.log(`Most common category: ${sortedCategories[0] ? sortedCategories[0][0] : 'N/A'}`);
    console.log(`Most common equipment: ${sortedEquipment[0] ? sortedEquipment[0][0] : 'N/A'}`);
}

// Run the analysis
analyzeExercises();
