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

// Function to create example standardizations (without LLM)
function createExampleStandardizations(exercises) {
    return exercises.map((exercise, index) => {
        // Create example standardizations based on common patterns
        let standardizedName = exercise.exercise_name;
        let standardizedPrimary = exercise.primary_muscle;
        let standardizedSecondary = exercise.secondary_muscle;
        let notes = '';
        
        // Example standardizations based on common patterns
        if (exercise.exercise_name.includes('Stability Ball')) {
            standardizedName = exercise.exercise_name.replace('Stability Ball ', '');
            notes = 'Removed equipment prefix for clarity';
        }
        
        if (exercise.exercise_name.includes('Double Dumbbell')) {
            standardizedName = exercise.exercise_name.replace('Double Dumbbell ', '');
            notes = 'Simplified equipment description';
        }
        
        if (exercise.exercise_name.includes('Barbell Conventional')) {
            standardizedName = exercise.exercise_name.replace('Barbell Conventional ', '');
            notes = 'Removed redundant equipment and form descriptors';
        }
        
        // Standardize muscle names
        const muscleMappings = {
            'Rectus Abdominis': 'Abs',
            'Pectoralis Major': 'Chest',
            'Latissimus Dorsi': 'Back',
            'Biceps Brachii': 'Biceps',
            'Triceps Brachii': 'Triceps',
            'Anterior Deltoids': 'Shoulders',
            'Gluteus Maximus': 'Glutes',
            'Quadriceps Femoris': 'Quads',
            'Biceps Femoris': 'Hamstrings',
            'Obliques': 'Obliques',
            'Erector Spinae': 'Lower Back',
            'Trapezius': 'Traps',
            'Rhomboids': 'Upper Back'
        };
        
        if (muscleMappings[exercise.primary_muscle]) {
            standardizedPrimary = muscleMappings[exercise.primary_muscle];
        }
        
        if (muscleMappings[exercise.secondary_muscle]) {
            standardizedSecondary = muscleMappings[exercise.secondary_muscle];
        }
        
        return {
            original_name: exercise.exercise_name,
            standardized_name: standardizedName,
            standardized_primary_muscle: standardizedPrimary,
            standardized_secondary_muscle: standardizedSecondary,
            notes: notes || 'Standardized muscle terminology'
        };
    });
}

// Function to merge original and standardized data
function mergeExerciseData(originalExercises, standardizedExercises) {
    return originalExercises.map((original, index) => {
        const standardized = standardizedExercises[index];
        if (standardized) {
            return {
                ...original,
                standardized_name: standardized.standardized_name || original.exercise_name,
                standardized_primary_muscle: standardized.standardized_primary_muscle || original.primary_muscle,
                standardized_secondary_muscle: standardized.standardized_secondary_muscle || original.secondary_muscle,
                standardization_notes: standardized.notes || ''
            };
        } else {
            return {
                ...original,
                standardized_name: original.exercise_name,
                standardized_primary_muscle: original.primary_muscle,
                standardized_secondary_muscle: original.secondary_muscle,
                standardization_notes: 'Failed to standardize'
            };
        }
    });
}

// Function to write CSV file
function writeCSV(data, filename) {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                // Escape commas and quotes in CSV
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');
    
    fs.writeFileSync(filename, csvContent);
    console.log(`CSV file written: ${filename}`);
}

// Main function
async function main() {
    const inputFile = 'attached_assets/exercises_raw_rows.csv';
    const outputFile = 'demo_standardized_exercises.csv';
    
    if (!fs.existsSync(inputFile)) {
        console.error(`Input file not found: ${inputFile}`);
        return;
    }
    
    console.log('Exercise Standardization Demo\n');
    console.log('================================\n');
    console.log('This demo shows what the LLM-based standardization would look like.\n');
    console.log('The actual LLM would provide much more sophisticated and accurate standardizations.\n');
    
    try {
        // Read and parse the CSV file
        const allExercises = parseCSV(inputFile);
        console.log(`Loaded ${allExercises.length} exercises from CSV file`);
        
        // Take first 10 exercises for demo
        const demoExercises = allExercises.slice(0, 10);
        console.log(`Demo with ${demoExercises.length} exercises...\n`);
        
        // Show the demo exercises
        console.log('=== ORIGINAL EXERCISES ===');
        demoExercises.forEach((exercise, index) => {
            console.log(`${index + 1}. ${exercise.exercise_name}`);
            console.log(`   Primary: ${exercise.primary_muscle}`);
            console.log(`   Secondary: ${exercise.secondary_muscle}`);
            console.log(`   Equipment: ${exercise.equipment}`);
            console.log('');
        });
        
        // Create example standardizations
        const standardizedExercises = createExampleStandardizations(demoExercises);
        
        // Merge the data
        const processedExercises = mergeExerciseData(demoExercises, standardizedExercises);
        
        // Write the demo data to a CSV file
        writeCSV(processedExercises, outputFile);
        
        console.log('=== DEMO STANDARDIZATION RESULTS ===');
        console.log('(Note: These are simplified examples. The actual LLM would provide more sophisticated standardizations)\n');
        
        processedExercises.forEach((exercise, index) => {
            console.log(`${index + 1}. ${exercise.exercise_name}`);
            console.log(`   → ${exercise.standardized_name}`);
            console.log(`   Primary: ${exercise.primary_muscle} → ${exercise.standardized_primary_muscle}`);
            console.log(`   Secondary: ${exercise.secondary_muscle} → ${exercise.standardized_secondary_muscle}`);
            if (exercise.standardization_notes) {
                console.log(`   Notes: ${exercise.standardization_notes}`);
            }
            console.log('');
        });
        
        console.log('=== WHAT THE ACTUAL LLM WOULD DO ===');
        console.log('The real LLM-based system would:');
        console.log('1. Understand exercise variations and provide appropriate standard names');
        console.log('2. Recognize equipment-specific modifications and suggest alternatives');
        console.log('3. Use industry-standard exercise terminology');
        console.log('4. Provide context-aware muscle group mappings');
        console.log('5. Handle complex compound movements and variations');
        console.log('6. Consider exercise difficulty and progression levels');
        console.log('7. Maintain exercise specificity while improving clarity');
        
        console.log('\n=== NEXT STEPS ===');
        console.log('To use the actual LLM-based system:');
        console.log('1. Get an OpenAI API key from https://platform.openai.com/');
        console.log('2. Set it as an environment variable: export OPENAI_API_KEY="your-key"');
        console.log('3. Run: npm run test (to test with 5 exercises)');
        console.log('4. Run: npm run standardize (to process all exercises)');
        
        console.log(`\nDemo completed! Output file: ${outputFile}`);
        
    } catch (error) {
        console.error('Error during demo:', error);
    }
}

// Run the main function
main().catch(console.error);
