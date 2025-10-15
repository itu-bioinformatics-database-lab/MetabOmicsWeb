import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { map } from "rxjs/operators";
import { AppSettings } from "../../../app";
import { LoginService } from "../../../metabol.auth/services";
import * as _ from 'lodash';
import { NotificationsService } from 'angular2-notifications';


@Component({
  selector: 'app-past-analysis',
  templateUrl: './past-analysis.component.html',
  styleUrls: ['./past-analysis.component.css']
})
export class PastAnalysisComponent implements OnInit {
  data = { public: [], list: [], disease: [], results: []};
  form = new FormGroup({});

  temp: any = [];

  loading = true;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private login: LoginService,
    private actRoute: ActivatedRoute,
    private notify2 : NotificationsService,
    private router: Router) {
    }

  ngOnInit() {


    let isActive = localStorage.getItem('access_token') !== null;

    this.actRoute.params.subscribe(params => {
      let searchResults = JSON.parse(localStorage.getItem('search-results'));
      
      if (searchResults) {
        localStorage.removeItem('search-results');
      }


      if (!isActive) {
        ['public'].forEach(x => this.getData(x));

      } else {
        this.getData('list');
        this.getData('public');
      }

    });
  }

  search(query) {
    this.http.get(`${AppSettings.API_ENDPOINT}/analysis/search/${query}`)

      .subscribe((d:any) => {
        this.data.results = d;
        this.createForm();
      });
  }

  getData(type: string) {
    let apiUrl = `${AppSettings.API_ENDPOINT}/analysis/${type}`;
    this.http.get(apiUrl, this.login.optionByAuthorization())

      .subscribe((d:any) => {
        this.data[type] = d;
        this.createForm();
        if (type == 'public') {
          this.loading = false;
        }
      });
}

  createForm() {
    let combined_data = [];
    for (let t in this.data)

      combined_data = combined_data.concat(this.data[t]);


    this.form = this.fb.group(
      _.zipObject(combined_data.map(x => x["avg_id"]),
      _.times(combined_data.length, _.constant([false]))),

      );

  }

  submit() {
    let selecteds = _.toPairs(this.form.value).filter(x => x[1]).map(x => x[0]);
    this.router.navigate(['panel/compare-analysis', selecteds]);
  }

  delete_analysis() {
    let selecteds = Object.entries(this.form.value)
      .filter(([key, value]) => value === true)
      .map(([key]) => key);
  
    console.log(selecteds);
  
    if (selecteds.length > 0) {
      if (this.login.isDemoUser()) {
        this.notify2.error("Demo User", "As a demo user, you don't have permission to delete analyses.");
      } else if (this.login.isLoggedIn) {
        let apiUrl = `${AppSettings.API_ENDPOINT}/delete/delete_analysis`;
        let token = localStorage.getItem("access_token");
  
        if (!token) {
          this.notify2.error("Possible Token Error", "Your session might have expired. Please log in again.");
          return;
        }
  
        let headers = new HttpHeaders({
          "Authorization": `JWT ${token}`,
          "Content-Type": "application/json"
        });
  
        // Using http.post instead of http.request
        this.http.post(apiUrl, { analysis_ids: selecteds }, { headers: headers }).subscribe({
          next: (response) => {
            console.log("Delete successful:", response);
            this.notify2.success("Delete successful.", "Your analyses are deleted successfully.");
            this.router.navigate(['/panel/past-analysis']);
  
            const selectedIds = selecteds.map(id => Number(id));
  
            this.data.list = this.data.list.filter(analysis => !selectedIds.includes(analysis.avg_id));
            this.data.public = this.data.public.filter(analysis => !selectedIds.includes(analysis.avg_id));
  
            this.createForm();
          },
          error: (error) => {
            console.error("Delete failed:", error);
            if (error.status == 404) {
              this.notify2.error("Unauthorized", "You cannot delete these analyses as you are not the owner.");
            } else {
              this.notify2.error("Error", "Error deleting analyses.");
            }
          }
        });
      } else {
        alert("You should log in to delete analyses.");
      }
    }
  }
}
