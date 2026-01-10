from functools import reduce
from flask import jsonify, request
from flask_jwt import jwt_required, current_identity
from sqlalchemy import and_, or_
from sqlalchemy.types import Float
from ..utils import similarty_dict
from ..visualization import HeatmapVisualization
import time
from ..app import app
from ..schemas import *
from ..models import db, User, Analyses, OmicsDatasets, AnalysisMethod, DiffusionMethod, AnalysisMetadata, Diseases
from ..tasks import save_analysis, enhance_synonyms, save_dpm, save_pe
from ..base import *
from ..dpm import *
import datetime
from ..services.mail_service import *
import os
import pickle
from ..pe import *
from metabomics.preprocessing import MetaboliticsPipeline
import sys
from marshmallow import ValidationError



@app.route('/analysis/fva', methods=['POST'])
@jwt_required()
def fva_analysis():
    """
    FVA analysis
    ---
    tags:
      - analysis
    parameters:
        -
          name: authorization
          in: header
          type: string
          required: true
        - in: body
          name: body
          schema:
            id: AnalysisInput
            required:
              - name
              - concentration_changes
            properties:
              name:
              name:
                  type: string
                  description: name of analysis
              concentration_changes:
                  type: object
                  description: concentration changes of metabolitics
    responses:
      200:
        description: Analysis info
      404:
        description: Analysis not found
      401:
        description: Analysis is not yours
    """
    try:
        data = AnalysisInputSchema().load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400

    if not request.json:
        return "", 404

    # if 'metabolites' in data:
    #     enhance_synonyms.delay(data['metabolites'])

    data = checkMapped(data)


    user = User.query.filter_by(email=str(current_identity)).first()
    #

    if len(data['analysis']) == 0:
        return jsonify({'id': 'mapping_error'})

    else:

        disease = Diseases.query.get(request.json['disease'])
        study = AnalysisMetadata(
            name=request.json['study_name'],
            analysis_method_id=1,
            diffusion_id=1 if "Transcriptomes" in data else None,
            group=request.json["group"],
            disease_id=disease.id,
            disease=disease)
        db.session.add(study)
        db.session.commit()

        analysis_id = 0
        healthy_metab_data = None
        healthy_gene_data = None
        for key,value in data['analysis'].items():
            if len(value['Metabolites']) > 0:
                if value['Label'] == data['group'].lower() + ' label avg':
                    healthy_metab_data = value['Metabolites']
                    healthy_gene_data = value.get('Transcriptomes', None)


        for key,value in data["analysis"].items():  # user as key, value {metaboldata , label}
            current_metabolites = value["Metabolites"]
            current_genes = value.get('Genes', {})
            if len(current_metabolites) > 0:
                if healthy_metab_data != None:
                    # 1. Handle zeros for current Metabolites
                    for k, v in current_metabolites.items():
                        current_metabolites[k] = v if v != 0 else sys.float_info.min
                    # 2. Handle zeros for healthy Metabolites
                    for k, v in healthy_metab_data.items():
                        healthy_metab_data[k] = v if v != 0 else sys.float_info.min
                    metab_pipe = MetaboliticsPipeline(['fold-change-scaler'])
                    # Calculate scaled metabolites (X_t)
                    X_t = metab_pipe.fit_transform([current_metabolites, healthy_metab_data], [value['Label'], 'healthy'])[0]

                    X_gene_scaled = None
                    
                    # Check if Gene baseline and current Gene data are available
                    if healthy_gene_data is not None and len(current_genes) > 0:
                        gene_pipe = MetaboliticsPipeline(['fold-change-scaler'])
                        
                        # Handle zeros for Genes
                        for k, v in current_genes.items():
                            current_genes[k] = v if v != 0 else sys.float_info.min
                        for k, v in healthy_gene_data.items():
                            healthy_gene_data[k] = v if v != 0 else sys.float_info.min
                        
                        # Calculate scaled genes
                        X_gene_scaled = gene_pipe.fit_transform([current_genes, healthy_gene_data], [value['Label'], 'healthy'])[0]

                metabolomics_data = OmicsDatasets(
                    omics_type = "metabolomics",
                    omics_data= value["Metabolites"] if healthy_metab_data == None else X_t,
                    owner_email = str(user),
                    is_public = True if request.json['public'] else False
                )

                transcriptomics_data = None

                if(X_gene_scaled is not None):
                    transcriptomics_data = OmicsDatasets(
                        omics_type = "transcriptomics",
                        omics_data = current_genes if healthy_gene_data == None else X_gene_scaled,
                        owner_email = str(user),
                        is_public = True if request.json['public'] else False
                    )

                metabolomics_data.disease_id = disease.id
                metabolomics_data.disease = disease
                db.session.add(metabolomics_data)
                if( transcriptomics_data is not None):
                    transcriptomics_data.disease_id = disease.id
                    transcriptomics_data.disease = disease
                    db.session.add(transcriptomics_data)
                db.session.commit()


                analysis = Analyses(name=key, user=user)
                analysis.label = value['Label']
                analysis.name = key
                analysis.type = 'public' if request.json['public'] else "private"


                analysis.owner_user_id = user.id
                analysis.owner_email = user.email
                if( transcriptomics_data is not None):
                    analysis.omics_data_id = [metabolomics_data.id, transcriptomics_data.id]
                else:
                    analysis.omics_data_id = metabolomics_data.id
                analysis.dataset_id = study.id

                db.session.add(analysis)
                db.session.commit()
                save_analysis.delay(analysis.id, value["Metabolites"] if healthy_metab_data is None else X_t, gene_changes=None if healthy_metab_data is None else X_gene_scaled)
                analysis_id = analysis.id

        return jsonify({'id': analysis_id})



