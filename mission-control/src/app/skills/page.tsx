'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CircleCheck, Loader2, Trash2, Zap } from 'lucide-react';
import Link from 'next/link';

export default function SkillsPage() {
  const [skills, setSkills] = useState<Array<{
    name: string;
    displayName: string;
    description: string;
    version: string;
    created: string;
    content: string;
  }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [deletingSkill, setDeletingSkill] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/skills');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setSkills(data.skills || []);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSkill = async (skillName: string) => {
    setDeletingSkill(skillName);
    try {
      // In a full implementation, we would have a DELETE endpoint
      // For now, we'll just remove from local state and refresh
      setSkills(prev => prev.filter(skill => skill.name !== skillName));
      // Refetch from server to ensure consistency
      await fetchSkills();
    } catch (error) {
      console.error('Failed to delete skill:', error);
    } finally {
      setDeletingSkill(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex h-full items-center justify-center">
          <Loader2 size={32} className="text-gray-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-600">
                <ArrowLeft size={20} />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Skills Library
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
              </span>
              <Zap size={16} className="text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Skills Grid */}
        <div className="grid gap-6">
          {/* Empty State */}
          {skills.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Zap size={48} className="text-gray-300" />
                <h2 className="text-xl font-semibold text-gray-700">
                  No Skills Yet
                </h2>
                <p className="text-gray-500">
                  Skills are automatically created from your conversations
                  when the agent detects significant learning or complex tool usage.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Try having a detailed conversation or using multiple tools
                  in a single request to trigger skill creation.
                </p>
              </div>
            </div>
          )}
          
          {/* Skills List */}
          {skills.length > 0 && (
            <>
              {/* Skill Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skills.map((skill) => (
                  <div 
                    key={skill.name} 
                    className={`group ${deletingSkill === skill.name ? 'opacity-50' : ''}`}
                  >
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                      {/* Skill Header */}
                      <div className="px-6 py-4 border-b border-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {skill.displayName}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              v{skill.version} • {new Date(skill.created).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Delete Button */}
                            {deletingSkill === skill.name ? (
                              <button 
                                onClick={() => handleDeleteSkill(skill.name)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100 transition-colors"
                              >
                                Deleting...
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeleteSkill(skill.name)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100 transition-colors"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Skill Content Preview */}
                      <div className="px-6 py-4">
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {skill.description}
                        </p>
                        
                        {/* Show first 200 chars of content as preview */}
                        {skill.content.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-50">
                            <p className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                              {skill.content.substring(0, 200)}{skill.content.length > 200 ? '...' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Bar */}
                      <div className="px-6 py-4 border-t border-gray-50">
                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => setSelectedSkill(skill.name)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded hover:bg-blue-100 transition-colors hover:text-blue-800"
                          >
                            <CircleCheck size={16} />
                            View Details
                          </button>
                          <span className="text-xs text-gray-500">
                            Click to view full skill
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Skill Detail View */}
              {selectedSkill && (
                <div className="mt-8">
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <Link 
                          href="/skills" 
                          className="text-sm text-gray-500 hover:text-gray-600"
                        >
                          <ArrowLeft size={20} />
                          Back to Skills
                        </Link>
                        <h2 className="text-xl font-bold text-gray-900">
                          {skills.find(s => s.name === selectedSkill)?.displayName || 'Skill Details'}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          v{skills.find(s => s.name === selectedSkill)?.version || '1.0.0'}
                        </span>
                        <Zap size={16} className="text-orange-500" />
                      </div>
                    </div>
                    
                    <div className="px-6 py-6">
                      <div className="space-y-4">
                        {/* Description */}
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                          <p className="text-gray-600 leading-relaxed">
                            {skills.find(s => s.name === selectedSkill)?.description || 'No description available'}
                          </p>
                        </div>
                        
                        {/* Content */}
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-2">Skill Content</h3>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
{skills.find(s => s.name === selectedSkill)?.content || 'No content available'}
                            </pre>
                          </div>
                        </div>
                        
                        {/* Metadata */}
                        <div className="border-t pt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">Created:</span>
                              <span>{new Date(skills.find(s => s.name === selectedSkill)?.created || '').toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="font-medium">Skill ID:</span>
                              <span className="font-mono">{skills.find(s => s.name === selectedSkill)?.name || 'unknown'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-white shadow-sm border-t">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-gray-500">
          Skills are automatically created by the agent's self-improving learning loop
          <br />
          stored locally in the skills/ directory for persistence across sessions
        </div>
      </div>
    </div>
  );
}