import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Rate limiting configuration based on Cerebras API limits
const RATE_LIMITS = {
    requests: {
        minute: 30,
        hour: 900,
        day: 14400
    },
    tokens: {
        minute: 60000,
        hour: 1000000,
        day: 1000000
    }
};

// Rate limiting state
let rateLimitState = {
    requests: {
        minute: { count: 0, resetTime: Date.now() + 60000 },
        hour: { count: 0, resetTime: Date.now() + 3600000 },
        day: { count: 0, resetTime: Date.now() + 86400000 }
    },
    tokens: {
        minute: { count: 0, resetTime: Date.now() + 60000 },
        hour: { count: 0, resetTime: Date.now() + 3600000 },
        day: { count: 0, resetTime: Date.now() + 86400000 }
    }
};

// API key management
let currentApiKeyIndex = 0;
const API_KEYS = [
    process.env.VITE_CEREBRAS_API_KEY,
    process.env.CEREBRAS_API_KEY2
].filter(key => key && key !== 'your-cerebras-api-key-here');

// Function to get current API key
function getCurrentApiKey() {
    return API_KEYS[currentApiKeyIndex];
}

// Function to switch to next API key
function switchToNextApiKey() {
    currentApiKeyIndex = (currentApiKeyIndex + 1) % API_KEYS.length;
    console.log(`Switching to API key ${currentApiKeyIndex + 1}/${API_KEYS.length}`);
}

// Function to check and update rate limits
function checkRateLimits(estimatedTokens = 2000) {
    const now = Date.now();
    
    Object.keys(rateLimitState.requests).forEach(period => {
        if (now >= rateLimitState.requests[period].resetTime) {
            rateLimitState.requests[period].count = 0;
            rateLimitState.requests[period].resetTime = now + (period === 'minute' ? 60000 : period === 'hour' ? 3600000 : 86400000);
        }
    });
    
    Object.keys(rateLimitState.tokens).forEach(period => {
        if (now >= rateLimitState.tokens[period].resetTime) {
            rateLimitState.tokens[period].count = 0;
            rateLimitState.tokens[period].resetTime = now + (period === 'minute' ? 60000 : period === 'hour' ? 3600000 : 86400000);
        }
    });
    
    const wouldExceedRequests = Object.keys(rateLimitState.requests).some(period => 
        rateLimitState.requests[period].count + 1 > RATE_LIMITS.requests[period]
    );
    
    const wouldExceedTokens = Object.keys(rateLimitState.tokens).some(period => 
        rateLimitState.tokens[period].count + estimatedTokens > RATE_LIMITS.tokens[period]
    );
    
    if (wouldExceedRequests || wouldExceedTokens) {
        const nextReset = Math.min(
            ...Object.values(rateLimitState.requests).map(r => r.resetTime),
            ...Object.values(rateLimitState.tokens).map(t => t.resetTime)
        );
        
        const waitTime = Math.max(0, nextReset - now);
        return { shouldWait: true, waitTime };
    }
    
    return { shouldWait: false, waitTime: 0 };
}

// Function to update rate limit counters
function updateRateLimits(actualTokens = 2000) {
    Object.keys(rateLimitState.requests).forEach(period => {
        rateLimitState.requests[period].count++;
    });
    
    Object.keys(rateLimitState.tokens).forEach(period => {
        rateLimitState.tokens[period].count += actualTokens;
    });
}

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

