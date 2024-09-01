import { Component, input, inject, OnInit } from '@angular/core';
import { StorageConnectionService } from '../../../../services/storage-connection.service';
import { MessageService } from 'primeng/api';
import { IStorageFiles } from '../../../../models/storage-files';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-review-file',
  standalone: true,
  imports: [TableModule, CommonModule, ButtonModule, ToggleButtonModule, FormsModule],
  templateUrl: './review-file.component.html',
  styles: ``
})
export class ReviewFileComponent implements OnInit {

  fileName = input.required<string>();
  private readonly connectionService = inject(StorageConnectionService);
  private readonly messageService = inject(MessageService)

  originalData: (IStorageFiles & { accepted: boolean })[] = [];

  ngOnInit(): void {
    this.connectionService.getBloByName(this.fileName())?.then(value => {
      console.log(value)
      if (!Array.isArray(value)) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid data received' })
        return;
      }
      value.forEach((v: IStorageFiles) => {
        this.originalData.push({ ...v, accepted: true })
      })
    }).catch(err => {
      console.log(err)
      this.messageService.add({ severity: 'error', summary: 'Error', detail: String(err) })
    })
  }
}
