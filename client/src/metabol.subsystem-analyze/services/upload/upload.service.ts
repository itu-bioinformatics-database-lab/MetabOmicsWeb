import { Injectable, OnDestroy } from '@angular/core';
import { AppDataLoader } from '../../../metabol.common/services/data-loader/data-loader.service';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationStart } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { OmicsData, OmicsSelectionService } from '../omics-selection.service';
import * as XLSX from 'xlsx';
import * as LZString from 'lz-string';
import { AppSettings } from '../../../app/';
import graph from '../../../assets/datasets/universalGraph_new.json';
import synonyms from '../../../assets/datasets/synonyms_latest.json';
import uniprot_synonym_mapping from '../../../assets/datasets/uniprot_synonym_mapping.json';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService implements OnDestroy {
  // Vector to track selected omics types in order
  omicsVector: string[] = [];
  currentOmicsIndex: number = 0;
  
  // metabolitics con table
  mConTable: Array<[string, number, string, string, boolean]> = [];
  // transcriptomics con table
  tConTable: Array<[string, number, string, string, boolean]> = [];
  // proteomics con table
  pConTable: Array<[string, number, string, string, boolean]> = [];
  // miRNA con table
  mrConTable: Array<[string, number, string, string, boolean]> = [];
  // genomic variants con table
  gvConTable: Array<[string, number, string, string, boolean]> = [];
  // epigenomics con table
  epConTable: Array<[string, number, string, string, boolean]> = [];
  file: any;
  analysisTable: Array<[string, number, string, string]> = [];
  public synonymList: [] = synonyms;
  selected = 'Combined.json';
  temp: JSON;
  temp2;
  data;
  ooldM;
  arrayBuffer: any;
  fileToUpload: File = null;
  file3: any;
  file2: File;
  file5: any;
  private routerSubscription: Subscription;
  private beforeUnloadHandler: () => void;

  constructor(
    private loader: AppDataLoader,
    private httpClient: HttpClient,
    public router: Router,
    private notify2: NotificationsService,
    private omicsService: OmicsSelectionService
  ) {
    // Subscribe to router events to clear tables on navigation
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // Clear tables when navigating to welcome or from header navigation
        if (event.url.startsWith('/analyze/welcome') || event.url === '/analyze'){  // When clicking Analyze in header
          this.clearTables();
        }
      }
    });

    // Handle page refresh
    this.beforeUnloadHandler = () => this.clearTables();
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  // Initialize omics vector from selected omics
  initializeOmicsVector() {
    const selectedOmics = this.omicsService.getSelectedOmicsArray();
    
    if (selectedOmics && selectedOmics.length > 0) {
      this.omicsVector = selectedOmics.map(omics => omics.type);
      this.currentOmicsIndex = 0;
    }
  }

  // Get current omics type from vector
  getCurrentOmicsType(): string {
    return this.omicsVector[this.currentOmicsIndex] || '';
  }

  // Move to next omics type
  moveToNextOmics(): boolean {
    if (this.currentOmicsIndex < this.omicsVector.length - 1) {
      this.currentOmicsIndex++;
      return true;
    }
    return false;
  }

  // Check if all omics are uploaded
  areAllOmicsUploaded(): boolean {
    return this.currentOmicsIndex >= this.omicsVector.length - 1;
  }

  // Reset vector
  resetOmicsVector() {
    this.omicsVector = [];
    this.currentOmicsIndex = 0;
  }

  // Manually initialize vector with omics types array
  initializeOmicsVectorFromArray(omicsTypes: string[]) {
    this.omicsVector = omicsTypes.slice(); // Create a copy
    this.currentOmicsIndex = 0;
  }

  // Navigate to specific omics type
  navigateToOmicsType(omicsType: string) {
    switch(omicsType) {
      case 'Metabolomics':
        this.router.navigate(['/analyze/metabolomics']);
        break;
      case 'Transcriptomics':
        this.router.navigate(['/analyze/transcriptomics']);
        break;
      case 'Proteomics':
        this.router.navigate(['/analyze/proteomics']);
        break;
      case 'miRNA':
        this.router.navigate(['/analyze/mirna']);
        break;
      case 'Genomic Variants':
        this.router.navigate(['/analyze/genomic-variants']);
        break;
      case 'Epigenomics':
        this.router.navigate(['/analyze/epigenomics']);
        break;
      default:
        console.warn('Unknown omics type:', omicsType);
        break;
    }
  }

  private clearTables() {
    this.mConTable = [];
    this.tConTable = [];
    this.pConTable = [];
    this.mrConTable = [];
    this.gvConTable = [];
    this.epConTable = [];
    this.analysisTable = [];
    this.resetOmicsVector();
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  }

  jsonChange($event, omicsType: string) {
    this.readJson($event.target, omicsType);
  }

  readJson(inputValue: any, omicsType: string) {
    const file: File = inputValue.files[0];
    const myReader: FileReader = new FileReader();
    const file2 = this.selected;
    myReader.readAsText(file);
    myReader.onload = (e: any) => {
      this.temp = JSON.parse(e.target.result);
      if(omicsType == 'Metabolomics'){
        this.loader.get('Recon3D', (recon) => {
          for (let t in this.temp) {
            if (recon.metabolites[t]) {
              this.mConTable.push([t, this.temp[t], recon.metabolites[t].id, recon.metabolites[t].name, true]);
            } else {
              if (this.synonymList[t]) {
                const name = this.prioritizeMetabolites(this.synonymList[t]);
                if (recon.metabolites[name]) {
                  this.mConTable.push([t, this.temp[t], name, recon.metabolites[name].name, true]);
                } else {
                  this.mConTable.push([t, this.temp[t], name, name, true]);
                }
              } else {
                this.mConTable.push([t, this.temp[t], '-', '-', false]);
              }
            }
          }
        });
      } 
      /*
      else if(omicsType == 'Transcriptomics'){
          for (let gene in this.temp) {
            // console.log(gene);
            // 1. Try direct match in universal graph
            const node = graph.vertices[gene] || 
                        graph.vertices[gene.replace(/_transcript|_transcript_x$/, '')];
            if(node){
              this.tConTable.push([gene,this.temp[gene],node.label, gene, true]);
            }
            // 2. Fallback to label graph lookup
            else {
              const labelMatch = labels[gene];
              if(labelMatch){
                this.tConTable.push([gene, this.temp[gene], labelMatch, gene, true]);
              }
              else{
                this.tConTable.push([gene, this.temp[gene], '-', '-', false]);
              }
          }
        }
      }
      */
      else if(omicsType == 'Transcriptomics'){
        for (let gene in this.temp) {
          const value = this.temp[gene];
          const uniprots = uniprot_synonym_mapping[gene];
          if(!uniprots){ // No synonyms found
            // Check directly
            if(graph.vertices[gene]){
              this.tConTable.push([gene, Number(value), graph.vertices[gene].label || gene, gene, true]);
            }
            else{
              this.tConTable.push([gene, Number(value), '-', '-', false]);
            }
          }
          else{
            var matched = false;
            for(const uniprot_id of uniprots){
              const transcript_id = uniprot_id + '_transcript';
              const transcript_id_x = transcript_id + '_x';
              const matched_id = graph.vertices[transcript_id];
              const matched_id_x = graph.vertices[transcript_id_x];
              
              if(matched_id){
                this.tConTable.push([gene, Number(value), matched_id.label || gene, transcript_id, true]);
                matched = true;
                break;
              }
              else if(matched_id_x){
                this.tConTable.push([gene, Number(value), matched_id_x.label || gene, transcript_id_x, true]);
                matched = true;
                break;
              }
            }
            if(!matched)
              this.tConTable.push([gene, Number(value), '-', '-', false]);
          }
        }
      }
      else if(omicsType == 'Proteomics'){
      }
      else if(omicsType == 'miRNA'){
      }
    switch (omicsType) {
      case 'Metabolomics':
        this.omicsService.updateOmicsData('Metabolomics', { fileName: file.name });
        break;
      case 'Transcriptomics':
        this.omicsService.updateOmicsData('Transcriptomics', { fileName: file.name });
        break;
      case 'Proteomics':
        this.omicsService.updateOmicsData('Proteomics', { fileName: file.name });
        break;
      case 'miRNA':
        this.omicsService.updateOmicsData('miRNA', { fileName: file.name });
        break;
      case 'Genomic Variants':
        this.omicsService.updateOmicsData('Genomic Variants', { fileName: file.name });
        break;
      case 'Epigenomics':
        this.omicsService.updateOmicsData('Epigenomics', { fileName: file.name });
        break;
    }
  };
}

  csvChange($event, omicsType: string) {
    this.readCsv($event.target, omicsType);
  }

  readCsv(inputValue: any, omicsType: string) {
    const file: File = inputValue.files[0];
    const myReader: FileReader = new FileReader();
    myReader.readAsText(file);
    myReader.onload = (e: any) => {
      const lines = e.target.result.split("\n");
      if(omicsType == 'Metabolomics'){
        this.loader.get('Recon3D', (recon) => {
          for (let line of lines) {
            const splitted = line.split(',');
            const originalName = splitted[0];
            if (originalName !== '' && originalName !== null) {
              const value = splitted[1];
              if (recon.metabolites[originalName]) {
                this.mConTable.push([originalName, value, recon.metabolites[originalName].id, recon.metabolites[originalName].name, true]);
              } else {
                if (this.synonymList[originalName]) {
                  const reconName = this.prioritizeMetabolites(this.synonymList[originalName]);
                  if (recon.metabolites[reconName]) {
                    this.mConTable.push([originalName, value, reconName, recon.metabolites[reconName].name, true]);
                  } else {
                    this.mConTable.push([originalName, value, reconName, reconName, true]);
                  }
                } else {
                  this.mConTable.push([originalName, value, '-', '-', false]);
                }
              }
            }
          }
        });
      }
      // TODO
      /*
      else if(omicsType == 'Transcriptomics'){
          for (let line of lines) {
            const splitted = line.split(',');
            const gene = splitted[0].replace(/"/g, ''); // Original name
            if(gene !== '' && gene !== null){
              const value = splitted[1];
              // 1. Try direct match in universal graph
              const node = graph.vertices[gene] || 
                          graph.vertices[gene.replace(/_transcript|_transcript_x$/, '')];
              if(node){
                this.tConTable.push([gene, Number(value), node.label, gene, true]);
              } 
              else {
              // 2. Fallback to label graph lookup
                const labelMatch = labels[gene];
                if(labelMatch){
                  this.tConTable.push([gene, Number(value), labelMatch, gene, true]);
                }
                else{
                  this.tConTable.push([gene, Number(value), '-', '-', false]);
                }
              }
            }
        }
      }
        */
      else if(omicsType == 'Transcriptomics'){
        for (let line of lines) {
          const splitted = line.split(',');
          const gene = splitted[0].replace(/"/g, ''); // Original name
          const value = splitted[1];

          const uniprots = uniprot_synonym_mapping[gene];
          if(!uniprots){ // No synonyms found
            // Check directly
            if(graph.vertices[gene]){
              this.tConTable.push([gene, Number(value), graph.vertices[gene].label || gene, gene, true]);
            }
            else{
              this.tConTable.push([gene, Number(value), '-', '-', false]);
            }
          }
          else{
            var matched = false;
            for(const uniprot_id of uniprots){
              const transcript_id = uniprot_id + '_transcript';
              const transcript_id_x = transcript_id + '_x';
              const matched_id = graph.vertices[transcript_id];
              const matched_id_x = graph.vertices[transcript_id_x];
              
              if(matched_id){
                this.tConTable.push([gene, Number(value), matched_id.label || gene, transcript_id, true]);
                matched = true;
                break;
              }
              else if(matched_id_x){
                this.tConTable.push([gene, Number(value), matched_id_x.label || gene, transcript_id_x, true]);
                matched = true;
                break;
              }
            }
            if(!matched)
              this.tConTable.push([gene, Number(value), '-', '-', false]);
          }
        }
      }
      else if(omicsType == 'Proteomics'){
      }
      else if(omicsType == 'miRNA'){
      }
      else if(omicsType == 'Genomic Variants'){
      }
      else if(omicsType == 'Epigenomics'){
      }
    switch (omicsType) {
      case 'Metabolomics':
        this.omicsService.updateOmicsData('Metabolomics', { fileName: file.name });
        break;
      case 'Transcriptomics':
        this.omicsService.updateOmicsData('Transcriptomics', { fileName: file.name });
        break;
      case 'Proteomics':
        this.omicsService.updateOmicsData('Proteomics', { fileName: file.name });
        break;
      case 'miRNA':
        this.omicsService.updateOmicsData('miRNA', { fileName: file.name });
        break;
      case 'Genomic Variants':
        this.omicsService.updateOmicsData('Genomic Variants', { fileName: file.name });
        break;
      case 'Epigenomics':
        this.omicsService.updateOmicsData('Epigenomics', { fileName: file.name });
        break;
    }
  };
}

 ///////////////////////////////// Workbench
    readText(inputValue: any){
      /*
      this.notify2.info('File Upload', 'File uploading',{
        timeOut:5000,
      });
      setTimeout(()=> 
        this.notify2.info('Matching...', 'Performing metabolite matching. This may take a while. Please wait.',{
        timeOut:50000,
      }), 5000);
      */
    this.file3 = inputValue.target.files[0];
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      this.httpClient.post(`${AppSettings.API_ENDPOINT}/workbench`, {
        data: fileReader.result
      }).subscribe(data => {
        this.notify2.remove();
        const recData = data as JSON;
        const compressedData = LZString.compress(JSON.stringify(recData));
        localStorage.setItem('metabolitics-data', compressedData);
        this.router.navigate(['/analyze/excel-data']);
      },
        err => {
          console.log("Error occured");
        }
      );
    }
    fileReader.readAsText(this.file3);
  }

  incomingfile(event, loadingRef: { value: boolean }) {
    loadingRef.value = true;
    this.file5 = event.target.files[0];
    this.onFileChange(this.file5, loadingRef);
  }

  onFileChange(file: any, loadingRef: { value: boolean }) {
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const wsname2: string = wb.SheetNames[1];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const ws2: XLSX.WorkSheet = wb.Sheets[wsname2];
      const data2 = <any>(XLSX.utils.sheet_to_json(ws, { header: 1 }));
      const meta = <any>(XLSX.utils.sheet_to_json(ws2, { header: 1 }));
      this.httpClient.post(`${AppSettings.API_ENDPOINT}/excel`, {
        data: data2, meta: meta
      }).subscribe(data => {
        this.notify2.remove();
        const recData = data as JSON;
        const compressedData = LZString.compress(JSON.stringify(recData));
        localStorage.setItem('metabolitics-data', compressedData);
        console.log(recData);
        this.router.navigate(['/analyze/excel-data']);
      },
        err => {
          console.log("Error occured");
        }
      );
    };
    reader.readAsBinaryString(this.file5);
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

  shouldShowContinueButton(): boolean {
    // Don't show button if all omics are uploaded and ready for analysis
    if (this.omicsService.hasUploadedAllFiles()) {
      return false;
    }
    
    // If only one omics type is selected, show the button
    if (this.omicsVector.length === 1) {
      return true;
    }

    // If multiple omics types are selected, check if current omics is ready to proceed
    if (this.omicsVector.length > 1) {
      const currentOmics = this.omicsService.getCurrentOmics();
      if (currentOmics && currentOmics.fileUploaded) {
        return true;
      }
    }

    return false;
  }

  getContinueButton() : string {
    if(this.omicsVector.length === 1) {
      return 'Continue to Analysis';
    }
    else if(this.omicsVector.length > 1) {
      // Check if this is the last omics in the vector
      const isLastOmics = this.currentOmicsIndex >= this.omicsVector.length - 1;
      
      if(isLastOmics) {
        return 'Continue to Analysis';
      } else {
        const nextOmicsType = this.omicsVector[this.currentOmicsIndex + 1];
        return `Continue to ${nextOmicsType}`;
      }
    }
    return 'Continue';
  }

  canProceed(currentOmicsName: string): boolean {
    const currentOmics = this.omicsService.getCurrentOmics();
    return currentOmics && currentOmics.fileUploaded ? true : false;
  }

  // Navigate to current omics upload page to show concentration table
  proceed(omics: string) {
    if (this.canProceed(omics)) {
      // Move to next omics type in vector
      const hasNext = this.moveToNextOmics();
      
      if (hasNext) {
        // Navigate to next omics type
        const nextOmicsType = this.getCurrentOmicsType();
        
        // Update omics service to reflect current omics using vector index
        this.omicsService.setCurrentOmics(this.currentOmicsIndex);
        
        // Navigate based on omics type
        this.navigateToOmicsType(nextOmicsType);
      } else {
        this.router.navigate(['/analyze/submit']);
      }
      /*
      switch(omics) {
        case 'Metabolomics':
          this.router.navigate(['/analyze/metabolomics-upload']);
          break;
        case 'Transcriptomics':
          this.router.navigate(['/analyze/transcriptomics-upload']);
          break;
        case 'Proteomics':
          this.router.navigate(['/analyze/proteomics-upload']);
          break;
        case 'miRNA':
          this.router.navigate(['/analyze/mirna-upload']);
          break;
        default:
          console.warn('Unknown omics type:', omics);
          break;
      }*/
    }
  }

  // Navigate to next omics type measurement page
  proceedToNext() {
    // Move to next omics type in vector
    const hasNext = this.moveToNextOmics();
    
    if (hasNext) {
      // Navigate to next omics type
      const nextOmicsType = this.getCurrentOmicsType();
      
      // Update omics service to reflect current omics using vector index
      this.omicsService.setCurrentOmics(this.currentOmicsIndex);
      
      // Navigate based on omics type
      this.navigateToOmicsType(nextOmicsType);
    }
  }
};