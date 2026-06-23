import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from './components/AppShell.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Projects } from './pages/Projects.jsx';
import { ProjectForm } from './pages/ProjectForm.jsx';
import { Finance } from './pages/Finance.jsx';
import { Reports } from './pages/Reports.jsx';
import { Settings } from './pages/Settings.jsx';
import { useProjectsData } from './hooks/useProjectsData.js';
import './styles/global.css';

const pages = {
  dashboard: Dashboard,
  projects: Projects,
  form: ProjectForm,
  finance: Finance,
  reports: Reports,
  settings: Settings
};

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [editingProject, setEditingProject] = useState(null);
  const ActivePage = pages[activePage] ?? Dashboard;
  const data = useProjectsData();

  const handleNavigate = (page) => {
    if (page !== 'form') {
      setEditingProject(null);
    }
    if (page === 'form') {
      setEditingProject(null);
    }
    setActivePage(page);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setActivePage('form');
  };

  const handleFormDone = () => {
    setEditingProject(null);
    setActivePage('projects');
  };

  return (
    <AppShell activePage={activePage} onNavigate={handleNavigate}>
      <ActivePage
        {...data}
        editingProject={editingProject}
        onEditProject={handleEditProject}
        onNavigate={handleNavigate}
        onFormDone={handleFormDone}
      />
    </AppShell>
  );
}

createRoot(document.getElementById('root')).render(<App />);
