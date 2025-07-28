import {
  runExecutor,
  stripIndents,
  parseTargetString,
  ExecutorContext,
  logger,
  readTargetOptions,
} from '@nx/devkit';
import { ChildProcess, spawn } from 'child_process';
import { promisify } from 'util';
import electron from 'electron';
import treeKill from 'tree-kill';

import { ElectronBuildEvent } from '../build/executor';

export const enum InspectType {
  Inspect = 'inspect',
  InspectBrk = 'inspect-brk',
  InspectBrkNode = 'inspect-brk-node',
  InspectBrkElectron = 'inspect-brk-electron',
}

export interface ElectronExecuteBuilderOptions {
  inspect: boolean | InspectType;
  remoteDebuggingPort?: number;
  port: number;
  args: string[];
  waitUntilTargets: string[];
  buildTargetOptions: Record<string, unknown>;
  buildTarget: string;
  watch: boolean;
  optimization?: boolean;
}

let subProcess: ChildProcess | null = null;

export async function* executor(options: ElectronExecuteBuilderOptions, context: ExecutorContext) {
  process.on('SIGTERM', () => {
    subProcess?.kill();
    process.exit(128 + 15);
  });

  process.on('exit', code => {
    process.exit(code);
  });

  if (options.waitUntilTargets && options.waitUntilTargets.length > 0) {
    const results = await runWaitUntilTargets(options, context);
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (!result.success) {
        logger.verbose('throw');
        throw new Error(`Wait until target failed: ${options.waitUntilTargets[i]}.`);
      }
    }
  }

  for await (const event of startBuild(options, context)) {
    if (!event.success) {
      logger.error('There was an error with the build. See above.');
      logger.info(`${event.outfile} was not restarted.`);
    }
    await handleBuildEvent(event, options);
    yield event;
  }
}

function runProcess(event: ElectronBuildEvent, options: ElectronExecuteBuilderOptions) {
  if (subProcess) {
    throw new Error('Already running');
  }

  subProcess = spawn(String(electron), normalizeArgs(event.outfile, options));

  if (subProcess.stdout) {
    subProcess.stdout.on('data', data => {
      logger.info(data.toString());
    });
  }

  if (subProcess.stderr) {
    subProcess.stderr.on('data', data => {
      logger.error(data.toString());
    });
  }
}

function normalizeArgs(file: string, options: ElectronExecuteBuilderOptions) {
  let args = [];

  if (options.inspect === true) {
    options.inspect = InspectType.Inspect;
  }

  if (options.inspect) {
    args.push(`--${options.inspect}=${options.port}`);
  }

  if (options.remoteDebuggingPort) {
    args.push(`--remote-debugging-port=${options.remoteDebuggingPort}`);
  }

  args.push(file);
  args = args.concat(options.args);

  return args;
}

async function handleBuildEvent(event: ElectronBuildEvent, options: ElectronExecuteBuilderOptions) {
  if ((!event.success || options.watch) && subProcess) {
    await killProcess();
  }

  runProcess(event, options);
}

async function killProcess() {
  if (!subProcess) {
    return;
  }

  const promisifiedTreeKill: (pid: number, signal: string) => Promise<void> = promisify(treeKill);
  try {
    if (typeof subProcess.pid !== 'number') throw new Error('subProcess.pid is undefined');
    await promisifiedTreeKill(subProcess.pid, 'SIGTERM');
  } catch (err) {
    if (Array.isArray(err) && err[0] && err[2]) {
      const errorMessage = err[2];
      logger.error(errorMessage);
    } else if (err && typeof err === 'object' && 'message' in err) {
      logger.error((err as { message: string }).message);
    }
  } finally {
    subProcess = null;
  }
}

async function* startBuild(options: ElectronExecuteBuilderOptions, context: ExecutorContext) {
  const buildTarget = parseTargetString(options.buildTarget, context.projectGraph);
  const buildOptions = readTargetOptions<ElectronExecuteBuilderOptions>(buildTarget, context);

  if (buildOptions['optimization']) {
    logger.warn(stripIndents`
            ************************************************
            This is a simple process manager for use in
            testing or debugging Electron applications locally.
            DO NOT USE IT FOR PRODUCTION!
            You should look into proper means of deploying
            your electron application to production.
            ************************************************`);
  }

  for await (const buildEventResponse of await runExecutor<ElectronBuildEvent>(
    buildTarget,
    {
      ...options.buildTargetOptions,
      generatePackageJson: false,
      watch: options.watch,
    },
    context
  )) {
    yield buildEventResponse;
  }
}

function runWaitUntilTargets(
  options: ElectronExecuteBuilderOptions,
  context: ExecutorContext
): Promise<{ success: boolean }[]> {
  return Promise.all(
    options.waitUntilTargets.map(async waitUntilTarget => {
      const target = parseTargetString(waitUntilTarget, context.projectGraph);
      const output = await runExecutor(target, {}, context);

      return new Promise<{ success: boolean }>(resolve => {
        (async () => {
          let event = await output.next();
          // Resolve after first event
          resolve(event.value as { success: boolean });

          // Continue iterating
          while (!event.done) {
            event = await output.next();
          }
        })();
      });
    })
  );
}

export default executor;
