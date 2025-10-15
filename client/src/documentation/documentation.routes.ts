import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DocumentationComponent } from './documentation.component';

const documentationRoutes: Routes = [
    { path: '', component: DocumentationComponent }
];

@NgModule({
    imports: [RouterModule.forChild(documentationRoutes)],
    exports: [RouterModule]
})
export class DocumentationRoutingModule { }
