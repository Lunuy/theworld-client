


export function serialize(data: any) {
    return JSON.stringify({ _: data });
}

export function deserialize(data: string) {
    return JSON.parse(data)._;
}