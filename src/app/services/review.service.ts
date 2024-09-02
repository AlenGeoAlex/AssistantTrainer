import {inject, Injectable} from '@angular/core';
import {invoke} from "@tauri-apps/api/tauri";
import {LoaderService} from "./loader.service";
import {MessageService} from "primeng/api";
import {StorageConnectionService} from "./storage-connection.service";
import { open } from '@tauri-apps/api/shell';
@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  private readonly reviewedFiles : Map<string, any> = new Map();
  protected readonly loaderService : LoaderService = inject(LoaderService)
  protected readonly messageService : MessageService = inject(MessageService)
  protected readonly storageConnectionService : StorageConnectionService = inject(StorageConnectionService)

  constructor() { }

  public review(fileName: string, data: any) {
    this.reviewedFiles.set(fileName, data);
  }

  public isReviewed(fileName: string): boolean {
    return this.reviewedFiles.has(fileName);
  }

  public remove(fileName: string) {
    this.reviewedFiles.delete(fileName);
  }

  public canExport(){
    return this.reviewedFiles.size > 0;
  }

  public async export(asst: string, savePath: any){
    this.loaderService.showLoading("Preparing")
    try {
      const fileName = `${asst.replace(":", "-")}-${new Date().getTime()}.jsonl`;
      if('__TAURI__' in window){
        this.buildJson();
        const path = await invoke("export", {
          body: {
            export_path: savePath,
            json_data: this.buildJson(),
            file_name: fileName
          }
        });

        this.messageService.add({
          severity: "success",
          summary: "Save Successfully",
          detail: `File has been saved at ${path}`
        })

      }else{
        const file = new Blob([this.buildJson()], {
          type: "application/json",
        });

        const link = document.createElement("a");
        link.hreflang = URL.createObjectURL(file);
        link.download = fileName;
        link.click();
        link.remove()
      }


    }catch (err){
      this.messageService.add({
        severity: 'error',
        summary: "Failed to save",
        detail: "Failed to save the file due to "+err?.toString()
      })
    }finally {
      this.loaderService.disableLoading();
    }

    this.reviewedFiles.clear();
  }


  private buildJson() : string {
    let str = "";
    for (let value of this.reviewedFiles.values()) {
      let jsonObject = {
        messages: [

        ] ,
        tools: []
      }
      for (let valueElement of value) {
        // @ts-ignore
        jsonObject.messages.push(valueElement)
      }
      str += JSON.stringify(jsonObject);
      str += "\n";
    }
    return str;
  }
}
