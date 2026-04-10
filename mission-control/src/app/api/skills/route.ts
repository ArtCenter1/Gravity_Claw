import { NextResponse } from 'next/server';
import { promises as fsPromises } from 'fs';
import { join } from 'path';

const SKILLS_DIR = join(process.cwd(), '..', '..', 'skills');

/**
 * GET /api/skills - List all available skills
 */
export async function GET(request: Request) {
  try {
    // Check if skills directory exists
    try {
      await fsPromises.access(SKILLS_DIR);
    } catch {
      // Skills directory doesn't exist yet
      return NextResponse.json({ skills: [], count: 0 });
    }

    // Read all directories in skills folder (each directory is a skill)
    const skillDirs = await fsPromises.readdir(SKILLS_DIR);
    
    const skills = [];
    
    for (const dirName of skillDirs) {
      const skillPath = join(SKILLS_DIR, dirName);
      const skillFilePath = join(skillPath, 'SKILL.md');
      
      try {
        // Check if it's a directory and has SKILL.md
        const stats = await fsPromises.stat(skillPath);
        if (stats.isDirectory()) {
          try {
            await fsPromises.access(skillFilePath);
            // Read the skill content
            const content = await fsPromises.readFile(skillFilePath, 'utf-8');
            
            // Parse basic info from SKILL.md
            const nameMatch = content.match(/name:\s*(.+)/);
            const descriptionMatch = content.match(/description:\s*(.+)/);
            const versionMatch = content.match(/version:\s*(.+)/);
            const createdMatch = content.match(/created:\s*(.+)/);
            
            skills.push({
              name: dirName,
              displayName: nameMatch ? nameMatch[1].trim() : dirName,
              description: descriptionMatch ? descriptionMatch[1].trim() : 'No description',
              version: versionMatch ? versionMatch[1].trim() : '1.0.0',
              created: createdMatch ? createdMatch[1].trim() : new Date().toISOString(),
              content: content
            });
          } catch {
            // Directory exists but no SKILL.md file
            skills.push({
              name: dirName,
              displayName: dirName,
              description: 'Skill file missing',
              version: 'unknown',
              created: new Date().toISOString(),
              content: ''
            });
          }
        }
      } catch (err) {
        console.error(`Error processing skill ${dirName}:`, err);
        // Skip problematic skills
      }
    }
    
    // Sort by name
    skills.sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json({ 
      skills: skills, 
      count: skills.length 
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}
