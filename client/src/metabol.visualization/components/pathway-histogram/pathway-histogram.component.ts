import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import * as _ from 'lodash';

declare var Plotly: any;

@Component({
  selector: 'pathway-histogram',
  templateUrl: './pathway-histogram.component.html',
  styleUrls: ['./pathway-histogram.component.css']
})
export class PathwayHistogramComponent implements OnInit, AfterViewInit {

  constructor() { }

  data = [{
    x: ['a', 'b', 'c'],
    y: [1, 20, 30],
    type: 'bar',
    text: [],
    textposition: 'outside',
    hoverinfo: 'y',
    marker: {
      color: []
    },

  }];
  layout = {
    xaxis: {
      automargin: true,
    },
    yaxis: {
      title : "-log(pval)",
      automargin: true,
    },
    margin: {
      t: 10
    },
  };

  @Input() pathwayScores: Array<object>;
  @Input() method: String;

  ngOnInit() { }

  ngAfterViewInit() {
    // console.log(this.pathwayScores);
    this.data[0].x = Object.keys(this.pathwayScores[0]);
    this.data[0].y = [];

    for (let scores of this.pathwayScores) {
      let sortedScores = _.orderBy(_.toPairs(scores), [(x) => Math.abs(x[1])], [this.method === 'Pathway Enrichment' ? 'asc' : 'desc']).slice(0, 20);
      this.data[0].x = sortedScores.map(x => x[0]);
      this.data[0].y = sortedScores.map(x => x[1]);
      this.data[0].text = sortedScores.map(x => Number(x[1].toPrecision(2)));
      this.data[0].marker.color = sortedScores.map(x => x[1] > 0 ? '#3F51B5' : '#E91E63');
    }
    Plotly.react('histogram', this.data, this.layout);

    if(this.method == "Pathway Enrichment"){
      this.layout.yaxis.title = "-log(pval)";
    }
  }

}
