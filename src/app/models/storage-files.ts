export interface IStorageFiles {
    fileName: string,
    created: Date | string | number,
    url?: string,
    id: string,
    originalName: string,
    processed: boolean
    localBlob: any | undefined;
}