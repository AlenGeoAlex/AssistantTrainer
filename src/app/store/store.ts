import {appLocalDataDir, BaseDirectory} from "@tauri-apps/api/path";
import {Store} from "tauri-plugin-store-api";

export interface IStore {

    get(key: string): Promise<any>;

    set(key: string, value: any): Promise<any>;

    remove(key: string): Promise<any>;

}

export class BrowserStore implements IStore {

    get(key: string): Promise<any> {
        const item = localStorage.getItem(key);
        if(!item)
            return Promise.resolve(null);
        return Promise.resolve(
            JSON.parse(item)
        )
    }
    set(key: string, value: any): Promise<any> {
        localStorage.setItem(key, JSON.stringify(value));
        return Promise.resolve(true);
    }

    remove(key: string): Promise<any> {
        localStorage.removeItem(key);
        return Promise.resolve(true);
    }
}

export class NonBrowserStore implements  IStore {

    private store: Store | null = null;

    private async getStore() : Promise<Store> {
        if(!this.store){
            const path = await appLocalDataDir();
            this.store = new Store(`${path}\\store.bin`);
        }

        return this.store;
    }

    async get(key: string): Promise<any> {
        return (await this.getStore()).get(key);
    }

    async set(key: string, value: any): Promise<any> {
        const fileStore = await this.getStore();
        await fileStore.set(key, value);
        fileStore.save().then(r => {
            return true;
        }).catch((err) => {
            return false;
        });
    }

    async remove(key: string): Promise<any> {
        const fileStore = await this.getStore();
        await fileStore.delete(key);
        fileStore.save().then(r => {
            return true;
        }).catch((err) => {
            return false;
        });
    }

}

export const store : IStore = !('__TAURI__' in window) ? new BrowserStore() : new NonBrowserStore();