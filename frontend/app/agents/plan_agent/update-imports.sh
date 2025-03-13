#!/bin/bash

# This script helps update import paths in the app directory
# It replaces @/ imports with relative paths

# Function to calculate the relative path
calculate_relative_path() {
  local file_path=$1
  local import_path=$2
  
  # Count the number of directories in the file path (excluding the filename)
  local dir_count=$(echo "$file_path" | grep -o "/" | wc -l)
  
  # Generate the appropriate number of "../" based on directory depth
  local relative_prefix=""
  for ((i=0; i<dir_count-3; i++)); do
    relative_prefix="../$relative_prefix"
  done
  
  echo "$relative_prefix$import_path"
}

# Find all TypeScript and TSX files in the app directory
find apps/web/src/app -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  echo "Processing $file"
  
  # Check if the file contains @/ imports
  if grep -q "from \"@/" "$file"; then
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Process each line
    while IFS= read -r line; do
      if [[ $line =~ from\ \"@/([^\"]+)\" ]]; then
        # Extract the import path
        import_path="${BASH_REMATCH[1]}"
        
        # Calculate the relative path
        rel_path=$(calculate_relative_path "$file" "$import_path")
        
        # Replace the import path with the relative path
        echo "$line" | sed "s|from \"@/[^\"]*\"|from \"$rel_path\"|" >> "$temp_file"
      else
        # Keep the line as is
        echo "$line" >> "$temp_file"
      fi
    done < "$file"
    
    # Replace the original file with the modified one
    mv "$temp_file" "$file"
  fi
done

echo "Import paths updated successfully!" 