#!/bin/bash

# Initialize an empty array
added_folders=()
updated_folders=()
deleted_folders=()

# Read folder names into the array
while IFS= read -r folder; do
    # Ensure we add unique parent directories only
    # Determine if the canary is added or updated or deleted
    status=${folder:0:1}
    directory=$(echo "$folder" | awk '{print $2}' | cut -d'/' -f2)

    if [[ "$status" == "A" ]]; then
        added_folders+=("$directory")
    elif [[ "$status" == "M" ]]; then
        updated_folders+=("$directory")
    elif [[ "$status" == "D" ]]; then
        deleted_folders+=("$directory")
    fi
done < <(git diff --name-status origin/main | grep canary-js | sed -n 's|^\([AM]\)\s*[^/]*\/\([^/]*\)\/.*|\1 \2|p' | sort -u)

# Start tasks asynchronously
for folder in "${added_folders[@]}"; do
    # Execute task for each folder asynchronously
    (
        echo "Starting task for folder: $folder"
        node ./aws-scripts/deploy-canary.js $folder
        echo "Task for folder $folder completed"
    ) &
done

for folder in "${updated_folders[@]}"; do
    # Execute task for each folder asynchronously
    (
        echo "Starting task for folder: $folder"
        node ./aws-scripts/update-canary.js $folder
        echo "Task for folder $folder completed"
    ) &
done

for folder in "${deleted_folders[@]}"; do
    # Execute task for each folder asynchronously
    (
        echo "Starting task for folder: $folder"
        node ./aws-scripts/delete-canary.js $folder
        echo "Task for folder $folder completed"
    ) &
done

# Wait for all tasks to finish
wait

echo "All tasks completed"
