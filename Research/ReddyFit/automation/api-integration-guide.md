# API Integration Guide
Complete Implementation Guide for All Integrations

## Table of Contents
1. [Microsoft Graph API Setup](#microsoft-graph-api-setup)
2. [Jira API Integration](#jira-api-integration)
3. [Azure SDK Configuration](#azure-sdk-configuration)
4. [OpenAI Agents SDK](#openai-agents-sdk)
5. [GitHub API Integration](#github-api-integration)
6. [Temporal.io Setup](#temporalio-setup)

---

## Microsoft Graph API Setup

### 1. App Registration in Azure AD

**Step-by-Step:**

1. Navigate to Azure Portal → Azure Active Directory → App registrations
2. Click "New registration"
3. Configure:
   - Name: `ReddyFit-Documentation-Automation`
   - Supported account types: `Single tenant`
   - Redirect URI: Leave blank (daemon app)

4. Note the following values:
   - Application (client) ID: `{client_id}`
   - Directory (tenant) ID: `{tenant_id}`

### 2. Create Client Secret or Certificate

**Option A: Client Secret (Development)**
```bash
# In Azure Portal: App Registration → Certificates & secrets → New client secret
# Description: ReddyFit-Doc-Secret
# Expires: 90 days (rotate every 60 days recommended)
```

**Option B: Certificate (Production - Recommended)**
```bash
# Generate certificate
openssl req -x509 -newkey rsa:4096 -keyout private_key.pem -out certificate.pem -days 365

# Upload to Azure: App Registration → Certificates & secrets → Upload certificate
# Upload certificate.pem
```

### 3. Grant API Permissions

Navigate to: App Registration → API permissions → Add a permission → Microsoft Graph

**Application Permissions (Requires Admin Consent):**

| Permission | Purpose |
|------------|---------|
| `Files.ReadWrite.All` | Create/update documents in OneDrive/SharePoint |
| `Sites.ReadWrite.All` | Access SharePoint sites and document libraries |
| `ChannelMessage.Send` | Send notifications to Teams channels |
| `Mail.Send` | Send email investor reports |
| `User.Read.All` | Read user info for audit trails |

**Grant Admin Consent:**
```bash
# In Azure Portal: API permissions → Grant admin consent for {tenant}
```

### 4. Python Implementation

**Install Dependencies:**
```bash
pip install msal requests python-docx openpyxl python-pptx
```

**Authentication Code:**
```python
# graph_auth.py
import msal
import requests
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class GraphAPIClient:
    """Microsoft Graph API client with token caching"""

    def __init__(self, client_id: str, client_secret: str, tenant_id: str):
        self.client_id = client_id
        self.tenant_id = tenant_id
        self.authority = f"https://login.microsoftonline.com/{tenant_id}"
        self.scope = ["https://graph.microsoft.com/.default"]

        # Create MSAL confidential client
        self.app = msal.ConfidentialClientApplication(
            client_id,
            authority=self.authority,
            client_credential=client_secret,
        )

        self.token_cache = None

    def get_access_token(self) -> str:
        """Get access token with caching"""
        # Try to get token from cache
        result = self.app.acquire_token_silent(self.scope, account=None)

        if not result:
            # Request new token
            result = self.app.acquire_token_for_client(scopes=self.scope)

        if "access_token" in result:
            logger.info("Access token acquired successfully")
            return result["access_token"]
        else:
            error = result.get("error")
            error_desc = result.get("error_description")
            raise Exception(f"Token acquisition failed: {error} - {error_desc}")

    def call_graph_api(
        self,
        endpoint: str,
        method: str = "GET",
        data: Dict[Any, Any] = None,
        headers: Dict[str, str] = None
    ) -> Dict[Any, Any]:
        """Make authenticated request to Microsoft Graph API"""
        token = self.get_access_token()

        # Prepare headers
        default_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        if headers:
            default_headers.update(headers)

        # Make request
        url = f"https://graph.microsoft.com/v1.0{endpoint}"

        if method == "GET":
            response = requests.get(url, headers=default_headers)
        elif method == "POST":
            response = requests.post(url, headers=default_headers, json=data)
        elif method == "PUT":
            response = requests.put(url, headers=default_headers, json=data)
        elif method == "PATCH":
            response = requests.patch(url, headers=default_headers, json=data)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")

        # Handle rate limiting
        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 60))
            logger.warning(f"Rate limited. Retry after {retry_after} seconds")
            raise Exception(f"Rate limited. Retry after {retry_after}s")

        response.raise_for_status()
        return response.json() if response.content else {}
```

### 5. SharePoint Document Upload

```python
# sharepoint_uploader.py
from graph_auth import GraphAPIClient
from typing import BinaryIO
import os

class SharePointUploader:
    """Upload documents to SharePoint with versioning"""

    def __init__(self, graph_client: GraphAPIClient, site_id: str):
        self.client = graph_client
        self.site_id = site_id

    def get_site_id(self, site_url: str) -> str:
        """Get SharePoint site ID from URL"""
        # Example: https://yourcompany.sharepoint.com/sites/ReddyFit
        hostname = site_url.split("//")[1].split("/")[0]
        site_path = "/" + "/".join(site_url.split("/")[3:])

        endpoint = f"/sites/{hostname}:{site_path}"
        result = self.client.call_graph_api(endpoint)
        return result["id"]

    def upload_file(
        self,
        file_path: str,
        sharepoint_folder: str = "Shared Documents/Automation"
    ) -> str:
        """Upload file to SharePoint document library"""
        filename = os.path.basename(file_path)

        # Read file
        with open(file_path, 'rb') as f:
            file_content = f.read()

        # Upload endpoint
        # Small file (<4MB): PUT /sites/{site-id}/drive/root:/{folder}/{filename}:/content
        endpoint = f"/sites/{self.site_id}/drive/root:/{sharepoint_folder}/{filename}:/content"

        # Custom headers for upload
        headers = {
            "Content-Type": "application/octet-stream"
        }

        token = self.client.get_access_token()
        url = f"https://graph.microsoft.com/v1.0{endpoint}"

        response = requests.put(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/octet-stream"
            },
            data=file_content
        )

        response.raise_for_status()
        result = response.json()

        sharepoint_url = result.get("webUrl")
        print(f"File uploaded: {sharepoint_url}")
        return sharepoint_url

    def upload_large_file(self, file_path: str, sharepoint_folder: str) -> str:
        """Upload large file (>4MB) using upload session"""
        filename = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)

        # Create upload session
        endpoint = f"/sites/{self.site_id}/drive/root:/{sharepoint_folder}/{filename}:/createUploadSession"
        session_data = {
            "item": {
                "@microsoft.graph.conflictBehavior": "replace"
            }
        }

        session = self.client.call_graph_api(endpoint, method="POST", data=session_data)
        upload_url = session["uploadUrl"]

        # Upload in chunks (10MB chunks)
        chunk_size = 10 * 1024 * 1024
        with open(file_path, 'rb') as f:
            chunk_number = 0
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break

                start = chunk_number * chunk_size
                end = start + len(chunk) - 1

                headers = {
                    "Content-Length": str(len(chunk)),
                    "Content-Range": f"bytes {start}-{end}/{file_size}"
                }

                response = requests.put(upload_url, headers=headers, data=chunk)
                response.raise_for_status()

                chunk_number += 1

        result = response.json()
        return result.get("webUrl")
```

### 6. Teams Notifications

```python
# teams_notifier.py
from graph_auth import GraphAPIClient
from typing import Dict, Any

class TeamsNotifier:
    """Send notifications to Microsoft Teams channels"""

    def __init__(self, graph_client: GraphAPIClient):
        self.client = graph_client

    def send_channel_message(
        self,
        team_id: str,
        channel_id: str,
        message_content: str,
        document_url: str = None
    ) -> Dict[Any, Any]:
        """Send message to Teams channel"""

        # Build message body
        message_body = {
            "body": {
                "contentType": "html",
                "content": message_content
            }
        }

        # Add attachment if document URL provided
        if document_url:
            message_body["attachments"] = [{
                "id": "1",
                "contentType": "reference",
                "contentUrl": document_url,
                "name": "Daily Progress Report"
            }]

        endpoint = f"/teams/{team_id}/channels/{channel_id}/messages"
        result = self.client.call_graph_api(endpoint, method="POST", data=message_body)

        print(f"Teams message sent: {result['id']}")
        return result

    def get_team_id(self, team_name: str) -> str:
        """Get team ID by name"""
        endpoint = "/me/joinedTeams"
        result = self.client.call_graph_api(endpoint)

        for team in result.get("value", []):
            if team["displayName"] == team_name:
                return team["id"]

        raise ValueError(f"Team '{team_name}' not found")

    def get_channel_id(self, team_id: str, channel_name: str) -> str:
        """Get channel ID by name"""
        endpoint = f"/teams/{team_id}/channels"
        result = self.client.call_graph_api(endpoint)

        for channel in result.get("value", []):
            if channel["displayName"] == channel_name:
                return channel["id"]

        raise ValueError(f"Channel '{channel_name}' not found")
```

### 7. Excel Automation with Microsoft Graph

```python
# excel_graph.py
from graph_auth import GraphAPIClient
from typing import List, Dict, Any

class ExcelGraphAutomation:
    """Create and update Excel files via Microsoft Graph"""

    def __init__(self, graph_client: GraphAPIClient):
        self.client = graph_client

    def create_workbook(self, site_id: str, folder_path: str, filename: str):
        """Create new Excel workbook in SharePoint"""
        # First, create empty workbook locally and upload
        from openpyxl import Workbook
        wb = Workbook()
        local_path = f"/tmp/{filename}"
        wb.save(local_path)

        # Upload to SharePoint
        endpoint = f"/sites/{site_id}/drive/root:/{folder_path}/{filename}:/content"
        # Upload code here (similar to SharePointUploader)

        return local_path

    def add_chart(
        self,
        site_id: str,
        file_id: str,
        worksheet_name: str,
        chart_type: str,
        source_range: str
    ):
        """Add chart to Excel worksheet"""

        # Create chart
        chart_data = {
            "type": chart_type,  # e.g., "ColumnClustered", "Line", "Pie"
            "sourceData": source_range,
            "seriesBy": "Auto"
        }

        endpoint = f"/sites/{site_id}/drive/items/{file_id}/workbook/worksheets/{worksheet_name}/charts"
        result = self.client.call_graph_api(endpoint, method="POST", data=chart_data)

        print(f"Chart created: {result['id']}")
        return result

    def update_range(
        self,
        site_id: str,
        file_id: str,
        worksheet_name: str,
        range_address: str,
        values: List[List[Any]]
    ):
        """Update cell values in Excel"""

        data = {
            "values": values
        }

        endpoint = f"/sites/{site_id}/drive/items/{file_id}/workbook/worksheets/{worksheet_name}/range(address='{range_address}')"
        result = self.client.call_graph_api(endpoint, method="PATCH", data=data)

        print(f"Range updated: {range_address}")
        return result
```

### 8. Rate Limit Handling

```python
# rate_limiter.py
import time
import logging
from functools import wraps

logger = logging.getLogger(__name__)

def exponential_backoff(max_retries=5, base_delay=1):
    """Decorator for exponential backoff retry logic"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if "429" in str(e) or "rate limit" in str(e).lower():
                        if attempt < max_retries - 1:
                            delay = base_delay * (2 ** attempt)
                            logger.warning(f"Rate limited. Retrying in {delay}s...")
                            time.sleep(delay)
                        else:
                            logger.error("Max retries reached")
                            raise
                    else:
                        raise
        return wrapper
    return decorator

# Usage
@exponential_backoff(max_retries=5, base_delay=2)
def upload_document(file_path):
    # Your upload logic here
    pass
```

---

## Jira API Integration

### 1. Authentication Setup

**Option A: API Token (Recommended for Cloud)**

1. Generate API Token:
   - Go to: https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Name: `ReddyFit-Automation`
   - Copy token immediately (shown only once)

2. Store in Azure Key Vault:
```bash
az keyvault secret set \
  --vault-name reddyfit-keyvault \
  --name jira-api-token \
  --value "YOUR_API_TOKEN"
```

**Option B: OAuth 2.0 (For Apps)**

```python
# jira_oauth.py
from requests_oauthlib import OAuth1Session
import json

# OAuth 1.0a setup (Jira Cloud uses OAuth 2.0, but Server uses 1.0a)
oauth = OAuth1Session(
    client_key='consumer_key',
    client_secret='consumer_secret',
    resource_owner_key='access_token',
    resource_owner_secret='access_token_secret'
)
```

### 2. Python Client Implementation

```python
# jira_client.py
import requests
from requests.auth import HTTPBasicAuth
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class JiraClient:
    """Jira Cloud REST API client"""

    def __init__(self, domain: str, email: str, api_token: str):
        """
        Initialize Jira client

        Args:
            domain: yourcompany.atlassian.net
            email: your@email.com
            api_token: API token from Atlassian
        """
        self.base_url = f"https://{domain}"
        self.auth = HTTPBasicAuth(email, api_token)
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

    def _call_api(
        self,
        endpoint: str,
        method: str = "GET",
        data: Dict = None,
        params: Dict = None
    ) -> Dict[Any, Any]:
        """Make authenticated API call"""

        url = f"{self.base_url}/rest/api/3/{endpoint}"

        try:
            if method == "GET":
                response = requests.get(
                    url,
                    auth=self.auth,
                    headers=self.headers,
                    params=params
                )
            elif method == "POST":
                response = requests.post(
                    url,
                    auth=self.auth,
                    headers=self.headers,
                    json=data
                )
            elif method == "PUT":
                response = requests.put(
                    url,
                    auth=self.auth,
                    headers=self.headers,
                    json=data
                )

            response.raise_for_status()
            return response.json() if response.content else {}

        except requests.exceptions.HTTPError as e:
            logger.error(f"Jira API error: {e}")
            logger.error(f"Response: {e.response.text}")
            raise

    def get_issues_by_jql(self, jql: str, max_results: int = 50) -> List[Dict]:
        """Search issues using JQL"""

        params = {
            "jql": jql,
            "maxResults": max_results,
            "fields": "summary,status,assignee,updated,created"
        }

        result = self._call_api("search", params=params)
        return result.get("issues", [])

    def get_sprint_issues(self, sprint_id: int) -> List[Dict]:
        """Get all issues in a sprint"""
        jql = f"sprint = {sprint_id}"
        return self.get_issues_by_jql(jql)

    def get_recent_updates(self, project_key: str, days: int = 1) -> List[Dict]:
        """Get issues updated in last N days"""
        jql = f"project = {project_key} AND updated >= -{days}d ORDER BY updated DESC"
        return self.get_issues_by_jql(jql)

    def create_issue(
        self,
        project_key: str,
        summary: str,
        description: str,
        issue_type: str = "Task"
    ) -> Dict:
        """Create new issue"""

        data = {
            "fields": {
                "project": {"key": project_key},
                "summary": summary,
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [{
                        "type": "paragraph",
                        "content": [{
                            "type": "text",
                            "text": description
                        }]
                    }]
                },
                "issuetype": {"name": issue_type}
            }
        }

        result = self._call_api("issue", method="POST", data=data)
        logger.info(f"Created issue: {result['key']}")
        return result

    def get_board_configuration(self, board_id: int) -> Dict:
        """Get board configuration"""
        # Software API endpoint
        url = f"{self.base_url}/rest/agile/1.0/board/{board_id}/configuration"
        response = requests.get(url, auth=self.auth, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_sprint_report(self, sprint_id: int) -> Dict:
        """Get sprint report data"""
        # This requires Jira Software
        url = f"{self.base_url}/rest/greenhopper/1.0/rapid/charts/sprintreport"
        params = {"sprintId": sprint_id}

        response = requests.get(
            url,
            auth=self.auth,
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
```

### 3. Webhook Configuration

```python
# jira_webhook_setup.py
from jira_client import JiraClient

def create_webhook(jira: JiraClient, callback_url: str) -> Dict:
    """Create Jira webhook programmatically"""

    # Note: Webhooks can only be created via Connect apps or OAuth 2.0 apps
    # For API tokens, create webhooks manually in Jira UI

    webhook_data = {
        "name": "ReddyFit Documentation Automation",
        "url": callback_url,
        "events": [
            "jira:issue_created",
            "jira:issue_updated",
            "jira:issue_deleted",
            "sprint_started",
            "sprint_closed"
        ],
        "filters": {
            "issue-related-events-section": "project = REDDYFIT"
        },
        "excludeBody": False
    }

    # This requires OAuth 2.0 or Connect app authentication
    # Not available with API token
    return jira._call_api("webhook", method="POST", data=webhook_data)

# Manual webhook creation in Jira:
# 1. Go to Jira Settings → System → Webhooks
# 2. Click "Create a webhook"
# 3. Configure:
#    - Name: ReddyFit Automation
#    - Status: Enabled
#    - URL: https://your-azure-function.azurewebsites.net/api/jira-webhook
#    - Events: Issue created, updated, deleted, sprint events
#    - JQL: project = REDDYFIT
```

### 4. Webhook Handler (Azure Function)

```python
# function_app.py (Azure Functions)
import azure.functions as func
import logging
import json

app = func.FunctionApp()

@app.function_name(name="JiraWebhook")
@app.route(route="jira-webhook", methods=["POST"])
def jira_webhook_handler(req: func.HttpRequest) -> func.HttpResponse:
    """Handle Jira webhook events"""

    try:
        webhook_event = req.get_json()

        event_type = webhook_event.get("webhookEvent")
        issue = webhook_event.get("issue", {})

        logging.info(f"Received Jira event: {event_type}")
        logging.info(f"Issue key: {issue.get('key')}")

        # Process different event types
        if event_type == "jira:issue_created":
            handle_issue_created(issue)
        elif event_type == "jira:issue_updated":
            handle_issue_updated(issue)
        elif event_type == "sprint_started":
            handle_sprint_started(webhook_event)

        return func.HttpResponse(
            json.dumps({"status": "success"}),
            status_code=200,
            mimetype="application/json"
        )

    except Exception as e:
        logging.error(f"Webhook processing error: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500
        )

def handle_issue_created(issue: Dict):
    """Process new issue creation"""
    # Trigger documentation workflow
    pass

def handle_issue_updated(issue: Dict):
    """Process issue update"""
    # Update documentation if status changed
    pass

def handle_sprint_started(event: Dict):
    """Process sprint start"""
    # Generate sprint planning documentation
    pass
```

---

## Azure SDK Configuration

### 1. Install Azure SDK Packages

```bash
pip install azure-identity \
            azure-mgmt-costmanagement \
            azure-mgmt-monitor \
            azure-mgmt-resource \
            azure-devops \
            azure-keyvault-secrets
```

### 2. Authentication with Managed Identity

```python
# azure_auth.py
from azure.identity import DefaultAzureCredential, ClientSecretCredential
from azure.keyvault.secrets import SecretClient
import os

class AzureAuthManager:
    """Centralized Azure authentication"""

    def __init__(self, use_managed_identity: bool = True):
        if use_managed_identity:
            # Use Managed Identity (recommended for Azure Functions)
            self.credential = DefaultAzureCredential()
        else:
            # Use Service Principal (for local development)
            self.credential = ClientSecretCredential(
                tenant_id=os.getenv("AZURE_TENANT_ID"),
                client_id=os.getenv("AZURE_CLIENT_ID"),
                client_secret=os.getenv("AZURE_CLIENT_SECRET")
            )

    def get_secret(self, vault_url: str, secret_name: str) -> str:
        """Retrieve secret from Azure Key Vault"""
        client = SecretClient(vault_url=vault_url, credential=self.credential)
        secret = client.get_secret(secret_name)
        return secret.value
```

### 3. Cost Management API

```python
# azure_cost_tracker.py
from azure.mgmt.costmanagement import CostManagementClient
from azure.identity import DefaultAzureCredential
from datetime import datetime, timedelta
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class AzureCostTracker:
    """Track Azure costs and usage"""

    def __init__(self, subscription_id: str):
        self.subscription_id = subscription_id
        self.credential = DefaultAzureCredential()
        self.client = CostManagementClient(self.credential)

    def get_daily_costs(self, days: int = 7) -> List[Dict]:
        """Get daily costs for last N days"""

        scope = f"/subscriptions/{self.subscription_id}"

        # Define time range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        query = {
            "type": "Usage",
            "timeframe": "Custom",
            "timePeriod": {
                "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                "to": end_date.strftime("%Y-%m-%dT23:59:59Z")
            },
            "dataset": {
                "granularity": "Daily",
                "aggregation": {
                    "totalCost": {
                        "name": "Cost",
                        "function": "Sum"
                    }
                },
                "grouping": [
                    {
                        "type": "Dimension",
                        "name": "ServiceName"
                    }
                ]
            }
        }

        try:
            result = self.client.query.usage(scope, query)

            costs = []
            for row in result.rows:
                costs.append({
                    "date": row[2],
                    "service": row[1],
                    "cost": row[0],
                    "currency": result.properties.columns[0].name
                })

            logger.info(f"Retrieved {len(costs)} cost records")
            return costs

        except Exception as e:
            logger.error(f"Cost query failed: {e}")
            raise

    def get_month_to_date_cost(self) -> float:
        """Get total cost for current month"""

        scope = f"/subscriptions/{self.subscription_id}"

        query = {
            "type": "Usage",
            "timeframe": "MonthToDate",
            "dataset": {
                "granularity": "None",
                "aggregation": {
                    "totalCost": {
                        "name": "Cost",
                        "function": "Sum"
                    }
                }
            }
        }

        result = self.client.query.usage(scope, query)
        total_cost = result.rows[0][0] if result.rows else 0.0

        logger.info(f"Month-to-date cost: ${total_cost:.2f}")
        return total_cost

    def get_cost_by_resource_group(self) -> List[Dict]:
        """Get costs grouped by resource group"""

        scope = f"/subscriptions/{self.subscription_id}"

        query = {
            "type": "Usage",
            "timeframe": "MonthToDate",
            "dataset": {
                "granularity": "None",
                "aggregation": {
                    "totalCost": {
                        "name": "Cost",
                        "function": "Sum"
                    }
                },
                "grouping": [
                    {
                        "type": "Dimension",
                        "name": "ResourceGroup"
                    }
                ]
            }
        }

        result = self.client.query.usage(scope, query)

        costs_by_rg = []
        for row in result.rows:
            costs_by_rg.append({
                "resource_group": row[1],
                "cost": row[0]
            })

        return costs_by_rg
```

### 4. Azure DevOps Integration

```python
# azure_devops_client.py
from azure.devops.connection import Connection
from msrest.authentication import BasicAuthentication
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class AzureDevOpsClient:
    """Azure DevOps API client"""

    def __init__(self, organization_url: str, personal_access_token: str):
        """
        Initialize Azure DevOps client

        Args:
            organization_url: https://dev.azure.com/yourorg
            personal_access_token: PAT from Azure DevOps
        """
        credentials = BasicAuthentication('', personal_access_token)
        self.connection = Connection(base_url=organization_url, creds=credentials)

    def get_recent_builds(self, project_name: str, days: int = 1) -> List[Dict]:
        """Get recent builds"""

        build_client = self.connection.clients.get_build_client()

        builds = build_client.get_builds(
            project=project_name,
            max_builds_per_definition=10
        )

        recent_builds = []
        for build in builds:
            recent_builds.append({
                "id": build.id,
                "build_number": build.build_number,
                "status": build.status,
                "result": build.result,
                "start_time": build.start_time,
                "finish_time": build.finish_time,
                "source_branch": build.source_branch
            })

        logger.info(f"Retrieved {len(recent_builds)} builds")
        return recent_builds

    def get_pipeline_runs(self, project_name: str, pipeline_id: int) -> List[Dict]:
        """Get pipeline run history"""

        pipelines_client = self.connection.clients.get_pipelines_client()

        runs = pipelines_client.list_runs(
            project=project_name,
            pipeline_id=pipeline_id
        )

        run_history = []
        for run in runs:
            run_history.append({
                "id": run.id,
                "name": run.name,
                "state": run.state,
                "result": run.result,
                "created_date": run.created_date,
                "finished_date": run.finished_date
            })

        return run_history

    def get_release_deployments(self, project_name: str, release_id: int) -> List[Dict]:
        """Get deployment history for a release"""

        release_client = self.connection.clients.get_release_client()

        release = release_client.get_release(
            project=project_name,
            release_id=release_id
        )

        deployments = []
        for environment in release.environments:
            deployments.append({
                "environment": environment.name,
                "status": environment.status,
                "deployment_time": environment.deploy_steps[0].attempt if environment.deploy_steps else None
            })

        return deployments
```

---

## OpenAI Agents SDK

### 1. Installation

```bash
pip install openai-agents-sdk openai
```

### 2. Basic Agent Configuration

```python
# openai_agents_config.py
from openai_agents import Agent, Handoff, Session
from typing import List, Dict
import os

class DocumentationAgents:
    """Multi-agent system for documentation generation"""

    def __init__(self, api_key: str):
        os.environ["OPENAI_API_KEY"] = api_key

        # Initialize agents
        self.doc_writer = self._create_doc_writer_agent()
        self.exec_summary = self._create_exec_summary_agent()
        self.data_analyst = self._create_data_analyst_agent()
        self.manager = self._create_manager_agent()

    def _create_doc_writer_agent(self) -> Agent:
        """Technical documentation writer"""
        return Agent(
            name="Documentation Writer",
            instructions="""You are a technical documentation specialist.
            Analyze code changes, Jira updates, and infrastructure changes
            to create clear, concise technical documentation.

            Focus on:
            - What changed and why
            - Problem-solution narrative
            - Technical details that matter
            - Impact on the system

            Keep it professional and precise.""",
            model="gpt-4",
            tools=[]
        )

    def _create_exec_summary_agent(self) -> Agent:
        """Executive summary writer for investors"""
        return Agent(
            name="Executive Summary Writer",
            instructions="""You are an investor relations specialist.
            Create executive summaries that highlight:
            - Key progress and milestones
            - Blockers and challenges
            - Metrics and KPIs
            - Next steps and timeline

            Use business language, not technical jargon.
            Be concise but comprehensive.
            Focus on value and progress.""",
            model="gpt-4",
            tools=[]
        )

    def _create_data_analyst_agent(self) -> Agent:
        """Data analysis and metrics agent"""
        return Agent(
            name="Data Analyst",
            instructions="""You are a data analyst specializing in
            development metrics and cost analysis.

            Analyze:
            - Jira velocity and sprint metrics
            - Azure infrastructure costs
            - Code commit patterns
            - Deployment frequency

            Provide insights and trends.
            Highlight anomalies or concerns.
            Suggest optimizations.""",
            model="gpt-4",
            tools=[]
        )

    def _create_manager_agent(self) -> Agent:
        """Manager agent that orchestrates other agents"""
        return Agent(
            name="Documentation Manager",
            instructions="""You orchestrate documentation tasks.
            Delegate to specialized agents:
            - Documentation Writer for technical docs
            - Executive Summary Writer for investor reports
            - Data Analyst for metrics and insights

            Coordinate their work to create comprehensive reports.""",
            model="gpt-4",
            handoffs=[
                Handoff(target=self.doc_writer),
                Handoff(target=self.exec_summary),
                Handoff(target=self.data_analyst)
            ]
        )

    async def generate_daily_summary(self, data: Dict) -> str:
        """Generate daily documentation summary"""

        session = Session()

        prompt = f"""Generate daily progress documentation based on:

        Git Commits: {data['commits']}
        Jira Updates: {data['jira_updates']}
        Azure Deployments: {data['deployments']}
        Azure Costs: {data['costs']}

        Create a comprehensive daily summary with:
        1. Executive Overview
        2. Development Progress
        3. Infrastructure Changes
        4. Blockers/Issues
        5. Next Steps
        """

        response = await session.run(
            agent=self.manager,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.messages[-1].content

    async def generate_weekly_investor_report(self, weekly_data: Dict) -> Dict:
        """Generate comprehensive weekly investor report"""

        session = Session()

        # Get executive summary
        exec_prompt = f"""Create an executive summary for the weekly
        investor report based on this week's data:

        {weekly_data}

        Include: Progress, Metrics, Challenges, Outlook
        """

        exec_response = await session.run(
            agent=self.exec_summary,
            messages=[{"role": "user", "content": exec_prompt}]
        )

        # Get technical details
        tech_prompt = f"""Document the technical achievements and
        changes from this week:

        {weekly_data}
        """

        tech_response = await session.run(
            agent=self.doc_writer,
            messages=[{"role": "user", "content": tech_prompt}]
        )

        # Get data analysis
        analysis_prompt = f"""Analyze the metrics and provide insights:

        {weekly_data}
        """

        analysis_response = await session.run(
            agent=self.data_analyst,
            messages=[{"role": "user", "content": analysis_prompt}]
        )

        return {
            "executive_summary": exec_response.messages[-1].content,
            "technical_details": tech_response.messages[-1].content,
            "data_analysis": analysis_response.messages[-1].content
        }
```

### 3. Token Cost Estimation

```python
# cost_estimator.py
import tiktoken

def estimate_openai_cost(text: str, model: str = "gpt-4") -> float:
    """Estimate OpenAI API cost for text generation"""

    # Get tokenizer for model
    encoding = tiktoken.encoding_for_model(model)

    # Count tokens
    tokens = len(encoding.encode(text))

    # Pricing (as of 2025)
    pricing = {
        "gpt-4": {
            "input": 0.03 / 1000,   # $0.03 per 1K tokens
            "output": 0.06 / 1000    # $0.06 per 1K tokens
        },
        "gpt-3.5-turbo": {
            "input": 0.0005 / 1000,
            "output": 0.0015 / 1000
        }
    }

    # Assume 50/50 input/output split
    input_cost = tokens * pricing[model]["input"]
    output_cost = tokens * pricing[model]["output"]

    total_cost = input_cost + output_cost

    print(f"Estimated tokens: {tokens}")
    print(f"Estimated cost: ${total_cost:.4f}")

    return total_cost
```

---

## GitHub API Integration

### 1. Webhook Setup

```python
# github_webhook_setup.py
import requests
from typing import Dict

class GitHubWebhookManager:
    """Manage GitHub webhooks"""

    def __init__(self, token: str, repo_owner: str, repo_name: str):
        self.token = token
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }

    def create_webhook(self, callback_url: str, secret: str) -> Dict:
        """Create repository webhook"""

        url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/hooks"

        data = {
            "name": "web",
            "active": True,
            "events": [
                "push",
                "pull_request",
                "deployment",
                "deployment_status",
                "release"
            ],
            "config": {
                "url": callback_url,
                "content_type": "json",
                "secret": secret,
                "insecure_ssl": "0"
            }
        }

        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()

        return response.json()

    def list_webhooks(self) -> list:
        """List all webhooks for repository"""

        url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/hooks"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()

        return response.json()
```

### 2. Webhook Handler

```python
# github_webhook_handler.py (Azure Function)
import azure.functions as func
import hashlib
import hmac
import json
import logging

app = func.FunctionApp()

@app.function_name(name="GitHubWebhook")
@app.route(route="github-webhook", methods=["POST"])
def github_webhook_handler(req: func.HttpRequest) -> func.HttpResponse:
    """Handle GitHub webhook events"""

    # Verify webhook signature
    signature = req.headers.get("X-Hub-Signature-256")
    if not verify_signature(req.get_body(), signature):
        return func.HttpResponse("Invalid signature", status_code=401)

    event_type = req.headers.get("X-GitHub-Event")
    payload = req.get_json()

    logging.info(f"Received GitHub event: {event_type}")

    if event_type == "push":
        handle_push_event(payload)
    elif event_type == "pull_request":
        handle_pr_event(payload)
    elif event_type == "deployment":
        handle_deployment_event(payload)

    return func.HttpResponse("OK", status_code=200)

def verify_signature(payload_body: bytes, signature_header: str) -> bool:
    """Verify GitHub webhook signature"""

    if not signature_header:
        return False

    webhook_secret = os.getenv("GITHUB_WEBHOOK_SECRET")
    hash_object = hmac.new(
        webhook_secret.encode('utf-8'),
        msg=payload_body,
        digestmod=hashlib.sha256
    )

    expected_signature = "sha256=" + hash_object.hexdigest()
    return hmac.compare_digest(expected_signature, signature_header)

def handle_push_event(payload: Dict):
    """Process push events"""
    commits = payload.get("commits", [])
    logging.info(f"Processing {len(commits)} commits")
    # Trigger documentation workflow

def handle_pr_event(payload: Dict):
    """Process pull request events"""
    action = payload.get("action")
    pr = payload.get("pull_request", {})
    logging.info(f"PR {action}: {pr.get('title')}")

def handle_deployment_event(payload: Dict):
    """Process deployment events"""
    deployment = payload.get("deployment", {})
    logging.info(f"Deployment to {deployment.get('environment')}")
```

---

## Temporal.io Setup

### 1. Installation

```bash
pip install temporalio
```

### 2. Worker Setup

```python
# temporal_worker.py
import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from workflows import DailyDocumentationWorkflow, WeeklyInvestorReportWorkflow
from activities import (
    collect_github_commits,
    collect_jira_updates,
    collect_azure_metrics,
    generate_daily_summary,
    create_word_document,
    upload_to_sharepoint,
    send_teams_notification
)

async def main():
    # Connect to Temporal Cloud
    client = await Client.connect(
        "your-namespace.tmprl.cloud:7233",
        namespace="your-namespace",
        tls=True
    )

    # Create worker
    worker = Worker(
        client,
        task_queue="documentation-tasks",
        workflows=[
            DailyDocumentationWorkflow,
            WeeklyInvestorReportWorkflow
        ],
        activities=[
            collect_github_commits,
            collect_jira_updates,
            collect_azure_metrics,
            generate_daily_summary,
            create_word_document,
            upload_to_sharepoint,
            send_teams_notification
        ]
    )

    # Run worker
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
```

### 3. Schedule Creation

```python
# create_schedules.py
import asyncio
from temporalio.client import Client, Schedule, ScheduleActionStartWorkflow, ScheduleSpec, ScheduleCalendarSpec

async def create_daily_documentation_schedule():
    """Create daily documentation schedule"""

    client = await Client.connect(
        "your-namespace.tmprl.cloud:7233",
        namespace="your-namespace",
        tls=True
    )

    # Daily at 6 PM
    schedule = Schedule(
        action=ScheduleActionStartWorkflow(
            workflow="DailyDocumentationWorkflow",
            id="daily-doc",
            task_queue="documentation-tasks"
        ),
        spec=ScheduleSpec(
            calendars=[
                ScheduleCalendarSpec(
                    hour=18,
                    minute=0
                )
            ]
        )
    )

    handle = await client.create_schedule(
        "daily-documentation",
        schedule
    )

    print(f"Created schedule: {handle.id}")

asyncio.run(create_daily_documentation_schedule())
```

---

## Complete Example: Daily Workflow

```python
# complete_daily_workflow.py
"""Complete example of daily documentation automation"""

import asyncio
from datetime import datetime
from graph_auth import GraphAPIClient
from jira_client import JiraClient
from azure_cost_tracker import AzureCostTracker
from openai_agents_config import DocumentationAgents
from docx import Document
import os

async def run_daily_documentation():
    """Execute daily documentation workflow"""

    print(f"Starting daily documentation: {datetime.now()}")

    # 1. Initialize all clients
    graph = GraphAPIClient(
        client_id=os.getenv("MS_CLIENT_ID"),
        client_secret=os.getenv("MS_CLIENT_SECRET"),
        tenant_id=os.getenv("MS_TENANT_ID")
    )

    jira = JiraClient(
        domain="yourcompany.atlassian.net",
        email=os.getenv("JIRA_EMAIL"),
        api_token=os.getenv("JIRA_API_TOKEN")
    )

    azure_cost = AzureCostTracker(
        subscription_id=os.getenv("AZURE_SUBSCRIPTION_ID")
    )

    ai_agents = DocumentationAgents(
        api_key=os.getenv("OPENAI_API_KEY")
    )

    # 2. Collect data from all sources
    print("Collecting data...")

    # GitHub commits (would use GitHub API)
    commits = []  # Fetch from GitHub

    # Jira updates
    jira_updates = jira.get_recent_updates("REDDYFIT", days=1)

    # Azure metrics
    daily_costs = azure_cost.get_daily_costs(days=1)

    # 3. Generate documentation with AI
    print("Generating documentation...")

    data = {
        "commits": commits,
        "jira_updates": jira_updates,
        "deployments": [],
        "costs": daily_costs
    }

    summary = await ai_agents.generate_daily_summary(data)

    # 4. Create Word document
    print("Creating Word document...")

    doc = Document()
    doc.add_heading(f"Daily Progress Report - {datetime.now().strftime('%Y-%m-%d')}", 0)
    doc.add_paragraph(summary)

    filename = f"daily_report_{datetime.now().strftime('%Y%m%d')}.docx"
    doc.save(filename)

    # 5. Upload to SharePoint
    print("Uploading to SharePoint...")

    from sharepoint_uploader import SharePointUploader

    sp_uploader = SharePointUploader(graph, site_id="your-site-id")
    sharepoint_url = sp_uploader.upload_file(
        filename,
        "Shared Documents/Daily Reports"
    )

    # 6. Send Teams notification
    print("Sending Teams notification...")

    from teams_notifier import TeamsNotifier

    teams = TeamsNotifier(graph)
    teams.send_channel_message(
        team_id="your-team-id",
        channel_id="investor-channel-id",
        message_content=f"""
        <h2>Daily Progress Report Available</h2>
        <p>The daily progress report for {datetime.now().strftime('%B %d, %Y')} is now available.</p>
        <p><a href="{sharepoint_url}">View Report</a></p>
        """,
        document_url=sharepoint_url
    )

    print("Daily documentation complete!")
    return sharepoint_url

if __name__ == "__main__":
    asyncio.run(run_daily_documentation())
```

---

## Environment Variables

Create a `.env` file:

```bash
# Microsoft 365
MS_CLIENT_ID=your-client-id
MS_CLIENT_SECRET=your-client-secret
MS_TENANT_ID=your-tenant-id
MS_SITE_ID=your-sharepoint-site-id
MS_TEAM_ID=your-teams-team-id
MS_CHANNEL_ID=your-teams-channel-id

# Jira
JIRA_DOMAIN=yourcompany.atlassian.net
JIRA_EMAIL=your@email.com
JIRA_API_TOKEN=your-api-token

# Azure
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_KEYVAULT_URL=https://your-keyvault.vault.azure.net/

# GitHub
GITHUB_TOKEN=your-personal-access-token
GITHUB_WEBHOOK_SECRET=your-webhook-secret
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=your-repo

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Temporal
TEMPORAL_NAMESPACE=your-namespace
TEMPORAL_ADDRESS=your-namespace.tmprl.cloud:7233
```

---

## Next Steps

1. Set up all API credentials
2. Store secrets in Azure Key Vault
3. Create Azure Functions for webhook handlers
4. Deploy Temporal workflows
5. Test each integration individually
6. Integrate complete workflow
7. Monitor and optimize

This guide provides everything needed to implement the automated documentation system with proper authentication, error handling, and best practices.
