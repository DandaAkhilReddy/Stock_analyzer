# Document Templates
Templates for Automated Documentation Generation

## Overview

This document contains all document templates used by the automation system. Templates are designed for:
- **Word Documents**: Daily progress reports and technical documentation
- **Excel Spreadsheets**: Metrics tracking and data visualization
- **PowerPoint Presentations**: Weekly investor presentations
- **Jira Tickets**: Automated issue creation templates

---

## Table of Contents

1. [Daily Progress Report (Word)](#daily-progress-report-word)
2. [Weekly Investor Report (Word)](#weekly-investor-report-word)
3. [Metrics Tracker (Excel)](#metrics-tracker-excel)
4. [Weekly Investor Presentation (PowerPoint)](#weekly-investor-presentation-powerpoint)
5. [Jira Ticket Templates](#jira-ticket-templates)

---

## Daily Progress Report (Word)

### Template Structure

```
ReddyFit Daily Progress Report
===============================
Date: {YYYY-MM-DD}
Report Generated: {timestamp}

EXECUTIVE SUMMARY
-----------------
{AI-generated 2-3 sentence overview}

DEVELOPMENT PROGRESS
--------------------
Commits Today: {count}
Files Changed: {count}
Lines Added/Removed: +{added} / -{removed}

Key Changes:
• {commit 1 summary}
• {commit 2 summary}
• {commit 3 summary}

JIRA ACTIVITY
-------------
Tickets Updated: {count}
Tickets Completed: {count}
New Tickets: {count}

Completed Work:
✓ {ticket-key}: {ticket summary}
  - Problem: {problem description}
  - Solution: {solution description}
  - Impact: {impact statement}

In Progress:
→ {ticket-key}: {ticket summary} ({progress%}%)

INFRASTRUCTURE & DEPLOYMENTS
-----------------------------
Deployments: {count}
Infrastructure Changes: {count}

Deployment Details:
• {environment}: {service} deployed at {time}
  Status: ✓ Success
  Duration: {duration}

AZURE COSTS
-----------
Today's Cost: ${amount}
Month-to-Date: ${amount}
Projected Monthly: ${amount}

Top Services:
1. {service}: ${amount}
2. {service}: ${amount}
3. {service}: ${amount}

BLOCKERS & ISSUES
-----------------
{List of any blockers or issues encountered}

NEXT STEPS
----------
{AI-generated list of planned activities}

---
Generated automatically by ReddyFit Documentation System
```

### Python Implementation

```python
# templates/daily_report_template.py
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from datetime import datetime
from typing import Dict

def create_daily_report(data: Dict) -> Document:
    """
    Create daily progress report from template

    Args:
        data: Aggregated daily data with all sections

    Returns:
        Document object ready to save
    """

    doc = Document()

    # Configure styles
    _configure_styles(doc)

    # Header
    _add_header(doc, data['date'])

    # Executive Summary
    _add_section(doc, "EXECUTIVE SUMMARY", data['executive_summary'])

    # Development Progress
    _add_development_section(doc, data['commits'])

    # Jira Activity
    _add_jira_section(doc, data['jira_updates'])

    # Infrastructure
    _add_infrastructure_section(doc, data['deployments'])

    # Azure Costs
    _add_costs_section(doc, data['costs'])

    # Blockers
    _add_blockers_section(doc, data['blockers'])

    # Next Steps
    _add_next_steps_section(doc, data['next_steps'])

    # Footer
    _add_footer(doc)

    return doc

def _configure_styles(doc: Document):
    """Configure custom styles"""

    styles = doc.styles

    # Heading 1 style
    heading1 = styles['Heading 1']
    heading1.font.name = 'Calibri'
    heading1.font.size = Pt(16)
    heading1.font.color.rgb = RGBColor(0, 112, 192)
    heading1.font.bold = True

    # Section heading style
    section_heading = styles.add_style('Section Heading', WD_STYLE_TYPE.PARAGRAPH)
    section_heading.font.name = 'Calibri'
    section_heading.font.size = Pt(14)
    section_heading.font.color.rgb = RGBColor(68, 114, 196)
    section_heading.font.bold = True

def _add_header(doc: Document, date: str):
    """Add document header"""

    # Title
    title = doc.add_heading('ReddyFit Daily Progress Report', 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Date
    date_para = doc.add_paragraph(f'Report Date: {date}')
    date_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    date_para.runs[0].font.size = Pt(12)

    # Timestamp
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    time_para = doc.add_paragraph(f'Generated: {timestamp}')
    time_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    time_para.runs[0].font.size = Pt(10)
    time_para.runs[0].font.color.rgb = RGBColor(128, 128, 128)

    doc.add_paragraph('')  # Spacing

def _add_section(doc: Document, title: str, content: str):
    """Add generic section"""

    doc.add_heading(title, level=1)
    doc.add_paragraph(content)
    doc.add_paragraph('')  # Spacing

def _add_development_section(doc: Document, commits: list):
    """Add development progress section"""

    doc.add_heading('DEVELOPMENT PROGRESS', level=1)

    # Statistics
    stats = doc.add_paragraph()
    stats.add_run(f'Commits Today: {len(commits)}\\n')
    stats.add_run(f'Files Changed: {sum(c["files_changed"] for c in commits)}\\n')
    stats.add_run(f'Lines Changed: +{sum(c["additions"] for c in commits)} / -{sum(c["deletions"] for c in commits)}')

    # Key changes
    doc.add_paragraph('Key Changes:', style='Heading 2')

    for commit in commits[:10]:  # Top 10 commits
        bullet = doc.add_paragraph(style='List Bullet')
        bullet.add_run(f'{commit["sha"][:8]}: ').bold = True
        bullet.add_run(commit["message"].split('\\n')[0])

    doc.add_paragraph('')

def _add_jira_section(doc: Document, jira_updates: list):
    """Add Jira activity section"""

    doc.add_heading('JIRA ACTIVITY', level=1)

    completed = [j for j in jira_updates if j['status'] in ['Done', 'Resolved']]
    in_progress = [j for j in jira_updates if j['status'] == 'In Progress']
    new_tickets = [j for j in jira_updates if j.get('is_new', False)]

    # Statistics
    stats = doc.add_paragraph()
    stats.add_run(f'Tickets Updated: {len(jira_updates)}\\n')
    stats.add_run(f'Tickets Completed: {len(completed)}\\n')
    stats.add_run(f'New Tickets: {len(new_tickets)}')

    # Completed work
    if completed:
        doc.add_paragraph('Completed Work:', style='Heading 2')
        for ticket in completed:
            p = doc.add_paragraph(style='List Bullet')
            p.add_run(f'✓ {ticket["key"]}: {ticket["summary"]}\\n').bold = True
            if ticket.get('problem_solution'):
                p.add_run(f'  Problem: {ticket["problem_solution"]["problem"]}\\n')
                p.add_run(f'  Solution: {ticket["problem_solution"]["solution"]}\\n')

    # In progress
    if in_progress:
        doc.add_paragraph('In Progress:', style='Heading 2')
        for ticket in in_progress:
            p = doc.add_paragraph(style='List Bullet')
            p.add_run(f'→ {ticket["key"]}: {ticket["summary"]}')

    doc.add_paragraph('')

def _add_infrastructure_section(doc: Document, deployments: list):
    """Add infrastructure section"""

    doc.add_heading('INFRASTRUCTURE & DEPLOYMENTS', level=1)

    stats = doc.add_paragraph()
    stats.add_run(f'Deployments: {len(deployments)}\\n')

    if deployments:
        doc.add_paragraph('Deployment Details:', style='Heading 2')
        for deployment in deployments:
            p = doc.add_paragraph(style='List Bullet')
            p.add_run(f'{deployment["environment"]}: {deployment["service"]} ')
            p.add_run(f'deployed at {deployment["time"]}\\n')
            p.add_run(f'  Status: ')
            status_run = p.add_run(f'✓ {deployment["status"]}\\n')
            if deployment['status'] == 'Success':
                status_run.font.color.rgb = RGBColor(0, 176, 80)
            p.add_run(f'  Duration: {deployment["duration"]}')

    doc.add_paragraph('')

def _add_costs_section(doc: Document, costs: dict):
    """Add Azure costs section"""

    doc.add_heading('AZURE COSTS', level=1)

    stats = doc.add_paragraph()
    stats.add_run(f'Today\\'s Cost: ${costs["today"]:.2f}\\n')
    stats.add_run(f'Month-to-Date: ${costs["mtd"]:.2f}\\n')
    stats.add_run(f'Projected Monthly: ${costs["projected"]:.2f}')

    doc.add_paragraph('Top Services:', style='Heading 2')

    table = doc.add_table(rows=1, cols=2)
    table.style = 'Light Grid Accent 1'

    # Header row
    header_cells = table.rows[0].cells
    header_cells[0].text = 'Service'
    header_cells[1].text = 'Cost'

    # Data rows
    for service, cost in costs['by_service'][:5]:
        row_cells = table.add_row().cells
        row_cells[0].text = service
        row_cells[1].text = f'${cost:.2f}'

    doc.add_paragraph('')

def _add_blockers_section(doc: Document, blockers: list):
    """Add blockers section"""

    doc.add_heading('BLOCKERS & ISSUES', level=1)

    if blockers:
        for blocker in blockers:
            p = doc.add_paragraph(style='List Bullet')
            p.add_run(f'⚠️ {blocker["title"]}\\n').bold = True
            p.add_run(f'  {blocker["description"]}\\n')
            if blocker.get('mitigation'):
                p.add_run(f'  Mitigation: {blocker["mitigation"]}')
    else:
        doc.add_paragraph('No blockers reported.')

    doc.add_paragraph('')

def _add_next_steps_section(doc: Document, next_steps: list):
    """Add next steps section"""

    doc.add_heading('NEXT STEPS', level=1)

    for step in next_steps:
        p = doc.add_paragraph(style='List Bullet')
        p.add_run(step)

    doc.add_paragraph('')

def _add_footer(doc: Document):
    """Add document footer"""

    doc.add_paragraph('─' * 80)

    footer = doc.add_paragraph('Generated automatically by ReddyFit Documentation System')
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.runs[0].font.size = Pt(9)
    footer.runs[0].font.color.rgb = RGBColor(128, 128, 128)
```

---

## Weekly Investor Report (Word)

### Template Structure

```
REDDYFIT
Weekly Investor Update
======================
Week of {start_date} to {end_date}
Report Period: Week {week_number}, {year}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY
-----------------
{AI-generated executive summary highlighting:
 - Key accomplishments
 - Major milestones
 - Critical metrics
 - Challenges and resolutions
 - Outlook for next week}

KEY METRICS
-----------
┌─────────────────────────────────────────────┐
│ Development Velocity                        │
│ • Commits:           {count} (+{%} vs last) │
│ • Pull Requests:     {count}                │
│ • Code Reviews:      {count}                │
│ • Features Deployed: {count}                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Sprint Progress                             │
│ • Story Points Completed: {points}/{total}  │
│ • Velocity:              {velocity}         │
│ • Sprint Completion:     {%}%               │
│ • Burndown Status:       On Track / Behind  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Infrastructure & Costs                      │
│ • Azure Spend:       ${amount}              │
│ • Deployment Count:  {count}                │
│ • Uptime:           {%}%                    │
│ • P0 Incidents:     {count}                 │
└─────────────────────────────────────────────┘

ACCOMPLISHMENTS THIS WEEK
--------------------------
🎯 Major Milestones:
   • {milestone 1}
   • {milestone 2}
   • {milestone 3}

✨ Features Delivered:
   • {feature 1}: {description}
   • {feature 2}: {description}

🔧 Technical Improvements:
   • {improvement 1}
   • {improvement 2}

CHALLENGES & RESOLUTIONS
-------------------------
Challenge: {description}
Impact: {impact level}
Resolution: {how it was resolved}
Status: ✓ Resolved | ⏳ In Progress

NEXT WEEK'S PRIORITIES
----------------------
1. {priority 1}
2. {priority 2}
3. {priority 3}

FINANCIAL SUMMARY
-----------------
Infrastructure Costs: ${amount}
Development Costs: ${amount}
Total Burn Rate: ${amount}/week

Compared to Budget:
• Under budget: ${amount} ({%}%)
• Projected monthly: ${amount}

TEAM UPDATES
------------
Team Size: {count}
New Hires: {count}
Open Positions: {count}

RISKS & MITIGATION
------------------
{AI-generated risk assessment and mitigation strategies}

APPENDIX
--------
• Detailed Metrics Dashboard (Excel attached)
• Sprint Burndown Chart
• Cost Breakdown by Service
• Deployment History

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confidential - For Investor Use Only
Generated: {timestamp}
```

---

## Metrics Tracker (Excel)

### Sheet 1: Weekly Overview

```python
# templates/excel_template.py
from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, PieChart, Reference
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def create_weekly_metrics_excel(data: dict, week_start: str) -> Workbook:
    """Create weekly metrics Excel workbook"""

    wb = Workbook()

    # Sheet 1: Weekly Overview
    ws_overview = wb.active
    ws_overview.title = "Weekly Overview"
    _create_overview_sheet(ws_overview, data)

    # Sheet 2: Development Metrics
    ws_dev = wb.create_sheet("Development Metrics")
    _create_development_sheet(ws_dev, data['development'])

    # Sheet 3: Sprint Progress
    ws_sprint = wb.create_sheet("Sprint Progress")
    _create_sprint_sheet(ws_sprint, data['sprint'])

    # Sheet 4: Cost Analysis
    ws_costs = wb.create_sheet("Cost Analysis")
    _create_cost_sheet(ws_costs, data['costs'])

    # Sheet 5: Trends (Historical)
    ws_trends = wb.create_sheet("Trends")
    _create_trends_sheet(ws_trends, data['historical'])

    return wb

def _create_overview_sheet(ws, data):
    """Create overview dashboard sheet"""

    # Title
    ws['A1'] = 'ReddyFit Weekly Metrics Dashboard'
    ws['A1'].font = Font(size=18, bold=True, color="FFFFFF")
    ws['A1'].fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    ws.merge_cells('A1:F1')

    # Week info
    ws['A2'] = f'Week of {data["week_start"]}'
    ws['A2'].font = Font(size=12)

    # Key Metrics Summary (Row 4-10)
    metrics = [
        ['Metric', 'This Week', 'Last Week', 'Change', 'Target', 'Status'],
        ['Commits', data['commits'], data['commits_last'], f"{data['commits_change']}%", '50', '✓'],
        ['Story Points', data['story_points'], data['story_points_last'], f"{data['sp_change']}%", '25', '✓'],
        ['Deployments', data['deployments'], data['deployments_last'], f"{data['deploy_change']}%", '10', '✓'],
        ['Azure Cost ($)', f"${data['cost']}", f"${data['cost_last']}", f"{data['cost_change']}%", '$500', '⚠'],
        ['Uptime (%)', f"{data['uptime']}%", f"{data['uptime_last']}%", f"{data['uptime_change']}%", '99.9%', '✓']
    ]

    for row_idx, row_data in enumerate(metrics, start=4):
        for col_idx, value in enumerate(row_data, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=value)

            # Header row styling
            if row_idx == 4:
                cell.font = Font(bold=True, color="FFFFFF")
                cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
                cell.alignment = Alignment(horizontal="center")

    # Auto-fit columns
    for col in range(1, 7):
        ws.column_dimensions[get_column_letter(col)].width = 15

    # Add chart: Commits Trend
    _add_commits_chart(ws, data)

def _add_commits_chart(ws, data):
    """Add commits trend chart"""

    # Create data for chart (last 4 weeks)
    chart_data_start = 12
    ws.cell(chart_data_start, 1, "Week")
    ws.cell(chart_data_start, 2, "Commits")

    for idx, week_data in enumerate(data['historical'][-4:], start=chart_data_start + 1):
        ws.cell(idx, 1, week_data['week'])
        ws.cell(idx, 2, week_data['commits'])

    # Create chart
    chart = LineChart()
    chart.title = "Commit Trend (Last 4 Weeks)"
    chart.y_axis.title = "Commits"
    chart.x_axis.title = "Week"

    data_ref = Reference(ws, min_col=2, min_row=chart_data_start, max_row=chart_data_start + 4)
    cats_ref = Reference(ws, min_col=1, min_row=chart_data_start + 1, max_row=chart_data_start + 4)

    chart.add_data(data_ref, titles_from_data=True)
    chart.set_categories(cats_ref)

    ws.add_chart(chart, "H4")

def _create_development_sheet(ws, dev_data):
    """Create development metrics sheet"""

    ws['A1'] = 'Development Metrics'
    ws['A1'].font = Font(size=16, bold=True)

    # Commits by day
    ws['A3'] = 'Commits by Day'
    headers = ['Day', 'Commits', 'Files Changed', 'Lines Added', 'Lines Deleted']

    for col_idx, header in enumerate(headers, start=1):
        cell = ws.cell(4, col_idx, header)
        cell.font = Font(bold=True)

    for row_idx, day_data in enumerate(dev_data['by_day'], start=5):
        ws.cell(row_idx, 1, day_data['day'])
        ws.cell(row_idx, 2, day_data['commits'])
        ws.cell(row_idx, 3, day_data['files'])
        ws.cell(row_idx, 4, day_data['additions'])
        ws.cell(row_idx, 5, day_data['deletions'])

    # Pull Requests
    ws['A12'] = 'Pull Requests'
    pr_headers = ['PR Number', 'Title', 'Author', 'Status', 'Created', 'Merged']

    for col_idx, header in enumerate(pr_headers, start=1):
        cell = ws.cell(13, col_idx, header)
        cell.font = Font(bold=True)

    for row_idx, pr in enumerate(dev_data['pull_requests'], start=14):
        ws.cell(row_idx, 1, pr['number'])
        ws.cell(row_idx, 2, pr['title'])
        ws.cell(row_idx, 3, pr['author'])
        ws.cell(row_idx, 4, pr['status'])
        ws.cell(row_idx, 5, pr['created_at'])
        ws.cell(row_idx, 6, pr.get('merged_at', ''))

def _create_sprint_sheet(ws, sprint_data):
    """Create sprint progress sheet"""

    ws['A1'] = 'Sprint Progress'
    ws['A1'].font = Font(size=16, bold=True)

    # Sprint summary
    summary = [
        ['Sprint Name', sprint_data['name']],
        ['Start Date', sprint_data['start_date']],
        ['End Date', sprint_data['end_date']],
        ['Story Points Planned', sprint_data['planned_points']],
        ['Story Points Completed', sprint_data['completed_points']],
        ['Completion %', f"{sprint_data['completion_pct']}%"],
        ['Velocity', sprint_data['velocity']]
    ]

    for row_idx, (label, value) in enumerate(summary, start=3):
        ws.cell(row_idx, 1, label).font = Font(bold=True)
        ws.cell(row_idx, 2, value)

    # Burndown chart data
    ws['A12'] = 'Burndown Chart Data'
    ws.cell(13, 1, 'Day')
    ws.cell(13, 2, 'Remaining Points')
    ws.cell(13, 3, 'Ideal')

    for row_idx, day_data in enumerate(sprint_data['burndown'], start=14):
        ws.cell(row_idx, 1, day_data['day'])
        ws.cell(row_idx, 2, day_data['remaining'])
        ws.cell(row_idx, 3, day_data['ideal'])

    # Add burndown chart
    chart = LineChart()
    chart.title = "Sprint Burndown"
    chart.y_axis.title = "Story Points"
    chart.x_axis.title = "Day"

    data_ref = Reference(ws, min_col=2, max_col=3, min_row=13, max_row=13 + len(sprint_data['burndown']))
    cats_ref = Reference(ws, min_col=1, min_row=14, max_row=13 + len(sprint_data['burndown']))

    chart.add_data(data_ref, titles_from_data=True)
    chart.set_categories(cats_ref)

    ws.add_chart(chart, "E3")

def _create_cost_sheet(ws, cost_data):
    """Create cost analysis sheet"""

    ws['A1'] = 'Azure Cost Analysis'
    ws['A1'].font = Font(size=16, bold=True)

    # Weekly costs
    ws['A3'] = 'Weekly Summary'
    summary = [
        ['Total Cost', f"${cost_data['total']:.2f}"],
        ['Daily Average', f"${cost_data['daily_avg']:.2f}"],
        ['Projected Monthly', f"${cost_data['projected_monthly']:.2f}"],
        ['vs. Budget', f"{cost_data['vs_budget']}%"]
    ]

    for row_idx, (label, value) in enumerate(summary, start=4):
        ws.cell(row_idx, 1, label).font = Font(bold=True)
        ws.cell(row_idx, 2, value)

    # Cost by service
    ws['A10'] = 'Cost by Service'
    ws.cell(11, 1, 'Service').font = Font(bold=True)
    ws.cell(11, 2, 'Cost').font = Font(bold=True)
    ws.cell(11, 3, '% of Total').font = Font(bold=True)

    for row_idx, service_data in enumerate(cost_data['by_service'], start=12):
        ws.cell(row_idx, 1, service_data['service'])
        ws.cell(row_idx, 2, f"${service_data['cost']:.2f}")
        ws.cell(row_idx, 3, f"{service_data['percentage']:.1f}%")

    # Pie chart
    pie = PieChart()
    pie.title = "Cost by Service"

    labels = Reference(ws, min_col=1, min_row=12, max_row=11 + len(cost_data['by_service']))
    data = Reference(ws, min_col=2, min_row=11, max_row=11 + len(cost_data['by_service']))

    pie.add_data(data, titles_from_data=True)
    pie.set_categories(labels)

    ws.add_chart(pie, "E10")

def _create_trends_sheet(ws, historical_data):
    """Create historical trends sheet"""

    ws['A1'] = 'Historical Trends'
    ws['A1'].font = Font(size=16, bold=True)

    # Headers
    headers = ['Week', 'Commits', 'Story Points', 'Deployments', 'Cost', 'Velocity']

    for col_idx, header in enumerate(headers, start=1):
        cell = ws.cell(3, col_idx, header)
        cell.font = Font(bold=True)

    # Data (last 12 weeks)
    for row_idx, week_data in enumerate(historical_data[-12:], start=4):
        ws.cell(row_idx, 1, week_data['week'])
        ws.cell(row_idx, 2, week_data['commits'])
        ws.cell(row_idx, 3, week_data['story_points'])
        ws.cell(row_idx, 4, week_data['deployments'])
        ws.cell(row_idx, 5, f"${week_data['cost']:.2f}")
        ws.cell(row_idx, 6, week_data['velocity'])
```

---

## Weekly Investor Presentation (PowerPoint)

### Slide Structure

```python
# templates/powerpoint_template.py
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor

def create_weekly_presentation(data: dict, week_start: str) -> Presentation:
    """Create weekly investor presentation"""

    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)

    # Slide 1: Title
    _add_title_slide(prs, data, week_start)

    # Slide 2: Executive Summary
    _add_executive_summary_slide(prs, data['executive_summary'])

    # Slide 3: Key Metrics
    _add_metrics_slide(prs, data['metrics'])

    # Slide 4: Accomplishments
    _add_accomplishments_slide(prs, data['accomplishments'])

    # Slide 5: Development Progress
    _add_development_slide(prs, data['development'])

    # Slide 6: Financial Summary
    _add_financial_slide(prs, data['costs'])

    # Slide 7: Challenges & Mitigations
    _add_challenges_slide(prs, data['challenges'])

    # Slide 8: Next Steps
    _add_next_steps_slide(prs, data['next_steps'])

    return prs

def _add_title_slide(prs, data, week_start):
    """Add title slide"""

    slide_layout = prs.slide_layouts[6]  # Blank layout
    slide = prs.slides.add_slide(slide_layout)

    # Background color
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = RGBColor(68, 114, 196)

    # Title
    title_box = slide.shapes.add_textbox(
        Inches(1), Inches(2.5), Inches(8), Inches(1)
    )
    title_frame = title_box.text_frame
    title_para = title_frame.add_paragraph()
    title_para.text = "REDDYFIT"
    title_para.font.size = Pt(60)
    title_para.font.bold = True
    title_para.font.color.rgb = RGBColor(255, 255, 255)
    title_para.alignment = PP_ALIGN.CENTER

    # Subtitle
    subtitle_box = slide.shapes.add_textbox(
        Inches(1), Inches(3.5), Inches(8), Inches(0.5)
    )
    subtitle_frame = subtitle_box.text_frame
    subtitle_para = subtitle_frame.add_paragraph()
    subtitle_para.text = "Weekly Investor Update"
    subtitle_para.font.size = Pt(28)
    subtitle_para.font.color.rgb = RGBColor(255, 255, 255)
    subtitle_para.alignment = PP_ALIGN.CENTER

    # Date
    date_box = slide.shapes.add_textbox(
        Inches(1), Inches(5), Inches(8), Inches(0.5)
    )
    date_frame = date_box.text_frame
    date_para = date_frame.add_paragraph()
    date_para.text = f"Week of {week_start}"
    date_para.font.size = Pt(18)
    date_para.font.color.rgb = RGBColor(255, 255, 255)
    date_para.alignment = PP_ALIGN.CENTER

def _add_executive_summary_slide(prs, summary_text):
    """Add executive summary slide"""

    slide_layout = prs.slide_layouts[1]  # Title and content
    slide = prs.slides.add_slide(slide_layout)

    title = slide.shapes.title
    title.text = "Executive Summary"

    content = slide.placeholders[1].text_frame
    content.text = summary_text
    content.word_wrap = True

def _add_metrics_slide(prs, metrics):
    """Add key metrics slide"""

    slide_layout = prs.slide_layouts[5]  # Title only
    slide = prs.slides.add_slide(slide_layout)

    title = slide.shapes.title
    title.text = "Key Metrics"

    # Create metric boxes
    metrics_data = [
        ("Commits", metrics['commits'], metrics['commits_change']),
        ("Story Points", metrics['story_points'], metrics['sp_change']),
        ("Deployments", metrics['deployments'], metrics['deploy_change']),
        ("Uptime", f"{metrics['uptime']}%", metrics['uptime_change'])
    ]

    for idx, (label, value, change) in enumerate(metrics_data):
        left = Inches(1 + (idx % 2) * 4.5)
        top = Inches(2 + (idx // 2) * 2)

        # Box
        box = slide.shapes.add_shape(
            1,  # Rectangle
            left, top, Inches(3.5), Inches(1.5)
        )
        box.fill.solid()
        box.fill.fore_color.rgb = RGBColor(68, 114, 196)

        # Label
        text_frame = box.text_frame
        text_frame.clear()

        p1 = text_frame.add_paragraph()
        p1.text = label
        p1.font.size = Pt(16)
        p1.font.color.rgb = RGBColor(255, 255, 255)
        p1.alignment = PP_ALIGN.CENTER

        # Value
        p2 = text_frame.add_paragraph()
        p2.text = str(value)
        p2.font.size = Pt(32)
        p2.font.bold = True
        p2.font.color.rgb = RGBColor(255, 255, 255)
        p2.alignment = PP_ALIGN.CENTER

        # Change
        p3 = text_frame.add_paragraph()
        change_symbol = "▲" if change > 0 else "▼"
        p3.text = f"{change_symbol} {abs(change)}%"
        p3.font.size = Pt(14)
        p3.font.color.rgb = RGBColor(0, 255, 0) if change > 0 else RGBColor(255, 0, 0)
        p3.alignment = PP_ALIGN.CENTER
```

**Remaining slides follow similar structure...**

---

## Jira Ticket Templates

### Bug Report Template

```python
# templates/jira_templates.py

BUG_TEMPLATE = {
    "fields": {
        "project": {"key": "REDDYFIT"},
        "summary": "{bug_summary}",
        "description": {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "Bug Description"}]
                },
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "{description}"}]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "Steps to Reproduce"}]
                },
                {
                    "type": "orderedList",
                    "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "{step_1}"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "{step_2}"}]}]}
                    ]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "Expected vs Actual"}]
                },
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Expected: {expected}"}]
                },
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Actual: {actual}"}]
                }
            ]
        },
        "issuetype": {"name": "Bug"},
        "priority": {"name": "{priority}"},
        "labels": ["automated", "documentation-system"]
    }
}

TASK_TEMPLATE = {
    "fields": {
        "project": {"key": "REDDYFIT"},
        "summary": "{task_summary}",
        "description": {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "{description}"}]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "Acceptance Criteria"}]
                },
                {
                    "type": "bulletList",
                    "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "{criteria_1}"}]}]}
                    ]
                }
            ]
        },
        "issuetype": {"name": "Task"},
        "labels": ["automated"]
    }
}
```

---

## Usage Examples

### Generate Daily Report

```python
from templates.daily_report_template import create_daily_report

data = {
    "date": "2025-10-08",
    "executive_summary": "Completed authentication refactor...",
    "commits": [...],
    "jira_updates": [...],
    "deployments": [...],
    "costs": {...},
    "blockers": [],
    "next_steps": [...]
}

doc = create_daily_report(data)
doc.save("daily_report_2025-10-08.docx")
```

### Generate Weekly Excel

```python
from templates.excel_template import create_weekly_metrics_excel

wb = create_weekly_metrics_excel(weekly_data, "2025-10-06")
wb.save("weekly_metrics_2025-W41.xlsx")
```

### Generate Presentation

```python
from templates.powerpoint_template import create_weekly_presentation

prs = create_weekly_presentation(weekly_data, "2025-10-06")
prs.save("weekly_investor_update_2025-W41.pptx")
```

---

## Template Customization

All templates can be customized by modifying:
1. **Styles**: Fonts, colors, sizes in template files
2. **Content**: Section order and structure
3. **Branding**: Logos, company colors, headers/footers
4. **Data fields**: Add/remove metrics as needed

Templates are version-controlled and can be updated without changing workflow code.
