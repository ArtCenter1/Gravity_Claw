import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

export const timeToolDef: FunctionDeclaration = {
    name: 'get_current_time',
    description: 'Gets the current exact time locally.',
};

export function getCurrentTime(): string {
    return new Date().toISOString();
}
