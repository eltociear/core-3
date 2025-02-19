import path from 'path';
import { retrieveRemoteConfig } from '../configurations/remotePlugin';
import { HostOptions } from '../interfaces/HostOptions';
import { RemoteOptions } from '../interfaces/RemoteOptions';
import { DTSManager } from './DTSManager';
import { retrieveTypesZipPath } from './archiveHandler';
import fs from 'fs';
import {
  retrieveMfAPITypesPath,
  retrieveMfTypesPath,
} from './typeScriptCompiler';
import { moduleFederationPlugin } from '@module-federation/sdk';
import ansiColors from 'ansi-colors';
import tsconfigPaths from 'vite-tsconfig-paths';

export function getDTSManagerConstructor(
  implementation?: string,
): typeof DTSManager {
  if (implementation) {
    const NewConstructor = require(implementation);
    return NewConstructor.default ? NewConstructor.default : NewConstructor;
  }
  return DTSManager;
}
export const validateOptions = (options: HostOptions) => {
  if (!options.moduleFederationConfig) {
    throw new Error('moduleFederationConfig is required');
  }
};

export function retrieveTypesAssetsInfo(options: RemoteOptions) {
  let apiTypesPath = '';
  let zipTypesPath = '';
  try {
    const { tsConfig, remoteOptions, mapComponentsToExpose } =
      retrieveRemoteConfig(options);
    if (!Object.keys(mapComponentsToExpose).length) {
      return {
        apiTypesPath,
        zipTypesPath,
        zipName: '',
        apiFileName: '',
      };
    }
    const mfTypesPath = retrieveMfTypesPath(tsConfig, remoteOptions);
    zipTypesPath = retrieveTypesZipPath(mfTypesPath, remoteOptions);
    if (remoteOptions.generateAPITypes) {
      apiTypesPath = retrieveMfAPITypesPath(tsConfig, remoteOptions);
    }

    return {
      apiTypesPath,
      zipTypesPath,
      zipName: path.basename(zipTypesPath),
      apiFileName: path.basename(apiTypesPath),
    };
  } catch (err) {
    console.error(ansiColors.red(`Unable to compile federated types, ${err}`));
    return {
      apiTypesPath: '',
      zipTypesPath: '',
      zipName: '',
      apiFileName: '',
    };
  }
}

export function replaceLocalhost(url: string): string {
  return url.replace('localhost', '127.0.0.1');
}

export function isDebugMode() {
  return Boolean(process.env['FEDERATION_DEBUG']);
}

export const isTSProject = (
  dtsOptions: moduleFederationPlugin.ModuleFederationPluginOptions['dts'],
  context = process.cwd(),
) => {
  if (dtsOptions === false) {
    return false;
  }

  try {
    let filepath = '';
    if (typeof dtsOptions === 'object' && dtsOptions.tsConfigPath) {
      filepath = dtsOptions.tsConfigPath;
    } else {
      filepath = path.resolve(context, './tsconfig.json');
    }

    if (!path.isAbsolute(filepath)) {
      filepath = path.resolve(context, filepath);
    }
    return fs.existsSync(filepath);
  } catch (err) {
    return false;
  }
};
