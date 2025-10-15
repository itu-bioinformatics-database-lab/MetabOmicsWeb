//import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import {CurrencyMetabolitesService, AppDataLoader} from './services';

@NgModule({
  imports: [
    CommonModule

  ],
  providers: [
    AppDataLoader,
    CurrencyMetabolitesService
  ],
})
export class MetabolCommonModule { }
