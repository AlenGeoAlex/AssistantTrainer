import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { StorageConnectionService } from '../../../services/storage-connection.service';
import { IConnectionConfig, IConnectionConfigForm } from '../../../models/connection-config';
import { ToastModule } from 'primeng/toast';
import { MenuItem, MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { AssistantsService } from '../../../services/assistants.service';
import { IAssistant } from '../../../models/assistant.model';
import { IStorageFiles } from '../../../models/storage-files';
import { FilesListComponent } from './files-list/files-list.component';
import { InputTextareaModule } from "primeng/inputtextarea";
import { store } from "../../../store/store";
import { LoaderService } from "../../../services/loader.service";
import { MenuModule } from "primeng/menu";
import { StoreKeys } from "../../../store/store-keys";
import { ReviewFileComponent } from "./review-file/review-file.component";
import {CheckboxModule} from "primeng/checkbox";
import {ReviewService} from "../../../services/review.service";
import {LocalFileService} from "../../../services/local-file.service";
import {open} from "@tauri-apps/api/dialog";
import {ToggleButtonModule} from "primeng/togglebutton";
import {InputSwitchModule} from "primeng/inputswitch";

@Component({
  selector: 'app-storage',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, ReactiveFormsModule, FilesListComponent, ToastModule, ButtonModule, InputTextModule, DropdownModule, FormsModule, InputTextareaModule, MenuModule, ReviewFileComponent, CheckboxModule, ToggleButtonModule, InputSwitchModule],
  templateUrl: './storage.component.html',
  styles: ``
})
export class StorageComponent implements OnInit {

  @ViewChild(FilesListComponent) appFileList?: FilesListComponent;
  @ViewChild(ReviewFileComponent) reviewFile?: ReviewFileComponent;

  protected connectionService = inject(StorageConnectionService)
  private messageService = inject(MessageService)
  protected assistantService = inject(AssistantsService)
  protected reviewService = inject(ReviewService)
  private loaderService = inject(LoaderService);
  protected localFileService = inject(LocalFileService);

  protected showConnectionDialog: boolean = false;
  protected showToolDialog: boolean = false;
  protected showOpenAiDialog: boolean = false;
  assistantsData: IAssistant[] = [];

  selectedFileName?: IStorageFiles;
  completedFileData?: IStorageFiles;

  connectionForm = new FormGroup<IConnectionConfigForm>({
    connectionString: new FormControl('', Validators.required),
    path: new FormControl('', Validators.required),
    includeReviewed: new FormControl(false),
    sessionId: new FormControl('')
  })

  toolDialogValue: string | undefined;
  openAiKey: string | undefined;

  protected readonly menuItem: MenuItem[] = [
    {
      label: 'Connection',
      items: [
        {
          label: 'Azure Storage',
          icon: 'pi pi-refresh',
          command: () => {
            if(this.selectedFileName){
              this.messageService.add({ severity: 'warn', summary: "Restricted", detail: "Please close the review page to open the menu!"})
              return;
            }
            setTimeout(async () => {
              await this.showDialog();
            }, 400)
          },
        },
        {
          label: 'Open AI',
          icon: 'pi pi-upload',
          command: async () => {
            if(this.selectedFileName){
              this.messageService.add({ severity: 'warn', summary: "Restricted", detail: "Please close the review page to open the menu!"})
              return;
            }

            setTimeout(async () => {
              await this.showOpenAiToolDialog();
            }, 400)
          }
        }
      ]
    },
    {
      label: 'Open AI',
      items: [
        {
          label: 'Tool Body',
          icon: 'pi pi-upload',
          command: () => {
            if(this.selectedFileName){
              this.messageService.add({ severity: 'warn', summary: "Restricted", detail: "Please close the review page to open the menu!"})
              return;
            }

            setTimeout(() => {
              this.showToolDialogBox();
            }, 400)
          }
        }
      ]
    },
    {
      label: 'Finally!',
      items: [
        {
          label: 'Export JSONL',
          icon: 'pi pi-times',
          command: async () => {
            if(this.selectedFileName){
              this.messageService.add({ severity: 'warn', summary: "Restricted", detail: "Please close the review page to open the menu!"})
              return;
            }

            if(!this.reviewService.canExport()){
              this.messageService.add({severity: 'error', summary: 'No marked reviews', detail: 'Please mark at least one conversation as reviewed'})
              return;
            }
            setTimeout(async () => {
              await this.export();
            }, 400)
          }
        }
      ]
    }
  ]