###############

# Analysis FVA Public

@app.route('/analysis/fva/public', methods=['POST'])
def fva_analysis_public():

    try:
        data = AnalysisInputSchema2().load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400

    if not request.json:
        return "", 404
    # print(request.json)

    counter = 1
    check_value = len(list(request.json['analysis'].keys()))

    # if 'metabolites' in data:
    #     enhance_synonyms.delay(data['metabolites'])

    data = checkMapped(data)

    user = User.query.filter_by(email='tajothman@std.sehir.edu.tr').first()
    if len(data['analysis']) == 0:
        return jsonify({'id': 'mapping_error'})

    else:


        disease = Diseases.query.get(request.json['disease'])
        study = AnalysisMetadata(
            name=request.json['study_name'],
            analysis_method_id=1,
            diffusion_id=1 if "Transcriptomes" in data else None,
            group=request.json["group"],
            disease_id=disease.id,
            disease=disease)
        db.session.add(study)
        db.session.commit()

    #
        for key, value in data["analysis"].items():  # user as key, value {metaboldata , label}
            if len(value['Metabolites']) > 0:
                check_value -=1

                metabolomics_data = OmicsDatasets(
                    omics_type = "metabolitics",
                    omics_data= value["Metabolites"],
                    owner_email=request.json["email"],
                    is_public=True
                )

                trancsriptomics_data = None
                if( "Transcriptomes" in data and len(data["Transcriptomes"]) > 0):
                    trancsriptomics_data = OmicsDatasets(
                        omics_type = "transcriptomics",
                        omics_data= data["Transcriptomes"],
                        owner_email=request.json["email"],
                        is_public=True
                    )

                metabolomics_data.disease_id = disease.id
                metabolomics_data.disease = disease
                trancsriptomics_data.disease_id = disease.id
                trancsriptomics_data.disease = disease
                db.session.add(metabolomics_data)
                db.session.add(trancsriptomics_data)
                db.session.commit()

                analysis = Analyses(name=key, user=user)
                analysis.label = value['Label']
                analysis.name = key
                analysis.type = 'public'
                analysis.start_time = datetime.datetime.now()

                analysis.owner_user_id = user.id
                analysis.owner_email = request.json["email"]
                analysis.omics_data_id = [metabolomics_data.id, trancsriptomics_data.id] if trancsriptomics_data != None else metabolomics_data.id
                analysis.dataset_id = study.id

                db.session.add(analysis)
                db.session.commit()

                if check_value == counter:
                    save_analysis.delay(analysis.id, value["Metabolites"],registered=False,mail=request.json["email"],study2=request.json['study_name'])
                else:
                    counter+=1
                    save_analysis.delay(analysis.id, value["Metabolites"])


        return jsonify({'id': analysis.id})
        # return jsonify({1:1})


#### direct pathway analysis

