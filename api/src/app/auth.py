from flask_jwt_extended import JWTManager
from hmac import compare_digest as safe_str_cmp
from .app import app
from .models import User

jwt = JWTManager(app)

@jwt.user_identity_loader
def user_identity_lookup(user):
    return user.id

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return User.query.get(identity)

def authenticate(email, password):
    user = User.query.filter_by(email=email).first()
    if user and safe_str_cmp(
            user.password.encode('utf-8'), password.encode('utf-8')):
        return user
