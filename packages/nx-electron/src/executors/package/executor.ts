import { ExecutorContext, logger } from '@nx/devkit';

import {
  build,
  Configuration,
  PublishOptions,
  Platform,
  Arch,
  createTargets,
  FileSet,
  CliOptions,
} from 'electron-builder';
import { writeFile, statSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { promisify } from 'util';

import { getSourceRoot } from '../../utils/workspace';
import { normalizePackagingOptions } from '../../utils/normalize';

import { platform } from 'os';
import stripJsonComments from 'strip-json-comments';

const writeFileAsync = (path: string, data: string) =>
  promisify(writeFile)(path, data, { encoding: 'utf8' });

/**
 * Recursively interpolates placeholders in an object or string
 */
function interpolatePlaceholders(
  value: unknown,
  context: ExecutorContext,
  projectName: string
): unknown {
  if (typeof value === 'string') {
    const project = context.projectsConfigurations.projects[projectName];
    return value
      .replace(/\{platform\}/g, process.platform)
      .replace(/\{workspaceRoot\}/g, context.root)
      .replace(/\{projectRoot\}/g, project?.root || '')
      .replace(/\{projectName\}/g, projectName)
      .replace(/\{sourceRoot\}/g, project?.sourceRoot || '');
  }

  if (Array.isArray(value)) {
    return value.map(item => interpolatePlaceholders(item, context, projectName));
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = interpolatePlaceholders(val, context, projectName);
    }
    return result;
  }

  return value;
}

export interface PackageElectronBuilderOptions extends Configuration {
  name: string;
  extraProjects: string[];
  platform: string | string[];
  arch: string;
  root: string;
  prepackageOnly: boolean;
  sourcePath: string;
  outputPath: string;
  publishPolicy?: PublishOptions['publish'];
  makerOptionsPath?: string;
  [key: string]: unknown;
}

export interface PackageElectronBuilderOutput {
  target?: unknown;
  success: boolean;
  outputPath: string | string[];
}

export async function executor(
  rawOptions: PackageElectronBuilderOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  let success = false;

  logger.debug('PackageElectronBuilderOptions', JSON.stringify(rawOptions, null, 2));

  try {
    const { sourceRoot } = getSourceRoot(context);

    let options = normalizePackagingOptions(rawOptions, context.root, sourceRoot);
    options = mergePresetOptions(options, context);
    options = addMissingDefaultOptions(options);

    const platforms: Platform[] = _createPlatforms(options.platform);
    const targets: Map<Platform, Map<Arch, string[]>> = _createTargets(
      platforms,
      null,
      options.arch
    );
    const baseConfig: Configuration = _createBaseConfig(options, context);
    const config: Configuration = _createConfigFromOptions(options, baseConfig);
    const normalizedOptions: CliOptions = _normalizeBuilderOptions(targets, config, rawOptions);

    if (context.isVerbose) {
      logger.debug('Build options:', JSON.stringify(normalizedOptions, null, 2));
    }

    await beforeBuild(options.root, options.sourcePath, options.name);
    await build(normalizedOptions);

    success = true;
  } catch (error) {
    logger.error(error);
  }

  return { success };
}

async function beforeBuild(projectRoot: string, sourcePath: string, appName: string) {
  await writeFileAsync(
    join(projectRoot, sourcePath, appName, 'index.js'),
    `const Main = require('./${appName}/main.js');`
  );
}

function _createPlatforms(rawPlatforms: string | string[]): Platform[] {
  const platforms: Platform[] = [];

  if (!rawPlatforms) {
    const platformMap: Map<string, string> = new Map([
      ['win32', 'windows'],
      ['darwin', 'mac'],
      ['linux', 'linux'],
    ]);

    rawPlatforms = platformMap.get(platform()) || '';
  }

  if (typeof rawPlatforms === 'string') {
    rawPlatforms = [rawPlatforms];
  }

  if (Array.isArray(rawPlatforms)) {
    if (rawPlatforms.includes(Platform.WINDOWS.name)) {
      platforms.push(Platform.WINDOWS);
    }
    if (rawPlatforms.includes(Platform.MAC.name)) {
      platforms.push(Platform.MAC);
    }
    if (rawPlatforms.includes(Platform.LINUX.name)) {
      platforms.push(Platform.LINUX);
    }
  }

  return platforms;
}

