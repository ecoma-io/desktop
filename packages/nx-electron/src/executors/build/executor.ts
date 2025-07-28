import { join, resolve } from 'path';
import { map, tap } from 'rxjs/operators';
import { eachValueFrom } from 'rxjs-for-await';
import { ExecutorContext, logger, writeJsonFile } from '@nx/devkit';
import { runWebpack } from '../../utils/run-webpack';
import {
  calculateProjectDependencies,
  createTmpTsConfig,
} from '@nx/js/src/utils/buildable-libs-utils';

import { getElectronWebpackConfig } from '../../utils/electron.config';
import { normalizeBuildOptions } from '../../utils/normalize';
import { BuildBuilderOptions } from '../../utils/types';
import { getSourceRoot } from '../../utils/workspace';
import { MAIN_OUTPUT_FILENAME } from '../../utils/config';
import { createPackageJson } from '@nx/js';

export type ElectronBuildEvent = {
  outfile: string;
  success: boolean;
};

export interface BuildElectronBuilderOptions extends BuildBuilderOptions {
  optimization?: boolean;
  sourceMap?: boolean;
  buildLibsFromSource?: boolean;
  generatePackageJson?: boolean;
  ignoredModules: Array<string>;
  implicitDependencies: Array<string>;
  externalDependencies: 'all' | 'none' | Array<string>;
}

export interface NormalizedBuildElectronBuilderOptions extends BuildElectronBuilderOptions {
  webpackConfig?: string;
}

export function executor(
  rawOptions: BuildElectronBuilderOptions,
  context: ExecutorContext
): AsyncIterableIterator<ElectronBuildEvent> {
  const { sourceRoot, projectRoot } = getSourceRoot(context);
  const normalizedOptions = normalizeBuildOptions(
    rawOptions,
    context.root,
    sourceRoot,
    projectRoot
  );
  const projGraph = context.projectGraph;

  if (!context.projectName) throw new Error('context.projectName is undefined');

  if (!normalizedOptions.buildLibsFromSource) {
    if (!context.targetName) throw new Error('context.targetName is undefined');
    if (!context.configurationName) throw new Error('context.configurationName is undefined');

    const { target, dependencies } = calculateProjectDependencies(
      projGraph,
      context.root,
      context.projectName,
      context.targetName,
      context.configurationName
    );

    normalizedOptions.tsConfig = createTmpTsConfig(
      normalizedOptions.tsConfig,
      context.root,
      target.data.root,
      dependencies
    );
  }

  if (normalizedOptions.generatePackageJson && context.projectName) {
    const packageJsonContent = createPackageJson(context.projectName, projGraph, {
      ...normalizedOptions,
      isProduction: true,
    });
    writeJsonFile(join(normalizedOptions.outputPath, 'package.json'), packageJsonContent);
  }

  let config = getElectronWebpackConfig(normalizedOptions);
  if (normalizedOptions.webpackConfig) {
    config = require(normalizedOptions.webpackConfig)(config, {
      normalizedOptions,
      configuration: context.configurationName,
    });
  }

  return eachValueFrom(
    runWebpack(config).pipe(
      tap(stats => {
        logger.info(stats.toString(config.stats));
      }),

      map(stats => {
        return {
          success: !stats.hasErrors(),
          outfile: resolve(context.root, normalizedOptions.outputPath, MAIN_OUTPUT_FILENAME),
        } as ElectronBuildEvent;
      })
    )
  );
}

export default executor;
