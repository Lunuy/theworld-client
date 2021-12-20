import { BroadcasterInfo } from "./BroadcasterInfo";
import { FieldInfo } from "./FieldInfo";
import { User } from "./User";


export interface Parent {
    getFields(): Promise<FieldInfo[]>;
    getField(id: string): Promise<FieldInfo | null>;
    getFieldValue(id: string): Promise<string>;
    setFieldValue(id: string, value : string): Promise<void>;

    getBroadcasters(): Promise<BroadcasterInfo[]>;
    getBroadcaster(id: string): Promise<BroadcasterInfo | null>;
    broadcast(id: string, message: string): Promise<void>;

    getUser(id?: string): Promise<User | null>;
}