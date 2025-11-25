'use client';

import { useState, useEffect, useRef } from 'react';

interface RecentProject {
  path: string;
  name: string;
  lastUsed: number;
}

interface ProjectSwitcherProps {
  currentPath: string;
  onSwitch: (path: string) => void;
}

export default function ProjectSwitcher({ currentPath, onSwitch }: ProjectSwitcherProps) {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRecentProjects();
  }, []);

  useEffect(() => {
    if (currentPath) {
      addToRecentProjects(currentPath);
    }
  }, [currentPath]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const loadRecentProjects = () => {
    const stored = localStorage.getItem('recentProjects');
    if (stored) {
      const projects = JSON.parse(stored);
      setRecentProjects(projects.sort((a: RecentProject, b: RecentProject) => b.lastUsed - a.lastUsed));
    }
  };

  const addToRecentProjects = (path: string) => {
    if (!path) return;

    const stored = localStorage.getItem('recentProjects');
    const existing = stored ? JSON.parse(stored) : [];
    
    const pathParts = path.split('/');
    const name = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    
    const filtered = existing.filter((p: RecentProject) => p.path !== path);
    const updated = [
      { path, name, lastUsed: Date.now() },
      ...filtered
    ].slice(0, 5);
    
    localStorage.setItem('recentProjects', JSON.stringify(updated));
    setRecentProjects(updated);
  };

  const removeProject = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = recentProjects.filter(p => p.path !== path);
    localStorage.setItem('recentProjects', JSON.stringify(filtered));
    setRecentProjects(filtered);
  };

  const getCurrentProjectName = () => {
    if (!currentPath) return '未选择项目';
    const pathParts = currentPath.split('/');
    return pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || '项目';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
      >
        <span className="text-gray-600">📁</span>
        <span className="max-w-[200px] truncate">{getCurrentProjectName()}</span>
        <span className="text-gray-400">▼</span>
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">最近项目</h3>
          </div>

          {recentProjects.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              暂无最近项目
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {recentProjects.map((project) => (
                <div
                  key={project.path}
                  className={`w-full px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                    project.path === currentPath ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        onSwitch(project.path);
                        setShowDropdown(false);
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📁</span>
                        <span className="font-medium text-sm truncate">
                          {project.name}
                        </span>
                        {project.path === currentPath && (
                          <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">当前</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate ml-7">
                        {project.path}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 ml-7">
                        {new Date(project.lastUsed).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </button>
                    <button
                      onClick={(e) => removeProject(project.path, e)}
                      className="text-gray-400 hover:text-red-600 transition-colors px-2"
                      title="移除"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