@app.route('/analysis/direct-pathway-mapping', methods=['GET', 'POST'])
@jwt_required()
def direct_pathway_mapping():

    try:
        data = AnalysisInputSchema().load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400
    if not request.json:
        return "", 404

    # if 'metabolites' in data:
    #     enhance_synonyms.delay(data['metabolites'])

    data = checkMapped(data)

    user = User.query.filter_by(email=str(current_identity)).first()

    if len(data['analysis']) == 0:
        return jsonify({'id': 'mapping_error'})

    else:


        disease = Diseases.query.get(request.json['disease'])
        study = AnalysisMetadata(
            name=data['study_name'],
            analysis_method_id=2,
            diffusion_id=1 if "Transcriptomes" in data else None,
            status=True,
            group=data["group"],
            disease_id=disease.id,
            disease=disease)
        db.session.add(study)
        db.session.commit()
        analysis_id = 0
        healthy_metab_data = None
        healthy_gene_data = None
        for key,value in data['analysis'].items():
            if len(value['Metabolites']) > 0:
                if value['Label'] == data['group'].lower() + ' label avg':
                    healthy_metab_data = value['Metabolites']
                    healthy_gene_data = value.get('Transcriptomes', None)

        for key,value in data["analysis"].items():  # user as key, value {metaboldata , label}
            current_metabolites = value["Metabolites"]
            current_genes = value.get('Genes', {})
            if len(current_metabolites) > 0:
                if healthy_metab_data != None:
                    # 1. Handle zeros for current Metabolites
                    for k, v in current_metabolites.items():
                        current_metabolites[k] = v if v != 0 else sys.float_info.min
                    # 2. Handle zeros for healthy Metabolites
                    for k, v in healthy_metab_data.items():
                        healthy_metab_data[k] = v if v != 0 else sys.float_info.min
                    metab_pipe = MetaboliticsPipeline(['fold-change-scaler'])
                    # Calculate scaled metabolites (X_t)
                    X_t = metab_pipe.fit_transform([current_metabolites, healthy_metab_data], [value['Label'], 'healthy'])[0]

                    X_gene_scaled = None
                    
                    # Check if Gene baseline and current Gene data are available
                    if healthy_gene_data is not None and len(current_genes) > 0:
                        gene_pipe = MetaboliticsPipeline(['fold-change-scaler'])
                        
                        # Handle zeros for Genes
                        for k, v in current_genes.items():
                            current_genes[k] = v if v != 0 else sys.float_info.min
                        for k, v in healthy_gene_data.items():
                            healthy_gene_data[k] = v if v != 0 else sys.float_info.min
                        
                        # Calculate scaled genes
                        X_gene_scaled = gene_pipe.fit_transform([current_genes, healthy_gene_data], [value['Label'], 'healthy'])[0]

                metabolomics_data = OmicsDatasets(
                    omics_type = "metabolomics",
                    omics_data = value["Metabolites"] if healthy_metab_data == None else X_t,
                    owner_email = str(user),
                    is_public = True if request.json['public'] else False
                )

                transcriptomics_data = None

                if(X_gene_scaled is not None):
                    transcriptomics_data = OmicsDatasets(
                        omics_type = "transcriptomics",
                        omics_data = current_genes if healthy_gene_data == None else X_gene_scaled,
                        owner_email = str(user),
                        is_public = True if request.json['public'] else False
                    )

                metabolomics_data.disease_id = disease.id
                metabolomics_data.disease = disease
                db.session.add(metabolomics_data)
                if( transcriptomics_data is not None):
                    transcriptomics_data.disease_id = disease.id
                    transcriptomics_data.disease = disease
                    db.session.add(transcriptomics_data)
                db.session.commit()


                analysis = Analyses(name=key, user=user)
                analysis.label = value['Label']
                analysis.name = key
                analysis.type = 'public' if request.json['public'] else "private"


                analysis.owner_user_id = user.id
                analysis.owner_email = user.email
                if( transcriptomics_data is not None):
                    analysis.omics_data_id = [metabolomics_data.id, transcriptomics_data.id]
                else:
                    analysis.omics_data_id = metabolomics_data.id
                analysis.dataset_id = study.id

                db.session.add(analysis)
                db.session.commit()
                save_dpm.delay(analysis.id, value["Metabolites"] if healthy_metab_data == None else X_t)
                analysis_id = analysis.id

        return jsonify({'id': analysis_id})


### direct pathway analysis public

@app.route('/analysis/direct-pathway-mapping/public', methods=['GET', 'POST'])
def direct_pathway_mapping2():
    # print(request.json)
    try:
        data = AnalysisInputSchema2().load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400
    if not request.json:
        return "", 404

    # if 'metabolites' in data:
    #     enhance_synonyms.delay(data['metabolites'])

    data = checkMapped(data)
    user = User.query.filter_by(email='tajothman@std.sehir.edu.tr').first()
    if len(data['analysis']) == 0:
        return jsonify({'id':'mapping_error'})

    else:
        disease = Diseases.query.get(request.json['disease'])
        study = AnalysisMetadata(
            name=data['study_name'],
            analysis_method_id=2,
            diffusion_id=1 if "Transcriptomes" in data else None,
            status=True,
            group=data["group"],
            disease_id=disease.id,
            disease=disease)
        db.session.add(study)
        db.session.commit()

        analysis_id = 0
        for key,value in data["analysis"].items():  # user as key, value {metaboldata , label}

            if len(value['Metabolites']) > 0:
                metabolomics_data = OmicsDatasets(
                    omics_type = "metabolitics",
                    omics_data= value["Metabolites"],
                    owner_email = str(user),
                    is_public = True
                )
                print('ok')
                
                trancsriptomics_data = None
                if( "Transcriptomes" in data and len(data["Transcriptomes"]) > 0):
                    trancsriptomics_data = OmicsDatasets(
                        omics_type = "transcriptomics",
                        omics_data=data["Transcriptomes"],
                        owner_email=request.json["email"],
                        is_public=True
                    )


                metabolomics_data.disease_id = disease.id
                metabolomics_data.disease = disease
                trancsriptomics_data.disease_id = disease.id
                trancsriptomics_data.disease = disease
                db.session.add(metabolomics_data)
                db.session.add(trancsriptomics_data)
                db.session.commit()

                analysis = Analyses(name =key, user = user)
                analysis.label = value['Label']
                analysis.name = key
                # analysis.status = True
                analysis.type = 'public'
                analysis.start_time = datetime.datetime.now()

                analysis.owner_user_id = user.id
                analysis.owner_email = request.json["email"]

                analysis.omics_data_id = [metabolomics_data.id, trancsriptomics_data.id] if trancsriptomics_data != None else metabolomics_data.id
                analysis.dataset_id = study.id
                analysis_runs = DirectPathwayMapping(value["Metabolites"])  # Forming the instance
                # fold_changes
                analysis_runs.run()  # Making the analysis
                analysis.results_pathway = [analysis_runs.result_pathways]
                analysis.results_reaction = [analysis_runs.result_reactions]
                analysis.end_time = datetime.datetime.now()

                db.session.add(analysis)
                db.session.commit()
                analysis_id = analysis.id

        message = 'Hello, \n you can find your analysis results in the following link: \n http://metabolitics.itu.edu.tr/past-analysis/' + str(analysis_id)
        send_mail( request.json["email"], request.json['study_name'] + ' Analysis Results', message)
        return jsonify({'id': analysis_id})


