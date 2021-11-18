
import Penpal, { Connection } from 'penpal';
import EventEmitter from 'wolfy87-eventemitter';
import { Broadcaster } from './Broadcaster';
import { BroadcasterInfo } from './BroadcasterInfo';
import Field from './Field';
import { FieldInfo } from './FieldInfo';
import { Parent } from './Parent';
import { User } from './User';



export interface Client extends EventEmitter {
    on(event : string | RegExp, f : Function) : this
    on(event : 'createField', f : (field: FieldInfo) => void) : this
    // on(event : "setUserField", f : (fieldId : string, value : ResField["value"]) => void) : this
}

export class Client extends EventEmitter {
    private connection!: Connection;
    private connectingPromise!: Promise<void>;
    private parent!: Parent;

    private broadcasterMap: Map<string, Broadcaster>;
    private fieldMap: Map<string, Field<any>>;

    private broadcasterPorts: Set<string>;
    private fieldPorts: Set<string>;
    private user!: User| null;

    constructor() {
        super();

        this.broadcasterMap = new Map();
        this.fieldMap = new Map();
        this.broadcasterPorts = new Set();
        this.fieldPorts = new Set();
    }

    async connect() {
        if(this.connectingPromise) return await this.connectingPromise;

        this.connection = Penpal.connectToParent({
            methods: {
                getPorts() {
                    return {
                        broadcasters: [...self.broadcasterPorts],
                        fields: [...self.fieldPorts]
                    };
                },
                broadcast(id: string, userId: string, ...values: any) {
                    self.getBroadcaster(id);
                },
                setFieldValue(id: string, userId: string, value: string) {
                    const field = self.fieldMap.get(id);
                    if(field)
                        field._set(value, userId);
                },
                createField(field: FieldInfo) {
                    self.emit('createField', field);
                },
                deleteField(id: string) {
                    const field = self.fieldMap.get(id);
                    if(field) {
                        field._delete();
                        self.fieldMap.delete(id);
                    }
                },
                createBroadcaster(broadcaster: BroadcasterInfo) {
                    self.emit('createBroadcaster', broadcaster);
                },
                deleteBroadcaster(id: string) {
                    const broadcaster = self.broadcasterMap.get(id);
                    if(broadcaster) {
                        broadcaster._delete();
                        self.broadcasterMap.delete(id);
                    }
                },
            }
        });

        const self = this;

        this.connectingPromise = (async () => {
            this.parent = await this.connection!.promise as any;
            this.user = await this.parent.getUser();
        })();
    }

    async getField<V>(id: string, fallbackValue: V) {
        if(this.fieldMap.get(id))
            return this.fieldMap.get(id);
        
        let fieldInfo = await this.parent.getField(id);
        if(!fieldInfo)
            fieldInfo = await new Promise(solve => this.once('createField', solve));
        
        const field = new Field<V>(fieldInfo!, this.parent, fallbackValue);
        this.fieldMap.set(id, field);
        return field;
    }
    async getFields<V>(fallbackValueCallback: (id: string) => V) {
        const fieldInfos = await this.parent.getFields();

        const fields = fieldInfos.map(fieldInfo => {
            const field = this.fieldMap.get(fieldInfo.id);
            if(field)
                return field;
            const newField = new Field<V>(fieldInfo, this.parent, fallbackValueCallback(fieldInfo.id));
            return newField;
        });

        return fields;
    }

    async getBroadcaster(id: string) {
        if(this.broadcasterMap.get(id))
            return this.broadcasterMap.get(id);
        
        let broadcasterInfo = await this.parent.getBroadcaster(id);
        if(!broadcasterInfo)
            broadcasterInfo = await new Promise(solve => this.once('createBroadcaster', solve));
        
        const broadcaster = new Broadcaster(broadcasterInfo!, this.parent);
        this.broadcasterMap.set(id, broadcaster);
        return broadcaster;
    }
    async getBroadcasters() {
        const broadcasterInfos = await this.parent.getBroadcasters();

        const broadcasters = broadcasterInfos.map(broadcasterInfo => {
            const broadcaster = this.fieldMap.get(broadcasterInfo.id);
            if(broadcaster)
                return broadcaster;
            const newBroadcaster = new Broadcaster(broadcasterInfo, this.parent);
            return newBroadcaster;
        });

        return broadcasters;
    }

    addBroadcasterPort(id: string) {
        this.broadcasterPorts.add(id);
    }
    removeBroadcasterPort(id: string) {
        this.broadcasterPorts.delete(id);
    }
    addFieldPort(id: string) {
        this.fieldPorts.add(id);
    }
    removeFieldPort(id: string) {
        this.fieldPorts.delete(id);
    }

    getUser() {
        return this.user;
    }
}