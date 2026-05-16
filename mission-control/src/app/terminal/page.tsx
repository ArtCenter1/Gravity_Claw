'use client';

import { useEffect, useRef, useState } from 'react';

// Dynamic import to prevent SSR issues with xterm
let Terminal: any = null;
let FitAddon: any = null;

// Initialize the modules lazily
const loadXTerm = async () => {
  if (!Terminal) {
    const [xtermModule, fitAddonModule] = await Promise.all([
      import('xterm'),
      import('@xterm/addon-fit')
    ]);
    Terminal = xtermModule.Terminal;
    FitAddon = fitAddonModule.FitAddon;
  }
};

export default function TerminalPage() {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [command, setCommand] = useState('');
  const [cwd, setCwd] = useState(process.cwd() || '');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadXTerm().then(() => {
      setIsReady(true);
    });
  }, []);

  const runCommand = async () => {
    if (!command.trim() || !isReady) return;

    // Ensure xterm is loaded
    await loadXTerm();
    
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#000000',
        foreground: '#ffffff',
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);

    const container = terminalRef.current;
    if (!container) return;

    term.open(container);
    term.clear();
    term.write(`$ ${command}\n`);
    fit.fit();

    // Fetch the output via SSE
    const evtSource = new EventSource(
      `/api/terminal/stream?command=${encodeURIComponent(command)}&cwd=${encodeURIComponent(cwd)}`
    );

    evtSource.addEventListener('output', (event) => {
      const text = event.data;
      term.write(text);
    });

    evtSource.addEventListener('end', (event) => {
      term.write(`\n[Process exited with code ${event.data}]\n`);
    });

    evtSource.addEventListener('error', (event) => {
      term.write(`\n[Error: ${event.data}]\n`);
    });

    // Handle window resize
    const handleResize = () => {
      fit.fit();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      evtSource.close();
      term.dispose();
    };
  };

  return (
    <div className="flex h-screen flex-col bg-black">
      <div className="flex items-center px-4 py-2 bg-gray-800">
        <span className="text-white">Terminal</span>
        <div className="ml-auto flex items-center space-x-2">
          <button
            onClick={() => {
              setCwd(process.cwd() || '');
              setCommand('');
            }}
            className="text-xs text-white bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
          >
            Reset CWD
          </button>
          <button
            onClick={() => {
              // Clear terminal would require keeping term instance - simplified for now
            }}
            className="text-xs text-white bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div ref={terminalRef} className="flex-1 w-full"></div>
        <div className="px-4 py-2 bg-gray-800 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="Working directory"
              className="flex-1 text-xs text-white bg-gray-900 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
            />
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  runCommand();
                }
              }}
              placeholder="Enter command"
              className="flex-1 text-xs text-white bg-gray-900 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
            />
            <button
              onClick={runCommand}
              disabled={!isReady}
              className={`text-xs text-white bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded ${!isReady ? 'opacity-50' : ''}`}
            >
              {isReady ? 'Run' : 'Loading...'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}