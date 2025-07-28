import {
  Configuration,
  ProgressPlugin,
  DefinePlugin,
  WebpackPluginInstance,
  IgnorePlugin,
} from 'webpack';

import * as ts from 'typescript';
import { join } from 'path';

import { LicenseWebpackPlugin } from 'license-webpack-plugin';
import ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
import TsConfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { readTsConfig } from '@nx/js';
import { BuildBuilderOptions } from './types';
import type { PathData } from 'webpack';

export const MAIN_OUTPUT_FILENAME = 'main.js';
export const INDEX_OUTPUT_FILENAME = 'index.js';
export const DEFAULT_APPS_DIR = 'apps';
export const OUT_FILENAME_TEMPLATE = '[name].js';

export function getBaseWebpackPartial(options: BuildBuilderOptions): Configuration {
  const { options: compilerOptions } = readTsConfig(options.tsConfig);
  const supportsEs2015 =
    compilerOptions.target !== ts.ScriptTarget.ES3 &&
    compilerOptions.target !== ts.ScriptTarget.ES5;
  const mainFields = [...(supportsEs2015 ? ['es2015'] : []), 'module', 'main'];
  const extensions = ['.ts', '.tsx', '.mjs', '.js', '.jsx'];

  const additionalEntryPoints =
    options.additionalEntryPoints?.reduce(
      (obj, current) => ({ ...obj, [current.entryName]: current.entryPath }),
      {} as { [entryName: string]: string }
    ) ?? {};

  const webpackConfig: Configuration = {
    entry: {
      main: [options.main],
      ...additionalEntryPoints,
      // preload entries will be included dynamically
    },
    devtool: options.sourceMap ? 'source-map' : false,
    mode: options.optimization ? 'production' : 'development',
    output: {
      path: options.outputPath,
      filename: (pathData: PathData): string => {
        if (pathData && pathData.chunk && typeof pathData.chunk.name === 'string') {
          return pathData.chunk.name === 'main'
            ? options.outputFileName || OUT_FILENAME_TEMPLATE
            : OUT_FILENAME_TEMPLATE;
        }
        return OUT_FILENAME_TEMPLATE;
      },
      hashFunction: 'xxhash64',
      // Disabled for performance
      pathinfo: false,
    },
    module: {
      // Enabled for performance
      // unsafeCache: true,
      rules: [
        {
          test: /\.([jt])sx?$/,
          loader: require.resolve(`ts-loader`),
          exclude: /node_modules/,
          options: {
            configFile: options.tsConfig,
            transpileOnly: true,
            // https://github.com/TypeStrong/ts-loader/pull/685
            experimentalWatchApi: true,
          },
        },
      ],
    },
    resolve: {
      extensions,
      alias: getAliases(options),
      plugins: [
        new TsConfigPathsPlugin({
          configFile: options.tsConfig,
          extensions,
          mainFields,
        }) as unknown as { apply: (compiler: unknown) => void },
      ],
      mainFields,
    },
    performance: {
      hints: false,
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: options.tsConfig,
          memoryLimit: options.memoryLimit || 4096,
        },
      }),
      new DefinePlugin({
        __BUILD_VERSION__: JSON.stringify(
          options.extraMetadata?.version ||
            require(join(options.root || process.cwd(), 'package.json')).version
        ),
        __BUILD_DATE__: Date.now(),
      }),
    ],
    watch: options.watch,
    watchOptions: {
      poll: options.poll,
    },
    stats: options.verbose ? 'verbose' : 'normal',
  };

  const extraPlugins: WebpackPluginInstance[] = [];

  if (options.progress) {
    extraPlugins.push(new ProgressPlugin());
  }

  if (options.extractLicenses) {
    extraPlugins.push(
      new LicenseWebpackPlugin({
        stats: {
          warnings: false,
          errors: false,
        },
        perChunkOutput: false,
        outputFilename: `3rdpartylicenses.txt`,
      }) as unknown as WebpackPluginInstance
    );
  }

  // Add IgnorePlugin for ignored modules
  if (options.ignoredModules && options.ignoredModules.length > 0) {
    options.ignoredModules.forEach(moduleName => {
      extraPlugins.push(
        new IgnorePlugin({
          resourceRegExp: new RegExp(`^${moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
        })
      );
    });
  }

  // process asset entries
  if (Array.isArray(options.assets) && options.assets.length > 0) {
    const copyWebpackPluginInstance = new CopyWebpackPlugin({
      patterns: (
        options.assets as { input: string; output: string; glob: string; ignore?: string[] }[]
      ).map(asset => ({
        context: asset.input,
        to: asset.output,
        from: asset.glob,
        globOptions: {
          ignore: ['.gitkeep', '**/.DS_Store', '**/Thumbs.db', ...(asset.ignore ?? [])],
          dot: true,
        },
      })),
    });
    extraPlugins.push(copyWebpackPluginInstance);
  }

  webpackConfig.plugins = [...(webpackConfig.plugins || []), ...extraPlugins];

  return webpackConfig;
}

function getAliases(options: BuildBuilderOptions): { [key: string]: string } {
  return options.fileReplacements.reduce(
    (aliases, replacement) => ({
      ...aliases,
      [replacement.replace]: replacement.with,
    }),
    {}
  );
}