// Function to create batches of exercises
function createBatches(exercises, batchSize = 50) {
    const batches = [];
    for (let i = 0; i < exercises.length; i += batchSize) {
        batches.push(exercises.slice(i, i + batchSize));
    }
    return batches;
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
- Keep notes brief and concise

IMPORTANT: Respond ONLY with valid JSON array. No additional text, no explanations outside the JSON. Ensure all quotes are properly escaped and the JSON is complete.

Format:
[
  {
    "original_name": "original exercise name",
    "standardized_name": "well-known exercise name",
    "standardized_primary_muscle": "standardized primary muscle",
    "standardized_secondary_muscle": "standardized secondary muscle",
    "notes": "brief explanation"
  }
]

Exercises to standardize:

${exerciseList}

Respond with ONLY the JSON array.`;
}

// Function to clean and parse JSON response
function cleanAndParseJSON(content) {
    try {
        return JSON.parse(content);
    } catch (error) {
        console.log('Direct JSON parsing failed, attempting to clean response...');
        
        let cleanedContent = content;
        
        const startIndex = cleanedContent.indexOf('[');
        if (startIndex > 0) {
            cleanedContent = cleanedContent.substring(startIndex);
        }
        
        const endIndex = cleanedContent.lastIndexOf(']');
        if (endIndex > 0 && endIndex < cleanedContent.length - 1) {
            cleanedContent = cleanedContent.substring(0, endIndex + 1);
        }
        
        cleanedContent = cleanedContent
            .replace(/\n/g, ' ')
            .replace(/\r/g, '')
            .replace(/\t/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/"\s+"/g, '","')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
        
        try {
            return JSON.parse(cleanedContent);
        } catch (secondError) {
            console.log('Cleaned JSON parsing also failed');
            console.log('Cleaned content:', cleanedContent.substring(0, 500) + '...');
            return null;
        }
    }
}

// Function to call Cerebras API for standardization
async function standardizeExercisesWithCerebras(exercises) {
    const maxApiKeyAttempts = API_KEYS.length;
    let apiKeyAttempts = 0;
    
    while (apiKeyAttempts < maxApiKeyAttempts) {
        try {
            const rateLimitCheck = checkRateLimits(exercises.length * 100);
            if (rateLimitCheck.shouldWait) {
                console.log(`Rate limit approaching. Waiting ${Math.ceil(rateLimitCheck.waitTime / 1000)} seconds...`);
                await new Promise(resolve => setTimeout(resolve, rateLimitCheck.waitTime));
            }
            
            const prompt = createStandardizationPrompt(exercises);
            const currentApiKey = getCurrentApiKey();
            
            console.log(`Sending request to Cerebras API (${exercises.length} exercises) using API key ${currentApiKeyIndex + 1}/${API_KEYS.length}...`);
            
            const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentApiKey}`
                },
                body: JSON.stringify({
                    model: process.env.VITE_CEREBRAS_MODEL || 'qwen-3-235b-a22b-instruct-2507',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a fitness expert specializing in exercise terminology and muscle anatomy. Provide clear, standardized names that are widely understood in the fitness industry. ALWAYS respond with valid JSON only.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 4000
                })
            });

            if (!response.ok) {
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
                    console.log(`Rate limit exceeded. Waiting ${waitTime / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return null;
                } else if (response.status === 401) {
                    console.log(`API key ${currentApiKeyIndex + 1} failed with 401 Unauthorized. Switching to next API key...`);
                    switchToNextApiKey();
                    apiKeyAttempts++;
                    continue;
                } else {
                    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
                }
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            
            const usage = data.usage || {};
            const totalTokens = usage.total_tokens || (exercises.length * 100);
            updateRateLimits(totalTokens);
            
            console.log(`Received response from Cerebras API (${totalTokens} tokens used)`);
            
            const standardizedExercises = cleanAndParseJSON(content);
            if (standardizedExercises) {
                return standardizedExercises;
            } else {
                console.error('Failed to parse LLM response as JSON after cleaning');
                console.log('Raw response preview:', content.substring(0, 300) + '...');
                return null;
            }
        } catch (error) {
            console.error(`Error calling Cerebras API with key ${currentApiKeyIndex + 1}:`, error.message);
            
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                console.log(`Switching to next API key due to authentication error...`);
                switchToNextApiKey();
                apiKeyAttempts++;
                continue;
            }
            
            return null;
        }
    }
    
    console.error(`All ${API_KEYS.length} API keys have failed. Cannot proceed with this batch.`);
    return null;
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

// Main function to continue processing
async function main() {
    if (API_KEYS.length === 0) {
        console.error('Error: No valid API keys found in .env file');
        return;
    }
    
    console.log(`Found ${API_KEYS.length} valid API key(s)`);
    
    const inputFile = 'attached_assets/exercises_raw_rows.csv';
    const processedFile = 'attached_assets/exercises_standardized_cerebras.csv';
    const outputFile = 'attached_assets/exercises_standardized_cerebras_complete.csv';
    
    if (!fs.existsSync(inputFile)) {
        console.error(`Input file not found: ${inputFile}`);
        return;
    }
    
    if (!fs.existsSync(processedFile)) {
        console.error(`Processed file not found: ${processedFile}`);
        return;
    }
    
    console.log('Continuing exercise standardization process...\n');
    console.log(`Model: ${process.env.VITE_CEREBRAS_MODEL || 'qwen-3-235b-a22b-instruct-2507'}\n`);
    
    try {
        // Read all exercises and already processed exercises
        const allExercises = parseCSV(inputFile);
        const processedExercises = parseCSV(processedFile);
        
        console.log(`Total exercises: ${allExercises.length}`);
        console.log(`Already processed: ${processedExercises.length}`);
        
        // Find exercises that haven't been processed yet
        const processedIds = new Set(processedExercises.map(ex => ex.id));
        const remainingExercises = allExercises.filter(ex => !processedIds.has(ex.id));
        
        console.log(`Remaining to process: ${remainingExercises.length}`);
        
        if (remainingExercises.length === 0) {
            console.log('All exercises have been processed!');
            return;
        }
        
        // Process remaining exercises
        const batches = createBatches(remainingExercises, 50);
        const allProcessedExercises = [...processedExercises]; // Start with already processed
        
        console.log(`Processing ${remainingExercises.length} exercises in ${batches.length} batches...`);
        console.log('Rate limiting enabled: 30 requests/minute, 900/hour, 14,400/day\n');
        
        for (let i = 0; i < batches.length; i++) {
            console.log(`Processing batch ${i + 1}/${batches.length} (${batches[i].length} exercises)...`);
            
            let retryCount = 0;
            const maxRetries = 3;
            let standardizedBatch = null;
            
            while (retryCount < maxRetries && !standardizedBatch) {
                standardizedBatch = await standardizeExercisesWithCerebras(batches[i]);
                
                if (!standardizedBatch) {
                    retryCount++;
                    if (retryCount < maxRetries) {
                        const delay = 10000;
                        console.log(`Retry ${retryCount}/${maxRetries} for batch ${i + 1} in ${delay / 1000} seconds...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            
            if (standardizedBatch) {
                const mergedBatch = mergeExerciseData(batches[i], standardizedBatch);
                allProcessedExercises.push(...mergedBatch);
                console.log(`✓ Batch ${i + 1} processed successfully`);
            } else {
                console.log(`✗ Batch ${i + 1} failed after ${maxRetries} retries. Stopping processing.`);
                
                if (allProcessedExercises.length > 0) {
                    const emergencyFile = `attached_assets/exercises_standardized_cerebras_emergency_${Date.now()}.csv`;
                    writeCSV(allProcessedExercises, emergencyFile);
                    console.log(`Emergency save: ${emergencyFile}`);
                }
                
                return;
            }
            
            if (i < batches.length - 1) {
                const delay = 3000;
                console.log(`Waiting ${delay / 1000} seconds before next batch...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            if ((i + 1) % 10 === 0) {
                const progressFile = `attached_assets/exercises_standardized_cerebras_progress_${allProcessedExercises.length}.csv`;
                writeCSV(allProcessedExercises, progressFile);
                console.log(`Progress saved: ${progressFile} (${allProcessedExercises.length} exercises processed)`);
            }
        }
        
        // Write the complete standardized data
        writeCSV(allProcessedExercises, outputFile);
        
        console.log('\n=== PROCESSING COMPLETE ===');
        console.log(`Original exercises: ${allExercises.length}`);
        console.log(`Processed exercises: ${allProcessedExercises.length}`);
        console.log(`Output file: ${outputFile}`);
        
    } catch (error) {
        console.error('Error during processing:', error);
    }
}

// Run the main function
main().catch(console.error);
