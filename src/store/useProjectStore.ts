import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as RoadmapTypes from '@/types/roadmap';
import { type Message } from '@ai-sdk/react';
import { ProjectStore as ProjectStoreType } from '@/types/store';
import { RoadmapNode } from '@/types/project';

export interface ProjectStore {
  // Initial State
  projects: any[];
  currentProject: any | null;
  isLoading: boolean;
  error: any | null;
  isGenerating: boolean;
  
  // New Chat State
  chatMode: 'smart' | 'manual';
  chatHistory: Message[];

  // Project Actions
  setProjects: (projects: any[]) => void;
  addProject: (project: any) => void;
  updateProject: (projectId: string, updates: any) => void;
  deleteProject: (projectId: string) => void;
  setCurrentProject: (project: any) => void;

  // Roadmap Actions
  updateRoadmapNode: (projectId: string, nodeId: string, updates: any) => void;
  addRoadmapNode: (projectId: string, parentNodeId: string | null, newNode: any) => void;
  deleteRoadmapNode: (projectId: string, nodeId: string) => void;

  // New Chat Actions
  setChatMode: (mode: 'smart' | 'manual') => void;
  setChatHistory: (history: Message[]) => void;
  appendChatHistory: (newMessages: Message[]) => void;
  addMessage: (message: Message) => void;
  clearChatHistory: () => void;

  // UI Actions
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: any) => void;
}

export const useProjectStore = create<ProjectStoreType>()(
  persist(
    (set) => ({
      // Initial State
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,
      isGenerating: false,
      
      // New Chat State
      chatMode: 'smart',
      chatHistory: [],

      // Project Actions
      setProjects: (projects) => set({ projects }),
      
      addProject: (project) => set((state) => ({ 
        projects: [...state.projects, project] 
      })),
      
      updateProject: (projectId, updates) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId ? { ...p, ...updates } : p
        ),
        currentProject: state.currentProject?.id === projectId 
          ? { ...state.currentProject, ...updates }
          : state.currentProject
      })),
      
      deleteProject: (projectId) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId 
          ? null 
          : state.currentProject
      })),
      
      setCurrentProject: (project) => set({ currentProject: project }),

      // Roadmap Actions
      updateRoadmapNode: (projectId, nodeId, updates) => {
        const updateNodeInTree = (nodes: RoadmapNode[]): RoadmapNode[] => {
          return nodes.map((node) => {
            if (node.id === nodeId) {
              return { ...node, ...updates };
            }
            if (node.children) {
              return {
                ...node,
                children: updateNodeInTree(node.children)
              };
            }
            return node;
          });
        };

        set((state) => {
          const updatedProjects = state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                roadmap: updateNodeInTree(p.roadmap)
              };
            }
            return p;
          });

          const updatedCurrentProject = state.currentProject?.id === projectId
            ? {
                ...state.currentProject,
                roadmap: updateNodeInTree(state.currentProject.roadmap)
              }
            : state.currentProject;

          return {
            projects: updatedProjects,
            currentProject: updatedCurrentProject
          };
        });
      },

      addRoadmapNode: (projectId, parentNodeId, newNode) => {
        const addNodeToTree = (nodes: RoadmapNode[]): RoadmapNode[] => {
          return nodes.map((node) => {
            if (node.id === parentNodeId) {
              return {
                ...node,
                children: [...(node.children || []), newNode]
              };
            }
            if (node.children) {
              return {
                ...node,
                children: addNodeToTree(node.children)
              };
            }
            return node;
          });
        };

        set((state) => {
          const updatedProjects = state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                roadmap: parentNodeId 
                  ? addNodeToTree(p.roadmap)
                  : [...p.roadmap, newNode]
              };
            }
            return p;
          });

          const updatedCurrentProject = state.currentProject?.id === projectId
            ? {
                ...state.currentProject,
                roadmap: parentNodeId
                  ? addNodeToTree(state.currentProject.roadmap)
                  : [...state.currentProject.roadmap, newNode]
              }
            : state.currentProject;

          return {
            projects: updatedProjects,
            currentProject: updatedCurrentProject
          };
        });
      },

      deleteRoadmapNode: (projectId, nodeId) => {
        const deleteNodeFromTree = (nodes: RoadmapNode[]): RoadmapNode[] => {
          return nodes
            .filter((node) => node.id !== nodeId)
            .map((node) => {
              if (node.children) {
                return {
                  ...node,
                  children: deleteNodeFromTree(node.children)
                };
              }
              return node;
            });
        };

        set((state) => {
          const updatedProjects = state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                roadmap: deleteNodeFromTree(p.roadmap)
              };
            }
            return p;
          });

          const updatedCurrentProject = state.currentProject?.id === projectId
            ? {
                ...state.currentProject,
                roadmap: deleteNodeFromTree(state.currentProject.roadmap)
              }
            : state.currentProject;

          return {
            projects: updatedProjects,
            currentProject: updatedCurrentProject
          };
        });
      },

      // New Chat Actions
      setChatMode: (mode) => set({ chatMode: mode }),
      setChatHistory: (history: Message[]) => set({ chatHistory: history }),
      appendChatHistory: (newMessages: Message[]) =>
        set((state) => ({
          chatHistory: [...state.chatHistory, ...newMessages],
        })),
      addMessage: (message: Message) =>
        set((state) => ({ chatHistory: [...state.chatHistory, message] })),
      clearChatHistory: () => set({ chatHistory: [], currentProject: null, chatMode: 'smart' }),

      // UI Actions
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setError: (error) => set({ error })
    }),
    {
      name: 'briki-projects',
      skipHydration: true,
    }
  )
); 