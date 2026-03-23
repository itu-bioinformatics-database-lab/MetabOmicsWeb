import { Injectable, OnDestroy } from "@angular/core";
import { AppDataLoader } from "../../../metabol.common/services/data-loader/data-loader.service";
import { HttpClient } from "@angular/common/http";
import { Router, NavigationStart } from "@angular/router";
import { NotificationsService } from "angular2-notifications";
import { OmicsData, OmicsSelectionService } from "../omics-selection.service";
import * as XLSX from "xlsx";
import * as LZString from "lz-string";
import { AppSettings } from "../../../app/";
import graph from "../../../assets/datasets/universalGraph_new.json";
import synonyms from "../../../assets/datasets/synonyms_latest.json";
import uniprot_synonym_mapping from "../../../assets/datasets/uniprot_synonym_mapping.json";
import { Subscription } from "rxjs";

@Injectable({
  providedIn: "root",
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
  gvConTable: [
    string,
    number,
    string,
    string,
    boolean,
    {
      clinical_sig: string;
      consequence: string;
      location: string;
    }
  ][] = [];
  // epigenomics con table
  epConTable: Array<[string, number, string, string, boolean]> = [];
  file: any;
  analysisTable: Array<[string, number, string, string]> = [];
  public synonymList: [] = synonyms;
  selected = "Combined.json";
  temp: JSON;
  temp2;
  data;
  ooldM;
  arrayBuffer: any;
  fileToUpload: File = null;
  file3: any;
  file2: File;
  file5: any;
  public isLoading: boolean = false;
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
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Clear tables when navigating to welcome or from header navigation
        if (
          event.url.startsWith("/analyze/welcome") ||
          event.url === "/analyze"
        ) {
          // When clicking Analyze in header
          this.clearTables();
        }
      }
    });

    // Handle page refresh
    this.beforeUnloadHandler = () => this.clearTables();
    window.addEventListener("beforeunload", this.beforeUnloadHandler);
  }

  // Initialize omics vector from selected omics
  initializeOmicsVector() {
    const selectedOmics = this.omicsService.getSelectedOmicsArray();

    if (selectedOmics && selectedOmics.length > 0) {
      this.omicsVector = selectedOmics.map((omics) => omics.type);
      this.currentOmicsIndex = 0;
    }
  }

  // Get current omics type from vector
  getCurrentOmicsType(): string {
    return this.omicsVector[this.currentOmicsIndex] || "";
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

  // Navigate to the measurement (input method selection) page for a given omics type.
  // Each measurement page offers Upload / Manual / Sample options, matching the
  // first-omics experience that starts from the Welcome page.
  navigateToOmicsType(omicsType: string) {
    switch (omicsType) {
      case 'Metabolomics':
        this.router.navigate(['/analyze/metabolomics-measurement']);
        break;
      case 'Transcriptomics':
        this.router.navigate(['/analyze/transcriptomics-measurement']);
        break;
      case 'Proteomics':
        this.router.navigate(['/analyze/proteomics-measurement']);
        break;
      case 'miRNAs':
        this.router.navigate(['/analyze/mirnas-measurement']);
        break;
      case 'Genomic Variants':
        this.router.navigate(['/analyze/genomic-variants-measurement']);
        break;
      case 'Epigenomics':
        this.router.navigate(['/analyze/epigenomics-measurement']);
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
    localStorage.removeItem("metabolitics-data-Metabolomics");
    localStorage.removeItem("metabolitics-data-Transcriptomics");
    localStorage.removeItem("metabolitics-data-Proteomics");
    localStorage.removeItem("metabolitics-data-miRNAs");
    localStorage.removeItem("metabolitics-data-GenomicVariant");
    localStorage.removeItem("metabolitics-data");
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    window.removeEventListener("beforeunload", this.beforeUnloadHandler);
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
      if (omicsType == "Metabolomics") {
        localStorage.removeItem("metabolitics-data-Metabolomics");
        this.loader.get("Recon3D", (recon) => {
          for (let t in this.temp) {
            if (recon.metabolites[t]) {
              this.mConTable.push([
                t,
                this.temp[t],
                recon.metabolites[t].id,
                recon.metabolites[t].name,
                true,
              ]);
            } else {
              if (this.synonymList[t]) {
                const name = this.prioritizeMetabolites(this.synonymList[t]);
                if (recon.metabolites[name]) {
                  this.mConTable.push([
                    t,
                    this.temp[t],
                    name,
                    recon.metabolites[name].name,
                    true,
                  ]);
                } else {
                  this.mConTable.push([t, this.temp[t], name, name, true]);
                }
              } else {
                this.mConTable.push([t, this.temp[t], "-", "-", false]);
              }
            }
          }
        });
      } else if (omicsType == "Transcriptomics") {
        localStorage.removeItem("metabolitics-data-Transcriptomics");
        for (let gene in this.temp) {
          const value = this.temp[gene];
          const uniprots = uniprot_synonym_mapping[gene];
          if (!uniprots) {
            // No synonyms found
            // Check directly
            if (graph.vertices[gene]) {
              this.tConTable.push([
                gene,
                Number(value),
                graph.vertices[gene].label || gene,
                gene,
                true,
              ]);
            } else {
              this.tConTable.push([gene, Number(value), "-", "-", false]);
            }
          } else {
            var matched = false;
            for (const uniprot_id of uniprots) {
              const transcript_id = uniprot_id + "_transcript";
              const transcript_id_x = transcript_id + "_x";
              const matched_id = graph.vertices[transcript_id];
              const matched_id_x = graph.vertices[transcript_id_x];

              if (matched_id) {
                this.tConTable.push([
                  gene,
                  Number(value),
                  matched_id.label || gene,
                  transcript_id,
                  true,
                ]);
                matched = true;
                break;
              } else if (matched_id_x) {
                this.tConTable.push([
                  gene,
                  Number(value),
                  matched_id_x.label || gene,
                  transcript_id_x,
                  true,
                ]);
                matched = true;
                break;
              }
            }
            if (!matched)
              this.tConTable.push([gene, Number(value), "-", "-", false]);
          }
        }
      } else if (omicsType == "Proteomics") {
        localStorage.removeItem("metabolitics-data-Proteomics");
        for (let protein in this.temp) {
          const value = this.temp[protein];
          const uniprots = uniprot_synonym_mapping[protein];

          if (!uniprots) {
            // No synonyms found
            // Check directly
            if (graph.vertices[protein]) {
              this.pConTable.push([
                protein,
                Number(value),
                graph.vertices[protein].label || protein,
                protein,
                true,
              ]);
            } else {
              this.pConTable.push([protein, Number(value), "-", "-", false]);
            }
          } else {
            var matched = false;
            for (const uniprot_id of uniprots) {
              const protein_id = uniprot_id + "_protein";
              const protein_id_x = protein_id + "_x";
              const matched_id = graph.vertices[protein_id];
              const matched_id_x = graph.vertices[protein_id_x];

              if (matched_id) {
                this.pConTable.push([
                  protein,
                  Number(value),
                  matched_id.label || protein,
                  protein_id,
                  true,
                ]);
                matched = true;
                break;
              } else if (matched_id_x) {
                this.pConTable.push([
                  protein,
                  Number(value),
                  matched_id_x.label || protein,
                  protein_id_x,
                  true,
                ]);
                matched = true;
                break;
              }
            }
            if (!matched)
              this.pConTable.push([protein, Number(value), "-", "-", false]);
          }
        }
      } else if (omicsType == "miRNAs") {
        localStorage.removeItem("metabolitics-data-miRNAs");
        for (let mirna in this.temp) {
          const value = this.temp[mirna];
          if (graph.vertices[mirna]) {
            this.mrConTable.push([
              mirna,
              Number(value),
              graph.vertices[mirna].label || mirna,
              mirna,
              true,
            ]);
          } else {
            this.mrConTable.push([mirna, Number(value), "-", "-", false]);
          }
        }
      } else if (omicsType == "Genomic Variants") {
        localStorage.removeItem("metabolitics-data-GenomicVariants");

        for (let variant in this.temp) {
          const item = this.temp[variant];
          const targetGene = item.gene_symbol || item.gene || "";
          if (!targetGene) {
            // No gene to map to — still record as unmapped
            this.gvConTable.push([variant, 0, "-", "-", false,
              { clinical_sig: "Unknown", consequence: "n/a", location: "unknown" }]);
            continue;
          }
          const impact_score =
            item.impact_score !== undefined ? Number(item.impact_score) : 0;

          // Wrap all extras into ONE object
          const metadata = {
            clinical_sig: item.clinical_significance || "Unknown",
            consequence: item.consequence || "n/a",
            location:
              item.chromosome && item.position
                ? `${item.chromosome}:${item.position}`
                : "unknown",
          };
          if (graph.vertices[targetGene]) {
            const vertex = graph.vertices[targetGene];
            this.gvConTable.push([
              variant,
              impact_score,
              vertex.label || targetGene,
              targetGene,
              true,
              metadata,
            ]);
          } else {
            this.gvConTable.push([
              variant,
              impact_score,
              "-",
              "-",
              false,
              metadata,
            ]);
          }
        }
      } else if (omicsType == "Epigenomics") {
        localStorage.removeItem("metabolitics-data-Epigenomics");

        for (let feature in this.temp) {
          const item = this.temp[feature];
          const targetGene = item.gene_symbol || item.gene || item.target_gene || "";
          if (!targetGene) {
            // No gene to map to
            this.epConTable.push([feature, 0, "-", "-", false]);
            continue;
          }

          // Get the score/value - try multiple common field names
          const score =
            item.beta_value !== undefined
              ? Number(item.beta_value)
              : item.delta_beta !== undefined
              ? Number(item.delta_beta)
              : item.m_value !== undefined
              ? Number(item.m_value)
              : item.fold_change !== undefined
              ? Number(item.fold_change)
              : item.enrichment_score !== undefined
              ? Number(item.enrichment_score)
              : item.accessibility_score !== undefined
              ? Number(item.accessibility_score)
              : item.signal_value !== undefined
              ? Number(item.signal_value)
              : item.score !== undefined
              ? Number(item.score)
              : 0;

          if (graph.vertices[targetGene]) {
            const vertex = graph.vertices[targetGene];
            this.epConTable.push([
              feature,
              score,
              vertex.label || targetGene,
              targetGene,
              true,
            ]);
          } else {
            this.epConTable.push([feature, score, "-", "-", false]);
          }
        }
      }
      switch (omicsType) {
        case "Metabolomics":
          this.omicsService.updateOmicsData("Metabolomics", {
            fileName: file.name,
          });
          break;
        case "Transcriptomics":
          this.omicsService.updateOmicsData("Transcriptomics", {
            fileName: file.name,
          });
          break;
        case "Proteomics":
          this.omicsService.updateOmicsData("Proteomics", {
            fileName: file.name,
          });
          break;
        case "miRNAs":
          this.omicsService.updateOmicsData("miRNAs", { fileName: file.name });
          break;
        case "Genomic Variants":
          this.omicsService.updateOmicsData("Genomic Variants", {
            fileName: file.name,
          });
          break;
        case "Epigenomics":
          this.omicsService.updateOmicsData("Epigenomics", {
            fileName: file.name,
          });
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
      if (omicsType == "Metabolomics") {
        localStorage.removeItem("metabolitics-data-Metabolomics");
        this.loader.get("Recon3D", (recon) => {
          for (let line of lines) {
            const splitted = line.split(",");
            const originalName = splitted[0].trim().replace(/^"|"$/g, "");
            if (originalName !== "" && originalName !== null) {
              const value = splitted[1];
              if (recon.metabolites[originalName]) {
                this.mConTable.push([
                  originalName,
                  value,
                  recon.metabolites[originalName].id,
                  recon.metabolites[originalName].name,
                  true,
                ]);
              } else {
                if (this.synonymList[originalName]) {
                  const reconName = this.prioritizeMetabolites(
                    this.synonymList[originalName]
                  );
                  if (recon.metabolites[reconName]) {
                    this.mConTable.push([
                      originalName,
                      value,
                      reconName,
                      recon.metabolites[reconName].name,
                      true,
                    ]);
                  } else {
                    this.mConTable.push([
                      originalName,
                      value,
                      reconName,
                      reconName,
                      true,
                    ]);
                  }
                } else {
                  this.mConTable.push([originalName, value, "-", "-", false]);
                }
              }
            }
          }
        });
      } else if (omicsType == "Transcriptomics") {
        localStorage.removeItem("metabolitics-data-Transcriptomics");
        for (let line of lines) {
          const splitted = line.split(",");
          const gene = splitted[0].replace(/"/g, ""); // Original name
          const value = splitted[1];

          const uniprots = uniprot_synonym_mapping[gene];
          if (!uniprots) {
            // No synonyms found
            // Check directly
            if (graph.vertices[gene]) {
              this.tConTable.push([
                gene,
                Number(value),
                graph.vertices[gene].label || gene,
                gene,
                true,
              ]);
            } else {
              this.tConTable.push([gene, Number(value), "-", "-", false]);
            }
          } else {
            var matched = false;
            for (const uniprot_id of uniprots) {
              const transcript_id = uniprot_id + "_transcript";
              const transcript_id_x = transcript_id + "_x";
              const matched_id = graph.vertices[transcript_id];
              const matched_id_x = graph.vertices[transcript_id_x];

              if (matched_id) {
                this.tConTable.push([
                  gene,
                  Number(value),
                  matched_id.label || gene,
                  transcript_id,
                  true,
                ]);
                matched = true;
                break;
              } else if (matched_id_x) {
                this.tConTable.push([
                  gene,
                  Number(value),
                  matched_id_x.label || gene,
                  transcript_id_x,
                  true,
                ]);
                matched = true;
                break;
              }
            }
            if (!matched)
              this.tConTable.push([gene, Number(value), "-", "-", false]);
          }
        }
      } else if (omicsType == "Proteomics") {
        localStorage.removeItem("metabolitics-data-Proteomics");
        for (let line of lines) {
          const splitted = line.split(",");
          const protein = splitted[0].replace(/"/g, ""); // Original name
          const value = splitted[1];

          const uniprots = uniprot_synonym_mapping[protein];
          if (!uniprots) {
            // No synonyms found
            // Check directly
            if (graph.vertices[protein]) {
              this.pConTable.push([
                protein,
                Number(value),
                graph.vertices[protein].label || protein,
                protein,
                true,
              ]);
            } else {
              this.pConTable.push([protein, Number(value), "-", "-", false]);
            }
          } else {
            var matched = false;
            for (const uniprot_id of uniprots) {
              const protein_id = uniprot_id + "_protein";
              const protein_x_id = protein_id + "_x";
              const matched_id = graph.vertices[protein_id];
              const matched_id_x = graph.vertices[protein_x_id];

              if (matched_id) {
                this.pConTable.push([
                  protein,
                  Number(value),
                  matched_id.label || protein,
                  protein_id,
                  true,
                ]);
                matched = true;
                break;
              } else if (matched_id_x) {
                this.pConTable.push([
                  protein,
                  Number(value),
                  matched_id_x.label || protein,
                  protein_x_id,
                  true,
                ]);
                matched = true;
                break;
              }
            }
            if (!matched)
              this.pConTable.push([protein, Number(value), "-", "-", false]);
          }
        }
      } else if (omicsType == "miRNAs") {
        localStorage.removeItem("metabolitics-data-miRNAs");
        for (let line of lines) {
          const splitted = line.split(",");
          const mirna = splitted[0].replace(/"/g, "");
          const value = splitted[1];

          if (mirna !== "" && mirna !== null) {
            if (graph.vertices[mirna]) {
              this.mrConTable.push([
                mirna,
                Number(value),
                graph.vertices[mirna].label || mirna,
                mirna,
                true,
              ]);
            } else {
              this.mrConTable.push([mirna, Number(value), "-", "-", false]);
            }
          }
        }
      } else if (omicsType == "Genomic Variants") {
        localStorage.removeItem("metabolitics-data-GenomicVariants");
        for (let line of lines) {
          const splitted = line.split(",");
          const variant = splitted[0].replace(/"/g, "").trim();

          if (variant !== "" && variant !== null) {
            // Expected CSV format: variant_id, gene_symbol, impact_score, clinical_significance, consequence, chromosome, position
            const targetGene = splitted[1]
              ? splitted[1].replace(/"/g, "").trim()
              : "";
            // Skip header row or rows with no gene symbol
            if (!targetGene || targetGene === "gene_symbol") continue;

            const impact_score = splitted[2] ? Number(splitted[2].trim()) : 0;
            const clinical_sig = splitted[3]
              ? splitted[3].replace(/"/g, "").trim()
              : "Unknown";
            const consequence = splitted[4]
              ? splitted[4].replace(/"/g, "").trim()
              : "n/a";
            const chromosome = splitted[5]
              ? splitted[5].replace(/"/g, "").trim()
              : "";
            const position = splitted[6]
              ? splitted[6].replace(/"/g, "").trim()
              : "";

            const metadata = {
              clinical_sig: clinical_sig,
              consequence: consequence,
              location:
                chromosome && position
                  ? `${chromosome}:${position}`
                  : "unknown",
            };

            if (graph.vertices[targetGene]) {
              const vertex = graph.vertices[targetGene];
              this.gvConTable.push([
                variant,
                impact_score,
                vertex.label || targetGene,
                targetGene,
                true,
                metadata,
              ]);
            } else {
              this.gvConTable.push([
                variant,
                impact_score,
                "-",
                "-",
                false,
                metadata,
              ]);
            }
          }
        }
      } else if (omicsType == "Epigenomics") {
        localStorage.removeItem("metabolitics-data-Epigenomics");
        for (let line of lines) {
          const splitted = line.split(",");
          const feature = splitted[0].replace(/"/g, "").trim();

          if (feature !== "" && feature !== null) {
            // Expected CSV format: feature_id, gene_symbol, score/value
            const targetGene = splitted[1]
              ? splitted[1].replace(/"/g, "").trim()
              : "";
            // Skip header row or rows with no gene symbol
            if (!targetGene || targetGene === "gene_symbol") continue;

            const score = splitted[2] ? Number(splitted[2].trim()) : 0;

            if (graph.vertices[targetGene]) {
              const vertex = graph.vertices[targetGene];
              this.epConTable.push([
                feature,
                score,
                vertex.label || targetGene,
                targetGene,
                true,
              ]);
            } else {
              this.epConTable.push([feature, score, "-", "-", false]);
            }
          }
        }
      }
      switch (omicsType) {
        case "Metabolomics":
          this.omicsService.updateOmicsData("Metabolomics", {
            fileName: file.name,
          });
          break;
        case "Transcriptomics":
          this.omicsService.updateOmicsData("Transcriptomics", {
            fileName: file.name,
          });
          break;
        case "Proteomics":
          this.omicsService.updateOmicsData("Proteomics", {
            fileName: file.name,
          });
          break;
        case "miRNAs":
          this.omicsService.updateOmicsData("miRNAs", { fileName: file.name });
          break;
        case "Genomic Variants":
          this.omicsService.updateOmicsData("Genomic Variants", {
            fileName: file.name,
          });
          break;
        case "Epigenomics":
          this.omicsService.updateOmicsData("Epigenomics", {
            fileName: file.name,
          });
          break;
      }
    };
  }

  ///////////////////////////////// Workbench
  readText(inputValue: any) {
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
      this.httpClient
        .post(`${AppSettings.API_ENDPOINT}/workbench`, {
          data: fileReader.result,
        })
        .subscribe(
          (data) => {
            this.notify2.remove();
            const recData = data as JSON;
            const compressedData = LZString.compress(JSON.stringify(recData));
            localStorage.setItem("metabolitics-data", compressedData);
            this.router.navigate(["/analyze/excel-data"]);
          },
          (err) => {
            console.log("Error occured");
          }
        );
    };
    fileReader.readAsText(this.file3);
  }

  incomingfile(
    event,
    loadingRef: { value: boolean },
    omicsType: string = "Metabolomics"
  ) {
    this.isLoading = true;
    if (loadingRef) loadingRef.value = true;

    if (event.target.files && event.target.files.length > 0) {
      this.file5 = event.target.files[0];
      this.onFileChange(this.file5, loadingRef, omicsType);
    } else {
      this.isLoading = false;
      if (loadingRef) loadingRef.value = false;
    }
  }

  onFileChange(
    file: any,
    loadingRef: { value: boolean },
    omicsType: string = "Metabolomics"
  ) {
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: "binary" });
      const wsname: string = wb.SheetNames[0];
      const wsname2: string = wb.SheetNames[1];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const ws2: XLSX.WorkSheet = wb.Sheets[wsname2];
      const data2 = <any>XLSX.utils.sheet_to_json(ws, { header: 1 });
      const meta = <any>XLSX.utils.sheet_to_json(ws2, { header: 1 });
      this.httpClient
        .post(`${AppSettings.API_ENDPOINT}/excel`, {
          data: data2,
          meta: meta,
          omicsType: omicsType,
        })
        .subscribe(
          (data) => {
            this.notify2.remove();
            const recData = data as JSON;
            const compressedData = LZString.compress(JSON.stringify(recData));

            // Store based on omics type
            if (omicsType === "Transcriptomics") {
              localStorage.setItem(
                "metabolitics-data-Transcriptomics",
                compressedData
              );
            } else if (omicsType === "Proteomics") {
              localStorage.setItem(
                "metabolitics-data-Proteomics",
                compressedData
              );
            } else if (omicsType === "miRNAs") {
              localStorage.setItem("metabolitics-data-miRNAs", compressedData);
            } else {
              localStorage.setItem(
                "metabolitics-data-Metabolomics",
                compressedData
              );
            }

            // Update omics service status
            this.omicsService.updateOmicsData(omicsType, {
              fileName: file.name,
            });

            // Stop loading
            this.isLoading = false;
            if (loadingRef) loadingRef.value = false;

            console.log(recData);
            // Do NOT navigate immediately
            // this.router.navigate(['/analyze/excel-data']);
          },
          (err) => {
            console.log("Error occured");
            this.isLoading = false;
            if (loadingRef) loadingRef.value = false;
          }
        );
    };
    reader.readAsBinaryString(this.file5);
  }

  prioritizeMetabolites(metaboliteList) {
    let is_c_found = false;
    let is_m_found = false;
    let recon_name = "";
    metaboliteList.forEach((metabolite) => {
      if (/_c/.test(metabolite) && !is_c_found) {
        recon_name = metabolite;
        is_c_found = true;
      }
    });
    if (!is_c_found) {
      metaboliteList.forEach((metabolite) => {
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

  getContinueButton(): string {
    if (this.omicsVector.length === 1) {
      return "Continue to Analysis";
    } else if (this.omicsVector.length > 1) {
      // Check if this is the last omics in the vector
      const isLastOmics = this.currentOmicsIndex >= this.omicsVector.length - 1;

      if (isLastOmics) {
        return "Continue to Analysis";
      } else {
        const nextOmicsType = this.omicsVector[this.currentOmicsIndex + 1];
        return `Continue to ${nextOmicsType}`;
      }
    }
    return "Continue";
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
        // Check if we have Excel data for either omics type
        const hasExcelMetabolomics = localStorage.getItem(
          "metabolitics-data-Metabolomics"
        );
        const hasExcelTranscriptomics = localStorage.getItem(
          "metabolitics-data-Transcriptomics"
        );
        const hasExcelProteomics = localStorage.getItem(
          "metabolitics-data-Proteomics"
        );
        const hasExcelMiRNA = localStorage.getItem("metabolitics-data-miRNAs");

        if (
          hasExcelMetabolomics ||
          hasExcelTranscriptomics ||
          hasExcelProteomics ||
          hasExcelMiRNA
        ) {
          this.router.navigate(["/analyze/excel-data"]);
        } else {
          this.router.navigate(["/analyze/submit"]);
        }
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
}
