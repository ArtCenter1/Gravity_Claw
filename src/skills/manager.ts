import { getSetting, saveSetting } from '../memory/settings.js';
import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises';
import { join } from 'path';

const SKILLS_DIR = join(process.cwd(), 'skills');

/**
 * Skill management system for Gravity Claw
 * Handles creation, storage, retrieval, and execution of skills
 */
export class SkillManager {
  private static instance: SkillManager;

  private constructor() {
    // Ensure skills directory exists
    this.initSkillsDir().catch(console.error);
  }

  public static getInstance(): SkillManager {
    if (!SkillManager.instance) {
      SkillManager.instance = new SkillManager();
    }
    return SkillManager.instance;
  }

  private async initSkillsDir(): Promise<void> {
    try {
      await mkdir(SKILLS_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create skills directory:', error);
    }
  }

  /**
   * Get the path for a specific skill
   */
  private getSkillPath(skillName: string): string {
    return join(SKILLS_DIR, skillName);
  }

  /**
   * Get the path for a skill's main SKILL.md file
   */
  private getSkillMainFilePath(skillName: string): string {
    return join(this.getSkillPath(skillName), 'SKILL.md');
  }

  /**
   * List all available skills
   */
  public async listSkills(): Promise<string[]> {
    try {
      const files = await readdir(SKILLS_DIR);
      const skills = [];
      
      for (const file of files) {
        const skillPath = join(SKILLS_DIR, file);
        const fileStat = await stat(skillPath);
        if (fileStat.isDirectory()) {
          // Check if it has a SKILL.md file
          try {
            await stat(join(skillPath, 'SKILL.md'));
            skills.push(file);
          } catch {
            // Not a valid skill directory
          }
        }
      }
      
      return skills.sort();
    } catch (error) {
      console.error('Failed to list skills:', error);
      return [];
    }
  }

  /**
   * Check if a skill exists
   */
  public async skillExists(skillName: string): Promise<boolean> {
    try {
      const skillPath = this.getSkillMainFilePath(skillName);
      await stat(skillPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the content of a skill's SKILL.md file
   */
  public async getSkillContent(skillName: string): Promise<string | null> {
    try {
      const skillPath = this.getSkillMainFilePath(skillName);
      return await readFile(skillPath, 'utf8');
    } catch (error) {
      console.error(`Failed to read skill ${skillName}:`, error);
      return null;
    }
  }

  /**
   * Create a new skill
   */
  public async createSkill(
    skillName: string, 
    content: string, 
    category?: string
  ): Promise<boolean> {
    try {
      // Validate skill name (alphanumeric, hyphens, underscores only)
      if (!/^[a-zA-Z0-9_-]+$/.test(skillName)) {
        throw new Error('Skill name can only contain letters, numbers, hyphens, and underscores');
      }

      const skillPath = this.getSkillPath(skillName);
      
      // Create skill directory
      await mkdir(skillPath, { recursive: true });
      
      // Create SKILL.md file with proper format
      const skillContent = this.formatSkillContent(skillName, content, category);
      await writeFile(this.getSkillMainFilePath(skillName), skillContent, 'utf8');
      
      console.log(`Created skill: ${skillName}`);
      return true;
    } catch (error) {
      console.error(`Failed to create skill ${skillName}:`, error);
      return false;
    }
  }

  /**
   * Update an existing skill
   */
  public async updateSkill(
    skillName: string, 
    content: string
  ): Promise<boolean> {
    try {
      const exists = await this.skillExists(skillName);
      if (!exists) {
        throw new Error(`Skill ${skillName} does not exist`);
      }
      
      await writeFile(this.getSkillMainFilePath(skillName), content, 'utf8');
      console.log(`Updated skill: ${skillName}`);
      return true;
    } catch (error) {
      console.error(`Failed to update skill ${skillName}:`, error);
      return false;
    }
  }

  /**
   * Delete a skill
   */
  public async deleteSkill(skillName: string): Promise<boolean> {
    try {
      const exists = await this.skillExists(skillName);
      if (!exists) {
        throw new Error(`Skill ${skillName} does not exist`);
      }
      
      const skillPath = this.getSkillPath(skillName);
      // Note: In a real implementation, we would recursively delete the directory
      // For now, we'll just remove the SKILL.md file
      await writeFile(this.getSkillMainFilePath(skillName), '', 'utf8');
      console.log(`Deleted skill: ${skillName}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete skill ${skillName}:`, error);
      return false;
    }
  }

  /**
   * Format skill content according to SKILL.md specification
   */
  private formatSkillContent(
    skillName: string, 
    content: string, 
    category?: string | undefined
  ): string {
    const timestamp = new Date().toISOString();
    let formatted = `---name: ${skillName}\n`;
    formatted += `description: Auto-generated skill from Gravity Claw\n`;
    formatted += `version: 1.0.0\n`;
    formatted += `created: ${timestamp}\n`;
    if (category) {
      formatted += `category: ${category}\n`;
    }
    formatted += `---\n\n`;
    formatted += `# ${skillName}\n\n`;
    formatted += content;
    
    return formatted;
  }

  /**
   * Execute a skill by parsing its content and determining appropriate action
   * This is a simplified version - in a full implementation, this would
   * parse the skill and execute its procedures
   */
  public async executeSkill(skillName: string, context: string = ''): Promise<string> {
    try {
      const skillContent = await this.getSkillContent(skillName);
      if (!skillContent) {
        return `Error: Skill ${skillName} not found`;
      }
      
      // For now, we'll return the skill content as context for the AI to use
      // In a more advanced implementation, we would parse procedures and execute them
      return `Skill ${skillName} loaded successfully.\n\nContent:\n${skillContent}\n\nContext: ${context}`;
    } catch (error) {
      console.error(`Failed to execute skill ${skillName}:`, error);
      return `Error executing skill ${skillName}: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

/**
 * Global skill manager instance
 */
export const skillManager = SkillManager.getInstance();