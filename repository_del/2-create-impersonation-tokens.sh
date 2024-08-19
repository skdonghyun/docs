#!/bin/bash

GHE_URL="https://your-github-enterprise-url"
LOG_FILE="2_impersonation_token_log.txt"
PAT_FILE="personal_access_tokens.txt"
IMP_TOKEN_FILE="impersonation_tokens.txt"

# Function to log messages
log_message() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$LOG_FILE"
}

# Initialize log file
echo "Impersonation token creation started at $(date '+%Y-%m-%d %H:%M:%S')" > "$LOG_FILE"
echo "Impersonation Tokens - SENSITIVE INFORMATION" > "$IMP_TOKEN_FILE"
echo "DELETE THIS FILE AFTER USE" >> "$IMP_TOKEN_FILE"
echo "----------------------------------------" >> "$IMP_TOKEN_FILE"

# Function to create impersonation token
create_impersonation_token() {
    local username=$1
    local pat=$2
    log_message "Creating impersonation token for user: $username"
    local response=$(curl -s -H "Authorization: token ${pat}" -X POST "${GHE_URL}/api/v3/admin/users/${username}/authorizations" \
        -H "Accept: application/vnd.github.v3+json" \
        -d '{"scopes":["delete_repo"], "note":"Impersonation token for repository deletion"}')
    local token=$(echo $response | jq -r '.token // empty')
    if [ -z "$token" ]; then
        log_message "Failed to create impersonation token for $username"
    else
        log_message "Successfully created impersonation token for $username"
        echo "$username:$token" >> "$IMP_TOKEN_FILE"
    fi
}

# Read PATs and create impersonation tokens
while IFS=: read -r username pat; do
    create_impersonation_token "$username" "$pat"
done < "$PAT_FILE"

log_message "Impersonation token creation completed. Check $IMP_TOKEN_FILE for tokens."
log_message "IMPORTANT: Keep $IMP_TOKEN_FILE secure and delete after use."
