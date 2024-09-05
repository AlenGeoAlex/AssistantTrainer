import { AbstractControl } from "@angular/forms";

export interface IConnectionConfig {
    connectionString: string;
    path: string,
    includeReviewed: boolean,
    sessionId: string
}

export interface IConnectionConfigForm {
    connectionString: AbstractControl;
    path: AbstractControl,
    includeReviewed: AbstractControl,
    sessionId: AbstractControl
}