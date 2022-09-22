
import { connectToParent, Connection } from 'penpal';
import EventEmitter from 'wolfy87-eventemitter';
import { Broadcaster } from './Broadcaster';
import { BroadcasterInfo } from './BroadcasterInfo';
import Field from './Field';
import { FieldInfo } from './FieldInfo';
import { Parent } from './Parent';
import { deserialize } from './serialize';
import { User } from './User';
import { Plugin } from './Plugin';
import { PluginInfo } from './PluginInfo';


export interface Client extends EventEmitter {
    on(event : string | RegExp, f : Function) : this
    on(event : 'createField', f : (field: FieldInfo) => void) : this
    on(event : 'createBroadcaster', f : (broadcaster: BroadcasterInfo) => void) : this
    on(event : 'createPlugin', f : (plugin: PluginInfo) => void) : this
    // on(event : "setUserField", f : (fieldId : string, value : ResField["value"]) => void) : this
}

export class Client extends EventEmitter {
    private connection!: Connection;
    private connectingPromise!: Promise<void>;
    private parent!: Parent;

    private broadcasterMap: Map<string, Broadcaster>;
    private fieldMap: Map<string, Field<any>>;
    private pluginMap: Map<string, Plugin>;

    private broadcasterPorts: Set<string>;
    private fieldPorts: Set<string>;
    private pluginPorts: Map<string, { code: string, data: string }>
    private user!: User| null;

    constructor() {
        super();

        this.broadcasterMap = new Map();
        this.fieldMap = new Map();
        this.pluginMap = new Map();
        this.broadcasterPorts = new Set();
        this.fieldPorts = new Set();
        this.pluginPorts = new Map();
    }

    async connect() {
        if(this.connectingPromise) return await this.connectingPromise;

        this.connection = connectToParent({
            methods: {
                getPorts() {
                    return {
                        broadcasters: [...self.broadcasterPorts],
                        fields: [...self.fieldPorts],
                        plugins: [...self.pluginPorts.entries()].map(([name, { code, data }]) => ({ name, code, data }))
                    };
                },
                broadcast(id: string, userId: string, message: string) {
                    const broadcaster = self.broadcasterMap.get(id);
                    if(broadcaster) {
                        try {
                            const [evt, ...values] = deserialize(message);
                            if(typeof evt === 'string')
                                broadcaster._emit(evt, userId, ...values);
                        } catch(e) {

                        }
                    }
                },
                setFieldValue(id: string, userId: string, value: string) {
                    const field = self.fieldMap.get(id);
                    if(field) {
                        try {
                            field._set(deserialize(value), userId);
                        } catch(e) {

                        }
                    }
                },
                sendPluginMessage(id: string, message: string) {
                    const plugin = self.pluginMap.get(id);
                    if(plugin) {
                        try {
                            const [evt, ...values] = deserialize(message);
                            if(typeof evt === 'string')
                                plugin._emit(evt, ...values);
                        } catch(e) {

                        }
                    }
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
                createPlugin(plugin: PluginInfo) {
                    self.emit('createPlugin', plugin);
                },
                deletePlugin(id: string) {
                    const plugin = self.pluginMap.get(id);
                    if(plugin) {
                        plugin._delete();
                        self.pluginMap.delete(id);
                    }
                }
            }
        });

        const self = this;

        this.connectingPromise = (async () => {
            this.parent = await this.connection!.promise as any;
            this.user = await this.parent.getUser();
        })();

        await this.connectingPromise;
    }

    async getField<V>(id: string, fallbackValue: V): Promise<Field<V>> {
        await this.connectingPromise;

        if(this.fieldMap.get(id))
            return this.fieldMap.get(id)!;
        
        let fieldInfo = await this.parent.getField(id);
        if(!fieldInfo)
            fieldInfo = await new Promise(solve => this.once('createField', solve));
        
        const field = new Field<V>(fieldInfo!, this.parent, fallbackValue);
        this.fieldMap.set(id, field);
        return field;
    }
    async getFields<V>(fallbackValueCallback: (id: string) => V) {
        await this.connectingPromise;

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
        await this.connectingPromise;

        if(this.broadcasterMap.get(id))
            return this.broadcasterMap.get(id)!;
        
        let broadcasterInfo = await this.parent.getBroadcaster(id);
        if(!broadcasterInfo)
            broadcasterInfo = await new Promise(solve => this.once('createBroadcaster', solve));
        
        const broadcaster = new Broadcaster(broadcasterInfo!, this.parent);
        this.broadcasterMap.set(id, broadcaster);
        return broadcaster;
    }
    async getBroadcasters() {
        await this.connectingPromise;

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
    
    async getPlugin(id: string) {
        await this.connectingPromise;

        if(this.pluginMap.get(id))
            return this.pluginMap.get(id)!;
        
        let pluginInfo = await this.parent.getPlugin(id);
        if(!pluginInfo)
            pluginInfo = await new Promise(solve => this.once('createPlugin', solve));
        
        const plugin = new Plugin(pluginInfo!, this.parent);
        this.pluginMap.set(id, plugin);
        return plugin;
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
    addPluginPort(id: string, code: string, data: string) {
        this.pluginPorts.set(id, { code, data });
    }
    removePluginPort(id: string) {
        this.pluginPorts.delete(id);
    }

    getUser() {
        return this.user;
    }
}