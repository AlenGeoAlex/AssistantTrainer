import {inject, Injectable} from '@angular/core';
import { IConnectionConfig } from '../models/connection-config';
import { Observable, of, throwError } from 'rxjs';
import { IStorageFiles } from '../models/storage-files';
import { IAssistant } from "../models/assistant.model";
import { store } from "../store/store";
import { StoreKeys } from "../store/store-keys";
import { BlobItem, BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import {LoaderService} from "./loader.service";



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


  public async connect(connectionConfig: IConnectionConfig): Promise<string | undefined> {
    return new Promise<string | undefined>(async (resolve, reject) => {
      try {
        await store.set(StoreKeys.PERSIST_AZURE, connectionConfig);
        this.path = connectionConfig.path;
        const blobServiceClient = new BlobServiceClient(connectionConfig.connectionString);
        const client = blobServiceClient.getContainerClient(connectionConfig.path);
        if (!await client.exists())
          reject(`No container with name ${connectionConfig.path} exists!`);


        this.blobClient = blobServiceClient;
        this.containerClient = client;
        resolve(undefined);
      } catch (err) {
        console.log(err)
        reject(err);
      }
    })
  }

  getBlobByName(name: string) {

    return this.containerClient?.getBlobClient(name).download().then(value => {
      return value.blobBody;
    }).then(value => {
      return value?.text();
    }).then(value => {
      return JSON.parse(value || '');
    })
  }

  public async *getTrainingData(assistantName: string): AsyncIterableIterator<IStorageFiles[]> {
    if (!this.selectedAssistant || !this.containerClient)
      return Promise.reject("No valid connection configuration present");

    let continuationToken = "";
    let currentPage = 1;

    let query = `assistant = '${this.selectedAssistant.name}'`;
    if(!this.selectedAssistant.includeReviewed){
      query += ` AND processed = 'false'`
    }

    const azureConfig = await store.get(StoreKeys.PERSIST_AZURE);
    if(azureConfig && azureConfig.sessionId){
      query += ` AND sessionId = '${azureConfig.sessionId}'`;
    }

    do {
      // Get Page of Blobs
      const iterator = (continuationToken != "")
        ? this.containerClient.findBlobsByTags(query).byPage({ maxPageSize: 20, continuationToken })
        : this.containerClient.findBlobsByTags(query).byPage({ maxPageSize: 20 });

      const page = (await iterator.next()).value;

      // Move to next page
      continuationToken = page.continuationToken;
      if (continuationToken) {
        currentPage++;
      }
      yield page.blobs.map((blob: BlobItem) => {
        let processed = false;
        let createdRaw = undefined;
        let sessionId = undefined;

        if(blob.tags){
          if(Object.hasOwn(blob.tags, "processed")){
            processed = blob.tags["processed"] === 'true';
          }

          if(Object.hasOwn(blob.tags, "created")){
            createdRaw = blob.tags["created"];
          }

          if(Object.hasOwn(blob.tags, "sessionId")){
            sessionId = blob.tags["sessionId"];
          }
        }

        return {
          fileName: (blob.name || '').split('/').pop() || '',
          created: createdRaw || new Date().toISOString().split("T")[0], //TODO
          id: blob.name,
          originalName: blob.name,
          processed: processed,
          sessionId: sessionId
        }
      })

    } while (continuationToken != "")
  }

  humanFileSize(bytes: number, si = false, dp = 2) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
      return bytes + ' B';
    }

    const units = si
      ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
      bytes /= thresh;
      ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
  }

  setProcessed(names: string[]) : Observable<{name: string, status: boolean}> {
    return new Observable<{name: string, status: boolean}>((obs) => {
      const urlBatch = this.batchNames(names);
      let timeoutCounter = 0;
      console.log(urlBatch)
      let fileProcessed = 0;
      for (let batch of urlBatch) {
        setTimeout(async () => {
          for (let eachTrainingData of batch) {
            try {
              const client = this.containerClient?.getBlobClient(eachTrainingData);
              if(!client)
                continue;

              const tags = await client.getTags();
              if(!tags || !tags.tags)
                continue;

              const tagRaw = tags.tags;
              tagRaw["processed"] = "true"
              await client.setTags(tagRaw)
              obs.next({
                name: eachTrainingData,
                status: true
              })
            }catch (err){
              obs.next({
                name: eachTrainingData,
                status: false
              })
            }finally {
              fileProcessed++;
              if(fileProcessed >= names.length){
                obs.complete();
              }
            }
          }
        }, timeoutCounter*2500 );

        timeoutCounter++;
      }
    })
  }

  private batchNames(names: string[]){
    const size = 15;
    const arrayOfArrays = [];
    for (let i=0; i<names.length; i+=size) {
      arrayOfArrays.push(names.slice(i,i+size));
    }

    return arrayOfArrays;
  }

}
