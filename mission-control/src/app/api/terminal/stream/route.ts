import { spawn } from 'child_process';
import { TextEncoder } from 'util';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const command = searchParams.get('command');
  const cwd = searchParams.get('cwd') || process.cwd();

  if (!command) {
    return new Response('Command is required', { status: 400 });
  }

  // Set up SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Return the response with the stream
  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });

  // Spawn the process and handle output
  (async () => {
    try {
      // Split command into cmd and args, but allow shell features by using shell=true
      // We'll use shell=true to support commands like `ls | grep foo`
      const child = spawn(command, { 
        cwd, 
        shell: true,
        windowsHide: true // Hide the console window on Windows
      });

      child.stdout.on('data', (data) => {
        const output = data.toString();
        writer.write(encoder.encode(`event: output\ndata: ${output.replace(/\n/g, '\\n')}\n\n`));
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        writer.write(encoder.encode(`event: output\ndata: ${output.replace(/\n/g, '\\n')}\n\n`));
      });

      child.on('close', (code) => {
        writer.write(encoder.encode(`event: end\ndata: ${code}\n\n`));
        writer.close();
      });

      child.on('error', (err) => {
        writer.write(encoder.encode(`event: error\ndata: ${err.message}\n\n`));
        writer.close();
      });

      // Set a timeout to kill the process after 30 seconds
      setTimeout(() => {
        if (!child.killed) {
          child.kill();
          writer.write(encoder.encode(`event: error\ndata: Process timed out\n\n`));
          writer.close();
        }
      }, 30000);
    } catch (err: any) {
      writer.write(encoder.encode(`event: error\ndata: ${err.message}\n\n`));
      writer.close();
    }
  })();

  return response;
}