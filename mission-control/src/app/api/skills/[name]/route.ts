import { NextResponse } from 'next/server';
import { promises as fsPromises } from 'fs';
import { join } from 'path';

const SKILLS_DIR = join(process.cwd(), '..', '..', 'skills');

/**
 * GET /api/skills/[name] - Get specific skill content
 */
export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    // Next.js passes dynamic route params in generic params object. Await it if needed in 15.0+ or read directly
    const { name } = await params;
    
    if (!name) {
      return NextResponse.json({ error: 'Skill name is required' }, { status: 400 });
    }
    
    const skillPath = join(SKILLS_DIR, name, 'SKILL.md');
    
    try {
      await fsPromises.access(skillPath);
      const content = await fsPromises.readFile(skillPath, 'utf-8');
      
      return NextResponse.json({ 
        name: name,
        content: content
      });
    } catch (err) {
      return NextResponse.json({ 
        error: `Skill "${name}" not found` 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching skill:', error);
    return NextResponse.json({ error: 'Failed to fetch skill' }, { status: 500 });
  }
}
