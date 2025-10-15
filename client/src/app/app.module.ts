import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { SimpleNotificationsModule } from 'angular2-notifications';
import { NgPipesModule } from 'ngx-pipes';
import { MatRippleModule } from '@angular/material';
import {MatListModule} from '@angular/material/list';

import { routing, appRoutingProviders } from './app.routes';
import { AppComponent } from './app.component';

import { MetabolCommonModule } from '../metabol.common';

import { VisualizationModule } from "../metabol.visualization";
import { MetabolAuthModule } from "../metabol.auth";  
import { SubsystemAnalyzeModule } from "../metabol.subsystem-analyze";

import { MatButtonModule} from '@angular/material';
import { MatTabsModule} from '@angular/material/tabs';
import { MatAutocompleteModule} from '@angular/material/autocomplete';
import { MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatMenuModule} from '@angular/material/menu';
import { MatToolbarModule} from '@angular/material/toolbar';
import { MatIconModule} from '@angular/material/icon';
import { MatCardModule} from '@angular/material/card';
import { MatDialogModule} from '@angular/material/dialog';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatSelectModule} from '@angular/material/select';
import { MatInputModule} from '@angular/material/input';
import { HttpModule } from '@angular/http';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatTableModule} from '@angular/material/table';
import { ReactiveFormsModule } from '@angular/forms';

import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import { MainComponent } from './main/main.component';
import { SearchBarComponent } from 'src/metabol.search-engine/components';
import { MainsearchComponent } from './mainsearch/mainsearch.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    MainsearchComponent,
  ]
  ,
  imports: [
    MatListModule,
    NoopAnimationsModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    BrowserModule,
    FormsModule,
    MatInputModule,
    HttpClientModule,
    HttpModule,
    MatExpansionModule,
    MatTableModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,

    MetabolCommonModule,
    MetabolAuthModule,
    SubsystemAnalyzeModule,
    VisualizationModule,
    NgPipesModule,
    MatRippleModule,
    SimpleNotificationsModule.forRoot(),
    routing,

  ],
  providers: [appRoutingProviders],
  bootstrap: [AppComponent]
})
export class AppModule { }