  async ngOnInit(): Promise<void> {
    const apiKey = await store.get(StoreKeys.PERSIST_OPEN_AI);
    if (apiKey) {
      try {
        await this.assistantService.connect(apiKey)
        this.getAssistants();
      } catch (error) { }
    }

    // Get the Azure Config
    const azureConfig = await store.get(StoreKeys.PERSIST_AZURE);
    if (azureConfig) {
      try {
        this.connectionForm.patchValue(azureConfig);
        await this.connectionService.connect(azureConfig);
        await this.appFileList?.refresh()
        this.messageService.add({ severity: 'success', summary: 'Connection complete', detail: `Connection has been made to ${azureConfig.path}`, });
      } catch (err) {
        console.error(err)
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.toString() || 'An error occurred', });
      }
    }
  }

  protected async showDialog() {
    if (!this.connectionService.selectedAssistant) {
      this.messageService.add({ severity: 'warn', summary: 'No Assistant Selected', detail: 'Please select an assistant first', });
      return;
    }
    const azureConfig = await store.get(StoreKeys.PERSIST_AZURE);
    this.connectionForm.patchValue(azureConfig)
    this.showConnectionDialog = true;
  }

  protected async showOpenAiToolDialog() {
    const openAiKey = await store.get(StoreKeys.PERSIST_OPEN_AI);
    if (openAiKey) {
      this.openAiKey = openAiKey
    }

    this.showOpenAiDialog = true;
  }

  protected async showToolDialogBox() {
    if (!this.connectionService.selectedAssistant) {
      this.messageService.add({ severity: 'warn', summary: 'No Assistant Selected', detail: 'Please select an assistant first', });
      return;
    }
    const newVar = await store.get(StoreKeys.getAssistantToolKey(this.connectionService.selectedAssistant.name));
    if(!newVar){
      this.toolDialogValue = JSON.stringify(newVar);
    }
    this.showToolDialog = true;
  }

  closeDialog() {
    this.showConnectionDialog = false;
    this.connectionForm.reset();
    this.connectionForm.markAsPristine();
    this.connectionForm.markAsUntouched();
  }

  closeOpenAiDialog() {
    this.showOpenAiDialog = false;
  }

  closeToolDialog() {
    this.showToolDialog = false;
    this.toolDialogValue = undefined;
  }

  async fetchPrompt() {

    if (!this.connectionService.selectedAssistant) {
      this.messageService.add({ severity: 'warn', summary: 'No Assistant Selected', detail: 'Please select an assistant first', });
      this.closeToolDialog()
      return;
    }

    if (!this.assistantService.isConnected()) {
      this.messageService.add({ severity: 'warn', summary: 'No OpenAI Client', detail: 'Please connect to OpenAI with API Key', });
      this.closeToolDialog()
      return;
    }
    this.loaderService.showLoading("Getting the prompt...")
    try {
      const response = await this.assistantService.fetchToolPrompt(this.connectionService.selectedAssistant.id);
      this.loaderService.disableLoading();
      if (!response) {
        this.messageService.add({ severity: 'warn', summary: 'No tool prompt is available', detail: 'err', });
        return
      }

      this.toolDialogValue = JSON.stringify(response, null, 4);
      this.messageService.add({ severity: 'success', summary: 'Prompt Refreshed', detail: `New prompt has been refreshed from OpenAI`, });

    } catch (err) {
      this.messageService.add({ severity: 'warn', summary: 'Unknown Error', detail: 'err', });
    }
  }

  async saveToolDialog() {
    if (!this.connectionService.selectedAssistant) {
      this.messageService.add({ severity: 'warn', summary: 'No Assistant Selected', detail: 'Please select an assistant first', });
      return;
    }

    if (!this.toolDialogValue) {
      this.messageService.add({ severity: 'warn', summary: 'No Tool Parameter', detail: 'Please provide a valid tool parameter', });
      return;
    }

    let parsedObject: any = null;
    try {
      parsedObject = JSON.parse(this.toolDialogValue);
    } catch (err) {
      this.messageService.add({ severity: 'warn', summary: 'No Tool Parameter', detail: 'Please provide a valid tool parameter', });
      return;
    }

    await store.set(StoreKeys.getAssistantToolKey(this.connectionService.selectedAssistant.name), parsedObject);
    this.messageService.add({ severity: 'success', summary: 'Saved Success' })
    this.closeToolDialog();
  }

  save() {
    if (this.connectionForm.valid) {
      this.connectionService.connect(this.connectionForm.value! as IConnectionConfig).then(() => {
        this.messageService.add({ severity: 'success', summary: 'Connection complete', detail: `Connection has been made to ${this.connectionForm.value.path}`, });
        this.closeDialog();
        this.connectionForm.markAsPristine();
        this.connectionForm.markAsUntouched();
      }).catch((error) => {
        console.error(error)
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message || 'An error occurred', });
      })
    }
  }

  async saveOpenAiDialog() {
    if (this.openAiKey)
      await this.connectAssistant(this.openAiKey)

    this.closeOpenAiDialog();
  }

  async connectAssistant(key: string) {
    try {
      await this.assistantService.connect(key)
      await store.set(StoreKeys.PERSIST_OPEN_AI, key);
      this.getAssistants();
      this.messageService.add({ severity: 'success', summary: 'Connection Successful', detail: 'Connected to OpenAI', });

    } catch (err) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.toString() || 'An error occurred while connecting to OpenAI', });
    }
  }

  async selectAssistant(dropdownEvent: any) {
    const asst = dropdownEvent.value;
    const assistantName = asst.name
    await store.set(StoreKeys.PERSIST_ASST, asst);
    this.toolDialogValue = await store.get(StoreKeys.getAssistantToolKey(assistantName)) || '';
    await this.appFileList?.refresh();
  }

  getAssistants() {
    this.loaderService.showLoading("Loading Assistants...")
    this.assistantService.getAssistants().subscribe({
      next: async (data) => {
        this.assistantsData = data;

        this.loaderService.disableLoading()

        // Get the previously used assistant
        const existingAssistant = await store.get(StoreKeys.PERSIST_ASST);
        if (existingAssistant) {
          const foundElement = this.assistantsData.find(x => x.id === existingAssistant.id && x.name === existingAssistant.name);
          if (!foundElement) {
            await store.remove(StoreKeys.PERSIST_ASST)
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Removed stale assistant name', });
          } else {
            this.connectionService.selectedAssistant = foundElement;
            await this.appFileList?.refresh()
            const toolParams = await store.get(StoreKeys.getAssistantToolKey(this.connectionService.selectedAssistant.name));
            if (toolParams) {
              try {
                this.toolDialogValue = JSON.stringify(toolParams, null, 4);
              } catch (err) {
                this.toolDialogValue = "";
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'An error occurred while parsing the tool parameter', });
              }
            } else {
              this.toolDialogValue = "";
            }
          }
        }
      },
      error: (error) => {
        console.error(error)
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message || 'An error occurred', });
        this.loaderService.disableLoading()
      }
    });
  }

  closeFile() {
    if(this.selectedFileName && this.reviewService.isReviewed(this.selectedFileName.fileName)){
      this.reviewFile?.updateReviewed();
    }

    this.selectedFileName = undefined;
    this.completedFileData = undefined;
    this.appFileList?.refresh();
  }

  completeReview(file: IStorageFiles) {
    this.completedFileData = file;
  }

  async addLocalFile($event: MouseEvent) {
    try {
      const newFile = await this.localFileService.addLocal(undefined, $event);
      if(newFile)
        this.selectedFileName = newFile;
    }catch (err){
      this.messageService.add({severity: 'error', summary: 'Failed to create', detail: err?.toString() || 'An error occurred while creating a new file', });
    }
  }

  async export(){
    let savePath = undefined;
    let asst = this.connectionService.selectedAssistant
    if(!asst){
      this.messageService.add({
        severity: 'error', summary: "Unknown Assistant", detail: "Please select an assistant!"
      })
      return;
    }
    if('__TAURI__' in window){
      savePath = await open({
        multiple: false,
        directory: true
      });
    }

    await this.reviewService.export(asst.name, savePath)
  }
}