#### pathway enrichment analysis

@app.route('/analysis/pathway-enrichment', methods=['GET', 'POST'])
@jwt_required()
def pathway_enrichment():

    try:
        data = AnalysisInputSchema().load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400
    if not request.json:
        return "", 404

    # if 'metabolites' in data:
    #     enhance_synonyms.delay(data['metabolites'])

    data = checkMapped(data)

    user = User.query.filter_by(email=str(current_identity)).first()

    if len(data['analysis']) == 0:
        return jsonify({'id': 'mapping_error'})

    else:


        disease = Diseases.query.get(request.json['disease'])
        study = AnalysisMetadata(
            name=data['study_name'],
            analysis_method_id=3,
            diffusion_id=1 if "Transcriptomes" in data else None,
            status=True,
            group=data["group"],
            disease_id=disease.id,
            disease=disease)
        db.session.add(study)
        db.session.commit()
        analysis_id = 0
        healthy_metab_data = None
        healthy_gene_data = None
        for key,value in data['analysis'].items():
            if len(value['Metabolites']) > 0:
                if value['Label'] == data['group'].lower() + ' label avg':
                    healthy_metab_data = value['Metabolites']
                    healthy_gene_data = value.get('Transcriptomes', None)

        for key,value in data["analysis"].items():  # user as key, value {metaboldata , label}
            current_metabolites = value["Metabolites"]
            current_genes = value.get('Genes', {})
            if len(current_metabolites) > 0:
                if healthy_metab_data != None:
                    # 1. Handle zeros for current Metabolites
                    for k, v in current_metabolites.items():
                        current_metabolites[k] = v if v != 0 else sys.float_info.min
                    # 2. Handle zeros for healthy Metabolites
                    for k, v in healthy_metab_data.items():
                        healthy_metab_data[k] = v if v != 0 else sys.float_info.min
                    metab_pipe = MetaboliticsPipeline(['fold-change-scaler'])
                    # Calculate scaled metabolites (X_t)
                    X_t = metab_pipe.fit_transform([current_metabolites, healthy_metab_data], [value['Label'], 'healthy'])[0]

                    X_gene_scaled = None
                    
                    # Check if Gene baseline and current Gene data are available
                    if healthy_gene_data is not None and len(current_genes) > 0:
                        gene_pipe = MetaboliticsPipeline(['fold-change-scaler'])
                        
                        # Handle zeros for Genes
                        for k, v in current_genes.items():
                            current_genes[k] = v if v != 0 else sys.float_info.min
                        for k, v in healthy_gene_data.items():
                            healthy_gene_data[k] = v if v != 0 else sys.float_info.min
                        
                        # Calculate scaled genes
                        X_gene_scaled = gene_pipe.fit_transform([current_genes, healthy_gene_data], [value['Label'], 'healthy'])[0]

                metabolomics_data = OmicsDatasets(
                    omics_type = "metabolomics",
                    omics_data = value["Metabolites"] if healthy_metab_data == None else X_t,
                    owner_email = str(user),
                    is_public = True if request.json['public'] else False
                )

                transcriptomics_data = None

                if(X_gene_scaled is not None):
                    transcriptomics_data = OmicsDatasets(
                        omics_type = "transcriptomics",
                        omics_data = current_genes if healthy_gene_data == None else X_gene_scaled,
                        owner_email = str(user),
                        is_public = True if request.json['public'] else False
                    )

                metabolomics_data.disease_id = disease.id
                metabolomics_data.disease = disease
                db.session.add(metabolomics_data)
                if( transcriptomics_data is not None):
                    transcriptomics_data.disease_id = disease.id
                    transcriptomics_data.disease = disease
                    db.session.add(transcriptomics_data)
                db.session.commit()


                analysis = Analyses(name=key, user=user)
                analysis.label = value['Label']
                analysis.name = key
                analysis.type = 'public' if request.json['public'] else "private"


                analysis.owner_user_id = user.id
                analysis.owner_email = user.email
                if( transcriptomics_data is not None):
                    analysis.omics_data_id = [metabolomics_data.id, transcriptomics_data.id]
                else:
                    analysis.omics_data_id = metabolomics_data.id
                analysis.dataset_id = study.id

                db.session.add(analysis)
                db.session.commit()
                save_pe.delay(analysis.id, value["Metabolites"] if healthy_metab_data == None else X_t)                
                analysis_id = analysis.id

        return jsonify({'id': analysis_id})


### pathway enrichment analysis public

