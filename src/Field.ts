import EventEmitter from 'wolfy87-eventemitter';
import { FieldLike } from './FieldLike';
import { FieldInfo } from './FieldInfo';
import { Parent } from './Parent';
import { deserialize, serialize } from './serialize';
import { User } from './User';

interface Field<V> extends FieldLike<V> {
    on(event : string | RegExp, f : Function) : this
    on(event : 'set', f : (value: V, userId: string) => void) : this;
    on(event : 'delete', f : () => void) : this;
}

class Field<V> extends EventEmitter implements FieldLike<V> {
    id: string;
    deleted: boolean;
    private _value: V;
    private parent: Parent | undefined;
    constructor(fieldInfo: FieldInfo, parent: Parent, fallbackValue: V) {
        super();
        this.id = fieldInfo.id;
        this.parent = parent;
        this.deleted = false;

        try {
            this._value = deserialize(fieldInfo.value);
        } catch(e) {
            this._value = fallbackValue;
            this.set(fallbackValue);
        }
    }
    get value() {
        return this._value;
    }
    set value(value: V) {
        if(!this.parent)
            throw new Error('The field is deleted');

        this.parent.setFieldValue(this.id, serialize(value));
    }
    async set(value: V) {
        if(!this.parent)
            throw new Error('The field is deleted');

        await this.parent.setFieldValue(this.id, serialize(value));
    }
    _set(value: V, userId: string) {
        this._value = value;
        this.emit('set', value, userId);
    }
    _delete() {
        this.parent = undefined;
        this.deleted = true;
        this.emit('delete');
    }
}

export default Field;