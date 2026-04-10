import { skillManager } from '../skills/manager.js';

/**
 * Skill creation tool for Gravity Claw
 * Allows the agent to create new skills from experience
 */
export const name = 'skill_create';
export const description = 'Create a new skill from the agent\'s experience and knowledge. Use this when the agent has learned a new capability or workflow that should be preserved for future use.';

export const skillCreateGeminiDef = {
  name: 'skill_create',
  description: 'Create a new skill from the agent\'s experience and knowledge. Use this when the agent has learned a new capability or workflow that should be preserved for future use.',
  parameters: {
    type: 'OBJECT',
    properties: {
      skillName: {
        type: 'STRING',
        description: 'Unique identifier for the skill (letters, numbers, hyphens, underscores only)'
      },
      content: {
        type: 'STRING',
        description: 'The skill content including procedures, when to use, pitfalls, and verification steps'
      },
      category: {
        type: 'STRING',
        description: 'Optional category to organize the skill (e.g., "devops", "mlops", "communication")'
      }
    },
    required: ['skillName', 'content']
  }
};

export const skillCreateOpenAIDef = {
  type: 'function',
  function: {
    name: 'skill_create',
    description: 'Create a new skill from the agent\'s experience and knowledge. Use this when the agent has learned a new capability or workflow that should be preserved for future use.',
    parameters: {
      type: 'object',
      properties: {
        skillName: {
          type: 'string',
          description: 'Unique identifier for the skill (letters, numbers, hyphens, underscores only)'
        },
        content: {
          type: 'string',
          description: 'The skill content including procedures, when to use, pitfalls, and verification steps'
        },
        category: {
          type: 'string',
          description: 'Optional category to organize the skill (e.g., "devops", "mlops", "communication")'
        }
      },
      required: ['skillName', 'content']
    }
  }
};

export async function skillCreate(args: Record<string, any>): Promise<string> {
  try {
    const { skillName, content, category } = args;
    
    if (!skillName || !content) {
      return 'Error: skillName and content are required parameters';
    }
    
    const success = await skillManager.createSkill(skillName, content, category);
    
    if (success) {
      return `Successfully created skill "${skillName}". The skill is now available for use via /${skillName} command or skill_view tool.`;
    } else {
      return `Failed to create skill "${skillName}". Check the logs for more details.`;
    }
  } catch (error) {
    console.error('Error in skill_create tool:', error);
    const message = error instanceof Error ? error.message : String(error);
    return `Error creating skill: ${message}`;
  }
}