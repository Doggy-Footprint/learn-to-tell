import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {connect} from 'node:net';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const parsedArgs = parseArgs({options: {port: {type: 'string'}, target: {type: 'string'}}, strict: false, allowPositionals: true, tokens: true});
for (const token of parsedArgs.tokens) {
  const name = token.kind === 'positional' ? token.value : `--${token.name}`;
  if (token.kind === 'positional' || !['port', 'target'].includes(token.name)) {
    process.stderr.write(`ARGUMENT ${name}\n`);
    process.exit(2);
  }
}
for (const name of ['port', 'target']) {
  if (parsedArgs.values[name] !== undefined && typeof parsedArgs.values[name] !== 'string') {
    process.stderr.write(`ARGUMENT --${name}\n`);
    process.exit(2);
  }
}
const portText = parsedArgs.values.port ?? '4321';
const target = parsedArgs.values.target ?? 'lesson';
const port = Number(portText);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  process.stderr.write('ARGUMENT --port\n');
  process.exit(2);
}
const TARGET_DIRS = {lesson: 'dist', diagnostic: 'dist-diagnostic'};
if (!Object.hasOwn(TARGET_DIRS, target)) {
  process.stderr.write('ARGUMENT --target\n');
  process.exit(2);
}
const dist = join(root, TARGET_DIRS[target]);
if (!existsSync(join(dist, 'index.html'))) {
  process.stderr.write(`DIST_MISSING ${TARGET_DIRS[target]}/index.html\n`);
  process.exit(1);
}

const server = spawn(process.execPath, [join(root, 'node_modules', 'http-server', 'bin', 'http-server'), dist, '-a', '127.0.0.1', '-p', String(port), '-c-1', '-s'], {stdio: ['ignore', 'ignore', 'inherit']});
const probe = () => {
  const socket = connect({host: '127.0.0.1', port});
  socket.once('connect', () => {
    socket.destroy();
    process.stdout.write(`http://127.0.0.1:${port}/\n`);
  });
  socket.once('error', () => setTimeout(probe, 50));
};
probe();
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('exit', code => process.exit(code ?? 0));