@app.route('/analysis/pathway-enrichment/public', methods=['GET', 'POST'])
def pathway_enrichment2():
    # print(request.json)
    try:
        data = AnalysisInputSchema2().load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400
    if not request.json:
        return "", 404

    # if 'metabolites' in data:
    #     enhance_synonyms.delay(data['metabolites'])

    data = checkMapped(data)
    user = User.query.filter_by(email='tajothman@std.sehir.edu.tr').first()
    if len(data['analysis']) == 0:
        return jsonify({'id':'mapping_error'})

    else:
        disease = Diseases.query.get(request.json['disease'])
        study = AnalysisMetadata(
            name=data['study_name'],
            analysis_method_id=3,
            diffusion_id=1 if "Transcriptomes" in data else None,
            status=True,
            group=data["group"],
            disease_id=disease.id,
            disease=disease)
        db.session.add(study)
        db.session.commit()

        analysis_id = 0
        for key,value in data["analysis"].items():  # user as key, value {metaboldata , label}

            if len(value['Metabolites']) > 0:
                metabolomics_data = OmicsDatasets(
                    omics_type = "metabolitics",
                    omics_data = value["Metabolites"],
                    owner_email = str(user),
                    is_public = True
                )
                print('ok')

                trancsriptomics_data = None
                if( "Transcriptomes" in data and len(data["Transcriptomes"]) > 0):
                    trancsriptomics_data = OmicsDatasets(
                        omics_type = "transcriptomics",
                        omics_data=data["Transcriptomes"],
                        owner_email=request.json["email"],
                        is_public=True
                    )


                metabolomics_data.disease_id = disease.id
                metabolomics_data.disease = disease
                trancsriptomics_data.disease_id = disease.id
                trancsriptomics_data.disease = disease
                db.session.add(metabolomics_data)
                db.session.add(trancsriptomics_data)
                db.session.commit()

                analysis = Analyses(name =key, user = user)
                analysis.label = value['Label']
                analysis.name = key
                # analysis.status = True
                analysis.type = 'public'
                analysis.start_time = datetime.datetime.now()

                analysis.owner_user_id = user.id
                analysis.owner_email = request.json["email"]

                analysis.omics_data_id = [metabolomics_data.id, trancsriptomics_data.id] if trancsriptomics_data != None else metabolomics_data.id
                analysis.dataset_id = study.id
                analysis_runs = PathwayEnrichment(value["Metabolites"])  # Forming the instance
                # fold_changes
                analysis_runs.run()  # Making the analysis
                analysis.results_pathway = [analysis_runs.result_pathways]
                #analysis.results_reaction = [analysis_runs.result_reactions]
                analysis.end_time = datetime.datetime.now()

                db.session.add(analysis)
                db.session.commit()
                analysis_id = analysis.id

        message = 'Hello, \n you can find your analysis results in the following link: \n http://metabolitics.itu.edu.tr/past-analysis/' + str(analysis_id)
        send_mail( request.json["email"], request.json['study_name'] + ' Analysis Results', message)
        return jsonify({'id': analysis_id})


###############################################################################
###############################################################################

@app.route('/analysis/set', methods=['POST'])
def user_analysis_set():

    data = request.json['data']
    # print(data)
    analyses = Analyses.get_multiple(data.values())
    # for i in analyses:
        # print(i.results_pathway[0])
    # X = [i.results_pathway for i in analyses]
    # y = [i.name for i in analyses]

    return AnalysisSchema(many=True).jsonify(analyses)

# ///////////////////////

@app.route('/analysis/visualization', methods=['POST'])
def analysis_visualization():
    """
    List of analysis of user
    ---
    tags:
        - analysis
    parameters:
        -
          name: authorization
          in: header
          type: string
          required: true
    """

    data = request.json['data']
    # print(data)
    analyses = Analyses.get_multiple(data.values())
    # print(analyses)
    # for i in analyses:
        # print(i.results_pathway[0])
    X = [i.results_pathway[0] for i in analyses]
    y = [Diseases.query.get(AnalysisMetadata.query.get(i.dataset_id).disease_id).name.title() for i in analyses]

    return jsonify(HeatmapVisualization(X, y).clustered_data())
    # return AnalysisSchema(many=True).jsonify(analyses)

@app.route('/analysis/most-similar-diseases/<id>')
def most_similar_diseases(id: int):
    """
    Calculates most similar disease for given disease id
    ---
    tags:
      - analysis
    parameters:
      -
        name: authorization
        in: header
        type: string
        required: true
      -
        name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Most similar diseases
      404:
        description: Analysis not found
      401:
        description: Analysis is not yours
    """
    analysis = Analyses.query.get(id)
    if not analysis:
        return '', 404
    if not analysis.authenticated():
        return '', 401
    analysis_method_id = AnalysisMetadata.query.get(analysis.dataset_id).analysis_method_id
    groups = db.session.query(AnalysisMetadata.group).all()
    groups = [group[0].lower() + ' label avg' for group in groups]
    public_analyses = db.session.query(Analyses).join(AnalysisMetadata).join(Diseases).filter(
        Analyses.type == 'public').filter(AnalysisMetadata.analysis_method_id == analysis_method_id).filter(
            Analyses.results_pathway != None).filter(
                or_(Analyses.label == 'not_provided', and_(Analyses.label.like('%label avg%'), ~Analyses.label.in_(groups)))).with_entities(
                    Diseases.name, Analyses.results_pathway, Diseases.synonym).all()
    diseases = [i[0] + ' (' + i[2] + ')' for i in public_analyses]
    results_pathways = [i[1][0] for i in public_analyses]
    similarities = similarty_dict(analysis.results_pathway[0], results_pathways)
    dis_sim = zip(diseases, similarities)
    dis_sim_dict = {}
    for i in dis_sim:
        if i[0] not in dis_sim_dict:
            dis_sim_dict[i[0]] = []
        dis_sim_dict[i[0]].append(i[1])
    for i in dis_sim_dict:
        dis_sim_dict[i] = sum(dis_sim_dict[i]) / len(dis_sim_dict[i])
    top_five = sorted(dis_sim_dict.items(), key=lambda x: x[1], reverse=True)[:5]
    return jsonify(dict(top_five))

