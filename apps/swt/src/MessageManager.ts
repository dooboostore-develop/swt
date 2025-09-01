import { SessionStorageKey, SwtStatus, SwtSessionData } from './Swt';

export enum Type {
  swtCommand = 'swt-command',
  swtResponse = 'swt-response',
}

export enum Command {
  getSwtStatus = 'get-swt-status',
  getSwtSessions = 'get-swt-sessions',
  getSwtSession = 'get-swt-session',
}

export type MessageCommandGetSwtStatus = {
  type: Type.swtCommand;
  command: Command.getSwtStatus;
};

export type MessageCommandGetSwtSessions = {
  type: Type.swtCommand;
  command: Command.getSwtSessions;
};

export type MessageCommandGetSwtSession = {
  type: Type.swtCommand;
  command: Command.getSwtSession;
  sessionId: string;
};

export type MessageCommand =
  | MessageCommandGetSwtStatus
  | MessageCommandGetSwtSessions
  | MessageCommandGetSwtSession;

export type MessageResponseGetSwtStatus = {
  type: Type.swtResponse;
  command: Command.getSwtStatus;
  data: SwtStatus | null;
};

export type MessageResponseGetSwtSessions = {
  type: Type.swtResponse;
  command: Command.getSwtSessions;
  data: SwtSessionData[];
};

export type MessageResponseGetSwtSession = {
  type: Type.swtResponse;
  command: Command.getSwtSession;
  data: SwtSessionData | null;
};

export type MessageResponse =
  | MessageResponseGetSwtStatus
  | MessageResponseGetSwtSessions
  | MessageResponseGetSwtSession;

export type Message = MessageCommand | MessageResponse;

export class MessageManager {
  private messageListeners: Map<Window, (event: MessageEvent) => void> = new Map();

  constructor(private window: Window) {
  }

  setupMessageListener(targetWindow: Window, onMessage: (data: Message, event: MessageEvent) => void) {
    if (this.messageListeners.has(targetWindow)) {
      targetWindow.removeEventListener('message', this.messageListeners.get(targetWindow)!);
    }

    const listener = (event: MessageEvent) => {
      // if (this.isValidMessageSource(event, targetWindow)) {
      const message = event.data;
      onMessage(message, event);
      // if (this.isValidMessage(message)) {
      //   onMessage(message.command, message.data || null, message.sessionId);
      // }
      // }
    };

    this.messageListeners.set(targetWindow, listener);
    targetWindow.addEventListener('message', listener);
  }

  sendCommandSwtStatus(targetWindow: Window) {
    const message: MessageCommand = {
      type: Type.swtCommand,
      command: Command.getSwtStatus
    };
    this.sendCommand(targetWindow, message);
  }

  sendCommandSwtSessions(targetWindow: Window) {
    const message: MessageCommand = {
      type: Type.swtCommand,
      command: Command.getSwtSessions,
    };
    this.sendCommand(targetWindow, message);
  }

  sendCommandSwtSession(targetWindow: Window, sessionId: string) {
    const message: MessageCommand = {
      type: Type.swtCommand,
      command: Command.getSwtSession,
      sessionId: sessionId,
    };
    this.sendCommand(targetWindow, message);
  }

  sendCommand(targetWindow: Window, data: MessageCommand) {
    targetWindow.postMessage(data, '*');
  }

  sendResponseSwtStatus(targetWindow: Window, data: SwtStatus) {
    const response: MessageResponse = {
      type: Type.swtResponse,
      command: Command.getSwtStatus,
      data
    };
    this.sendResponse(targetWindow, response);
  }

  sendResponseSwtSessions(targetWindow: Window, data: SwtSessionData[]) {
    const response: MessageResponse = {
      type: Type.swtResponse,
      command: Command.getSwtSessions,
      data
    };
    this.sendResponse(targetWindow, response);
  }

  sendResponseSwtSession(targetWindow: Window, data: SwtSessionData) {
    const response: MessageResponse = {
      type: Type.swtResponse,
      command: Command.getSwtSession,
      data
    };
    this.sendResponse(targetWindow, response);
  }

  sendResponse(targetWindow: Window, data: MessageResponse) {
    targetWindow.postMessage(data, '*');
  }

  makeMessageResponse(data: MessageCommand): MessageResponse | null {
    switch (data.command) {
      case 'get-swt-status':
        return {
          command: data.command,
          type: Type.swtResponse,
          data: this.getSwtStatus()
        };
      case 'get-swt-session':
        // data.type
        return {
          command: data.command,
          type: Type.swtResponse,
          data: this.getSessionDataById(data.sessionId)
        }
      case 'get-swt-sessions':
        return {
          command: data.command,
          type: Type.swtResponse,
          data: this.getAllSessions()
        };
      default:
        console.warn(`Unknown command: ${data}`);
        return null;
    }
  }

  public getSwtStatus(): SwtStatus | null {
    const storedStatus = this.window.sessionStorage.getItem(SessionStorageKey.swtStatus);
    return storedStatus ? JSON.parse(storedStatus) : null;
  }

  private getCurrentSessionId(): string | null {
    const storedStatus = this.window.sessionStorage.getItem(SessionStorageKey.swtStatus);
    if (storedStatus) {
      const swtStatus: SwtStatus = JSON.parse(storedStatus);
      return swtStatus.id;
    }
    return null;
  }

  public getAllSessions(): SwtSessionData[] {
    const status = this.getSwtStatus()
    const sessionDatas: SwtSessionData[] = [];
    if (status) {
      status.sessions.forEach(session => {
        const sessionData = this.getSessionDataById(session.id);
        if (sessionData) {
          sessionDatas.push(sessionData);
        }
      });
    }
    return sessionDatas;
  }

  private getSessionDataById(sessionId: string): SwtSessionData | null {
    const storedLog = this.window.sessionStorage.getItem(`${SessionStorageKey.swtSession}-${sessionId}`);
    return storedLog ? JSON.parse(storedLog) : null;
  }

  private isValidMessageSource(event: MessageEvent, expectedSource: Window): boolean {
    return event.source === expectedSource || event.source === this.window.opener;
  }

  private isValidMessage(message: any): message is MessageCommand {
    return message &&
      typeof message === 'object' &&
      (message.type === 'swt-command' || message.type === 'swt-response');
  }

  cleanup() {
    this.messageListeners.forEach((listener, window) => {
      window.removeEventListener('message', listener);
    });
    this.messageListeners.clear();
  }
}