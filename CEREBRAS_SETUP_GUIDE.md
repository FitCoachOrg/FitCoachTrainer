# Cerebras API Setup Guide

## Overview
This guide will help you set up the Cerebras API key to use with the exercise standardization system.

## Step 1: Get Cerebras API Key

1. **Visit Cerebras Platform**: Go to https://platform.cerebras.com/
2. **Sign Up/Login**: Create an account or log in to your existing account
3. **Get API Key**: Navigate to the API section and generate a new API key
4. **Copy the Key**: Save your API key securely

## Step 2: Create .env File

Create a `.env` file in the project root directory with your API key:

```bash
# Create the .env file
touch .env
```

Then add your API key to the `.env` file:

```
CEREBRAS_API_KEY=your-actual-api-key-here
```

**Replace "your-actual-api-key-here" with your real Cerebras API key.**

**Note**: You can also copy the template from `env_template.txt` and rename it to `.env`.

## Step 3: Verify Setup

Test that the .env file is set up correctly by running:

```bash
node test_cerebras_standardization.mjs
```

This will check if the API key is loaded correctly.

## Step 4: Run the Test

Test the system with a small batch of exercises:

```bash
node test_cerebras_standardization.mjs
```

This will process 5 exercises and show you the results.

## Step 5: Run Full Processing

If the test looks good, run the full processing:

```bash
node exercise_standardization_cerebras.mjs
```

This will process all 3,242 exercises and save the result to:
`attached_assets/exercises_standardized_cerebras.csv`

## Alternative: Use the Easy Run Script

You can also use the interactive script:

```bash
./run_cerebras_standardization.sh
```

This will guide you through the entire process.

## Troubleshooting

### .env File Not Found
```
Error: .env file not found
```
**Solution**: Create a `.env` file with your API key.

### API Key Not Found in .env
```
Error: CEREBRAS_API_KEY not found in .env file
```
**Solution**: Make sure your `.env` file contains the correct API key.

### API Request Failed
```
Error calling Cerebras API: API request failed: 401 Unauthorized
```
**Solution**: Check that your API key is correct and has sufficient credits.

### Rate Limit Exceeded
```
Error calling Cerebras API: API request failed: 429 Too Many Requests
```
**Solution**: Wait a few minutes and try again, or reduce the batch size.

## Model Information

- **Model**: qwen-3-235b-a22b-instruct-2507
- **Provider**: Cerebras
- **Capabilities**: High-quality text generation and analysis
- **Use Case**: Exercise name and muscle terminology standardization

## Expected Output

The system will create a CSV file with these additional columns:
- `standardized_name`: Well-known exercise name
- `standardized_primary_muscle`: Common muscle name
- `standardized_secondary_muscle`: Common secondary muscle name
- `standardization_notes`: Explanation of changes

## Example Transformations

| Original Name | Standardized Name | Primary Muscle | Standardized Primary |
|---------------|-------------------|----------------|---------------------|
| Stability Ball Dead Bug | Dead Bug | Rectus Abdominis | Abs |
| Bodyweight Glute Bridge | Glute Bridge | Gluteus Maximus | Glutes |
| Barbell Conventional Deadlift | Deadlift | Latissimus Dorsi | Back |

## Next Steps

1. Set your Cerebras API key in the `.env` file
2. Run the test script
3. Review the results
4. Run the full processing if satisfied
5. Use the standardized exercise names in your workout planning system

---

*Ready to standardize your exercise database with Cerebras AI!*