@app.route('/analysis/disease-prediction/<id>')
def disease_prediction(id: int):
    """
    Disease prediction for given analysis id using trained models
    ---
    tags:
      - analysis
    parameters:
      -
        name: authorization
        in: header
        type: string
        required: true
      -
        name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Disease predictions
      404:
        description: Analysis not found
      401:
        description: Analysis is not yours
    """
    analysis = Analyses.query.get(id)
    if not analysis:
        return '', 404
    if not analysis.authenticated():
        return '', 401
    results_reaction = analysis.results_reaction[0]
    dir = '../trained_models'
    preds = []
    for file in os.listdir(dir):
        if file == '.keep':
            continue
        file_path = os.path.join(dir, file)
        if os.path.isfile(file_path):
            try:
                saved = pickle.load(open(file_path, 'rb'))
                disease = saved['disease']
                model = saved['model']
                pred = model.predict([results_reaction])[0]
                pred_score = model.predict_proba([results_reaction])[0]
                pred_score = max(pred_score)
                if pred != 0:
                    preds.append({'disease' : disease, 'pred_score': round(pred_score, 3)})
            except Exception as e:
                print(e)
    return jsonify(sorted(preds, key=lambda p: p['pred_score'], reverse=True))

@app.route('/analysis/<type>')
def analysis_details(type):
    data = AnalysisMetadata.query.all()
    returned_data = []
    for item in data:
        analyses = Analyses.query.filter_by(type='public', dataset_id=item.id).with_entities(
            Analyses.id, Analyses.name, Analyses.dataset_id, Analyses.start_time, Analyses.end_time)
        analysisMethod = AnalysisMethod.query.get(item.analysis_method_id)
        diffusionMethod = DiffusionMethod.query.get(item.diffusion_id)
        disease = Diseases.query.get(item.disease_id)
        group = item.group
        if len(list(analyses)) > 0:
            avg_id = -1
            analysis_data = []
            starts = []
            ends = []
            for analysis in analyses:
                if group != 'not_provided':
                    if str(group).lower() + ' label avg' == analysis[1]:
                        continue
                analysis_data.append({'id': analysis[0], 'name': analysis[1], "start": analysis[3], "end": analysis[4]})
                if analysis[3] != None:
                    starts.append(analysis[3])
                if analysis[4] != None:
                    ends.append(analysis[4])
                if group != 'not_provided':
                    if ' label avg' in analysis[1]:
                        avg_id = analysis[0]
            if len(starts) > 0:
                start = min(starts)
            else:
                start = None
            if len(ends) == len(analysis_data):
                end = max(ends)
            else:
                end = None
            returned_data.append({
                'id': item.id,
                'name': item.name,
                'analyses': analysis_data,
                'analysis_method': analysisMethod.name,
                'diffusion_method': diffusionMethod.name,
                'disease': disease.name,
                'start': start,
                'end': end,
                'avg_id': analysis_data[0]['id'] if avg_id == -1 else avg_id,
                'progress': round(len(ends) / len(analysis_data) * 100) 
            })
    # print(returned_data)
    return jsonify(returned_data)

@app.route('/analysis/list')
@jwt_required()
def user_analysis():
    """
    List of analysis of user
    ---
    tags:
        - analysis
    parameters:
        -
          name: authorization
          in: header
          type: string
          required: true
    """
    data = AnalysisMetadata.query.all()
    returned_data = []

    if 'Authorization Required' not in str(current_identity.id):
        for item in data:
            analyses = Analyses.query.filter_by(owner_user_id=current_identity.id, type='private', dataset_id=item.id).with_entities(
            Analyses.id, Analyses.name, Analyses.dataset_id, Analyses.start_time, Analyses.end_time)
            analysisMethod = AnalysisMethod.query.get(item.analysis_method_id)
            diffusionMethod = DiffusionMethod.query.get(item.diffusion_id)
            disease = Diseases.query.get(item.disease_id)
            group = item.group
            if len(list(analyses)) > 0:
                avg_id = -1
                analysis_data = []
                starts = []
                ends = []
                for analysis in analyses:
                    if group != 'not_provided':
                        if str(group).lower() + ' label avg' == analysis[1]:
                            continue
                    analysis_data.append({'id': analysis[0], 'name': analysis[1], 'start': analysis[3], 'end': analysis[4]})
                    if analysis[3] != None:
                        starts.append(analysis[3])
                    if analysis[4] != None:
                        ends.append(analysis[4])
                    if group != 'not_provided':
                        if ' label avg' in analysis[1]:
                            avg_id = analysis[0]
                if len(starts) > 0:
                    start = min(starts)
                else:
                    start = None
                if len(ends) == len(analysis_data):
                    end = max(ends)
                else:
                    end = None
                returned_data.append({
                    'id': item.id,
                    'name': item.name,
                    'analyses': analysis_data,
                    'analysis_method': analysisMethod.name,
                    "diffusion_method": diffusionMethod.name,
                    'disease': disease.name,
                    'start': start,
                    'end': end,
                    'avg_id': analysis_data[0]['id'] if avg_id == -1 else avg_id,
                    'progress': round(len(ends) / len(analysis_data) * 100) 
                })

    return jsonify(returned_data)

