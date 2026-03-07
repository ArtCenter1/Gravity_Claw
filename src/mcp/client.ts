import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'fs';
import path from 'path';

interface MCPServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
}

interface MCPConfig {
    mcpServers: Record<string, MCPServerConfig>;
}

// Global registry of connected MCP clients
export const mcpClients: Record<string, Client> = {};

// Registries for dynamically loaded tools
export const mcpOpenAITools: any[] = [];
export const mcpGeminiTools: any[] = [];
export const mcpToolRouting: Record<string, string> = {};

export async function initializeMCPServers() {
    console.log('[MCP] Initializing servers...');

    const configPath = path.join(process.cwd(), 'mcp_servers.json');
    if (!fs.existsSync(configPath)) {
        console.warn(`[MCP] No mcp_servers.json found at ${configPath}. MCP tools will not be available.`);
        return;
    }

    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config: MCPConfig = JSON.parse(configContent);

        if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
            console.log('[MCP] No servers defined in config.');
            return;
        }

        for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
            try {
                console.log(`[MCP] Connecting to server: ${serverName}...`);
                const transport = new StdioClientTransport({
                    command: serverConfig.command,
                    args: serverConfig.args,
                    env: {
                        ...(process.env as Record<string, string>),
                        ...serverConfig.env
                    }
                });

                const client = new Client(
                    { name: `gravity-claw-${serverName}-client`, version: '1.0.0' },
                    { capabilities: {} }
                );

                await client.connect(transport);
                console.log(`[MCP] Connected to ${serverName} successfully!`);
                mcpClients[serverName] = client;

                // Fetch available tools from this server
                const toolsResponse = await client.listTools();
                if (toolsResponse.tools) {
                    for (const tool of toolsResponse.tools) {
                        // Register for OpenAI
                        mcpOpenAITools.push({
                            type: 'function',
                            function: {
                                name: tool.name,
                                description: tool.description || `Tool ${tool.name} from MCP server ${serverName}`,
                                parameters: tool.inputSchema as any
                            }
                        });

                        // Register for Gemini
                        mcpGeminiTools.push({
                            name: tool.name,
                            description: tool.description || `Tool ${tool.name} from MCP server ${serverName}`,
                            parameters: jsonSchemaToGeminiSchema(tool.inputSchema)
                        });

                        // Map name to server so we know where to route execution
                        mcpToolRouting[tool.name] = serverName;
                        console.log(`[MCP] Loaded tool: ${tool.name} (from ${serverName})`);
                    }
                }
            } catch (err) {
                console.error(`[MCP] Failed to connect to server ${serverName}:`, err);
            }
        }
    } catch (error) {
        console.error('[MCP] Failed to parse mcp_servers.json:', error);
    }
}

// Convert JSON Schema from MCP into Gemini's expected Schema format
function jsonSchemaToGeminiSchema(schema: any): any {
    if (!schema) return undefined;
    const typeMap: Record<string, string> = {
        'string': 'STRING',
        'number': 'NUMBER',
        'integer': 'INTEGER',
        'boolean': 'BOOLEAN',
        'array': 'ARRAY',
        'object': 'OBJECT',
    };

    const result: any = { type: typeMap[schema.type] || 'STRING' };
    if (schema.description) result.description = schema.description;

    if (schema.properties) {
        result.properties = {};
        for (const [key, val] of Object.entries(schema.properties)) {
            result.properties[key] = jsonSchemaToGeminiSchema(val);
        }
    }

    if (schema.items) result.items = jsonSchemaToGeminiSchema(schema.items);
    if (schema.required) result.required = schema.required;
    if (schema.enum) result.enum = schema.enum;

    return result;
}

// Execute an MCP tool by routing to the correct client
export async function executeMCPTool(toolName: string, args: Record<string, any>): Promise<string> {
    const serverName = mcpToolRouting[toolName];
    if (!serverName) {
        throw new Error(`[MCP] Unknown tool ${toolName}`);
    }

    const client = mcpClients[serverName];
    if (!client) {
        throw new Error(`[MCP] Client for ${serverName} is not connected`);
    }

    try {
        const result = await client.callTool({
            name: toolName,
            arguments: args
        });

        // The SDK returns { content: [{ type: "text", text: "..." }] }
        const contentArray = result.content as any[];
        if (contentArray && contentArray.length > 0) {
            const firstContent = contentArray[0];
            return firstContent.text || JSON.stringify(contentArray);
        }

        return "Tool executed successfully but returned no text.";
    } catch (e: any) {
        return `Error executing local tool ${toolName}: ${e.message}`;
    }
}

// Helper to shut down MCP servers gracefully
export async function closeMCPServers() {
    for (const [name, client] of Object.entries(mcpClients)) {
        console.log(`[MCP] Closing connection to ${name}...`);
        try {
            await client.close();
        } catch (e) {
            console.error(`[MCP] Error closing ${name}:`, e);
        }
    }
}
