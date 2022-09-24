
export {}

declare global {
    class BasePlugin {
        broadcastMessage(event: string, ...messages: any): void;
        sendMessage(userId: string, event: string, ...messages: any): void;
        setTile(x: number, y: number, atlasId: number, atlasIndex: number, isEffect: boolean): void
        deleteTile(x: number, y: number, isEffect: boolean): void
        setCollider(x: number, y: number, isBlocked: boolean): void
    
        onLoad(): void;
        onUnload(): void;
        onPlayerJoin(userId: string): void;
        onPlayerLeave(userId: string): void;
        onPlayerMove(userId: string, x: number, y: number): void;
        onMessage(userId: string, event: string, ...messages: any): void;
        onChat(userId: string, message: string): void;
    }
    var PluginImpl: { new(): BasePlugin };
}