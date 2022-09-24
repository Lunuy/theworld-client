import EventEmitter from "wolfy87-eventemitter";
import { Parent } from "./Parent";
import { PluginInfo } from "./PluginInfo";
import { serialize } from "./serialize";


export interface Plugin extends EventEmitter {
    on(event : string | RegExp, f : Function) : this;
    on(event : 'delete', f : () => void) : this;
}

export class Plugin extends EventEmitter {
    private readonly id: string;
    private parent: Parent | undefined;
    private deleted: boolean;
    constructor(pluginInfo: PluginInfo, parent: Parent) {
        super();
        this.id = pluginInfo.id;
        this.parent = parent;
        this.deleted = false;
    }
    _emit(evt : string, ...values : any) {
        super.emitEvent(evt, [...values]);
    }
    emitEvent(evt : string | RegExp, args : any[]) {
        if(!this.parent)
            throw new Error('The plugin is deleted');

        if(evt instanceof RegExp) return this;
        this.parent.sendPluginMessage(this.id, serialize([evt, ...args]));
        return this;
    }
    _delete() {
        if(!this.parent)
            throw new Error('The plugin is deleted');

        this.parent = undefined;
        this.deleted = true;
        this.emit('delete');
    }
}