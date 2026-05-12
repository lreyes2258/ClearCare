from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.db import mongo
from app.utils.bsonHandling import MongoJSONProvider


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)  # Set mongo URI
    app.json = MongoJSONProvider(app)

    # Enable CORS for frontend
    CORS(app)

    # initialize Mongo
    mongo.init_app(app)

    # Register blueprints
    from app.routes import mockSearch   #changed from search
    app.register_blueprint(mockSearch.bp) #changed from search

    return app
