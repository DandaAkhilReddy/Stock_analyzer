# Workflow Design
Temporal.io Workflow Specifications for Automated Documentation

## Overview

This document defines the Temporal.io workflows for automated documentation and investor reporting. All workflows include comprehensive error handling, retry logic, and monitoring.

## Table of Contents

1. [Daily Documentation Workflow](#daily-documentation-workflow)
2. [Weekly Investor Report Workflow](#weekly-investor-report-workflow)
3. [Real-Time Event Handlers](#real-time-event-handlers)
4. [Error Handling Strategy](#error-handling-strategy)
5. [Monitoring & Observability](#monitoring--observability)

---

## Daily Documentation Workflow

### Schedule
**Frequency:** Every day at 6:00 PM
**Timezone:** UTC
**Workflow ID:** `daily-documentation-{date}`

### Workflow Definition

```python
# workflows/daily_documentation.py
from temporalio import workflow
from temporalio.common import RetryPolicy
from datetime import timedelta, datetime
from typing import Dict, Any
import logging

@workflow.defn
class DailyDocumentationWorkflow:
    """
    Daily documentation generation workflow

    Collects data from Git, Jira, and Azure, generates AI-powered
    documentation, creates Word document, uploads to SharePoint,
    and notifies stakeholders via Teams.
    """

    @workflow.run
    async def run(self, date: str = None) -> Dict[str, Any]:
        """
        Execute daily documentation workflow

        Args:
            date: Date to generate report for (YYYY-MM-DD), defaults to today

        Returns:
            Dict containing SharePoint URL and summary statistics
        """

        if not date:
            date = datetime.now().strftime("%Y-%m-%d")

        workflow.logger.info(f"Starting daily documentation for {date}")

        # Define retry policy for all activities
        retry_policy = RetryPolicy(
            initial_interval=timedelta(seconds=1),
            maximum_interval=timedelta(seconds=30),
            maximum_attempts=5,
            backoff_coefficient=2.0,
            non_retryable_error_types=["AuthenticationError", "ConfigurationError"]
        )

        # ===== Step 1: Collect Data from All Sources =====
        workflow.logger.info("Step 1/6: Collecting data from sources")

        # Collect GitHub commits (parallel execution)
        commits_task = workflow.execute_activity(
            collect_github_commits,
            args=[date],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy
        )

        # Collect Jira updates (parallel execution)
        jira_task = workflow.execute_activity(
            collect_jira_updates,
            args=[date],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy
        )

        # Collect Azure metrics (parallel execution)
        azure_task = workflow.execute_activity(
            collect_azure_metrics,
            args=[date],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy
        )

        # Wait for all data collection to complete
        commits, jira_updates, azure_metrics = await workflow.gather(
            commits_task,
            jira_task,
            azure_task
        )

        workflow.logger.info(f"Collected: {len(commits)} commits, {len(jira_updates)} Jira updates")

        # ===== Step 2: Aggregate and Enrich Data =====
        workflow.logger.info("Step 2/6: Aggregating data")

        aggregated_data = await workflow.execute_activity(
            aggregate_daily_data,
            args=[commits, jira_updates, azure_metrics],
            start_to_close_timeout=timedelta(minutes=3),
            retry_policy=retry_policy
        )

        # ===== Step 3: Generate Documentation with AI =====
        workflow.logger.info("Step 3/6: Generating AI documentation")

        # Check if there's enough content to document
        if self._has_significant_activity(aggregated_data):
            doc_content = await workflow.execute_activity(
                generate_daily_summary,
                args=[aggregated_data],
                start_to_close_timeout=timedelta(minutes=10),
                retry_policy=RetryPolicy(
                    initial_interval=timedelta(seconds=2),
                    maximum_interval=timedelta(seconds=60),
                    maximum_attempts=3,
                    backoff_coefficient=2.0
                )
            )
        else:
            # No significant activity - create minimal report
            doc_content = self._create_minimal_report(aggregated_data)
            workflow.logger.info("Minimal activity detected, creating short report")

        # ===== Step 4: Create Word Document =====
        workflow.logger.info("Step 4/6: Creating Word document")

        doc_path = await workflow.execute_activity(
            create_word_document,
            args=[doc_content, date],
            start_to_close_timeout=timedelta(minutes=3),
            retry_policy=retry_policy
        )

        # ===== Step 5: Upload to SharePoint =====
        workflow.logger.info("Step 5/6: Uploading to SharePoint")

        sharepoint_url = await workflow.execute_activity(
            upload_to_sharepoint,
            args=[doc_path, f"Daily Reports/{date[:7]}"],  # Organize by month
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=RetryPolicy(
                initial_interval=timedelta(seconds=3),
                maximum_interval=timedelta(seconds=60),
                maximum_attempts=5,
                backoff_coefficient=2.0
            )
        )

        # ===== Step 6: Send Notifications =====
        workflow.logger.info("Step 6/6: Sending notifications")

        # Send Teams notification (non-critical, fewer retries)
        try:
            await workflow.execute_activity(
                send_teams_notification,
                args=[sharepoint_url, date, aggregated_data.get("summary_stats")],
                start_to_close_timeout=timedelta(minutes=2),
                retry_policy=RetryPolicy(
                    initial_interval=timedelta(seconds=1),
                    maximum_interval=timedelta(seconds=10),
                    maximum_attempts=3
                )
            )
        except Exception as e:
            workflow.logger.warning(f"Teams notification failed (non-critical): {e}")

        # ===== Workflow Complete =====
        workflow.logger.info(f"Daily documentation complete: {sharepoint_url}")

        return {
            "success": True,
            "date": date,
            "sharepoint_url": sharepoint_url,
            "commits_count": len(commits),
            "jira_updates_count": len(jira_updates),
            "doc_path": doc_path
        }

    def _has_significant_activity(self, data: Dict) -> bool:
        """Check if there's enough activity to warrant full AI generation"""
        return (
            len(data.get("commits", [])) > 0 or
            len(data.get("jira_updates", [])) > 0 or
            len(data.get("deployments", [])) > 0
        )

    def _create_minimal_report(self, data: Dict) -> str:
        """Create minimal report when there's no significant activity"""
        return f"""# Daily Progress Report - {data.get('date')}

## Summary
No significant development activity recorded for this day.

### Metrics
- Commits: 0
- Jira Updates: 0
- Deployments: 0
- Azure Costs: ${data.get('costs', {}).get('total', 0):.2f}

### Status
System operating normally with no active development work.
"""
```

### Activity Definitions

```python
# activities/data_collection.py
from temporalio import activity
from typing import List, Dict
import logging

@activity.defn
async def collect_github_commits(date: str) -> List[Dict]:
    """
    Collect all GitHub commits for the specified date

    Args:
        date: Date in YYYY-MM-DD format

    Returns:
        List of commit objects with metadata
    """
    activity.logger.info(f"Collecting GitHub commits for {date}")

    # GitHub API integration
    from integrations.github_client import GitHubClient

    github = GitHubClient()
    commits = await github.get_commits_for_date(date)

    activity.logger.info(f"Found {len(commits)} commits")

    return commits

@activity.defn
async def collect_jira_updates(date: str) -> List[Dict]:
    """
    Collect Jira ticket updates for the specified date

    Args:
        date: Date in YYYY-MM-DD format

    Returns:
        List of Jira issue updates
    """
    activity.logger.info(f"Collecting Jira updates for {date}")

    from integrations.jira_client import JiraClient

    jira = JiraClient()
    jql = f"project = REDDYFIT AND updated >= {date} AND updated < {date} + 1d"
    updates = jira.get_issues_by_jql(jql)

    activity.logger.info(f"Found {len(updates)} Jira updates")

    return updates

@activity.defn
async def collect_azure_metrics(date: str) -> Dict:
    """
    Collect Azure infrastructure metrics for the specified date

    Args:
        date: Date in YYYY-MM-DD format

    Returns:
        Dictionary containing costs, deployments, and resource metrics
    """
    activity.logger.info(f"Collecting Azure metrics for {date}")

    from integrations.azure_cost_tracker import AzureCostTracker
    from integrations.azure_devops_client import AzureDevOpsClient

    cost_tracker = AzureCostTracker()
    devops = AzureDevOpsClient()

    # Get costs
    costs = await cost_tracker.get_daily_costs_for_date(date)

    # Get deployments
    deployments = await devops.get_deployments_for_date(date)

    return {
        "costs": costs,
        "deployments": deployments,
        "date": date
    }

@activity.defn
async def aggregate_daily_data(
    commits: List[Dict],
    jira_updates: List[Dict],
    azure_metrics: Dict
) -> Dict:
    """
    Aggregate and enrich collected data

    Combines data from all sources and adds statistical summaries
    """
    activity.logger.info("Aggregating daily data")

    return {
        "commits": commits,
        "jira_updates": jira_updates,
        "deployments": azure_metrics.get("deployments", []),
        "costs": azure_metrics.get("costs", {}),
        "summary_stats": {
            "total_commits": len(commits),
            "total_jira_updates": len(jira_updates),
            "total_deployments": len(azure_metrics.get("deployments", [])),
            "total_cost": azure_metrics.get("costs", {}).get("total", 0)
        }
    }

@activity.defn
async def generate_daily_summary(data: Dict) -> str:
    """
    Generate AI-powered daily summary

    Uses OpenAI Agents to create comprehensive documentation
    """
    activity.logger.info("Generating AI summary")

    from integrations.openai_agents import DocumentationAgents

    agents = DocumentationAgents()
    summary = await agents.generate_daily_summary(data)

    # Log token usage for cost tracking
    activity.logger.info(f"Generated summary ({len(summary)} characters)")

    return summary

@activity.defn
async def create_word_document(content: str, date: str) -> str:
    """
    Create Word document from content

    Args:
        content: Markdown or formatted text content
        date: Date for the report

    Returns:
        Local file path to created document
    """
    activity.logger.info("Creating Word document")

    from docx import Document
    from docx.shared import Inches, Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    import os

    doc = Document()

    # Add logo/header
    header = doc.sections[0].header
    header_para = header.paragraphs[0]
    header_para.text = "ReddyFit Daily Progress Report"
    header_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Add title
    title = doc.add_heading(f"Daily Progress Report", 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Add date
    date_para = doc.add_paragraph(f"Report Date: {date}")
    date_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("")  # Spacing

    # Add content (parse markdown or use as-is)
    for line in content.split("\n"):
        if line.startswith("# "):
            doc.add_heading(line[2:], level=1)
        elif line.startswith("## "):
            doc.add_heading(line[3:], level=2)
        elif line.startswith("### "):
            doc.add_heading(line[4:], level=3)
        elif line.strip():
            doc.add_paragraph(line)

    # Add footer
    footer = doc.sections[0].footer
    footer_para = footer.paragraphs[0]
    footer_para.text = f"Generated automatically on {date} | ReddyFit Documentation System"
    footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Save document
    filename = f"/tmp/daily_report_{date}.docx"
    doc.save(filename)

    activity.logger.info(f"Document saved: {filename}")
    return filename

@activity.defn
async def upload_to_sharepoint(file_path: str, folder: str) -> str:
    """
    Upload document to SharePoint

    Args:
        file_path: Local path to file
        folder: SharePoint folder path

    Returns:
        SharePoint web URL
    """
    activity.logger.info(f"Uploading to SharePoint: {folder}")

    from integrations.sharepoint_uploader import SharePointUploader

    uploader = SharePointUploader()
    url = await uploader.upload_file(file_path, folder)

    activity.logger.info(f"Uploaded successfully: {url}")
    return url

@activity.defn
async def send_teams_notification(
    sharepoint_url: str,
    date: str,
    stats: Dict
) -> None:
    """
    Send Teams channel notification

    Args:
        sharepoint_url: Link to SharePoint document
        date: Report date
        stats: Summary statistics
    """
    activity.logger.info("Sending Teams notification")

    from integrations.teams_notifier import TeamsNotifier

    teams = TeamsNotifier()

    message = f"""
    <h2>📊 Daily Progress Report Available</h2>
    <p><strong>Date:</strong> {date}</p>
    <p><strong>Summary:</strong></p>
    <ul>
        <li>Commits: {stats.get('total_commits', 0)}</li>
        <li>Jira Updates: {stats.get('total_jira_updates', 0)}</li>
        <li>Deployments: {stats.get('total_deployments', 0)}</li>
        <li>Azure Costs: ${stats.get('total_cost', 0):.2f}</li>
    </ul>
    <p><a href="{sharepoint_url}">📄 View Full Report</a></p>
    """

    await teams.send_channel_message(
        team_id="reddyfit-team-id",
        channel_id="investor-channel-id",
        message_content=message,
        document_url=sharepoint_url
    )

    activity.logger.info("Teams notification sent")
```

### Schedule Configuration

```python
# schedules/create_daily_schedule.py
from temporalio.client import Client, Schedule, ScheduleActionStartWorkflow
from temporalio.client import ScheduleSpec, ScheduleCalendarSpec
import asyncio

async def create_daily_documentation_schedule():
    """Create daily documentation schedule in Temporal Cloud"""

    client = await Client.connect(
        "your-namespace.tmprl.cloud:7233",
        namespace="your-namespace",
        tls=True
    )

    schedule = Schedule(
        action=ScheduleActionStartWorkflow(
            workflow="DailyDocumentationWorkflow",
            task_queue="documentation-tasks",
            id="daily-doc-{timestamp}"
        ),
        spec=ScheduleSpec(
            calendars=[
                ScheduleCalendarSpec(
                    hour=18,  # 6 PM UTC
                    minute=0,
                    second=0
                )
            ],
            # Skip weekends (optional)
            skip=[
                ScheduleCalendarSpec(day_of_week=[0, 6])  # Sunday, Saturday
            ]
        )
    )

    handle = await client.create_schedule(
        "daily-documentation-schedule",
        schedule,
        memo={"creator": "automation-system", "purpose": "investor-reporting"}
    )

    print(f"✅ Daily schedule created: {handle.id}")
    return handle

if __name__ == "__main__":
    asyncio.run(create_daily_documentation_schedule())
```

---

## Weekly Investor Report Workflow

### Schedule
**Frequency:** Every Friday at 5:00 PM
**Timezone:** UTC
**Workflow ID:** `weekly-investor-report-{week-number}`

### Workflow Definition

```python
# workflows/weekly_investor_report.py
from temporalio import workflow
from temporalio.common import RetryPolicy
from datetime import timedelta, datetime
from typing import Dict, Any

@workflow.defn
class WeeklyInvestorReportWorkflow:
    """
    Weekly investor report generation workflow

    Aggregates entire week's data, generates comprehensive
    investor report with executive summary, creates PowerPoint
    presentation, and sends via email.
    """

    @workflow.run
    async def run(self, week_start: str = None) -> Dict[str, Any]:
        """
        Execute weekly investor report workflow

        Args:
            week_start: Week start date (Monday, YYYY-MM-DD)

        Returns:
            Dict containing report URLs and delivery status
        """

        if not week_start:
            # Get Monday of current week
            today = datetime.now()
            week_start = (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")

        workflow.logger.info(f"Starting weekly report for week of {week_start}")

        retry_policy = RetryPolicy(
            initial_interval=timedelta(seconds=2),
            maximum_interval=timedelta(seconds=60),
            maximum_attempts=5,
            backoff_coefficient=2.0
        )

        # ===== Step 1: Aggregate Week's Data =====
        workflow.logger.info("Step 1/7: Aggregating week's data")

        weekly_data = await workflow.execute_activity(
            aggregate_weekly_data,
            args=[week_start],
            start_to_close_timeout=timedelta(minutes=10),
            retry_policy=retry_policy
        )

        # ===== Step 2: Generate AI Summaries =====
        workflow.logger.info("Step 2/7: Generating AI summaries")

        # Generate different report sections in parallel
        exec_summary_task = workflow.execute_activity(
            generate_executive_summary,
            args=[weekly_data],
            start_to_close_timeout=timedelta(minutes=10),
            retry_policy=retry_policy
        )

        tech_details_task = workflow.execute_activity(
            generate_technical_details,
            args=[weekly_data],
            start_to_close_timeout=timedelta(minutes=10),
            retry_policy=retry_policy
        )

        metrics_analysis_task = workflow.execute_activity(
            generate_metrics_analysis,
            args=[weekly_data],
            start_to_close_timeout=timedelta(minutes=10),
            retry_policy=retry_policy
        )

        exec_summary, tech_details, metrics = await workflow.gather(
            exec_summary_task,
            tech_details_task,
            metrics_analysis_task
        )

        # ===== Step 3: Create Documents =====
        workflow.logger.info("Step 3/7: Creating documents")

        # Create all documents in parallel
        word_doc_task = workflow.execute_activity(
            create_investor_word_report,
            args=[exec_summary, tech_details, metrics, week_start],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy
        )

        excel_task = workflow.execute_activity(
            create_metrics_excel,
            args=[weekly_data, week_start],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy
        )

        ppt_task = workflow.execute_activity(
            create_investor_presentation,
            args=[exec_summary, weekly_data, week_start],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy
        )

        word_path, excel_path, ppt_path = await workflow.gather(
            word_doc_task,
            excel_task,
            ppt_task
        )

        # ===== Step 4: Upload to SharePoint =====
        workflow.logger.info("Step 4/7: Uploading to SharePoint")

        upload_tasks = [
            workflow.execute_activity(
                upload_to_sharepoint,
                args=[word_path, f"Weekly Reports/{week_start[:7]}"],
                start_to_close_timeout=timedelta(minutes=5),
                retry_policy=retry_policy
            ),
            workflow.execute_activity(
                upload_to_sharepoint,
                args=[excel_path, f"Weekly Reports/{week_start[:7]}"],
                start_to_close_timeout=timedelta(minutes=5),
                retry_policy=retry_policy
            ),
            workflow.execute_activity(
                upload_to_sharepoint,
                args=[ppt_path, f"Weekly Reports/{week_start[:7]}"],
                start_to_close_timeout=timedelta(minutes=5),
                retry_policy=retry_policy
            )
        ]

        word_url, excel_url, ppt_url = await workflow.gather(*upload_tasks)

        # ===== Step 5: Send Email to Investors =====
        workflow.logger.info("Step 5/7: Sending investor email")

        await workflow.execute_activity(
            send_investor_email,
            args=[word_url, excel_url, ppt_url, week_start, exec_summary],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy
        )

        # ===== Step 6: Send Teams Notification =====
        workflow.logger.info("Step 6/7: Sending Teams notification")

        await workflow.execute_activity(
            send_weekly_teams_notification,
            args=[word_url, week_start],
            start_to_close_timeout=timedelta(minutes=2),
            retry_policy=RetryPolicy(maximum_attempts=3)
        )

        # ===== Step 7: Archive Previous Week's Data =====
        workflow.logger.info("Step 7/7: Archiving data")

        await workflow.execute_activity(
            archive_weekly_data,
            args=[week_start],
            start_to_close_timeout=timedelta(minutes=5)
        )

        workflow.logger.info("Weekly investor report complete")

        return {
            "success": True,
            "week_start": week_start,
            "word_report": word_url,
            "excel_metrics": excel_url,
            "presentation": ppt_url,
            "email_sent": True
        }
```

---

## Real-Time Event Handlers

### GitHub Commit Handler

```python
# workflows/github_commit_handler.py
from temporalio import workflow
from datetime import timedelta

@workflow.defn
class GitHubCommitHandlerWorkflow:
    """Handle real-time GitHub commit events"""

    @workflow.run
    async def run(self, commit_data: dict) -> str:
        """
        Process GitHub commit and generate documentation

        Args:
            commit_data: Webhook payload from GitHub

        Returns:
            SharePoint URL of generated documentation
        """

        workflow.logger.info(f"Processing commit: {commit_data['sha'][:8]}")

        # Analyze commit
        analysis = await workflow.execute_activity(
            analyze_commit,
            args=[commit_data],
            start_to_close_timeout=timedelta(minutes=3)
        )

        # Generate documentation if significant
        if analysis['is_significant']:
            doc_content = await workflow.execute_activity(
                generate_commit_documentation,
                args=[commit_data, analysis],
                start_to_close_timeout=timedelta(minutes=5)
            )

            # Store in knowledge base
            await workflow.execute_activity(
                store_in_knowledge_base,
                args=[doc_content, commit_data['sha']],
                start_to_close_timeout=timedelta(minutes=2)
            )

        return "Documentation generated"
```

### Jira Ticket Handler

```python
# workflows/jira_ticket_handler.py
from temporalio import workflow
from datetime import timedelta

@workflow.defn
class JiraTicketHandlerWorkflow:
    """Handle real-time Jira ticket events"""

    @workflow.run
    async def run(self, jira_event: dict) -> str:
        """
        Process Jira ticket update and generate documentation

        Args:
            jira_event: Webhook payload from Jira

        Returns:
            Status message
        """

        event_type = jira_event['webhookEvent']
        issue = jira_event['issue']

        workflow.logger.info(f"Processing Jira {event_type}: {issue['key']}")

        # Handle completed tickets
        if self._is_ticket_completed(issue):
            summary = await workflow.execute_activity(
                generate_ticket_summary,
                args=[issue],
                start_to_close_timeout=timedelta(minutes=5)
            )

            await workflow.execute_activity(
                store_in_knowledge_base,
                args=[summary, issue['key']],
                start_to_close_timeout=timedelta(minutes=2)
            )

        return f"Processed {issue['key']}"

    def _is_ticket_completed(self, issue: dict) -> bool:
        """Check if ticket status is 'Done' or 'Resolved'"""
        status = issue['fields']['status']['name']
        return status in ['Done', 'Resolved', 'Closed']
```

### Azure Deployment Handler

```python
# workflows/azure_deployment_handler.py
from temporalio import workflow
from datetime import timedelta

@workflow.defn
class AzureDeploymentHandlerWorkflow:
    """Handle Azure deployment events"""

    @workflow.run
    async def run(self, deployment_data: dict) -> str:
        """
        Process Azure deployment and log changes

        Args:
            deployment_data: Deployment information

        Returns:
            Documentation URL
        """

        workflow.logger.info(f"Processing deployment: {deployment_data['id']}")

        # Collect deployment details
        details = await workflow.execute_activity(
            collect_deployment_details,
            args=[deployment_data],
            start_to_close_timeout=timedelta(minutes=5)
        )

        # Generate infrastructure change log
        changelog = await workflow.execute_activity(
            generate_infrastructure_changelog,
            args=[details],
            start_to_close_timeout=timedelta(minutes=5)
        )

        # Store changelog
        url = await workflow.execute_activity(
            upload_to_sharepoint,
            args=[changelog, "Infrastructure Changes"],
            start_to_close_timeout=timedelta(minutes=5)
        )

        # Notify DevOps team
        await workflow.execute_activity(
            send_teams_notification,
            args=[url, "DevOps", details],
            start_to_close_timeout=timedelta(minutes=2)
        )

        return url
```

---

## Error Handling Strategy

### Retry Policies

```python
# Configuration for different activity types

# Critical activities (must succeed)
CRITICAL_RETRY_POLICY = RetryPolicy(
    initial_interval=timedelta(seconds=5),
    maximum_interval=timedelta(minutes=2),
    maximum_attempts=10,
    backoff_coefficient=2.0,
    non_retryable_error_types=["AuthenticationError", "ConfigurationError"]
)

# Standard activities
STANDARD_RETRY_POLICY = RetryPolicy(
    initial_interval=timedelta(seconds=1),
    maximum_interval=timedelta(seconds=30),
    maximum_attempts=5,
    backoff_coefficient=2.0
)

# Non-critical activities (notifications, etc.)
NON_CRITICAL_RETRY_POLICY = RetryPolicy(
    initial_interval=timedelta(seconds=1),
    maximum_interval=timedelta(seconds=10),
    maximum_attempts=3,
    backoff_coefficient=1.5
)
```

### Error Handling Patterns

```python
# Pattern 1: Graceful degradation
try:
    ai_summary = await workflow.execute_activity(
        generate_ai_summary,
        args=[data],
        retry_policy=STANDARD_RETRY_POLICY
    )
except Exception as e:
    workflow.logger.warning(f"AI generation failed: {e}")
    # Fall back to template-based summary
    ai_summary = generate_template_summary(data)

# Pattern 2: Skip non-critical steps
try:
    await workflow.execute_activity(
        send_teams_notification,
        args=[url],
        retry_policy=NON_CRITICAL_RETRY_POLICY
    )
except Exception as e:
    workflow.logger.warning(f"Teams notification failed (non-critical): {e}")
    # Continue workflow

# Pattern 3: Compensating actions
try:
    await workflow.execute_activity(upload_document)
except Exception as e:
    # Compensate by storing locally and scheduling retry
    await workflow.execute_activity(save_to_local_backup)
    # Signal for manual intervention
    await workflow.signal_with_start("manual_upload_needed")
```

### Circuit Breaker Pattern

```python
# activities/circuit_breaker.py
from datetime import datetime, timedelta
from typing import Dict

class CircuitBreaker:
    """Circuit breaker for external API calls"""

    def __init__(self, failure_threshold: int = 5, timeout: timedelta = timedelta(minutes=5)):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures: Dict[str, int] = {}
        self.last_failure_time: Dict[str, datetime] = {}
        self.state: Dict[str, str] = {}  # "closed", "open", "half-open"

    def is_open(self, service: str) -> bool:
        """Check if circuit is open for a service"""
        if service not in self.state:
            self.state[service] = "closed"
            return False

        if self.state[service] == "closed":
            return False

        if self.state[service] == "open":
            # Check if timeout has passed
            if datetime.now() - self.last_failure_time[service] > self.timeout:
                self.state[service] = "half-open"
                return False
            return True

        return False

    def record_success(self, service: str):
        """Record successful call"""
        self.failures[service] = 0
        self.state[service] = "closed"

    def record_failure(self, service: str):
        """Record failed call"""
        self.failures[service] = self.failures.get(service, 0) + 1
        self.last_failure_time[service] = datetime.now()

        if self.failures[service] >= self.failure_threshold:
            self.state[service] = "open"
```

---

## Monitoring & Observability

### Metrics to Track

```python
# metrics/workflow_metrics.py

WORKFLOW_METRICS = {
    "daily_documentation": {
        "execution_time": "histogram",
        "success_rate": "gauge",
        "data_collection_time": "histogram",
        "ai_generation_time": "histogram",
        "upload_time": "histogram",
        "total_commits_processed": "counter",
        "total_jira_updates_processed": "counter"
    },
    "weekly_investor_report": {
        "execution_time": "histogram",
        "success_rate": "gauge",
        "email_delivery_rate": "gauge",
        "document_generation_time": "histogram"
    }
}

# Log metrics in activities
@activity.defn
async def collect_github_commits(date: str) -> List[Dict]:
    start_time = time.time()

    commits = await fetch_commits(date)

    duration = time.time() - start_time
    activity.heartbeat({"metric": "data_collection_time", "value": duration})

    return commits
```

### Logging Strategy

```python
# All workflows and activities use structured logging

workflow.logger.info(
    "Daily documentation started",
    extra={
        "workflow_id": workflow.info().workflow_id,
        "date": date,
        "run_id": workflow.info().run_id
    }
)

activity.logger.info(
    "Collected GitHub commits",
    extra={
        "activity": "collect_github_commits",
        "commit_count": len(commits),
        "date": date,
        "duration_ms": duration * 1000
    }
)
```

### Alerting Rules

```yaml
# alerting_rules.yaml

alerts:
  - name: DailyDocumentationFailed
    condition: workflow_status == "failed" AND workflow_type == "DailyDocumentationWorkflow"
    severity: high
    notify:
      - teams: "#devops-alerts"
      - email: "devops@reddyfit.com"

  - name: WeeklyReportNotDelivered
    condition: workflow_type == "WeeklyInvestorReportWorkflow" AND email_sent == false
    severity: critical
    notify:
      - teams: "#leadership"
      - email: "cto@reddyfit.com"
      - pagerduty: "on-call-engineer"

  - name: HighAPIFailureRate
    condition: api_failure_rate > 0.1 OVER 15m
    severity: medium
    notify:
      - teams: "#devops-alerts"

  - name: CostAnomaly
    condition: daily_cost > 150% OF 7day_average
    severity: medium
    notify:
      - teams: "#finance-alerts"
      - email: "finance@reddyfit.com"
```

---

## Summary

This workflow design provides:

1. **Robust Daily Documentation**: Fully automated, handles failures gracefully
2. **Comprehensive Weekly Reports**: Multi-format investor reports delivered reliably
3. **Real-Time Event Processing**: Immediate documentation of significant changes
4. **Error Resilience**: Retry policies, circuit breakers, graceful degradation
5. **Full Observability**: Metrics, logging, and alerting for all workflows

The system is production-ready with proper error handling, monitoring, and failover strategies to ensure reliable operation.
