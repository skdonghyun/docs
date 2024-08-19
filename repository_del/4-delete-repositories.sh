#!/bin/bash

GHE_URL="https://your-github-enterprise-url"
LOG_FILE="4_repository_deletion_log.txt"
IMP_TOKEN_FILE="impersonation_tokens.txt"
REPO_LIST_FILE="repository_list.txt"

# Function to log messages
log_message() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$LOG_FILE"
}

# Initialize log file
echo "Repository deletion started at $(date '+%Y-%m-%d %H:%M:%S')" > "$LOG_FILE"

# Function to delete repository
delete_repo() {
    local repo=$1
    local token=$2
    log_message "Deleting repository: $repo"
    local response=$(curl -s -H "Authorization: token ${token}" -X DELETE "${GHE_URL}/api/v3/repos/${repo}" \
        -H "Accept: application/vnd.github.v3+json")
    if [ -z "$response" ]; then
        log_message "Successfully deleted repository: $repo"
    else
        log_message "Failed to delete repository: $repo. Response: $response"
    fi
}

# Read impersonation tokens
declare -A tokens
while IFS=: read -r username token; do
    tokens[$username]=$token
done < "$IMP_TOKEN_FILE"

# Read repository list and delete repositories
while read -r repo; do
    username=$(echo $repo | cut -d'/' -f1)
    token=${tokens[$username]}
    if [ -n "$token" ]; then
        delete_repo "$repo" "$token"
    else
        log_message "No token found for $username. Skipping $repo"
    fi
    sleep 1  # Avoid rate limiting
done < "$REPO_LIST_FILE"

log_message "Repository deletion completed. Check $LOG_FILE for details."
log_message "IMPORTANT: Review $LOG_FILE to ensure all operations were successful."
log_message "Remember to clean up all sensitive files (PAT_FILE, IMP_TOKEN_FILE, REPO_LIST_FILE)."
