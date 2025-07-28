# @ecoma-io/nx-electron

Nx executors for Electron application development, providing seamless integration with the Nx build system for building, serving, and packaging Electron applications.

## 🚀 Features

- **Build Executor**: Compile Electron applications with webpack and TypeScript
- **Serve Executor**: Development server with hot reload and debugging support
- **Package Executor**: Create distributable packages for multiple platforms
- **Webpack Integration**: Advanced webpack configuration with optimization
- **TypeScript Support**: Full TypeScript compilation and type checking
- **Multi-platform Packaging**: Support for Windows, macOS, and Linux
- **Development Tools**: Hot reload, debugging, and development utilities

## 📦 Installation

This package is part of the ecoma workspace and is automatically available when using the workspace.

### Peer Dependencies

```json
{
  "electron": "*",
  "electron-builder": "*"
}
```

## 🏗️ Executors

### Build Executor

Compiles your Electron application using webpack and TypeScript.

```bash
nx build your-electron-app
```

#### Configuration

```json
{
  "build": {
    "executor": "@ecoma-io/nx-electron:build",
    "options": {
      "main": "src/main.ts",
      "tsConfig": "tsconfig.app.json",
      "outputPath": "dist/apps/your-electron-app",
      "watch": false,
      "sourceMap": true,
      "optimization": false,
      "externalDependencies": "all",
      "generatePackageJson": true
    }
  }
}
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `main` | `string` | - | Main entry point file (required) |
| `tsConfig` | `string` | - | TypeScript configuration file (required) |
| `outputPath` | `string` | - | Output directory for compiled files |
| `watch` | `boolean` | `false` | Enable file watching for rebuilds |
| `sourceMap` | `boolean` | `true` | Generate source maps |
| `optimization` | `boolean` | `false` | Enable webpack optimization |
| `externalDependencies` | `'all' \| 'none' \| string[]` | `'all'` | Dependencies to keep external |
| `generatePackageJson` | `boolean` | `true` | Generate package.json for distribution |
| `buildLibsFromSource` | `boolean` | `true` | Build libraries from source |
| `ignoredModules` | `string[]` | `[]` | Modules to ignore during build |
| `implicitDependencies` | `string[]` | `[]` | Implicit dependencies to include |
| `webpackConfig` | `string` | - | Custom webpack configuration path |
| `additionalEntryPoints` | `object[]` | `[]` | Additional entry points for webpack |

### Serve Executor

Starts a development server with hot reload and debugging capabilities.

```bash
nx serve your-electron-app
```

#### Configuration

```json
{
  "serve": {
    "executor": "@ecoma-io/nx-electron:serve",
    "options": {
      "buildTarget": "your-electron-app:build",
      "watch": true,
      "port": 5858,
      "inspect": "inspect",
      "remoteDebuggingPort": 9222
    }
  }
}
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `buildTarget` | `string` | - | Target to build before serving (required) |
| `buildTargetOptions` | `object` | `{}` | Additional build target options |
| `watch` | `boolean` | `true` | Enable file watching |
| `waitUntilTargets` | `string[]` | `[]` | Targets to run before starting |
| `port` | `number` | `5858` | Debug port for main process |
| `remoteDebuggingPort` | `number` | - | Debug port for renderer process |
| `inspect` | `string \| boolean` | `'inspect'` | Debug mode (`inspect`, `inspect-brk`, `inspect-brk-node`) |
| `args` | `string[]` | `[]` | Additional command line arguments |

### Package Executor

Creates distributable packages for multiple platforms using electron-builder.

```bash
nx package your-electron-app
```

#### Configuration

