import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as _ from 'lodash';

import { AppSettings } from "../../../app";
import { LoginService } from "../../../metabol.auth/services";


@Component({
  selector: 'disease-prediction',
  templateUrl: './disease-prediction.component.html',
  styleUrls: ['./disease-prediction.component.css']
})
export class DiseasePredictionComponent implements OnInit {

  @Input() id;
  @Input() method: String;
  predictions = [];

  constructor(private http: HttpClient, private login: LoginService) { }

  ngOnInit() {
    let apiUrl = `${AppSettings.API_ENDPOINT}/analysis/disease-prediction/${this.id}`;

    this.http.get(apiUrl, this.login.optionByAuthorization())
      .subscribe((d:any) => {   
        this.predictions = d;
      });
    
  }

}
