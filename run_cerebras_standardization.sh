#!/bin/bash

# Exercise Standardization with Cerebras API
# This script runs the full exercise standardization process

echo "=========================================="
echo "Exercise Standardization with Cerebras API"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo ""
    echo "Please create a .env file with your Cerebras API key:"
    echo "CEREBRAS_API_KEY=your-cerebras-api-key-here"
    echo ""
    echo "You can copy the template from env_template.txt"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check if input file exists
if [ ! -f "attached_assets/exercises_raw_rows.csv" ]; then
    echo "❌ Error: Input file not found: attached_assets/exercises_raw_rows.csv"
    exit 1
fi

echo "✅ Input file found: attached_assets/exercises_raw_rows.csv"
echo ""

# Ask user if they want to run test first
echo "Do you want to run a test with 5 exercises first? (y/n)"
read -r run_test

if [[ $run_test =~ ^[Yy]$ ]]; then
    echo ""
    echo "Running test with 5 exercises..."
    echo ""
    node test_cerebras_standardization.mjs
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Test completed successfully!"
        echo ""
        echo "Do you want to proceed with full processing? (y/n)"
        read -r run_full
        
        if [[ $run_full =~ ^[Yy]$ ]]; then
            echo ""
            echo "Starting full processing..."
            echo ""
            node exercise_standardization_cerebras.mjs
        else
            echo "Full processing cancelled."
        fi
    else
        echo ""
        echo "❌ Test failed. Please check the error messages above."
        exit 1
    fi
else
    echo ""
    echo "Starting full processing directly..."
    echo ""
    node exercise_standardization_cerebras.mjs
fi

echo ""
echo "=========================================="
echo "Processing complete!"
echo "=========================================="
echo ""
echo "Output files:"
echo "- Test results: attached_assets/test_standardized_cerebras.csv"
echo "- Full results: attached_assets/exercises_standardized_cerebras.csv"
echo ""
