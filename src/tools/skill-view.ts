import { skillManager } from '../skills/manager.js';

/**
 * Skill viewing tool for Gravity Claw
 * Allows viewing the content of a specific skill
 */
export const name = 'skill_view';
export const description = 'View the content of a specific skill. Use this to see the details of a skill including its procedures, when to use, pitfalls, and verification steps.';

export const getCurrentTimeGeminiDef = {
  name: 'skill_view',
  description: 'View the content of a specific skill. Use this to see the details of a skill including its procedures, when to use, pitfalls, and verification steps.',
  parameters: {
    type: 'OBJECT',
    properties: {
      skillName: {
        type: 'STRING',
        description: 'Name of the skill to view'
      }
    },
    required: ['skillName']
  }
};

export const getCurrentTimeOpenAIDef = {
  type: 'function',
  function: {
    name: 'skill_view',
    description: 'View the content of a specific skill. Use this to see the details of a skill including its procedures, when to use, pitfalls, and verification steps.',
    parameters: {
      type: 'object',
      properties: {
        skillName: {
          type: 'string',
          description: 'Name of the skill to view'
        }
      },
      required: ['skillName']
    }
  }
};

export async function skillView(args: Record<string, any>): Promise<string> {
  try {
    const { skillName } = args;
    
    if (!skillName) {
      return 'Error: skillName is required';
    }
    
    const skillContent = await skillManager.getSkillContent(skillName);
    
    if (skillContent === null) {
      return `Error: Skill "${skillName}" not found. Use skill_list to see available skills.`;
    }
    
    return skillContent;
  } catch (error) {
    console.error('Error in skill_view tool:', error);
    const message = error instanceof Error ? error.message : String(error);
    return `Error viewing skill: ${message}`;
  }
}