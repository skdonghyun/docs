#!/bin/bash

GHE_URL="https://your-github-enterprise-url"
LOG_FILE="3_repository_list_log.txt"
IMP_TOKEN_FILE="impersonation_tokens.txt"
REPO_LIST_FILE="repository_list.txt"

# Function to log messages
log_message() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$LOG_FILE"
}

# Initialize log file
echo "Repository listing started at $(date '+%Y-%m-%d %H:%M:%S')" > "$LOG_FILE"
echo "Repository List" > "$REPO_LIST_FILE"
echo "----------------------------------------" >> "$REPO_LIST_FILE"

# Function to get user repositories
get_user_repos() {
    local username=$1
    local token=$2
    local page=1
    log_message "Fetching repositories for user: $username"
    while true; do
        local response=$(curl -s -H "Authorization: token ${token}" "${GHE_URL}/api/v3/users/${username}/repos?per_page=100&page=${page}" \
            -H "Accept: application/vnd.github.v3+json")
        local repos=$(echo $response | jq -r '.[].full_name')
        if [ -z "$repos" ]; then
            break
        fi
        echo "$repos" >> "$REPO_LIST_FILE"
        ((page++))
    done
    log_message "Completed fetching repositories for $username"
}

# Read impersonation tokens and list repositories
while IFS=: read -r username token; do
    get_user_repos "$username" "$token"
done < "$IMP_TOKEN_FILE"

log_message "Repository listing completed. Check $REPO_LIST_FILE for the list."
log_message "Review $REPO_LIST_FILE before proceeding to deletion."