function _createTargets(
  platforms: Platform[],
  type?: string | null,
  arch?: string | null
): Map<Platform, Map<Arch, string[]>> {
  return createTargets(platforms, type, arch);
}

function _createBaseConfig(
  options: PackageElectronBuilderOptions,
  context: ExecutorContext
): Configuration {
  if (!options.outputPath) throw new Error('outputPath is undefined');
  if (!options.sourcePath) throw new Error('sourcePath is undefined');
  if (!options.name) throw new Error('name is undefined');
  const outputPath = options.prepackageOnly
    ? options.outputPath.replace('executables', 'packages')
    : options.outputPath;
  let files: Array<FileSet | string> = options.files
    ? Array.isArray(options.files)
      ? options.files
      : [options.files]
    : Array<FileSet | string>();

  if (options.extraProjects) {
    options.extraProjects.forEach(project => {
      files = files.concat([
        {
          from: resolve(options.sourcePath, project.trim()),
          to: project,
          filter: ['**/*'],
        },
      ]);
    });
  }

  files.forEach(file => {
    if (file && typeof file === 'object' && file.from && file.from.length > 0) {
      file.from = resolve(options.sourcePath, file.from);
    }
  });

  let extraMetadata;
  if (!existsSync(join(options.sourcePath, options.name, 'package.json'))) {
    files.push('package.json');
  } else {
    extraMetadata = {
      version: JSON.parse(readFileSync(join(options.sourcePath, options.name, 'package.json'), 'utf8')).version
    };
  }

  return {
    extraMetadata,
    directories: {
      ...options.directories,
      output: join(context.root, outputPath),
    },
    files: files.concat([
      {
        from: resolve(options.sourcePath, options.name),
        to: options.name,
        filter: ['!index.js', '!package.json', '**/*'],
      },
      {
        from: resolve(options.sourcePath, options.name),
        to: '',
        filter: ['index.js', 'package.json'],
      },
    ]),
  };
}

function _createConfigFromOptions(
  options: PackageElectronBuilderOptions,
  baseConfig: Configuration
): Configuration {
  const config: Record<string, unknown> = Object.assign({}, options, baseConfig);

  delete config['name'];
  delete config['frontendProject'];
  delete config['extraProjects'];
  delete config['platform'];
  delete config['arch'];
  delete config['root'];
  delete config['prepackageOnly'];
  delete config['sourceRoot'];
  delete config['$schema'];
  delete config['publishPolicy'];
  delete config['sourcePath'];
  delete config['outputPath'];
  delete config['makerOptionsPath'];

  return config;
}

function _normalizeBuilderOptions(
  targets: Map<Platform, Map<Arch, string[]>>,
  config: Configuration,
  rawOptions: PackageElectronBuilderOptions
): CliOptions {
  const normalizedOptions: CliOptions = {
    config,
    publish: rawOptions.publishPolicy || null,
  };

  if (rawOptions.prepackageOnly) {
    normalizedOptions.dir = true;
  } else {
    normalizedOptions.targets = targets;
  }

  return normalizedOptions;
}

function mergePresetOptions(
  options: PackageElectronBuilderOptions,
  context: ExecutorContext
): PackageElectronBuilderOptions {
  // load preset options file
  const externalOptionsPath: string = options.makerOptionsPath
    ? resolve(options.root, options.makerOptionsPath)
    : join(options.root, options['sourceRoot'] as string, 'app', 'options', 'maker.options.json');

  let externalOptions: Record<string, unknown> = {};
  try {
    if (statSync(externalOptionsPath).isFile()) {
      const rawData = readFileSync(externalOptionsPath, 'utf8');
      externalOptions = JSON.parse(stripJsonComments(rawData)) as Record<string, unknown>;

      // Interpolate placeholders in the external options
      if (context.projectName) {
        externalOptions = interpolatePlaceholders(
          externalOptions,
          context,
          context.projectName
        ) as Record<string, unknown>;
      }

      options = Object.assign(options, externalOptions);
    }
  } catch {
    logger.warn(`Could not read external options file: ${externalOptionsPath}`);
  }

  return options;
}

function addMissingDefaultOptions(
  options: PackageElectronBuilderOptions
): PackageElectronBuilderOptions {
  // remove unset options (use electron builder default values where possible)
  Object.keys(options).forEach(key => options[key] === '' && delete options[key]);

  return options;
}

export default executor;
