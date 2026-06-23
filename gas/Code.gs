const CONFIG = {
  SHEET_ID: '1qJVVG9i1zv8_C9Fa45UirHq9nC1lHSYEJaSXd6i7UD8',
  DRIVE_FOLDER_ID: '1NKbzj7rowdLwmjWNTPLAh6zBTTezIBFq'
};

const SHEET_SCHEMAS = {
  Projects: [
    'ID',
    'ProjectName',
    'FiscalYear',
    'Department',
    'OwnerName',
    'Status',
    'BudgetSource',
    'ApprovedBudget',
    'SpentBudget',
    'StartDate',
    'EndDate',
    'Objectives',
    'QuantityTarget',
    'QualityTarget',
    'Activities',
    'ResultSummary',
    'Problems',
    'CreatedAt',
    'UpdatedAt',
    'UseActivities'
  ],
  Activities: [
    'ID',
    'ProjectID',
    'ActivityName',
    'OwnerName',
    'Status',
    'ApprovedBudget',
    'SpentBudget',
    'StartDate',
    'EndDate',
    'Objectives',
    'QuantityTarget',
    'QualityTarget',
    'ResultSummary',
    'Problems',
    'CreatedAt',
    'UpdatedAt'
  ],
  Budgets: [
    'ID',
    'ProjectID',
    'BudgetType',
    'Amount',
    'FiscalYear',
    'Note',
    'CreatedAt',
    'UpdatedAt'
  ],
  Transactions: [
    'ID',
    'ProjectID',
    'TransactionType',
    'Amount',
    'Payee',
    'DocumentNo',
    'TransactionDate',
    'Status',
    'Note',
    'CreatedAt',
    'UpdatedAt',
    'ActivityID'
  ],
  Files: [
    'ID',
    'ProjectID',
    'FileName',
    'FileId',
    'FileUrl',
    'MimeType',
    'UploadedBy',
    'CreatedAt'
  ],
  Users: [
    'ID',
    'FullName',
    'Username',
    'PasswordHash',
    'Role',
    'Department',
    'Status',
    'CreatedAt',
    'UpdatedAt'
  ],
  Settings: [
    'Key',
    'Value',
    'UpdatedAt'
  ],
  ActivityLogs: [
    'ID',
    'Actor',
    'Action',
    'TargetType',
    'TargetID',
    'Detail',
    'CreatedAt'
  ]
};

const PROJECT_HEADERS = SHEET_SCHEMAS.Projects;
const ACTIVITY_HEADERS = SHEET_SCHEMAS.Activities;

function doGet() {
  return jsonOutput({
    ok: true,
    app: 'SPS Project Finance API',
    version: '0.1.0'
  });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action;
    const payload = body.payload || {};

    if (action === 'setup') return jsonOutput(setup());
    if (action === 'getDashboard') return jsonOutput(getDashboard());
    if (action === 'listProjects') return jsonOutput(listProjects());
    if (action === 'getProject') return jsonOutput(getProject(payload.id));
    if (action === 'saveProject') return jsonOutput(saveProject(payload.project));
    if (action === 'deleteProject') return jsonOutput(deleteProject(payload.id));
    if (action === 'listActivities') return jsonOutput(listActivities(payload.projectId));

    return jsonOutput({
      ok: false,
      message: 'Unknown action: ' + action
    });
  } catch (error) {
    return jsonOutput({
      ok: false,
      message: error.message
    });
  }
}

function setup() {
  Object.keys(SHEET_SCHEMAS).forEach((name) => {
    const sheet = getSheet(name);
    ensureHeaders(sheet, SHEET_SCHEMAS[name]);
    styleHeader(sheet, SHEET_SCHEMAS[name].length);
  });
  initDefaultSettings();
  initDefaultAdmin();

  return {
    ok: true,
    message: 'Setup complete',
    sheets: Object.keys(SHEET_SCHEMAS)
  };
}

function getDashboard() {
  const projects = listProjects().projects;
  const totalBudget = projects.reduce((sum, item) => sum + Number(item.ApprovedBudget || 0), 0);
  const usedBudget = projects.reduce((sum, item) => sum + Number(item.SpentBudget || 0), 0);
  return {
    ok: true,
    stats: {
      totalProjects: projects.length,
      totalBudget,
      usedBudget,
      remainingBudget: totalBudget - usedBudget,
      pending: projects.filter((item) => item.Status === 'pending').length
    }
  };
}

function listProjects() {
  const sheet = getSheet('Projects');
  ensureHeaders(sheet, PROJECT_HEADERS);
  const activities = listActivities().activities;
  return {
    ok: true,
    projects: sheetToObjects(sheet).map((project) => {
      const projectActivities = activities.filter((activity) => activity.ProjectID === project.ID);
      const activitySpent = projectActivities.reduce((sum, item) => sum + Number(item.SpentBudget || 0), 0);
      return Object.assign({}, project, {
        ActivitiesList: projectActivities,
        SpentBudget: projectActivities.length > 0 ? activitySpent : project.SpentBudget
      });
    })
  };
}

function getProject(id) {
  const projects = listProjects().projects;
  return {
    ok: true,
    project: projects.find((item) => item.ID === id) || null
  };
}