#TODO
@app.route('/analysis/detail/<id>')
def analysis_detail(id):
    analysis = Analyses.query.get(id)
    metabolomics_data = OmicsDatasets.query.get(analysis.omics_data_id)
    study = AnalysisMetadata.query.get(analysis.dataset_id)
    group = study.group
    method = AnalysisMethod.query.get(study.analysis_method_id)
    disease = Diseases.query.get(study.disease_id)
    data = {
        'case_name': analysis.name,
        'status': study.status,
        'results_pathway': analysis.results_pathway,
        'results_reaction': analysis.results_reaction,
        'method': method.name,
        'fold_changes': metabolomics_data.metabolomics_data,
        'study_name': study.name,
        'analyses': [],
        'disease': disease.name
    }
    analyses = Analyses.query.filter_by(dataset_id=study.id)
    for analysis in analyses:
        if analysis.label == str(group).lower() + ' label avg':
            healthy = {'id': analysis.id, 'name': analysis.name, 'label': 'Healthy'}
            continue
        data['analyses'].append({
            'id': analysis.id,
            'name': analysis.name,
            'label': disease.name if analysis.label != group or analysis.label == 'not_provided' else 'healthy'
        })
    if group != 'not_provided':
        data['analyses'].sort(key=lambda s: (len(s['name']), s['name']))
        for i, a in enumerate(data['analyses']):
            if ' label avg' in a['name']:
                index = i
        avg = data['analyses'][index]
        avg['Label'] = disease.name
        data['analyses'].pop(index)
        data['analyses'].insert(0, avg)
        data['analyses'].insert(1, healthy)
    return jsonify(data)

@app.route('/analysis/search-by-change', methods=['POST'])
def search_analysis_by_change():
    """
    Search query in db
    ---
    tags:
        - analysis
    parameters:
        -
          name: query
          in: url
          type: string
          required: true
    """
    try:
        data = PathwayChangesScheme().load(request.json, many=True)
    except ValidationError as err:
        return jsonify(err.messages), 400
    analyses = Analyses.query.filter_by_change_many(data).filter_by_change_amount_many(data).filter_by_authentication().with_entities(Analyses.id, Analyses.name, Analyses.dataset_id)
    temp_data = {}
    for analysis in analyses:
        temp_data.setdefault(analysis.dataset_id, [])
        temp_data[analysis.dataset_id].append((analysis.id, analysis.name))
    returned_data = {}
    c = 0
    for item in temp_data:
        study = AnalysisMetadata.query.get(item)
        method = AnalysisMethod.query.get(study.analysis_method_id)
        for (id, name) in temp_data[item]:
            returned_data[c] = {'anlysisId':study.id, 'name': study.name, 'case': id ,"method":method.name}
        c+=1

    return returned_data

@app.route('/diseases/all', methods=['GET', 'POST'])
def get_diseases():
    data = Diseases.query.all()
    returned_data = []
    for item in data:
        returned_data.append({
            "id": item.id,
            "name": item.name,
            "synonym": item.synonym
        })
    return jsonify(returned_data)

############################################################# deployed but new
##TODO
@app.route('/analysis/search-by-metabol', methods=['POST'])
def search_analysis_by_metabol():
    """
    Search query in db
    ---
    tags:
        - analysis
    parameters:
        -
          name: query
          in: url
          type: string
          required: true
    """
    filtered_ids = {}
    c = 0
    metabolite_name = request.json["metabol"]
    # print(metabolite_name)
    # metabolite_name = "C01507_c"
    # metabolite_measurment = 10246.0

    # change = "+"## represent up to
    # change = "-" ## represents at least
    # change = "=" ## represents around -10/+10

    ids = db.session.query(OmicsDatasets.id).all()
    for i in ids:  # loop over the Ids
        data = OmicsDatasets.query.filter_by(id=i[0]).first();
        if data.omics_type != "metabolitics":
            continue
        metabolites_data = data.omics_data
        if metabolite_name in list(metabolites_data) :
            analysis = Analyses.query.filter_by(omics_data_id=i[0]).first();
            temp = {"anlysisId":analysis.dataset.id,'study':analysis.dataset.name,"method":analysis.dataset.method.name,'case':analysis.omics_data_id,'name':metabolite_name}
            filtered_ids[c] = temp
            c+=1
    # print(filtered_ids)

    return (filtered_ids)

