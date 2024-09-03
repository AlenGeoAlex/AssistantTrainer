import {inject, Injectable} from '@angular/core';
import {StorageConnectionService} from "./storage-connection.service";
import {MessageService} from "primeng/api";
import {ReviewService} from "./review.service";
import {IStorageFiles} from "../models/storage-files";
import {LoaderService} from "./loader.service";

@Injectable({
  providedIn: 'root'
})
export class LocalFileService {

  private readonly connectionService = inject(StorageConnectionService);
  private readonly messageService = inject(MessageService)
  private readonly loaderService = inject(LoaderService)
  protected readonly reviewService = inject(ReviewService);

  public localList: IStorageFiles[] = []

  constructor() { }

  async addLocal(existingDoc: any | undefined, $event: any): Promise<IStorageFiles | undefined> {
    if($event){
      $event.stopPropagation()
    }

    if(!this.connectionService.selectedAssistant){
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'No assistant selected', });
      return undefined;
    }

    if(!existingDoc){
      existingDoc = {
        fileName: "", created: new Date(), id: "", url: undefined, localBlob: [], processed: false, originalName: ""
      }
    }
    const newStorageFile = structuredClone(existingDoc);
    this.loaderService.showLoading("Preparing")
    try{
      newStorageFile.url = undefined;
      newStorageFile.fileName = `${crypto.randomUUID()}.local`;
      newStorageFile.id = `${this.connectionService.selectedAssistant.name}/${newStorageFile.fileName}`;
      newStorageFile.originalName = `${newStorageFile.id}`;
      newStorageFile.processed = false;
      newStorageFile.created = existingDoc.created
      newStorageFile.localBlob = existingDoc.localBlob || await this.connectionService.getBlobByName(existingDoc.originalName);

      this.localList.push(newStorageFile)
    }catch (err){

    }finally {
      this.loaderService.disableLoading()
    }
    return newStorageFile;
  }


}
