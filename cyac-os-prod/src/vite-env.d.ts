/// <reference types="vite/client" />
declare module 'cookie'
interface Window {
    SimplexNoise: any;
    fs: {
        readFile: (path: string, options?: { encoding?: string }) => Promise<string | ArrayBuffer>;
        readFileSync?: (path: string, options?: { encoding?: string }) => string | ArrayBuffer;
        writeFile?: (path: string, data: string | ArrayBuffer) => Promise<void>;
        exists?: (path: string) => Promise<boolean>;
        mkdir?: (path: string) => Promise<void>;
        readdir?: (path: string) => Promise<string[]>;
    };
}