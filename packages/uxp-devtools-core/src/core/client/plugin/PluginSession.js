/*
 *  Copyright 2020 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the License for the specific language
 *  governing permissions and limitations under the License.
 *
 */
import { find, isEqual } from 'lodash-es';
import UxpRcMgr from '../../common/UxpRCMgr.js';

class PluginSession {
  static createFromRcFile() {
    const data = UxpRcMgr.readPluginSession();
    return new PluginSession(data.sessions, data.info);
  }

  static createFromLoadResults(loadResults, pluginInfo) {
    const sessions = loadResults.map((res) => {
      const { app, data } = res;
      return {
        app,
        pluginSessionId: data.pluginSessionId,
      };
    });
    return new PluginSession(sessions, pluginInfo);
  }

  constructor(sessions, pluginInfo) {
    this._sessions = sessions;
    this._pluginInfo = pluginInfo || {};
  }

  get sessions() {
    return this._sessions;
  }

  get pluginInfo() {
    return this._pluginInfo;
  }

  getSessionForApp(appEndPoint) {
    return find(this._sessions, (ses) => {
      isEqual(ses.app, appEndPoint);
    });
  }

  commitToRc(uxprcDirPath) {
    UxpRcMgr.setUxprcPath(uxprcDirPath);
    UxpRcMgr.writePluginSession(this._sessions, this._pluginInfo);
  }
}

export default PluginSession;
