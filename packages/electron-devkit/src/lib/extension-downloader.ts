import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { unzipCrx } from './crx-utils';
import { Logger } from './types';
import { sleep } from '@ecoma-io/sleep';

export const getExtensionStorePath = () => {
  const savePath = require('electron').app.getPath('userData');
  return path.resolve(`${savePath}/Extensions`);
};

export const downloadFile = async (from: string, to: string) => {
  const writer = fs.createWriteStream(to);
  const response = await axios.get(from, { responseType: 'stream' });
  return new Promise<void>((resolve, reject) => {
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

export async function downloadExtension(
  chromeStoreID: string,
  {
    forceDownload = false,
    attempts = 5,
    logger,
  }: {
    forceDownload?: boolean;
    attempts?: number;
    logger?: Logger;
  } = {}
): Promise<string> {
  const extensionsStore = getExtensionStorePath();
  if (!fs.existsSync(extensionsStore)) {
    logger?.info?.(`Creating extensions directory: ${extensionsStore}`);
    await fs.promises.mkdir(extensionsStore, { recursive: true });
  }
  const extensionFolder = path.resolve(`${extensionsStore}/${chromeStoreID}`);

  if (!fs.existsSync(extensionFolder) || forceDownload) {
    if (fs.existsSync(extensionFolder)) {
      logger?.info?.(`Deleting old extension: ${extensionFolder}`);
      await fs.promises.rm(extensionFolder, { recursive: true, force: true });
    }
    const fileURL = `https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3D${chromeStoreID}%26uc&prodversion=${process.versions.chrome}`;
    const filePath = path.resolve(`${extensionFolder}.crx`);
    try {
      logger?.info?.(`Downloading extension ${chromeStoreID} from ${fileURL}`);
      await downloadFile(fileURL, filePath);
      try {
        await unzipCrx(filePath, extensionFolder);
        logger?.info?.(`Unzipped extension successfully: ${extensionFolder}`);
        return extensionFolder;
      } catch (err) {
        logger?.warn?.(`Error unzipping extension: ${err}`);
        if (!fs.existsSync(path.resolve(extensionFolder, 'manifest.json'))) {
          throw err;
        }
      }
    } catch (err) {
      logger?.error?.(`Error downloading extension: ${err}`);
      if (attempts <= 1) {
        throw err;
      }
      logger?.info?.(`Retrying download extension (${attempts - 1} attempts left)`);
      await sleep(200);
      return await downloadExtension(chromeStoreID, {
        forceDownload,
        attempts: attempts - 1,
        logger,
      });
    }
  }
  logger?.info?.(`Extension already exists: ${extensionFolder}`);
  return extensionFolder;
}
