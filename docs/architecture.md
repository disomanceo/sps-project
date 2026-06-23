# SPS Project Finance Architecture

## Stack

- Frontend: React + Vite
- Database: Google Sheet
- File storage: Google Drive
- Backend: Google Apps Script Web App

## Google Resources

- Drive Folder ID: `1NKbzj7rowdLwmjWNTPLAh6zBTTezIBFq`
- Sheet ID: `1qJVVG9i1zv8_C9Fa45UirHq9nC1lHSYEJaSXd6i7UD8`
- Script ID: `11gYHTUsY9DGvXKxi_7Zi1jAuyOIRj8IFDTiUyaaoqpLKIHJ0Wivd9wCK`

## Frontend API Flow

React should call the deployed GAS Web App URL with:

```json
{
  "action": "listProjects",
  "payload": {}
}
```

The Apps Script backend routes `action` to Sheet/Drive operations and returns JSON.

## Suggested Sheet Tabs

- `Projects`
- `Budgets`
- `Transactions`
- `Files`
- `Users`
- `Settings`
- `ActivityLogs`

## Projects Columns

| Column | Purpose |
| --- | --- |
| ID | Project ID |
| ProjectName | Project name |
| FiscalYear | Fiscal or academic year |
| Department | Owner department |
| OwnerName | Responsible person |
| Status | draft, pending, approved, active, done, cancelled |
| BudgetSource | Budget source |
| ApprovedBudget | Approved amount |
| SpentBudget | Actual spending |
| StartDate | Start date |
| EndDate | End date |
| Objectives | Objectives |
| QuantityTarget | Quantitative target |
| QualityTarget | Qualitative target |
| Activities | Project activities |
| ResultSummary | Result summary |
| Problems | Problems and suggestions |
| CreatedAt | Created timestamp |
| UpdatedAt | Updated timestamp |

## Next Backend Step

Deploy the Apps Script as a Web App, then put the deployment URL in `.env.local`:

```bash
VITE_GAS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```
