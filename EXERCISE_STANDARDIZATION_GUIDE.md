# Exercise Standardization Guide

## Overview
This system uses OpenAI's GPT-4 to standardize exercise names and muscle terminology from the FitCoachTrainer exercise database. It processes exercises in batches of 100 and generates well-known, commonly understood exercise names along with standardized muscle terminology.

## Features

### What the System Does
1. **Standardizes Exercise Names**: Converts complex, equipment-specific names to well-known exercise names
2. **Standardizes Muscle Terminology**: Uses common anatomical terms instead of scientific names
3. **Batch Processing**: Processes exercises in batches of 100 to manage API costs and rate limits
4. **Error Handling**: Gracefully handles API failures and continues processing
5. **CSV Output**: Generates a new CSV file with both original and standardized data

### Example Transformations

| Original Name | Standardized Name | Original Primary Muscle | Standardized Primary Muscle |
|---------------|-------------------|-------------------------|------------------------------|
| "Stability Ball Dead Bug" | "Dead Bug" | "Rectus Abdominis" | "Abs" |
| "Double Dumbbell Z Press" | "Z Press" | "Anterior Deltoids" | "Shoulders" |
| "Barbell Conventional Deadlift" | "Deadlift" | "Latissimus Dorsi" | "Back" |

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up OpenAI API Key
You need an OpenAI API key to use this system. Set it as an environment variable:

```bash
export OPENAI_API_KEY="your-openai-api-key-here"
```

**Note**: Keep your API key secure and never commit it to version control.

### 3. Verify Setup
Run the test script to verify everything is working:

```bash
npm run test
```

This will process the first 5 exercises and show you the results.

## Usage

### Test Run (Recommended First)
Before processing all exercises, run a test with a small batch:

```bash
npm run test
```

This will:
- Process the first 5 exercises
- Show you the before/after comparison
- Create a test output file: `test_standardized_exercises.csv`

### Full Processing
To process all exercises (3,242 total):

```bash
npm run standardize
```

This will:
- Process all exercises in batches of 100
- Show progress for each batch
- Create the final output file: `standardized_exercises.csv`
- Display sample results at the end

## Output Files

### Test Output (`test_standardized_exercises.csv`)
Contains the first 5 exercises with both original and standardized data for verification.

### Full Output (`standardized_exercises.csv`)
Contains all exercises with the following additional columns:
- `standardized_name`: Well-known exercise name
- `standardized_primary_muscle`: Common muscle name
- `standardized_secondary_muscle`: Common secondary muscle name
- `standardization_notes`: Brief explanation of changes

## Cost Estimation

### API Costs
- **GPT-4**: Approximately $0.03 per 1K input tokens + $0.06 per 1K output tokens
- **Estimated cost for 3,242 exercises**: $15-25 USD
- **Test run (5 exercises)**: Less than $0.01 USD

### Rate Limits
- OpenAI has rate limits on API calls
- The system includes 2-second delays between batches
- Processing all exercises takes approximately 2-3 hours

## Customization

### Adjusting Batch Size
In `exercise_standardization.mjs`, modify the batch size:

```javascript
const processedExercises = await processExercisesInBatches(exercises, 50); // Smaller batches
```

### Modifying the Prompt
Edit the `createStandardizationPrompt` function to change how exercises are standardized:

```javascript
function createStandardizationPrompt(exercises) {
    // Modify the guidelines here
    const guidelines = `
    Guidelines:
    - Use widely recognized exercise names
    - Keep names concise and descriptive
    - Use common muscle terminology
    `;
    // ... rest of function
}
```

### Using Different Models
Change the model in the API call:

```javascript
const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // Cheaper but less accurate
    // ... rest of configuration
});
```

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   ```
   Error: OPENAI_API_KEY environment variable is required
   ```
   **Solution**: Set your API key: `export OPENAI_API_KEY="your-key"`

2. **Rate Limit Exceeded**
   ```
   Error: Rate limit exceeded
   ```
   **Solution**: Wait a few minutes and try again, or reduce batch size

3. **JSON Parse Error**
   ```
   Failed to parse LLM response as JSON
   ```
   **Solution**: The LLM response wasn't in the expected format. Check the raw response in the console.

4. **File Not Found**
   ```
   Input file not found: attached_assets/exercises_raw_rows.csv
   ```
   **Solution**: Ensure the CSV file exists in the correct location

### Debugging

1. **Check API Key**: Verify your API key is valid and has sufficient credits
2. **Monitor Console Output**: The script provides detailed progress information
3. **Review Test Results**: Always run the test first to verify the system works
4. **Check Network**: Ensure you have a stable internet connection

## Best Practices

### Before Running Full Processing
1. **Test First**: Always run the test script to verify setup
2. **Check API Credits**: Ensure you have sufficient OpenAI credits
3. **Backup Data**: Keep a backup of your original CSV file
4. **Monitor Costs**: Check your OpenAI usage dashboard

### During Processing
1. **Don't Interrupt**: Let the script run to completion
2. **Monitor Progress**: Watch the console output for any errors
3. **Check Output**: Review the test output before running full processing

### After Processing
1. **Verify Results**: Check the output file for quality
2. **Review Notes**: Read the standardization notes for any unusual changes
3. **Backup Output**: Keep a copy of the standardized data

## Integration with Workout Plans

### Using Standardized Names
The standardized exercise names are designed to be:
- **Client-Friendly**: Easy for clients to understand
- **Trainer-Friendly**: Familiar to most fitness professionals
- **Searchable**: Can be easily found in exercise databases

### Example Usage in Workout Plans
```javascript
// Instead of complex names like:
"Stability Ball Dead Bug with Alternating Heel Taps"

// Use standardized names like:
"Dead Bug"
```

### Muscle Group Targeting
The standardized muscle names help with:
- **Exercise Selection**: Easier to find exercises for specific muscle groups
- **Workout Planning**: Better organization of training sessions
- **Client Communication**: Clearer explanation of exercise benefits

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the console output for error messages
3. Verify your OpenAI API key and credits
4. Test with a smaller batch size

---

*This system is designed to make your exercise database more accessible and user-friendly for workout planning.*
