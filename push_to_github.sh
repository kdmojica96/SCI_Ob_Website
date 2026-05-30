#!/bin/bash
# Run this from inside the summit-curriculum-instruction folder
# It will push your website to GitHub.
# In Terminal, run:
#   cd "/Users/dr.mo.neo/Documents/Claude/Projects/Danielson Observation Website and Write ups/summit-curriculum-instruction"
#   bash push_to_github.sh

set -e

echo "Setting up git..."
git init
git config user.email "kdmojica@gmail.com"
git config user.name "K Mojica"

echo "Adding files..."
git add .
git commit -m "Initial commit: Summit Curriculum Instruction observation upload portal"

echo "Connecting to GitHub..."
git branch -M main
git remote add origin https://github.com/kdmojica96/SCI_Ob_Website.git

echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "Done! Your site is now at:"
echo "https://github.com/kdmojica96/SCI_Ob_Website"
