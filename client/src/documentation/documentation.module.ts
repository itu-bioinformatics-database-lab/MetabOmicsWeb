import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentationComponent } from './documentation.component';
import { DocumentationRoutingModule } from './documentation.routes';

@NgModule({
    imports: [
        CommonModule,
        DocumentationRoutingModule
    ],
    declarations: [DocumentationComponent]
})
export class DocumentationModule { }
