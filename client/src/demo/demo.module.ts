import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemoComponent } from './demo.component';
import { DemoRoutingModule } from './demo.routes';


@NgModule({
    imports: [
        CommonModule,
        DemoRoutingModule,
    ],
    declarations: [DemoComponent]
})
export class DemoModule { }
