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

import type { WebSocket } from 'ws';
import type AppClient from './AppClient.js';
import type { Server } from './Client.js';
import Client from './Client.js';

// Plugin details interface (matching the one in AppClient)
interface PluginDetails {
  pluginId: string;
  pluginPath: string;
  hostPlugInSessionId: string;
  getCDTClient: () => CDTClient | null;
  setCDTClient: (client: CDTClient | null) => void;
}

// Client interface for event handling
interface ClientWithType extends Client {
  type: string;
  id: number;
}

class CDTClient extends Client {
  private _appClient: AppClient | null = null;
  private _plugin: PluginDetails | null = null;

  override get type(): string {
    return 'cdt_client';
  }

  static create(server: Server, socket: WebSocket, url: string): CDTClient {
    const urlComps = url.split('/');
    return new CDTClient(server, socket, urlComps[urlComps.length - 1] || '');
  }

  constructor(server: Server, socket: WebSocket, clientSessionId: string) {
    super(server, socket);
    this._appClient = server.pluginSessionMgr.getAppClientFromSessionId(server.clients, clientSessionId) as AppClient | null;
    const pluginDetails = server.pluginSessionMgr.getPluginFromSessionId(clientSessionId) as PluginDetails | null;
    if (!this._appClient || !pluginDetails) {
      this._appClient = null;
      return;
    }
    this._plugin = pluginDetails;
    this._plugin.setCDTClient(this);
    this.handlesRawMessages = true;
    this._appClient.handlePluginCDTConnected(this._plugin.hostPlugInSessionId);
  }

  protected override handleClientRawMessage(rawCDTMessage: string): void {
    if (!this._appClient) {
      this.send({
        error: 'There is no valid app or plugin session applicable for this CDT client.',
      });
      return;
    }
    this._appClient.sendCDTMessage(rawCDTMessage, this._plugin!.hostPlugInSessionId);
  }

  on_clientDidDisconnect(client: ClientWithType): void {
    // If the client is not yet ready, we will just skip it.
    if (!this._appClient) {
      return;
    }
    if (client.type === 'app' && client.id === this._appClient.id) {
      // the app connection got closed - so terminate this cdt debugging session.
      this.handleHostPluginUnloaded();
    }
  }

  handleHostPluginUnloaded(): void {
    if (this._plugin) {
      this._plugin.setCDTClient(null);
    }
    this._appClient = null;
    this._plugin = null;
    if (!this._socket) {
      throw new Error('Socket not set');
    }
    this._socket.close();
  }

  override handleDisconnect(): void {
    if (!this._appClient) {
      return;
    }
    this._appClient.handlePluginCDTDisconnected(this._plugin!.hostPlugInSessionId);
  }
}

export default CDTClient;