# if change == "+" and metabolites_data[metabolite_name] <= metabolite_measurment:
#     # print (i[0],metabolites_data[metabolite_name])
#     filtered_ids.append(i[0])
# elif change == "-" and metabolites_data[metabolite_name] >= metabolite_measurment:
#     # print (i[0],metabolites_data[metabolite_name])
#     filtered_ids.append(i[0])
# elif change == "=" and metabolites_data[metabolite_name] < metabolite_measurment+11 and metabolites_data[metabolite_name] > metabolite_measurment-11 :


################## New
def checkMapped(data):
    '''

    :param data: our data strcuture for multi cases inputs
    :return: same data strcuture but removing the unmapped metabolites
    '''

    output = {}
    output['group'] = data['group']
    output['study_name'] = data['study_name']
    output['public'] = data['public']
    output['disease'] = data['disease']
    output['study_name'] = data['study_name']
    if 'email' in data.keys():
        output['email'] = data['email']
    if 'Transcriptomes' in data.keys():
        output['Transcriptomes'] = data['Transcriptomes']

    output.setdefault('analysis', {})

    if 'isMapped' in data.keys():

        isMapped = data['isMapped']
        for case in data['analysis'].keys():
            temp = {}
            metabolites = data['analysis'][case]['Metabolites']
            label = data['analysis'][case]['Label']
            temp['Label'] = label
            temp.setdefault('Metabolites', {})

            for i in metabolites.keys():
                if i in isMapped and isMapped[i]['isMapped'] is True:
                    temp['Metabolites'][i] = metabolites[i]
            # print(len(temp['Metabolites']))
            if len(temp['Metabolites']) > 0:
                output['analysis'][case] = temp

    # {'public': True, 'analysis': {'NIDDK1': {'Label': 'not_provided', 'Metabolites': {}}},
    #  'study_name': 'LIPID MAPS Lipidomics studies', 'group': 'not_provided', 'email': 'tajothman@std.sehir.edu.tr',
    #  'disease': 147}

        return output
    else:
        mapping_metabolites = {}

        # mapping_data = open("../datasets/assets/mapping_all.txt", "r+").readlines()
        # for line in mapping_data:
        #     tempo = line.split(",")
        #     mapping_metabolites[tempo[0].strip()] = tempo[1].strip()
        #
        with open('../datasets/assets/recon3D.json') as f:
            mapping_data1 = json.load(f)
            mapping_data1 = mapping_data1["metabolites"]

        with open('../datasets/assets/new-synonym-mapping.json') as f:
            mapping_data2 = json.load(f)

        for case in data['analysis'].keys():
            temp = {}
            metabolites = data['analysis'][case]['Metabolites']
            label = data['analysis'][case]['Label']
            temp['Label'] = label
            temp.setdefault('Metabolites', {})

            for i in metabolites.keys():

                if i in mapping_data2.keys():
                    print(type(metabolites[i]))
                    temp['Metabolites'][mapping_data2[i]] = float(str(metabolites[i]).strip())

                if i in mapping_data1.keys():
                    if metabolites[i] != '':
                        print(type(metabolites[i]))
                        temp['Metabolites'][i] = float(str(metabolites[i]).strip())

                # elif i in mapping_metabolites.keys():
                #     temp['Metabolites'][mapping_metabolites[i]] = metabolites[i]

            if len(temp['Metabolites']) > 0:
                output['analysis'][case] = temp
        print(output)
        return output

@app.route('/models/scores', methods=['GET'])
def get_model_scores():
    scores = {}
    dir = '../trained_models'
    for file in os.listdir(dir):
        if file == '.keep':
            continue
        file_path = os.path.join(dir, file)
        if os.path.isfile(file_path):
            try:
                saved = pickle.load(open(file_path, 'rb'))
                disease = saved['disease']
                fold_number = saved['fold_number']
                f1_score = saved['f1_score']
                precision_score = saved['precision_score']
                recall_score = saved['recall_score']
                algorithm = saved['algorithm']
                scores[disease] = {'fold_number': fold_number, 'f1_score': f1_score, 'precision_score': precision_score, 'recall_score': recall_score, 'algorithm': algorithm}
            except Exception as e:
                print(e)
    return jsonify(scores)

@app.route('/delete/delete_analysis', methods=['POST'])
@jwt_required()
def delete_analysis():
    print("Received request method:", request.method)  # Debug log
    try:
        
        data = request.get_json()
        analysis_ids = data.get('analysis_ids', [])
        user_id = current_identity.id
        analyses_to_delete = Analyses.query.filter(
            Analyses.id.in_(analysis_ids), Analyses.owner_user_id == user_id
        ).all()

        if not analyses_to_delete:
            return jsonify({"error": "No matching analyses found"}), 404

        for analysis in analyses_to_delete:
            db.session.delete(analysis)

        db.session.commit()

        return jsonify({"message": "Selected analyses deleted successfully."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
