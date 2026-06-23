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
    'UpdatedAt'
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
  return {
    ok: true,
    projects: sheetToObjects(sheet)
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

  const now = new Date().toISOString();
  const id = project.ID || 'P-' + Date.now();
  const data = Object.assign({}, project, {
    ID: id,
    UpdatedAt: now,
    CreatedAt: project.CreatedAt || now
  });

  const rows = sheetToObjects(sheet);
  const rowIndex = rows.findIndex((item) => item.ID === id);
  const values = PROJECT_HEADERS.map((header) => data[header] || '');

  if (rowIndex >= 0) {
    sheet.getRange(rowIndex + 2, 1, 1, PROJECT_HEADERS.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }

  return {
    ok: true,
    project: data
  };
}

function deleteProject(id) {
  const sheet = getSheet('Projects');
  const rows = sheetToObjects(sheet);
  const rowIndex = rows.findIndex((item) => item.ID === id);

  if (rowIndex >= 0) {
    sheet.deleteRow(rowIndex + 2);
  }

  return {
    ok: true
  };
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureHeaders(sheet, headers) {
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = current.some(Boolean);
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
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

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
