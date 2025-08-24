import fs from 'fs';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

// Function to create prompt for LLM
function createStandardizationPrompt(exercises) {
    const exerciseList = exercises.map((exercise, index) => {
        return `${index + 1}. Original Name: "${exercise.exercise_name}"
   Primary Muscle: "${exercise.primary_muscle}"
   Secondary Muscle: "${exercise.secondary_muscle}"
   Equipment: "${exercise.equipment}"
   Category: "${exercise.category}"`;
    }).join('\n\n');

    return `You are a fitness expert tasked with standardizing exercise names and muscle terminology. For each exercise below, provide:

1. A well-known, commonly understood exercise name
2. Standardized primary muscle name (use common anatomical terms)
3. Standardized secondary muscle name (use common anatomical terms)

Guidelines:
- Use widely recognized exercise names that trainers and clients would understand
- For muscle names, use standard anatomical terminology (e.g., "Biceps" instead of "Biceps Brachii", "Chest" instead of "Pectoralis Major")
- Keep the exercise name descriptive but concise
- Maintain the exercise's core movement pattern
- If the exercise is very specific/unique, provide the closest well-known equivalent

Please respond in JSON format with this structure:
[
  {
    "original_name": "original exercise name",
    "standardized_name": "well-known exercise name",
    "standardized_primary_muscle": "standardized primary muscle",
    "standardized_secondary_muscle": "standardized secondary muscle",
    "notes": "brief explanation of changes if needed"
  }
]

Exercises to standardize:

${exerciseList}

Respond only with the JSON array, no additional text.`;
}

// Function to call LLM for standardization
async function standardizeExercisesWithLLM(exercises) {
    try {
        const prompt = createStandardizationPrompt(exercises);
        
        console.log('Sending request to OpenAI...');
        
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a fitness expert specializing in exercise terminology and muscle anatomy. Provide clear, standardized names that are widely understood in the fitness industry."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        const content = response.choices[0].message.content;
        console.log('Received response from OpenAI');
        
        // Try to parse JSON response
        try {
            const standardizedExercises = JSON.parse(content);
            return standardizedExercises;
        } catch (parseError) {
            console.error('Failed to parse LLM response as JSON:', parseError);
            console.log('Raw response:', content);
            return null;
        }
    } catch (error) {
        console.error('Error calling LLM:', error);
        return null;
    }
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
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
        console.error('Error: OPENAI_API_KEY environment variable is required');
        console.log('Please set your OpenAI API key: export OPENAI_API_KEY="your-api-key-here"');
        return;
    }
    
    const inputFile = 'attached_assets/exercises_raw_rows.csv';
    const outputFile = 'test_standardized_exercises.csv';
    
    if (!fs.existsSync(inputFile)) {
        console.error(`Input file not found: ${inputFile}`);
        return;
    }
    
    console.log('Starting test exercise standardization process...\n');
    
    try {
        // Read and parse the CSV file
        const allExercises = parseCSV(inputFile);
        console.log(`Loaded ${allExercises.length} exercises from CSV file`);
        
        // Take only first 5 exercises for testing
        const testExercises = allExercises.slice(0, 5);
        console.log(`Testing with ${testExercises.length} exercises...`);
        
        // Show the test exercises
        console.log('\n=== TEST EXERCISES ===');
        testExercises.forEach((exercise, index) => {
            console.log(`${index + 1}. ${exercise.exercise_name}`);
            console.log(`   Primary: ${exercise.primary_muscle}`);
            console.log(`   Secondary: ${exercise.secondary_muscle}`);
            console.log(`   Equipment: ${exercise.equipment}`);
            console.log('');
        });
        
        // Process exercises with LLM
        const standardizedExercises = await standardizeExercisesWithLLM(testExercises);
        
        if (standardizedExercises) {
            // Merge the data
            const processedExercises = mergeExerciseData(testExercises, standardizedExercises);
            
            // Write the standardized data to a new CSV file
            writeCSV(processedExercises, outputFile);
            
            console.log('\n=== STANDARDIZATION RESULTS ===');
            processedExercises.forEach((exercise, index) => {
                console.log(`\n${index + 1}. ${exercise.exercise_name}`);
                console.log(`   → ${exercise.standardized_name}`);
                console.log(`   Primary: ${exercise.primary_muscle} → ${exercise.standardized_primary_muscle}`);
                console.log(`   Secondary: ${exercise.secondary_muscle} → ${exercise.standardized_secondary_muscle}`);
                if (exercise.standardization_notes) {
                    console.log(`   Notes: ${exercise.standardization_notes}`);
                }
            });
            
            console.log(`\nTest completed successfully! Output file: ${outputFile}`);
        } else {
            console.log('Failed to standardize exercises');
        }
        
    } catch (error) {
        console.error('Error during processing:', error);
    }
}

// Run the main function
main().catch(console.error);
