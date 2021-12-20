import EventEmitter from 'wolfy87-eventemitter';
import { BroadcasterInfo } from './BroadcasterInfo';
import { Parent } from './Parent';
import { serialize } from './serialize';

export interface Broadcaster extends EventEmitter {
    on(event : string | RegExp, f : Function) : this;
    on(event : 'delete', f : () => void) : this;
}

export class Broadcaster extends EventEmitter {
    public readonly id: string;
    private parent: Parent | undefined;
    private deleted: boolean;

    constructor(broadcasterInfo: BroadcasterInfo, parent: Parent) {
        super();
        this.id = broadcasterInfo.id;
        this.parent = parent;
        this.deleted = false;
    }
    
    _emit(evt : string, userId : string, ...values : any) {
        super.emitEvent(evt, [userId, ...values]);
    }
    emitEvent(evt : string | RegExp, args : any[]) {
        if(!this.parent)
            throw new Error('The field is deleted');

        if(evt instanceof RegExp) return this;
        this.parent.broadcast(this.id, serialize([evt, ...args]));
        return this;
    }
    _delete() {
        if(!this.parent)
            throw new Error('The field is deleted');

        this.parent = undefined;
        this.deleted = true;
        this.emit('delete');
    }
}