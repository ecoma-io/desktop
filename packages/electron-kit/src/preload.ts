import { contextBridge } from 'electron';

// Lấy các argument từ process.argv
function getWindowArguments() {
  const args = process.argv;
  const getArg = (key: string) => {
    const found = args.find(arg => arg.startsWith(`--${key}=`));
    return found ? found.substring(key.length + 3) : undefined;
  };
  const name = getArg('name');
  const id = getArg('id');
  const parentId = getArg('parentId');
  let data: unknown = undefined;
  const dataRaw = getArg('data');
  if (dataRaw) {
    try {
      data = JSON.parse(dataRaw);
    } catch {
      data = dataRaw;
    }
  }
  let uiConfigs: unknown = undefined;
  const uiConfigsRaw = getArg('uiConfigs');
  if (uiConfigsRaw) {
    try {
      uiConfigs = JSON.parse(uiConfigsRaw);
    } catch {
      uiConfigs = uiConfigsRaw;
    }
  }
  const version = getArg('version');
  const os = getArg('os');
  const platform = process.platform;
  return { name, id, parentId, data, uiConfigs, version, os, platform };
}

export function exposeWindowArguments() {
  contextBridge.exposeInMainWorld('information', getWindowArguments());
}
