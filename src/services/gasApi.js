import { appConfig } from '../config/appConfig.js';

async function request(action, payload = {}) {
  if (!appConfig.gasWebAppUrl) {
    return {
      ok: false,
      offline: true,
      message: 'GAS Web App URL is not configured yet.'
    };
  }

  const response = await fetch(appConfig.gasWebAppUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      action,
      payload
    })
  });

  if (!response.ok) {
    throw new Error(`GAS request failed: ${response.status}`);
  }

  return response.json();
}

export const gasApi = {
  getDashboard: () => request('getDashboard'),
  listProjects: () => request('listProjects'),
  listActivities: (projectId) => request('listActivities', { projectId }),
  getProject: (id) => request('getProject', { id }),
  saveProject: (project) => request('saveProject', { project }),
  deleteProject: (id) => request('deleteProject', { id }),
  uploadFileMeta: (file) => request('uploadFileMeta', { file })
};