function saveProject(project) {
  const sheet = getSheet('Projects');
  ensureHeaders(sheet, PROJECT_HEADERS);
  const headers = getHeaders(sheet);

  const now = new Date().toISOString();
  const id = project.ID || 'P-' + Date.now();
  const projectActivities = Array.isArray(project.activities) ? project.activities : [];
  const useActivities = project.UseActivities === true || project.UseActivities === 'true' || projectActivities.length > 0;
  const activitySpent = projectActivities.reduce((sum, item) => sum + Number(item.SpentBudget || 0), 0);
  const data = Object.assign({}, project, {
    ID: id,
    UseActivities: useActivities ? 'TRUE' : '',
    SpentBudget: useActivities ? activitySpent : project.SpentBudget,
    UpdatedAt: now,
    CreatedAt: project.CreatedAt || now
  });

  const rows = sheetToObjects(sheet);
  const rowIndex = rows.findIndex((item) => item.ID === id);
  const values = headers.map((header) => cellValue(data[header]));

  if (rowIndex >= 0) {
    sheet.getRange(rowIndex + 2, 1, 1, headers.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }

  saveProjectActivities(id, projectActivities, now);

  return {
    ok: true,
    project: Object.assign({}, data, {
      ActivitiesList: listActivities(id).activities
    })
  };
}

function deleteProject(id) {
  const sheet = getSheet('Projects');
  const rows = sheetToObjects(sheet);
  const rowIndex = rows.findIndex((item) => item.ID === id);

  if (rowIndex >= 0) {
    sheet.deleteRow(rowIndex + 2);
  }

  deleteActivitiesByProject(id);

  return {
    ok: true
  };
}

function listActivities(projectId) {
  const sheet = getSheet('Activities');
  ensureHeaders(sheet, ACTIVITY_HEADERS);
  const activities = sheetToObjects(sheet);
  return {
    ok: true,
    activities: projectId ? activities.filter((item) => item.ProjectID === projectId) : activities
  };
}

function saveProjectActivities(projectId, activities, now) {
  const sheet = getSheet('Activities');
  ensureHeaders(sheet, ACTIVITY_HEADERS);
  const headers = getHeaders(sheet);
  const existingRows = sheetToObjects(sheet);
  const incomingIds = activities.map((item) => item.ID).filter(Boolean);

  for (let index = existingRows.length - 1; index >= 0; index -= 1) {
    const row = existingRows[index];
    if (row.ProjectID === projectId && row.ID && incomingIds.indexOf(row.ID) === -1) {
      sheet.deleteRow(index + 2);
    }
  }

  const rowsAfterDelete = sheetToObjects(sheet);
  activities.forEach((activity, index) => {
    const id = activity.ID || 'A-' + Date.now() + '-' + (index + 1);
    const previous = rowsAfterDelete.find((item) => item.ID === id);
    const data = Object.assign({}, activity, {
      ID: id,
      ProjectID: projectId,
      UpdatedAt: now,
      CreatedAt: activity.CreatedAt || (previous && previous.CreatedAt) || now
    });
    const values = headers.map((header) => cellValue(data[header]));
    const rowIndex = rowsAfterDelete.findIndex((item) => item.ID === id);

    if (rowIndex >= 0) {
      sheet.getRange(rowIndex + 2, 1, 1, headers.length).setValues([values]);
    } else if (data.ActivityName) {
      sheet.appendRow(values);
    }
  });
}

function deleteActivitiesByProject(projectId) {
  const sheet = getSheet('Activities');
  ensureHeaders(sheet, ACTIVITY_HEADERS);
  const rows = sheetToObjects(sheet);

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (rows[index].ProjectID === projectId) {
      sheet.deleteRow(index + 2);
    }
  }
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureHeaders(sheet, headers) {
  const currentLastColumn = Math.max(sheet.getLastColumn(), 1);
  const current = sheet.getRange(1, 1, 1, currentLastColumn).getValues()[0];
  const hasHeaders = current.some(Boolean);
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }

  const missingHeaders = headers.filter((header) => current.indexOf(header) === -1);
  if (missingHeaders.length > 0) {
    sheet.getRange(1, current.length + 1, 1, missingHeaders.length).setValues([missingHeaders]);
  }
}

function getHeaders(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(Boolean);
}

function styleHeader(sheet, columnCount) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight('bold')
    .setBackground('#101828')
    .setFontColor('#ffffff');
  sheet.autoResizeColumns(1, columnCount);
}

function initDefaultSettings() {
  const sheet = getSheet('Settings');
  const existing = sheetToObjects(sheet).reduce((map, item) => {
    map[item.Key] = item.Value;
    return map;
  }, {});

  const defaults = {
    schoolName: 'SPS School',
    fiscalYear: '2569',
    driveFolderId: CONFIG.DRIVE_FOLDER_ID,
    sheetId: CONFIG.SHEET_ID
  };

  Object.keys(defaults).forEach((key) => {
    if (!existing[key]) {
      sheet.appendRow([key, defaults[key], new Date().toISOString()]);
    }
  });
}

function initDefaultAdmin() {
  const sheet = getSheet('Users');
  const users = sheetToObjects(sheet);
  const hasAdmin = users.some((item) => item.Username === 'admin');

  if (!hasAdmin) {
    sheet.appendRow([
      'U-' + Date.now(),
      'System Admin',
      'admin',
      'admin1234',
      'admin',
      'system',
      'active',
      new Date().toISOString(),
      new Date().toISOString()
    ]);
  }
}

function sheetToObjects(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  return values.slice(1).filter((row) => row.some(Boolean)).map((row) => {
    return headers.reduce((obj, header, index) => {
      obj[header] = row[index];
      return obj;
    }, {});
  });
}

function cellValue(value) {
  if (value === null || value === undefined) return '';
  return value;
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
