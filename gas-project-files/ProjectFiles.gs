/**
 * ProjectFiles.gs
 * เพิ่มไฟล์นี้ใน Apps Script โปรเจกต์เดิม
 */

const PROJECT_FILES_ROOT_FOLDER_ID = '1nDZVeBonnvbGtYYVU2q32xc2UaT0xKmh';
const PROJECT_FILE_MAX_BYTES = 10 * 1024 * 1024;
const PROJECT_FILE_ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

/**
 * เรียกจาก router ด้วย action = uploadProjectFile
 * payload = { projectId, projectName, file: { name, mimeType, size, base64 } }
 */
function uploadProjectFile(payload) {
  try {
    payload = payload || {};
    const file = payload.file || {};
    const projectId = cleanProjectFileText_(payload.projectId);
    const projectName = cleanProjectFileText_(payload.projectName);

    if (!projectId) throw new Error('ไม่พบรหัสโครงการ');
    if (!file.name || !file.base64) throw new Error('ข้อมูลไฟล์ไม่ครบ');

    const mimeType = String(file.mimeType || inferProjectFileMime_(file.name));
    if (PROJECT_FILE_ALLOWED_MIME.indexOf(mimeType) === -1) {
      throw new Error('รองรับเฉพาะรูปภาพ PDF และ Word');
    }

    const bytes = Utilities.base64Decode(file.base64);
    if (bytes.length > PROJECT_FILE_MAX_BYTES) {
      throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 10 MB');
    }

    const root = DriveApp.getFolderById(PROJECT_FILES_ROOT_FOLDER_ID);
    const folderName = [projectId, projectName].filter(Boolean).join(' ');
    const projectFolder = getOrCreateProjectFolder_(root, folderName || projectId);
    const safeName = sanitizeProjectFileName_(file.name);
    const blob = Utilities.newBlob(bytes, mimeType, safeName);
    const driveFile = projectFolder.createFile(blob);

    // ให้ผู้ใช้งานหน้าเว็บที่มีลิงก์เปิดดูไฟล์ได้
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = driveFile.getId();
    return {
      ok: true,
      file: {
        id: fileId,
        name: driveFile.getName(),
        mimeType: mimeType,
        size: driveFile.getSize(),
        url: driveFile.getUrl(),
        thumbnailUrl: mimeType.indexOf('image/') === 0
          ? 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w240'
          : '',
        folderId: projectFolder.getId(),
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    return { ok: false, message: error.message || String(error) };
  }
}

/**
 * เรียกจาก router ด้วย action = deleteProjectFile
 * payload = { fileId, projectId }
 */
function deleteProjectFile(payload) {
  try {
    payload = payload || {};
    if (!payload.fileId) throw new Error('ไม่พบรหัสไฟล์');
    const file = DriveApp.getFileById(String(payload.fileId));
    file.setTrashed(true);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message || String(error) };
  }
}

/**
 * รัน 1 ครั้ง เพื่อเพิ่มคอลัมน์ AttachmentsJSON ในชีตโครงการ
 * หากชื่อชีตไม่ใช่ Projects ให้แก้ PROJECT_SHEET_NAME
 */
function setupProjectAttachmentsColumn() {
  const PROJECT_SHEET_NAME = 'Projects';
  const spreadsheetId = '1qJVVG9i1zv8_C9Fa45UirHq9nC1lHSYEJaSXd6i7UD8';
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(PROJECT_SHEET_NAME);
  if (!sheet) throw new Error('ไม่พบชีตชื่อ ' + PROJECT_SHEET_NAME);

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  if (headers.indexOf('AttachmentsJSON') === -1) {
    sheet.getRange(1, lastColumn + 1).setValue('AttachmentsJSON');
  }
  return 'พร้อมใช้งาน AttachmentsJSON';
}

function getOrCreateProjectFolder_(root, name) {
  const folders = root.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : root.createFolder(name);
}

function cleanProjectFileText_(value) {
  return String(value || '').trim().replace(/[\\/:*?"<>|#%{}[\]]/g, '-').slice(0, 100);
}

function sanitizeProjectFileName_(value) {
  const name = String(value || 'file').trim().replace(/[\\/:*?"<>|#%{}[\]]/g, '-');
  return name.slice(0, 180) || 'file';
}

function inferProjectFileMime_(name) {
  name = String(name || '').toLowerCase();
  if (/\.pdf$/.test(name)) return 'application/pdf';
  if (/\.docx$/.test(name)) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (/\.doc$/.test(name)) return 'application/msword';
  if (/\.png$/.test(name)) return 'image/png';
  if (/\.webp$/.test(name)) return 'image/webp';
  return 'image/jpeg';
}
