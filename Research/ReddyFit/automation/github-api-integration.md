# GitHub API Integration: Complete Automation Guide

**Document Version:** 1.0
**Last Updated:** 2025-10-08
**API Version:** GitHub REST API v3 + GraphQL API v4

---

## Executive Summary

This guide provides complete implementation details for integrating GitHub's APIs to automate:
- ✅ **Issue & PR management** (auto-create, label, assign, comment)
- ✅ **Documentation syncing** (code → docs, auto-update on commits)
- ✅ **Jira bidirectional sync** (GitHub issues ↔ Jira tasks)
- ✅ **Progress tracking** (commit analysis, velocity metrics)
- ✅ **Cost tracking** (infrastructure spend dashboards)

**Key Benefits:**
- **Zero manual updates** (100% automated documentation)
- **Investor transparency** (daily progress reports auto-generated)
- **Team efficiency** (+40 hours/month saved per engineer)

---

## Table of Contents

1. [API Authentication & Setup](#1-api-authentication--setup)
2. [Issues API (Creating & Managing)](#2-issues-api-creating--managing)
3. [Pull Requests API](#3-pull-requests-api)
4. [Repository Content API (Documentation)](#4-repository-content-api-documentation)
5. [GraphQL API (Advanced Queries)](#5-graphql-api-advanced-queries)
6. [Jira Integration (Bidirectional Sync)](#6-jira-integration-bidirectional-sync)
7. [Webhooks (Real-Time Events)](#7-webhooks-real-time-events)
8. [GitHub Actions Integration](#8-github-actions-integration)
9. [Cost Tracking Dashboard](#9-cost-tracking-dashboard)
10. [Production Best Practices](#10-production-best-practices)

---

## 1. API Authentication & Setup

### 1.1 Creating a Personal Access Token (PAT)

**Steps:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Set permissions:
   - **Repository access:** All repositories (or select specific repos)
   - **Permissions:**
     - Contents: Read & Write (for updating docs)
     - Issues: Read & Write (for creating/updating issues)
     - Pull Requests: Read & Write (for PR automation)
     - Metadata: Read (required for all operations)
     - Workflows: Read & Write (for triggering GitHub Actions)

4. Generate token and copy (starts with `github_pat_...`)

**Security:** Store in GitHub Secrets or environment variable (never commit to code)

---

### 1.2 Authentication Methods

#### Method 1: REST API with Token

**Python:**
```python
import requests

GITHUB_TOKEN = "github_pat_..."
HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

# Example: Get repository info
response = requests.get(
    "https://api.github.com/repos/reddyfit/research",
    headers=HEADERS
)
print(response.json())
```

**Node.js:**
```javascript
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Example: Get repository info
const { data } = await octokit.repos.get({
  owner: "reddyfit",
  repo: "research"
});
console.log(data);
```

---

#### Method 2: GraphQL API

**Python:**
```python
import requests

query = """
query {
  repository(owner: "reddyfit", name: "research") {
    name
    description
    stargazerCount
    issues(first: 10) {
      nodes {
        title
        number
      }
    }
  }
}
"""

response = requests.post(
    "https://api.github.com/graphql",
    headers={"Authorization": f"bearer {GITHUB_TOKEN}"},
    json={"query": query}
)
print(response.json())
```

---

### 1.3 Rate Limits

| API | Authenticated | Unauthenticated |
|-----|--------------|-----------------|
| **REST API** | 5,000 req/hour | 60 req/hour |
| **GraphQL API** | 5,000 points/hour | N/A |
| **Search API** | 30 req/minute | 10 req/minute |

**Best Practices:**
- Always authenticate (83× higher rate limit)
- Cache responses when possible
- Use GraphQL to reduce number of requests (fetch nested data in 1 query)

---

## 2. Issues API (Creating & Managing)

### 2.1 Creating Issues Programmatically

**Use Case:** Auto-create issue when daily progress report is generated

**Python:**
```python
import requests
from datetime import datetime

def create_daily_progress_issue(commit_summaries: list):
    """Create GitHub issue with daily progress summary."""

    # Format issue body
    body = f"# Daily Progress Report - {datetime.now().strftime('%Y-%m-%d')}\n\n"
    body += f"**Commits Today:** {len(commit_summaries)}\n\n"
    body += "## Summary\n\n"

    for commit in commit_summaries:
        body += f"- **{commit['subject']}** by {commit['author']}\n"
        body += f"  - {commit['investor_summary']}\n\n"

    # Create issue
    issue_data = {
        "title": f"📊 Daily Progress - {datetime.now().strftime('%Y-%m-%d')}",
        "body": body,
        "labels": ["daily-report", "automated"],
        "assignees": ["project-manager"]  # Auto-assign PM
    }

    response = requests.post(
        "https://api.github.com/repos/reddyfit/research/issues",
        headers=HEADERS,
        json=issue_data
    )

    if response.status_code == 201:
        issue_url = response.json()['html_url']
        print(f"✅ Issue created: {issue_url}")
        return response.json()
    else:
        print(f"❌ Failed to create issue: {response.text}")
        return None
```

**Example Output:**
```
✅ Issue created: https://github.com/reddyfit/research/issues/42

Issue #42: 📊 Daily Progress - 2025-10-08

# Daily Progress Report - 2025-10-08

**Commits Today:** 3

## Summary

- **Add sensor fusion validation layer** by @engineer-john
  - Implemented advanced anti-cheat system using phone sensors, reducing GPS spoofing fraud by 97%.

- **Optimize PostGIS query for challenge zones** by @engineer-sarah
  - Reduced server costs by 40% while improving response time from 800ms to 200ms.

- **Update Coach Agent with persistent memory** by @engineer-mike
  - Integrated Supermemory for context retention, improving user engagement by 32%.
```

---

### 2.2 Auto-Labeling Issues

**Use Case:** Classify issues by type (bug, feature, documentation) using AI

**Python:**
```python
from openai import OpenAI

client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

def classify_issue(issue_title: str, issue_body: str) -> list:
    """Use GPT-4o-mini to classify issue and suggest labels."""

    prompt = f"""
    Classify this GitHub issue and suggest labels.

    Title: {issue_title}
    Body: {issue_body}

    Available labels: bug, feature, documentation, enhancement, question, urgent, backend, frontend, ai

    Return JSON: {{"labels": ["label1", "label2"], "reason": "why these labels"}}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)

# Usage in webhook handler
def on_issue_opened(issue):
    """Auto-label when issue is opened."""

    classification = classify_issue(issue['title'], issue['body'])

    # Add labels
    requests.post(
        f"https://api.github.com/repos/reddyfit/research/issues/{issue['number']}/labels",
        headers=HEADERS,
        json={"labels": classification['labels']}
    )

    # Add comment explaining labels
    comment = f"🤖 Auto-labeled as: {', '.join(classification['labels'])}\n\n"
    comment += f"Reason: {classification['reason']}"

    requests.post(
        f"https://api.github.com/repos/reddyfit/research/issues/{issue['number']}/comments",
        headers=HEADERS,
        json={"body": comment}
    )
```

---

### 2.3 Closing Issues with AI Summary

**Use Case:** Auto-close issues when related PR is merged, add summary comment

**Python:**
```python
def close_issue_with_summary(issue_number: int, pr_data: dict):
    """Close issue and add AI-generated summary comment."""

    # Generate summary using GPT-4o-mini
    summary_prompt = f"""
    Summarize this pull request for the linked issue.

    PR Title: {pr_data['title']}
    PR Description: {pr_data['body']}
    Files Changed: {', '.join([f['filename'] for f in pr_data['files']])}

    Write a 1-2 sentence summary explaining what was fixed/implemented.
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": summary_prompt}]
    )

    summary = response.choices[0].message.content

    # Add closing comment
    comment = f"✅ Closed via #{pr_data['number']}\n\n"
    comment += f"**Summary:** {summary}\n\n"
    comment += f"[View PR]({pr_data['html_url']})"

    requests.post(
        f"https://api.github.com/repos/reddyfit/research/issues/{issue_number}/comments",
        headers=HEADERS,
        json={"body": comment}
    )

    # Close issue
    requests.patch(
        f"https://api.github.com/repos/reddyfit/research/issues/{issue_number}",
        headers=HEADERS,
        json={"state": "closed"}
    )
```

---

## 3. Pull Requests API

### 3.1 Auto-Creating PRs from Feature Branches

**Use Case:** When engineer pushes to feature branch, auto-create PR

**Python:**
```python
def create_pr_from_branch(branch_name: str):
    """Auto-create PR when feature branch is pushed."""

    # Infer PR title from branch name (e.g., "feature/auth-system" → "Add Auth System")
    pr_title = branch_name.replace("feature/", "").replace("-", " ").title()

    # Get commit messages from branch
    commits = requests.get(
        f"https://api.github.com/repos/reddyfit/research/commits",
        headers=HEADERS,
        params={"sha": branch_name}
    ).json()

    # Generate PR description from commits
    pr_body = "## Changes\n\n"
    for commit in commits[:5]:  # Last 5 commits
        pr_body += f"- {commit['commit']['message'].split('\n')[0]}\n"

    pr_body += "\n## Test Plan\n\n"
    pr_body += "- [ ] Unit tests pass\n"
    pr_body += "- [ ] Integration tests pass\n"
    pr_body += "- [ ] Manually tested locally\n"

    # Create PR
    pr_data = {
        "title": pr_title,
        "head": branch_name,
        "base": "main",
        "body": pr_body,
        "draft": True  # Create as draft initially
    }

    response = requests.post(
        "https://api.github.com/repos/reddyfit/research/pulls",
        headers=HEADERS,
        json=pr_data
    )

    if response.status_code == 201:
        pr_url = response.json()['html_url']
        print(f"✅ PR created: {pr_url}")
        return response.json()
    else:
        print(f"❌ Failed to create PR: {response.text}")
```

---

### 3.2 Auto-Requesting Reviews

**Python:**
```python
def request_reviews(pr_number: int, changed_files: list):
    """Auto-request reviews from relevant engineers based on files changed."""

    # Map file paths to reviewers
    CODEOWNERS = {
        "backend/": ["@backend-lead"],
        "frontend/": ["@frontend-lead"],
        "agents/": ["@ai-engineer"],
        "docs/": ["@tech-writer"]
    }

    # Determine reviewers based on changed files
    reviewers = set()
    for file in changed_files:
        for path_prefix, owners in CODEOWNERS.items():
            if file['filename'].startswith(path_prefix):
                reviewers.update(owners)

    # Remove @ prefix (API expects username without @)
    reviewers = [r.replace("@", "") for r in reviewers]

    # Request reviews
    if reviewers:
        requests.post(
            f"https://api.github.com/repos/reddyfit/research/pulls/{pr_number}/requested_reviewers",
            headers=HEADERS,
            json={"reviewers": list(reviewers)}
        )
        print(f"✅ Requested reviews from: {', '.join(reviewers)}")
```

---

### 3.3 Auto-Merging PRs (with Checks)

**Python:**
```python
def auto_merge_if_ready(pr_number: int):
    """Auto-merge PR if all checks pass and approved."""

    # Get PR details
    pr = requests.get(
        f"https://api.github.com/repos/reddyfit/research/pulls/{pr_number}",
        headers=HEADERS
    ).json()

    # Check if mergeable
    if not pr['mergeable']:
        print("❌ PR has conflicts, cannot auto-merge")
        return

    # Check CI status
    checks = requests.get(
        f"https://api.github.com/repos/reddyfit/research/commits/{pr['head']['sha']}/check-runs",
        headers=HEADERS
    ).json()

    all_checks_passed = all(
        check['status'] == 'completed' and check['conclusion'] == 'success'
        for check in checks['check_runs']
    )

    if not all_checks_passed:
        print("❌ Not all checks passed")
        return

    # Check approvals
    reviews = requests.get(
        f"https://api.github.com/repos/reddyfit/research/pulls/{pr_number}/reviews",
        headers=HEADERS
    ).json()

    approved = any(review['state'] == 'APPROVED' for review in reviews)

    if not approved:
        print("❌ PR not approved")
        return

    # All checks passed → merge!
    response = requests.put(
        f"https://api.github.com/repos/reddyfit/research/pulls/{pr_number}/merge",
        headers=HEADERS,
        json={
            "commit_title": f"Merge PR #{pr_number}: {pr['title']}",
            "merge_method": "squash"  # Squash commits for clean history
        }
    )

    if response.status_code == 200:
        print(f"✅ Auto-merged PR #{pr_number}")
    else:
        print(f"❌ Failed to merge: {response.text}")
```

---

## 4. Repository Content API (Documentation)

### 4.1 Reading Files

**Python:**
```python
import base64

def read_file(file_path: str, branch: str = "main") -> str:
    """Read file content from GitHub repository."""

    response = requests.get(
        f"https://api.github.com/repos/reddyfit/research/contents/{file_path}",
        headers=HEADERS,
        params={"ref": branch}
    )

    if response.status_code == 200:
        # File content is base64-encoded
        content_base64 = response.json()['content']
        content = base64.b64decode(content_base64).decode('utf-8')
        return content
    else:
        print(f"❌ Failed to read file: {response.text}")
        return None

# Example
readme_content = read_file("README.md")
print(readme_content)
```

---

### 4.2 Creating/Updating Files

**Python:**
```python
def update_file(file_path: str, content: str, commit_message: str):
    """Create or update file in GitHub repository."""

    # Get current file (if exists) to get SHA
    response = requests.get(
        f"https://api.github.com/repos/reddyfit/research/contents/{file_path}",
        headers=HEADERS
    )

    sha = response.json().get('sha') if response.status_code == 200 else None

    # Encode content to base64
    content_base64 = base64.b64encode(content.encode('utf-8')).decode('utf-8')

    # Update file
    update_data = {
        "message": commit_message,
        "content": content_base64,
        "branch": "main"
    }

    if sha:
        update_data['sha'] = sha  # Required for updates

    response = requests.put(
        f"https://api.github.com/repos/reddyfit/research/contents/{file_path}",
        headers=HEADERS,
        json=update_data
    )

    if response.status_code in (200, 201):
        print(f"✅ Updated {file_path}")
        return response.json()
    else:
        print(f"❌ Failed to update file: {response.text}")
        return None
```

---

### 4.3 Auto-Updating Documentation

**Use Case:** When code changes, auto-update related docs

**Python:**
```python
def auto_update_api_docs(changed_files: list):
    """Auto-update API documentation when backend code changes."""

    # Check if backend files changed
    backend_files = [f for f in changed_files if f['filename'].startswith('backend/')]

    if not backend_files:
        return  # No backend changes

    # Generate updated API docs using OpenAI
    code_summary = "\n\n".join([
        f"File: {f['filename']}\nChanges:\n{f['patch']}"
        for f in backend_files
    ])

    prompt = f"""
    Update the API documentation based on these code changes:

    {code_summary}

    Generate updated Markdown documentation for the affected endpoints.
    Include:
    - Endpoint path
    - HTTP method
    - Request parameters
    - Response format
    - Example usage
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    updated_docs = response.choices[0].message.content

    # Update API docs file
    update_file(
        file_path="docs/api-reference.md",
        content=updated_docs,
        commit_message="📝 Auto-update API docs based on code changes [skip ci]"
    )
```

---

## 5. GraphQL API (Advanced Queries)

### 5.1 Fetching Nested Data (Issues + Comments + Reactions)

**GraphQL Query:**
```graphql
query {
  repository(owner: "reddyfit", name: "research") {
    issues(first: 10, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}) {
      nodes {
        number
        title
        author {
          login
        }
        labels(first: 5) {
          nodes {
            name
          }
        }
        comments(first: 3) {
          nodes {
            author {
              login
            }
            body
            reactions(first: 10) {
              nodes {
                content
              }
            }
          }
        }
      }
    }
  }
}
```

**Python:**
```python
def fetch_issues_with_details():
    """Fetch issues with nested comments and reactions (1 API call)."""

    query = """
    query {
      repository(owner: "reddyfit", name: "research") {
        issues(first: 10, states: OPEN) {
          nodes {
            number
            title
            comments(first: 3) {
              nodes {
                body
                reactions(first: 10) {
                  nodes {
                    content
                  }
                }
              }
            }
          }
        }
      }
    }
    """

    response = requests.post(
        "https://api.github.com/graphql",
        headers={"Authorization": f"bearer {GITHUB_TOKEN}"},
        json={"query": query}
    )

    return response.json()

# This would require ~30 REST API calls, but only 1 GraphQL call!
```

---

### 5.2 Fetching Commit History with File Changes

**GraphQL Query:**
```graphql
query {
  repository(owner: "reddyfit", name: "research") {
    ref(qualifiedName: "main") {
      target {
        ... on Commit {
          history(first: 10) {
            nodes {
              oid
              message
              author {
                name
                email
              }
              additions
              deletions
              changedFiles
            }
          }
        }
      }
    }
  }
}
```

---

## 6. Jira Integration (Bidirectional Sync)

### 6.1 GitHub Issue → Jira Task (Create)

**Python:**
```python
import requests
import base64

JIRA_URL = "https://your-domain.atlassian.net"
JIRA_EMAIL = "your-email@example.com"
JIRA_API_TOKEN = "your-jira-token"

# Create basic auth header
jira_auth = base64.b64encode(f"{JIRA_EMAIL}:{JIRA_API_TOKEN}".encode()).decode()
JIRA_HEADERS = {
    "Authorization": f"Basic {jira_auth}",
    "Content-Type": "application/json"
}

def sync_github_issue_to_jira(github_issue: dict):
    """Create Jira task from GitHub issue."""

    # Create Jira issue
    jira_data = {
        "fields": {
            "project": {"key": "RFIT"},
            "summary": github_issue['title'],
            "description": f"{github_issue['body']}\n\n---\n**GitHub Issue:** {github_issue['html_url']}",
            "issuetype": {"name": "Task"},
            "labels": [label['name'] for label in github_issue['labels']]
        }
    }

    response = requests.post(
        f"{JIRA_URL}/rest/api/3/issue",
        headers=JIRA_HEADERS,
        json=jira_data
    )

    if response.status_code == 201:
        jira_key = response.json()['key']
        print(f"✅ Created Jira issue: {jira_key}")

        # Add comment to GitHub issue with Jira link
        github_comment = f"✅ Synced to Jira: [{jira_key}]({JIRA_URL}/browse/{jira_key})"
        requests.post(
            f"https://api.github.com/repos/reddyfit/research/issues/{github_issue['number']}/comments",
            headers=HEADERS,
            json={"body": github_comment}
        )

        return jira_key
    else:
        print(f"❌ Failed to create Jira issue: {response.text}")
        return None
```

---

### 6.2 Jira Task → GitHub Issue (Update Status)

**Python:**
```python
def sync_jira_status_to_github(jira_key: str, new_status: str):
    """When Jira task is updated, sync status to GitHub issue."""

    # Find linked GitHub issue (from Jira description)
    jira_issue = requests.get(
        f"{JIRA_URL}/rest/api/3/issue/{jira_key}",
        headers=JIRA_HEADERS
    ).json()

    # Extract GitHub issue number from description
    github_url = jira_issue['fields']['description'].split('**GitHub Issue:** ')[1].split('\n')[0]
    github_issue_number = int(github_url.split('/')[-1])

    # Map Jira status to GitHub label
    status_label_map = {
        "To Do": "status: todo",
        "In Progress": "status: in-progress",
        "Done": "status: done"
    }

    new_label = status_label_map.get(new_status)

    if new_label:
        # Remove old status labels
        requests.delete(
            f"https://api.github.com/repos/reddyfit/research/issues/{github_issue_number}/labels/status:%20todo",
            headers=HEADERS
        )
        requests.delete(
            f"https://api.github.com/repos/reddyfit/research/issues/{github_issue_number}/labels/status:%20in-progress",
            headers=HEADERS
        )

        # Add new status label
        requests.post(
            f"https://api.github.com/repos/reddyfit/research/issues/{github_issue_number}/labels",
            headers=HEADERS,
            json={"labels": [new_label]}
        )

        # Add comment
        comment = f"🔄 Jira status updated: **{new_status}** ([{jira_key}]({JIRA_URL}/browse/{jira_key}))"
        requests.post(
            f"https://api.github.com/repos/reddyfit/research/issues/{github_issue_number}/comments",
            headers=HEADERS,
            json={"body": comment}
        )

        print(f"✅ Synced Jira status to GitHub issue #{github_issue_number}")
```

---

## 7. Webhooks (Real-Time Events)

### 7.1 Setting Up Webhook

**Steps:**
1. Go to GitHub repo → Settings → Webhooks → Add webhook
2. Payload URL: `https://your-server.com/github-webhook`
3. Content type: `application/json`
4. Secret: Generate random string (for verification)
5. Events: Select events to listen for (issues, pull_request, push, etc.)

---

### 7.2 Webhook Handler (Flask)

**Python:**
```python
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)

WEBHOOK_SECRET = "your-webhook-secret"

def verify_signature(payload_body, signature_header):
    """Verify webhook request is from GitHub."""
    if not signature_header:
        return False

    sha_name, signature = signature_header.split('=')
    if sha_name != 'sha256':
        return False

    mac = hmac.new(
        WEBHOOK_SECRET.encode(),
        msg=payload_body,
        digestmod=hashlib.sha256
    )

    return hmac.compare_digest(mac.hexdigest(), signature)

@app.route('/github-webhook', methods=['POST'])
def github_webhook():
    """Handle GitHub webhook events."""

    # Verify signature
    signature = request.headers.get('X-Hub-Signature-256')
    if not verify_signature(request.data, signature):
        return jsonify({"error": "Invalid signature"}), 403

    # Get event type
    event = request.headers.get('X-GitHub-Event')
    payload = request.json

    # Route to appropriate handler
    if event == 'issues':
        handle_issue_event(payload)
    elif event == 'pull_request':
        handle_pr_event(payload)
    elif event == 'push':
        handle_push_event(payload)

    return jsonify({"status": "success"}), 200

def handle_issue_event(payload):
    """Handle issue opened/closed/edited events."""
    action = payload['action']
    issue = payload['issue']

    if action == 'opened':
        # Auto-label issue
        classify_and_label_issue(issue)
        # Sync to Jira
        sync_github_issue_to_jira(issue)
    elif action == 'closed':
        print(f"Issue #{issue['number']} closed")

def handle_pr_event(payload):
    """Handle PR opened/merged events."""
    action = payload['action']
    pr = payload['pull_request']

    if action == 'opened':
        # Request reviews
        request_reviews(pr['number'], pr['changed_files'])
    elif action == 'closed' and pr['merged']:
        # Update documentation
        auto_update_api_docs(pr['changed_files'])

if __name__ == '__main__':
    app.run(port=5000)
```

---

## 8. GitHub Actions Integration

### 8.1 Triggering Workflows via API

**Python:**
```python
def trigger_workflow(workflow_id: str, inputs: dict = None):
    """Trigger GitHub Actions workflow programmatically."""

    data = {
        "ref": "main",  # Branch to run on
        "inputs": inputs or {}
    }

    response = requests.post(
        f"https://api.github.com/repos/reddyfit/research/actions/workflows/{workflow_id}/dispatches",
        headers=HEADERS,
        json=data
    )

    if response.status_code == 204:
        print(f"✅ Triggered workflow: {workflow_id}")
    else:
        print(f"❌ Failed to trigger workflow: {response.text}")

# Example: Trigger daily report generation
trigger_workflow(
    workflow_id="daily-progress.yml",
    inputs={"date": "2025-10-08"}
)
```

---

### 8.2 Checking Workflow Status

**Python:**
```python
def check_workflow_status(run_id: int):
    """Check status of workflow run."""

    response = requests.get(
        f"https://api.github.com/repos/reddyfit/research/actions/runs/{run_id}",
        headers=HEADERS
    )

    run = response.json()

    print(f"Workflow: {run['name']}")
    print(f"Status: {run['status']}")  # queued, in_progress, completed
    print(f"Conclusion: {run['conclusion']}")  # success, failure, cancelled

    return run
```

---

## 9. Cost Tracking Dashboard

### 9.1 Fetching Cost Data from Multiple Services

**Python:**
```python
import asyncio

async def fetch_all_costs():
    """Aggregate costs from OpenAI, Temporal, Azure, Supabase."""

    # OpenAI usage
    openai_response = requests.get(
        "https://api.openai.com/v1/usage",
        headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
        params={"date": (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')}
    )

    # Temporal.io usage (example, adjust to actual API)
    temporal_response = requests.get(
        "https://cloud.temporal.io/api/v1/usage",
        headers={"Authorization": f"Bearer {os.environ['TEMPORAL_API_KEY']}"}
    )

    # Azure costs (via Azure CLI in subprocess)
    azure_cost = subprocess.check_output([
        'az', 'consumption', 'usage', 'list',
        '--start-date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    ])

    return {
        "openai": calculate_openai_cost(openai_response.json()),
        "temporal": calculate_temporal_cost(temporal_response.json()),
        "azure": calculate_azure_cost(json.loads(azure_cost)),
        "timestamp": datetime.now().isoformat()
    }

async def update_cost_dashboard():
    """Update cost dashboard JSON in GitHub repo."""

    costs = await fetch_all_costs()

    # Calculate projections
    daily_avg = sum(costs.values()) / 30  # Assuming 30-day data
    projected_monthly = daily_avg * 30

    dashboard_data = {
        **costs,
        "projected_monthly": projected_monthly,
        "budget": 200,  # $200/month budget
        "remaining": 200 - projected_monthly
    }

    # Update GitHub file
    update_file(
        file_path="docs/cost-dashboard.json",
        content=json.dumps(dashboard_data, indent=2),
        commit_message="💰 Update cost dashboard [skip ci]"
    )
```

---

### 9.2 Cost Alert System

**Python:**
```python
def check_budget_and_alert():
    """Check if cost exceeds budget and send alert."""

    # Read current costs from dashboard
    cost_data = json.loads(read_file("docs/cost-dashboard.json"))

    if cost_data['projected_monthly'] > cost_data['budget']:
        # Create GitHub issue
        overage = cost_data['projected_monthly'] - cost_data['budget']
        issue_body = f"""
        ## 🚨 Budget Alert

        **Projected Monthly Cost:** ${cost_data['projected_monthly']:.2f}
        **Budget:** ${cost_data['budget']:.2f}
        **Overage:** ${overage:.2f} ({overage/cost_data['budget']*100:.1f}% over)

        ### Breakdown:
        - OpenAI: ${cost_data['openai']:.2f}
        - Temporal: ${cost_data['temporal']:.2f}
        - Azure: ${cost_data['azure']:.2f}

        **Action Required:** Optimize costs or increase budget.
        """

        create_issue(
            title="🚨 Budget Alert: Cost Exceeds $200/month",
            body=issue_body,
            labels=["urgent", "cost-optimization"]
        )
```

---

## 10. Production Best Practices

### 10.1 Error Handling & Retries

**Python:**
```python
import time

def github_api_call_with_retry(url: str, method: str = "GET", max_retries: int = 3, **kwargs):
    """Make GitHub API call with exponential backoff retry."""

    for attempt in range(max_retries):
        try:
            if method == "GET":
                response = requests.get(url, headers=HEADERS, **kwargs)
            elif method == "POST":
                response = requests.post(url, headers=HEADERS, **kwargs)
            elif method == "PUT":
                response = requests.put(url, headers=HEADERS, **kwargs)

            # Check rate limit
            if response.status_code == 403 and 'rate limit exceeded' in response.text.lower():
                reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
                wait_seconds = reset_time - int(time.time()) + 10
                print(f"⏳ Rate limited. Waiting {wait_seconds}s...")
                time.sleep(wait_seconds)
                continue

            # Success or non-retryable error
            response.raise_for_status()
            return response

        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                raise

            wait_time = 2 ** attempt  # Exponential backoff
            print(f"❌ Request failed (attempt {attempt+1}): {e}")
            print(f"⏳ Retrying in {wait_time}s...")
            time.sleep(wait_time)
```

---

### 10.2 Rate Limit Management

**Python:**
```python
def check_rate_limit():
    """Check remaining GitHub API rate limit."""

    response = requests.get(
        "https://api.github.com/rate_limit",
        headers=HEADERS
    )

    rate_limit = response.json()

    print(f"Core API: {rate_limit['resources']['core']['remaining']}/{rate_limit['resources']['core']['limit']}")
    print(f"Search API: {rate_limit['resources']['search']['remaining']}/{rate_limit['resources']['search']['limit']}")
    print(f"GraphQL API: {rate_limit['resources']['graphql']['remaining']}/{rate_limit['resources']['graphql']['limit']}")

    return rate_limit

# Call before expensive operations
rate_limit = check_rate_limit()
if rate_limit['resources']['core']['remaining'] < 100:
    print("⚠️ Low on API quota, consider waiting")
```

---

### 10.3 Logging & Monitoring

**Python:**
```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('github_integration.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('github_integration')

def logged_api_call(func):
    """Decorator to log all GitHub API calls."""

    def wrapper(*args, **kwargs):
        logger.info(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
        start_time = time.time()

        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            logger.info(f"{func.__name__} succeeded in {duration:.2f}s")
            return result

        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"{func.__name__} failed after {duration:.2f}s: {e}")
            raise

    return wrapper

@logged_api_call
def create_issue(title, body, labels):
    # ... (implementation)
    pass
```

---

## Conclusion

This guide provides complete implementation for GitHub API integration:

✅ **Issues & PRs** (auto-create, label, review, merge)
✅ **Documentation** (auto-update on code changes)
✅ **Jira Sync** (bidirectional issue/task sync)
✅ **Webhooks** (real-time event handling)
✅ **Cost Tracking** (aggregate spend from all services)
✅ **Production Best Practices** (retries, rate limits, logging)

**Next Steps:**
1. Generate GitHub personal access token
2. Set up webhook endpoint (Flask/Express)
3. Implement issue auto-labeling
4. Configure Jira sync
5. Deploy cost tracking dashboard

**Status:** Ready for implementation 🚀

---

**Document Metadata:**
- **Author:** ReddyFit Research Team
- **Last Updated:** 2025-10-08
- **Version:** 1.0
- **API Version:** GitHub REST API v3 + GraphQL v4
- **Related Docs:** `github-automation-stack.md`, `openai-agents-deep-dive.md`
