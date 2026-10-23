// Minimal Node declarations so dev tools typecheck without @types/node, which the spec's toolchain does not include.
declare module "node:fs" {
  export function existsSync(p: string): boolean;
  export function statSync(p: string): { isDirectory(): boolean };
}
declare module "node:fs/promises" {
  export function readdir(p: string, o: { withFileTypes: true }): Promise<{ name: string; isDirectory(): boolean; isFile(): boolean }[]>;
  export function readFile(p: string, enc: "utf8"): Promise<string>;
  export function writeFile(p: string, data: string): Promise<void>;
  export function mkdir(p: string, o: { recursive: true }): Promise<unknown>;
}
declare module "node:path" {
  export function resolve(...p: string[]): string;
  export function join(...p: string[]): string;
  export function relative(from: string, to: string): string;
}
declare module "node:url" {
  export function pathToFileURL(p: string): { href: string };
  export function fileURLToPath(u: string): string;
}
declare const process: {
  argv: string[];
  exitCode: number | undefined;
  stdout: { write(s: string): boolean };
  stderr: { write(s: string): boolean };
};
interface ImportMeta { url: string }
