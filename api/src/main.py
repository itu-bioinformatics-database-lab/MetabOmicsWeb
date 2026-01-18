

from __future__ import absolute_import


import os
import yaml
import logging.config

from subprocess import call
import click
import os
import uuid
import json
from collections import defaultdict
import pickle
from sklearn.pipeline import  Pipeline
from app.app import app
from app.models import db, AnalysisMethod, User, Diseases, DiffusionMethod
from app.DOParser import DOParser

from sklearn_utils.utils import SkUtilsIO
from metabomics.preprocessing import *
from metabomics.utils import load_network_model

@click.group()
def cli():
    pass


@cli.command()
def run_api():
    app.run(
        host=os.environ.get('HOST', 'localhost'),
        debug=True
        # os.environ.get('DEBUG', True)
    )


@cli.command()
def run_celery():
    call('celery -A app.celery worker', shell=True)
    # celery4 = make_celery(app)
    #call('celery -A app.celery.celery worker -l info -Q celery')

    # call('celery --app =app worker --loglevel=info')
    # make_celery(app)

@cli.command()
def run_celery_beat():
    call('celery -A app.celery beat', shell=True)

@cli.command()
def migrate():
    db.drop_all()
    db.create_all()
    do_parser = DOParser()
    do_parser.start()
    # print(do_parser.diseases)
    print('getting diseases Done..')

    for lib in do_parser.diseases:
        for temp in do_parser.diseases[lib]:
            _disease = Diseases(name=temp['name'], synonym=temp['synonym'])
            db.session.add(_disease)
    db.session.commit()
    method1 = AnalysisMethod(name = "Metabolitics")
    method2 = AnalysisMethod(name = "Direct Pathway Mapping")
    method3 = AnalysisMethod(name = "Pathway Enrichment")
    method4 = DiffusionMethod(name = "Linear Threshold")
    disease1 = Diseases(name="abc", synonym="x")
    disease2 = Diseases(name="abc", synonym="y")
    disease3 = Diseases(name="abc", synonym="z")
    user = User(name="Alper", surname="Dokay", email="alperdokay@sehir.edu.tr", password="test123")
    user2 = User(name="Taj", surname="Saleh", email="tajothman@std.sehir.edu.tr", password="test123")
    user3 = User(name="Demo", surname="User", email="demo", password="demo")

    db.session.add(method1)
    db.session.add(method2)
    db.session.add(method3)
    db.session.add(method4)
    db.session.add(disease1)
    db.session.add(disease2)
    db.session.add(disease3)
    db.session.add(user)
    db.session.add(user2)
    db.session.add(user3)
    db.session.commit()


@cli.command()
def generate_secret():
    with open('../secret.txt', 'w') as f:
        f.write(str(uuid.uuid4()))


@cli.command()
def generate_angular_friendly_model():
    '''
    This function convert json model into angular friendly json
    '''
    model = load_network_model()
    model_json = json.load(open('../dataset/network/recon3D.json'))

    reactions, metabolites = model_json['reactions'], model_json['metabolites']
    model_json = defaultdict(dict)
    model_json['pathways'] = defaultdict(list)

    for m in metabolites:
        m['reactions'] = [
            r.id for r in model.metabolites.get_by_id(m['id']).reactions
        ]
        model_json['metabolites'][m['id']] = m

    for r in reactions:
        # r['gene_reaction_rule'], r['notes'] = [], {}
        del r['gene_reaction_rule']
        del r['notes']

        model_json['reactions'][r['id']] = r
        model_json['pathways'][r.get('subsystem', 'NOpathway')].append(r['id'])

    json.dump(model_json, open('../outputs/ng-recon.json', 'w'))



@cli.command()
def healties_model():
    disease_name = 'metabData_breast'
    gene_name = 'geneData_breast'
    metab_path = '../datasets/diseases/%s.csv' % disease_name
    gene_path = '../datasets/diseases/%s.csv' % gene_name
    X, y = SkUtilsIO(metab_path).from_csv(label_column='Factors')
    X_tr, y_tr = SkUtilsIO(gene_path).from_csv(label_column='Factors')
    #y = ['bc' if i != 'h' else 'healthy' for i in y]
    #y_tr = ['bc' if i != 'h' else 'healthy' for i in y_tr]

    pipe = MetaboliticsPipeline([
        # 'metabolite-name-mapping-toy',
        # 'metabolite-name-mapping',
        'naming-toy', 
        # 'fold-change-scaler',
    ])
    print('-----------------------------------')
    X_t = pipe.fit_transform(X, y)
    X_tr = pipe.fit_transform(X_tr, y_tr)
    print(X_tr)
    print('-----------------------------------')
    metabolitics_transformer = MetaboliticsTransformer()

    X_train_transformed = metabolitics_transformer.transform(
    X=X_t, X_tr=X_tr)
    print(X_train_transformed)
    model = MetaboliticsPipeline([
        'reaction-diff'
    ])
    # model = MetaboliticsPipeline([
    #     'metabolitics-transformer',
    #     'reaction-diff',
    # ])
    model.fit_transform(X_train_transformed, y)
    with open('../models/api_model.p', 'wb') as f:
        pickle.dump(model, f)


if __name__ == '__main__':
    cli()
# cli()
