import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SearchBarComponent } from 'src/metabol.search-engine/components';
import { AppSettings } from '../app.settings'
import { MainsearchComponent } from '../mainsearch/mainsearch.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent{

  query: string;

  constructor(private router: Router) { }

  search() {
    this.router.navigate(['panel/search-past-analysis', this.query]);
  }

}
