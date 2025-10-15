import { AppDataLoader } from './../../../metabol.common/services/data-loader/data-loader.service';
import {HttpClient} from "@angular/common/http";
import {ConcentrationTableComponent} from "../concentration-table/concentration-table.component";
import {MetaboliteConcentration} from "../../models/metaboliteConcentration";
import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import synonyms from '../../../assets/datasets/synonyms_latest.json';
import { AppSettings } from '../../../app/';

@Component({
  selector: 'app-sample',
  templateUrl: 'sample.component.html',
  styleUrls: ['sample.component.css'],
})
export class SampleComponent implements OnInit {

  conTable: Array<[string, number, string, string, boolean]> = [];
  unmappedMetabolites: Array<[string, number, string, string, boolean]> = [];
  public synonymList: [] = synonyms;
  constructor(private http: HttpClient, private loader: AppDataLoader) { }

  ngOnInit() {
    this.loadSampleDataSet();
  }

  loadSampleDataSet() {
    this.http.get('assets/example-analyze-doc-files/example_metabolitic.json')

      .subscribe((data:any) => {
        this.loader.get('Recon3D', (recon) => {
          // tslint:disable-next-line:forin
          for (let key in data) {
            let change = data[key];
            if (recon.metabolites[key]) {
              this.conTable.push([key, change, recon.metabolites[key].id, recon.metabolites[key].name, true]);
            } else {
              if (this.synonymList[key]) {
                const name = this.prioritizeMetabolites(this.synonymList[key]);
                if (recon.metabolites[name]) {
                  this.conTable.push([key, change, name, recon.metabolites[name].name, true]);
                } else {
                  this.conTable.push([key, change, name, name, true]);
                }
              } else {
                this.conTable.push([key, change, '-', '-', false]);
              }
            }
          }
        })
        this.unmappedMetabolites = this.conTable.filter((m) => {return m[4] == false;})
      });
  }
  prioritizeMetabolites(metaboliteList) {
    let is_c_found = false;
    let is_m_found = false;
    let recon_name = "";
    metaboliteList.forEach(metabolite => {
      if (/_c/.test(metabolite) && !is_c_found) {
        recon_name = metabolite;
        is_c_found = true;
      }
    });
    if (!is_c_found) {
      metaboliteList.forEach(metabolite => {
        if (/_m/.test(metabolite) && !is_m_found) {
          recon_name = metabolite;
          is_m_found = true;
        }
      });
    }
    if (!is_c_found && !is_m_found) {
      const randomNumber = this.getRandomInt(0, metaboliteList.length - 1);
      recon_name = metaboliteList[randomNumber];
    }
    return recon_name;
  }
  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
