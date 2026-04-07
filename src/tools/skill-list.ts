import { skillManager } from '../skills/manager.js';

/**
 * Skill listing tool for Gravity Claw
 * Lists all available skills created by the agent
 */
export const name = 'skill_list';
export const description = 'List all available skills that the agent has created. Use this to see what skills are available for use.';

export const getCurrentTimeGeminiDef = {
  name: 'skill_list',
  description: 'List all available skills that the agent has created. Use this to see what skills are available for use.',
  parameters: {
    type: 'OBJECT',
    properties: {}
  }
};

export const getCurrentTimeOpenAIDef = {
  type: 'function',
  function: {
    name: 'skill_list',
    description: 'List all available skills that the agent has created. Use this to see what skills are available for use.',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
};

export async function skillList(args: Record<string, any>): Promise<string> {
  try {
    const skills = await skillManager.listSkills();
    
    if (skills.length === 0) {
      return 'No skills have been created yet. Use skill_create to create your first skill.';
    }
    
    const skillList = skills.map((skill, index) => `${index + 1}. ${skill}`).join('\n');
    return `Available skills (${skills.length} total):\n\n${skillList}\n\nUse skill_view <skill_name> to see the details of a specific skill.`;
  } catch (error) {
    console.error('Error in skill_list tool:', error);
    return `Error listing skills: ${error.message}`;
  }
}