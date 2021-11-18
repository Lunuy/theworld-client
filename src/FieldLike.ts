import EventEmitter from 'wolfy87-eventemitter';
import { FieldInfo } from './FieldInfo';

export interface FieldLike<V> extends EventEmitter {
    id: string;
    value: V;
    set(value : V) : Promise<void>
    on(event : string | RegExp, f : Function) : this
    on(event : 'set', f : (value: V, userId: string) => void) : this;
}