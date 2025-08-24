# Cerebras Exercise Standardization System

## What We Built

I've created a comprehensive exercise standardization system using the **Cerebras API** with the **qwen-3-235b-a22b-instruct-2507** model. This system will process your exercise database and generate well-known, commonly understood exercise names and muscle terminology.

## System Components

### 1. **Main Processing Script** (`exercise_standardization_cerebras.mjs`)
- Processes all 3,242 exercises in batches of 100
- Uses Cerebras API with qwen-3-235b-a22b-instruct-2507 model
- Handles errors gracefully and continues processing
- Saves output to `attached_assets/exercises_standardized_cerebras.csv`

### 2. **Test Script** (`test_cerebras_standardization.mjs`)
- Tests the system with 5 exercises first
- Verifies API connectivity and response format
- Shows before/after comparisons
- Creates test output: `attached_assets/test_standardized_cerebras.csv`

### 3. **Easy Run Script** (`run_cerebras_standardization.sh`)
- Interactive script that guides you through the process
- Checks for API key and input file
- Offers to run test first, then full processing
- User-friendly with clear status messages

### 4. **Setup Guide** (`CEREBRAS_SETUP_GUIDE.md`)
- Complete setup instructions
- Troubleshooting guide
- API key configuration steps

## Quick Start

### Step 1: Set Your API Key
```bash
export CEREBRAS_API_KEY="your-actual-api-key-here"
```

### Step 2: Run the System
```bash
./run_cerebras_standardization.sh
```

This will:
- Check your API key is set
- Offer to run a test first (recommended)
- Process all exercises if test is successful
- Save results to the attached_assets folder

## What the System Does

### Exercise Name Standardization
**Before:**
- "Stability Ball Dead Bug with Alternating Heel Taps"
- "Double Dumbbell Z Press with External Rotation"
- "Barbell Conventional Deadlift with Chains"

**After:**
- "Dead Bug"
- "Z Press"
- "Deadlift"

### Muscle Terminology Standardization
**Before:**
- "Rectus Abdominis" → "Abs"
- "Pectoralis Major" → "Chest"
- "Latissimus Dorsi" → "Back"
- "Biceps Brachii" → "Biceps"

## Output Files

### Test Output (`attached_assets/test_standardized_cerebras.csv`)
- Contains 5 test exercises with both original and standardized data
- Used for verification before full processing

### Full Output (`attached_assets/exercises_standardized_cerebras.csv`)
- Contains all 3,242 exercises with additional columns:
  - `standardized_name`: Well-known exercise name
  - `standardized_primary_muscle`: Common muscle name
  - `standardized_secondary_muscle`: Common secondary muscle name
  - `standardization_notes`: Explanation of changes

## Model Information

- **Provider**: Cerebras
- **Model**: qwen-3-235b-a22b-instruct-2507
- **Capabilities**: High-quality text generation and analysis
- **Use Case**: Exercise name and muscle terminology standardization

## Benefits for Your Workout Plans

### 1. **Client-Friendly Names**
- Easy for clients to understand and remember
- Familiar terminology they can search online
- Clear communication between trainer and client

### 2. **Trainer-Friendly Organization**
- Standardized muscle group targeting
- Easier exercise selection and substitution
- Better workout plan organization

### 3. **Improved Searchability**
- Common exercise names are easier to find
- Better integration with exercise databases
- Simplified exercise library management

## Manual Commands (Alternative)

If you prefer to run commands manually:

### Test the System
```bash
node test_cerebras_standardization.mjs
```

### Process All Exercises
```bash
node exercise_standardization_cerebras.mjs
```

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   ```
   Error: CEREBRAS_API_KEY environment variable is required
   ```
   **Solution**: Set your API key: `export CEREBRAS_API_KEY="your-key"`

2. **API Request Failed**
   ```
   Error calling Cerebras API: API request failed: 401 Unauthorized
   ```
   **Solution**: Check that your API key is correct and has sufficient credits

3. **Rate Limit Exceeded**
   ```
   Error calling Cerebras API: API request failed: 429 Too Many Requests
   ```
   **Solution**: Wait a few minutes and try again

## Integration with Your Workout System

### Database Integration
You can use the standardized names in your workout planning system:
- Replace complex exercise names with standardized versions
- Use standardized muscle names for targeting
- Maintain original names as fallback

### Workout Plan Benefits
- **Clearer Instructions**: Clients understand exercise names
- **Better Organization**: Group by standardized muscle names
- **Easier Substitutions**: Find similar exercises quickly
- **Improved Communication**: Standard terminology across the platform

## Files Created

- `exercise_standardization_cerebras.mjs` - Main processing script
- `test_cerebras_standardization.mjs` - Test script for verification
- `run_cerebras_standardization.sh` - Easy-to-use shell script
- `CEREBRAS_SETUP_GUIDE.md` - Complete setup documentation
- `CEREBRAS_STANDARDIZATION_SUMMARY.md` - This summary document

## Next Steps

1. **Get Cerebras API Key**: Sign up at https://platform.cerebras.com/
2. **Set API Key**: `export CEREBRAS_API_KEY="your-key"`
3. **Run the System**: `./run_cerebras_standardization.sh`
4. **Review Results**: Check the output quality
5. **Integrate with Database**: Use standardized names in your workout planning system

## Summary

This Cerebras-based system will transform your exercise database from complex, equipment-specific names to well-known, commonly understood exercise names. The qwen-3-235b-a22b-instruct-2507 model provides intelligent, context-aware standardizations that maintain exercise specificity while improving clarity and usability.

The system is ready to run once you set your Cerebras API key!

---

*Ready to standardize your exercise database with Cerebras AI!*
