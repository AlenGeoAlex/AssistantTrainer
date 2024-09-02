import { AbstractControl } from "@angular/forms";

export interface IConnectionConfig {
    connectionString: string;
    path: string,
    includeReviewed: boolean
}

export interface IConnectionConfigForm {
    connectionString: AbstractControl;
    path: AbstractControl,
    includeReviewed: AbstractControl,
}