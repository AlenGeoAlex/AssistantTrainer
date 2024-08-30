import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  public loader : string | undefined = undefined;

  constructor() { }

  public showLoading(text: string = "Loading..."): void {
    this.loader = text || 'Loading';
  }

  public disableLoading(){
    this.loader = undefined;
  }
}
