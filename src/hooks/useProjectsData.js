import { useCallback, useEffect, useMemo, useState } from 'react';
import { gasApi } from '../services/gasApi.js';
import { mapSheetProject } from '../utils/projectMapper.js';

export function useProjectsData() {
  const [projects, setProjects] = useState([]);
  const [source, setSource] = useState('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProjects = useCallback(async () => {
      setLoading(true);
      setError('');

      try {
        const result = await gasApi.listProjects();

        if (result.ok && Array.isArray(result.projects)) {
          setProjects(result.projects.map(mapSheetProject));
          setSource(result.projects.length > 0 ? 'sheet' : 'empty');
          return;
        }

        setProjects([]);
        setSource('error');
        setError(result.message || 'ไม่สามารถโหลดข้อมูลจากฐานข้อมูลได้');
      } catch (err) {
        setProjects([]);
        setSource('error');
        setError(err.message || 'ไม่สามารถโหลดข้อมูลจากฐานข้อมูลได้');
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!alive) return;
      await loadProjects();
    }

    load();
    return () => {
      alive = false;
    };
  }, [loadProjects]);

  const saveProject = useCallback(async (project) => {
    setLoading(true);
    setError('');
    try {
      const result = await gasApi.saveProject(project);
      if (!result.ok) {
        throw new Error(result.message || 'Unable to save project.');
      }
      await loadProjects();
      return result.project;
    } catch (err) {
      setError(err.message || 'Unable to save project.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  const deleteProject = useCallback(async (id) => {
    setLoading(true);
    setError('');
    try {
      const result = await gasApi.deleteProject(id);
      if (!result.ok) {
        throw new Error(result.message || 'ไม่สามารถลบโครงการได้');
      }
      await loadProjects();
      return true;
    } catch (err) {
      setError(err.message || 'ไม่สามารถลบโครงการได้');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  const stats = useMemo(() => {
    const totalBudget = projects.reduce((sum, item) => sum + item.budget, 0);
    const usedBudget = projects.reduce((sum, item) => sum + item.spent, 0);
    return {
      totalProjects: projects.length,
      totalBudget,
      usedBudget,
      remainingBudget: totalBudget - usedBudget,
      pending: projects.filter((item) => item.status === 'รออนุมัติ').length
    };
  }, [projects]);

  return {
    projects,
    stats,
    loading,
    error,
    source,
    refreshProjects: loadProjects,
    saveProject,
    deleteProject
  };
}
