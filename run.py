from flaskr import create_app
from flaskr.zconfig import DeploymentConfig

app = create_app(DeploymentConfig)

if __name__ == '__main__':
    app.run(debug=True)