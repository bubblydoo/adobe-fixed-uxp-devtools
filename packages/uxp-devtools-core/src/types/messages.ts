/*
 * Message type definitions
 */

export interface BaseMessage {
  command: string;
  requestId?: number;
  error?: string;
}

export interface ReplyMessage extends BaseMessage {
  command: 'reply';
}

export interface ProxyMessage extends BaseMessage {
  command: 'proxy';
  clientId: number;
  message: BaseMessage;
}

export interface PluginMessage extends BaseMessage {
  command: 'Plugin';
  action: 'load' | 'unload' | 'reload' | 'debug' | 'list' | 'validate' | 'cdtConnected' | 'cdtDisconnected' | 'discover';
  pluginSessionId?: string;
  breakOnStart?: boolean;
  params?: {
    provider?: {
      type?: string;
      id?: string;
      path?: string;
    };
    [key: string]: unknown;
  };
}

export interface UXPMessage extends BaseMessage {
  command: 'UXP';
  action: 'unloaded' | 'log';
  pluginSessionId?: string;
  level?: string;
  message?: string;
}

export interface CDTMessage extends BaseMessage {
  command: 'CDT';
  pluginSessionId?: string;
  cdtMessage?: string;
}

export interface CDTBrowserMessage extends BaseMessage {
  command: 'CDTBrowser';
  action: 'cdtMessage' | 'cdtConnected' | 'cdtDisconnected';
  cdtMessage?: string;
}

export interface AppInfoMessage extends BaseMessage {
  command: 'App';
  action: 'info';
}

export interface InitRuntimeClientMessage extends BaseMessage {
  command: 'initRuntimeClient';
}

export interface DidCompleteConnectionMessage extends BaseMessage {
  command: 'didCompleteConnection';
}

export interface DidAddRuntimeClientMessage extends BaseMessage {
  command: 'didAddRuntimeClient';
  app?: AppEndPoint;
}

export interface DidRemoveRuntimeClientMessage extends BaseMessage {
  command: 'didRemoveRuntimeClient';
  id?: number;
  app?: AppEndPoint;
}

export interface DidPluginUnloadedMessage extends BaseMessage {
  command: 'didPluginUnloaded';
  plugin?: PluginInfo;
}

export interface HostAppLogMessage extends BaseMessage {
  command: 'hostAppLog';
  details?: HostAppLogDetails;
}

export interface AppEndPoint {
  id: string;
  version?: string;
}

export interface PluginInfo {
  pluginId: string;
  pluginPath: string;
}

export interface HostAppLogDetails {
  level: string;
  message: string;
  appInfo: {
    appId: string;
    appName: string;
    appVersion: string;
    uxpVersion: string;
  };
}

export type AnyMessage
  = | BaseMessage
    | ReplyMessage
    | ProxyMessage
    | PluginMessage
    | UXPMessage
    | CDTMessage
    | CDTBrowserMessage
    | AppInfoMessage
    | InitRuntimeClientMessage
    | DidCompleteConnectionMessage
    | DidAddRuntimeClientMessage
    | DidRemoveRuntimeClientMessage
    | DidPluginUnloadedMessage
    | HostAppLogMessage;
