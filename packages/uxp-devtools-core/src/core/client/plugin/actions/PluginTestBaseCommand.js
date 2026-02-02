/**
 * ***********************************************************************
 *ADOBE CONFIDENTIAL **Copyright 2021 Adobe
 *All Rights Reserved.
 *
 *NOTICE:  All information contained herein is, and remains
 *the property of Adobe and its suppliers, if any. The intellectual
 *and technical concepts contained herein are proprietary to Adobe
 *and its suppliers and are protected by all applicable intellectual
 *property laws, including trade secret and copyright laws.
 *Dissemination of this information or reproduction of this material
 *is strictly forbidden unless prior written permission is obtained
 *from Adobe.
 *************************************************************************
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'fs-extra';
import _ from 'lodash';

import PluginBaseCommand from './PluginBaseCommand.js';

const require = createRequire(import.meta.url);

class PluginTestBaseCommand extends PluginBaseCommand {
  constructor(pluginMgr, params) {
    super(pluginMgr);
    this.params = params;
    this.pluginTestFolder = 'uxp-plugin-tests';
    this.pluginFolder = process.cwd();
  }

  getSupportedHostApp(applicableApps) {
    const supportedHostApp = (this.params.apps.length ? this.params.apps[0] : applicableApps[0].id);
    return supportedHostApp.toString();
  }

  async startTestService(applicableApps) {
    throw new Error('Not implemented');
  }

  createUXPPluginTestRunParams(params, applicableApps, pluginID) {
    const supportedHostApp = `--app=${this.getSupportedHostApp(applicableApps)}`;
    const driverPort = `--driverPort=${params.driverPort}`;
    const udtServicePort = `--servicePort=${params.servicePort}`;
    const uxpPluginID = `--uxpPluginID=${pluginID}`;

    const pluginTestRunParams = {
      supportedHostApp,
      driverPort,
      udtServicePort,
      uxpPluginID,
    };
    return pluginTestRunParams;
  }

  timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeTest(params, applicableApps, pluginID) {
    await this.startTestService(applicableApps);
    await this.timeout(1500);
    const pluginTestsPath = path.resolve(this.pluginFolder, this.pluginTestFolder);
    process.chdir(pluginTestsPath);

    const testParams = this.createUXPPluginTestRunParams(params, applicableApps, pluginID);
    return new Promise((resolve, reject) => {
      const cmd = 'yarn';
      const args = ['uxp-plugin-tests', testParams.driverPort, testParams.udtServicePort, testParams.supportedHostApp, testParams.uxpPluginID];
      const options = {
        stdio: 'inherit',
        shell: process.platform === 'win32',
      };
      const testCommand = spawn(cmd, args, options);
      testCommand.on('error', (err) => {
        reject(err);
        process.exit();
      });

      testCommand.on('close', (code) => {
        if (code == 0) {
          resolve(true);
        }
        process.exit();
      });
    });
  }

  initWithBundledTest(pluginDir, packageName) {
    const packageJsonFile = `${packageName}/package.json`;
    const templatePackageDir = require.resolve(packageJsonFile);
    const tempalteDir = path.dirname(templatePackageDir);
    const origTestDir = path.resolve(tempalteDir);
    const destTestDir = path.join(pluginDir, this.pluginTestFolder);

    if (!fs.existsSync(destTestDir)) {
      fs.mkdirSync(destTestDir);
    }
    else {
      const unsafeFiles = [
        'package.json',
        'wdio.conf.js',
        'nightwatch.conf.js',
      ];
      const fileNames = fs.readdirSync(destTestDir);
      const conflictingNames = _.intersection(fileNames, unsafeFiles);
      if (conflictingNames.length) {
        throw new Error(`Conflicting files ${conflictingNames} exists at ${destTestDir}`);
      }
    }
    fs.copySync(origTestDir, destTestDir);
    return Promise.resolve(true);
  }

  installTestDependency() {
    process.chdir(this.pluginTestFolder);

    return new Promise((resolve, reject) => {
      const command = 'yarn';
      const args = ['install'];
      const options = {
        stdio: 'inherit',
        shell: process.platform === 'win32',
      };
      const installDependency = spawn(command, args, options);
      installDependency.on('close', (code) => {
        if (code !== 0) {
          reject({
            command: `${command} ${args.join(' ')}`,
          });
          return;
        }
        resolve({ success: true });
      });
    });
  }
}
export default PluginTestBaseCommand;
