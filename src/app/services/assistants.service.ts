import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {from, map, Observable, of, throwError} from 'rxjs';
import { IAssistant } from '../models/assistant.model';
import OpenAI from "openai";

@Injectable({
  providedIn: 'root'
})
export class AssistantsService {

  protected client: OpenAI | undefined;

  constructor(
    private http: HttpClient
  ) { }

  public getAssistants(): Observable<IAssistant[]> {
    if(!this.client)
      of(throwError(() => 'No OpenAI client found.'))

    return from(this.client!.beta.assistants.list()).pipe(
        map((response: any) => {
          return (response.data as any[]).map(x => {
            return {
              id: x.id,
              name: x.name,
            } as IAssistant;
          });
        })
    );
  }

  public async connect(apiKey: string) : Promise<string | undefined>{
    return new Promise<string | undefined>( async (resolve, reject) => {
      try {
        this.client = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true
        });

        try {
          this.client?.beta.assistants.list()
        }catch (err){
          reject(`Not a valid key!`)

        }

        resolve(undefined);
      }catch (err){
        reject(err)
      }
    })
  }

  public isConnected() : boolean {
    return this.client !== null;
  }

  public async fetchToolPrompt(id: string) : Promise<any[] | undefined>{
    if(!this.client)
      return Promise.reject("No OpenAI client found, Please connect using API Key.");

    const assistant = await this.client.beta.assistants.retrieve(id);
    if(!assistant)
      return Promise.reject(undefined);

    return Promise.resolve(assistant.tools);
  }

  public async fetchSystemPrompt(id: string) : Promise<string | null>{
    if(!this.client)
      return Promise.reject("No OpenAI client found.")

    const assistant = await this.client.beta.assistants.retrieve(id);
    if(!assistant)
      return Promise.reject(undefined);

    return Promise.resolve(assistant.instructions);
  }

}
