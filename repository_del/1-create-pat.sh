#!/bin/bash

GHE_URL="https://your-github-enterprise-url"
ADMIN_USERNAME="admin_username"
ADMIN_PASSWORD="admin_password"
LOG_FILE="1_pat_creation_log.txt"
PAT_FILE="personal_access_tokens.txt"

# Function to log messages
log_message() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$LOG_FILE"
}

# Initialize log file
echo "PAT creation started at $(date '+%Y-%m-%d %H:%M:%S')" > "$LOG_FILE"
echo "Personal Access Tokens - SENSITIVE INFORMATION" > "$PAT_FILE"
echo "DELETE THIS FILE AFTER USE" >> "$PAT_FILE"
echo "----------------------------------------" >> "$PAT_FILE"

# Function to create PAT for a user
create_pat() {
    local username=$1
    log_message "Creating PAT for user: $username"
    local response=$(curl -s -u "${ADMIN_USERNAME}:${ADMIN_PASSWORD}" -X POST "${GHE_URL}/api/v3/admin/users/${username}/authorizations" \
        -H "Accept: application/vnd.github.v3+json" \
        -d '{"scopes":["admin:org", "delete_repo", "user"], "note":"Temporary PAT for impersonation"}')
    local token=$(echo $response | jq -r '.token // empty')
    if [ -z "$token" ]; then
        log_message "Failed to create PAT for $username"
    else
        log_message "Successfully created PAT for $username"
        echo "$username:$token" >> "$PAT_FILE"
    fi
}

# Get all users
users=$(curl -s -u "${ADMIN_USERNAME}:${ADMIN_PASSWORD}" "${GHE_URL}/api/v3/users" \
    -H "Accept: application/vnd.github.v3+json" | jq -r '.[].login')

# Create PAT for each user
for user in $users; do
    create_pat $user
done

log_message "PAT creation completed. Check $PAT_FILE for tokens."
log_message "IMPORTANT: Keep $PAT_FILE secure and delete after use."
