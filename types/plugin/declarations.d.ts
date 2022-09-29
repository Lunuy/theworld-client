
export interface IframeInfo {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface GlobalPluginEnvironmentInfo {
    isLocal: false;
}

export interface LocalPluginEnvironmentInfo {
    isLocal: true;
    iframe: IframeInfo;
}

export type PluginEnvironmentInfo = GlobalPluginEnvironmentInfo | LocalPluginEnvironmentInfo;

declare global {
    class BasePlugin<Data = any> {
        broadcastMessage(event: string, ...messages: any): void;
        sendMessage(userId: string, event: string, ...messages: any): void;
        setTile(x: number, y: number, atlasId: number, atlasIndex: number, isEffect: boolean): void;
        deleteTile(x: number, y: number, isEffect: boolean): void;
        setCollider(x: number, y: number, isBlocked: boolean): void;
        saveData(data: Data): void;
        requestMovePlayer(userId: string, x: number, y: number): void;
        teleportPlayer(userId: string, x: number, y: number): void;
    
        onLoad(data: Data, environmentInfo: PluginEnvironmentInfo): void;
        onUnload(): void;
        onPlayerJoin(userId: string): void;
        onPlayerLeave(userId: string): void;
        onPlayerMove(userId: string, x: number, y: number, isFromUser: boolean): void;
        onPlayerTeleport(userId: string, x: number, y: number): void;
        onMessage(userId: string, event: string, ...messages: any): void;
        onChat(userId: string, message: string): void;
    }
    var PluginImpl: { new(): BasePlugin };
}