import { AbstractControl } from "@angular/forms";

export interface IConnectionConfig {
    connectionString: string;
    path: string
}

export interface IConnectionConfigForm {
    connectionString: AbstractControl;
    path: AbstractControl
}