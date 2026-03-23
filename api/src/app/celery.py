from celery import Celery
from .app import app
from .config import DevelopmentConfig

def make_celery(app):
    celery = Celery(app.import_name,
                    backend=DevelopmentConfig.result_backend,
                    broker=DevelopmentConfig.CELERY_broker_url)
    celery.conf.update(app.config)
    TaskBase = celery.Task
    class ContextTask(TaskBase):
        abstract = True
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return TaskBase.__call__(self, *args, **kwargs)
    celery.Task = ContextTask
    return celery

celery = make_celery(app)
