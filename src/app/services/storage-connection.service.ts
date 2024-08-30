import { Injectable } from '@angular/core';
import { IConnectionConfig } from '../models/connection-config';
import { Observable, of } from 'rxjs';
import { IStorageFiles } from '../models/storage-files';
import {IAssistant} from "../models/assistant.model";
import {store} from "../store/store";
import {StoreKeys} from "../store/store-keys";
import {BlobServiceClient, ContainerClient} from "@azure/storage-blob";



@Injectable({
  providedIn: 'root'
})
export class StorageConnectionService {

  selectedAssistant: IAssistant | null = null;

  private blobClient: BlobServiceClient | undefined;
  private containerClient: ContainerClient | undefined;
  private path: string = '';
  constructor(
  ) { }


  public async connect(connectionConfig: IConnectionConfig) : Promise<string | undefined> {
    return new Promise<string | undefined>(async (resolve, reject) => {
      try {
        await store.set(StoreKeys.PERSIST_AZURE, connectionConfig);
        this.path = connectionConfig.path;
        const blobServiceClient = new BlobServiceClient(connectionConfig.connectionString);
        const client = blobServiceClient.getContainerClient(connectionConfig.path);
        if(!await client.exists())
          reject(`No container with name ${connectionConfig.path} exists!`)
        

        this.blobClient = blobServiceClient;
        this.containerClient = client;
        resolve(undefined);
      } catch (err) {
        console.log(err)
        reject(err);
      }
    })
  }

  public getTrainingData(): Observable<IStorageFiles[]> {
    //this.containerClient?.listBlobsFlat().byPage()
    return of([])
  }

}
