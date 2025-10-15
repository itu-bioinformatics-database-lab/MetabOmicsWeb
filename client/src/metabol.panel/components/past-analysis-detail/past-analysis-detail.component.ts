import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef, MatSelect } from '@angular/material';
import { map } from "rxjs/operators";
import { Router } from '@angular/router';
import { LoginService } from "../../../metabol.auth/services";
import { AppSettings } from "../../../app";
import { DialogPathwayVisualizationComponent } from '../dialog-pathway-visualization';
import { DialogReactionResultsComponent } from '../dialog-reaction-results';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import * as _ from 'lodash';

@Component({
  selector: 'app-past-analysis-detail',
  templateUrl: './past-analysis-detail.component.html',
  styleUrls: ['./past-analysis-detail.component.css']
})
export class PastAnalysisDetailComponent implements OnInit {
  conTable: Array<[string,number]> = [];


  id;
  data;
  data2:JSON;
  idData;
  recDATA:JSON;
  selectedMethod;
  selectedObj=0;
  methods = {
    Metabolitics: '\d',
    DirectPathwayMapping: 'direct-pathway-mapping'
  };

  constructor(
    private http: HttpClient,
    private login: LoginService,
    private router: Router,
    private route: ActivatedRoute) { }

  ngOnInit() {



    this.route.params.subscribe((params) => {
      this.id = params['key'];
      this.getData();

    });
    if (localStorage.getItem('selectedObj2')){
      this.selectedObj = Number(localStorage.getItem('selectedObj2'));
      localStorage.removeItem('selectedObj2');
    }
  }

  getData() {
    this.selectedMethod = '0';
    let apiUrl = `${AppSettings.API_ENDPOINT}/analysis/detail/${this.id}`;
    this.http.get(apiUrl, this.login.optionByAuthorization())
      .subscribe((data: any) => {
        //console.log(data);
        this.data2 = JSON.parse(JSON.stringify(data['fold_changes']));

      for (let t in this.data2){
        this.conTable.push([t,this.data2[t]]);


      }

        this.data = data;
        //console.log(data);
        let values = this.data['results_pathway'][0];
        let eliminated = {};
        let keys = _.keys(values)
          .filter(x => !x.startsWith('Transport') && !x.startsWith('Exchange'));
        keys.forEach(function (key) {
           eliminated[key] = values[key];
         });
         this.data['results_pathway'][0] = eliminated;
         console.log(data);
         if (this.selectedObj == 0){
          this.selectedObj = this.data['analyses'][0]['id'];
         }
      });

      if (localStorage.getItem('reload') == 'True'){
        localStorage.removeItem('reload');
        location.reload();
      }
  }
  isInteger(num) {
    try {
      return parseInt(num) ? true : false;
    }
    catch (err) {
      return false;
    }
  }
  reloadAnalysis () {
    localStorage.setItem('reload', 'True');
    localStorage.setItem('selectedObj2', String(this.selectedObj));
    this.router.navigate(['/panel/past-analysis', this.selectedObj]);

  }
}
