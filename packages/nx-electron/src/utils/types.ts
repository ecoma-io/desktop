export interface FileReplacement {
  replace: string;
  with: string;
}

export interface OptimizationOptions {
  scripts: boolean;
  styles: boolean;
}

export interface SourceMapOptions {
  scripts: boolean;
  styles: boolean;
  vendors: boolean;
  hidden: boolean;
}

export interface AdditionalEntryPoint {
  entryName: string;
  entryPath: string;
}

export interface BuildBuilderOptions {
  main: string;
  outputPath: string;
  tsConfig: string;
  watch?: boolean;
  clean?: boolean;
  sourceMap?: boolean | SourceMapOptions;
  optimization?: boolean | OptimizationOptions;
  maxWorkers?: number;
  memoryLimit?: number;
  poll?: number;

  fileReplacements: FileReplacement[];
  assets?: unknown[];

  progress?: boolean;
  statsJson?: boolean;
  extractLicenses?: boolean;
  obfuscate?: boolean;
  verbose?: boolean;

  webpackConfig?: string;

  root?: string;
  sourceRoot?: string;
  projectRoot?: string;

  // tsPlugins?: TsPluginEntry[];

  additionalEntryPoints?: AdditionalEntryPoint[];
  extraMetadata?: ExtraMetadata;
  outputFileName?: string;
  ignoredModules?: string[];
}

export interface ExtraMetadata {
  version?: string;
}