```json
{
  "package": {
    "executor": "@ecoma-io/nx-electron:package",
    "options": {
      "name": "your-electron-app",
      "platform": ["windows", "mac", "linux"],
      "arch": "x64",
      "sourcePath": "dist/apps/your-electron-app",
      "outputPath": "dist/packages",
      "extraProjects": ["your-frontend-app"],
      "publishPolicy": "never"
    }
  }
}
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | - | Application name (required) |
| `extraProjects` | `string[]` | `[]` | Additional projects to include |
| `prepackageOnly` | `boolean` | `false` | Only prepare package without building |
| `sourcePath` | `string` | `dist/apps` | Source directory path |
| `outputPath` | `string` | - | Output directory for packages |
| `platform` | `string \| string[]` | - | Target platform(s) |
| `arch` | `string` | - | Target architecture |
| `publishPolicy` | `string` | - | Publish policy (`onTag`, `onTagOrDraft`, `always`, `never`) |
| `makerOptionsPath` | `string` | - | Custom maker options file path |

## 🔧 Configuration Examples

### Basic Electron App Configuration

```json
{
  "name": "your-electron-app",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/your-electron-app/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@ecoma-io/nx-electron:build",
      "options": {
        "main": "apps/your-electron-app/src/main.ts",
        "tsConfig": "apps/your-electron-app/tsconfig.app.json",
        "outputPath": "dist/apps/your-electron-app",
        "assets": [
          {
            "glob": "**/*",
            "input": "apps/your-electron-app/src/assets",
            "output": "assets"
          }
        ],
        "externalDependencies": "all",
        "generatePackageJson": true
      }
    },
    "serve": {
      "executor": "@ecoma-io/nx-electron:serve",
      "options": {
        "buildTarget": "your-electron-app:build",
        "watch": true,
        "port": 5858,
        "inspect": "inspect"
      }
    },
    "package": {
      "executor": "@ecoma-io/nx-electron:package",
      "options": {
        "name": "your-electron-app",
        "platform": ["windows", "mac"],
        "arch": "x64",
        "sourcePath": "dist/apps/your-electron-app",
        "outputPath": "dist/packages"
      }
    }
  }
}
```

### Advanced Configuration with Custom Webpack

```json
{
  "build": {
    "executor": "@ecoma-io/nx-electron:build",
    "options": {
      "main": "src/main.ts",
      "tsConfig": "tsconfig.app.json",
      "outputPath": "dist/apps/your-electron-app",
      "webpackConfig": "webpack.config.js",
      "optimization": true,
      "sourceMap": false,
      "externalDependencies": ["electron", "electron-builder"],
      "additionalEntryPoints": [
        {
          "entryName": "preload",
          "entryPath": "src/preload.ts"
        }
      ],
      "ignoredModules": ["electron-devtools-installer"],
      "implicitDependencies": ["@ecoma-io/electron-kit"]
    }
  }
}
```

### Development Configuration

```json
{
  "serve": {
    "executor": "@ecoma-io/nx-electron:serve",
    "options": {
      "buildTarget": "your-electron-app:build",
      "buildTargetOptions": {
        "watch": true,
        "sourceMap": true,
        "optimization": false
      },
      "watch": true,
      "port": 5858,
      "remoteDebuggingPort": 9222,
      "inspect": "inspect-brk",
      "waitUntilTargets": ["your-frontend-app:build"],
      "args": ["--dev", "--enable-logging"]
    }
  }
}
```

## 🛠️ Development Workflow

### 1. Development Mode

```bash
# Start development server with hot reload
nx serve your-electron-app

# Or with specific configuration
nx serve your-electron-app --configuration=development
```

### 2. Building for Production

```bash
# Build the application
nx build your-electron-app

# Build with optimization
nx build your-electron-app --optimization=true --sourceMap=false
```

### 3. Packaging for Distribution

```bash
# Package for current platform
nx package your-electron-app

# Package for specific platforms
nx package your-electron-app --platform=windows,mac --arch=x64
```

### 4. Custom Build Scripts

```bash
# Build and package in one command
nx run-many --target=build,package --projects=your-electron-app

# Build with custom options
nx build your-electron-app --webpackConfig=./custom-webpack.config.js
```

## 🔍 Debugging

### Main Process Debugging

```bash
# Start with debugging enabled
nx serve your-electron-app --inspect=inspect-brk

# Custom debug port
nx serve your-electron-app --port=9229
```

### Renderer Process Debugging

```bash
# Enable remote debugging for renderer
nx serve your-electron-app --remoteDebuggingPort=9222
```

### Debug Configuration (VS Code)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Electron Main",
      "type": "node",
      "request": "attach",
      "port": 5858,
      "restart": true,
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "${workspaceFolder}"
    },
    {
      "name": "Debug Electron Renderer",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}",
      "timeout": 30000
    }
  ]
}
```

## 📦 Webpack Configuration

The build executor uses a sophisticated webpack configuration optimized for Electron applications:

- **TypeScript compilation** with ts-loader
- **External dependencies** handling for Electron modules
- **Source maps** generation for debugging
- **Asset copying** and processing
- **License extraction** for production builds
- **Code obfuscation** support
- **Multiple entry points** support

### Custom Webpack Configuration

Create a custom webpack configuration file:

```javascript
// webpack.config.js
module.exports = (config, { normalizedOptions, configuration }) => {
  // Customize webpack configuration
  config.plugins.push(new MyCustomPlugin());
  
  // Modify entry points
  config.entry.preload = './src/preload.ts';
  
  return config;
};
```

## 🧪 Testing

Run the unit tests:

```bash
nx test nx-electron
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

Proprietary - See LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/ecoma-io/desktop/issues)
- **Documentation**: [Project Wiki](https://github.com/ecoma-io/desktop/wiki)
- **Contact**: contact@ecoma.io

## 🔗 Related Packages

- [@ecoma-io/electron-kit](./../electron-kit) - Electron development toolkit
- [@ecoma-io/electron-devkit](./../electron-devkit) - Development tools for Electron applications
