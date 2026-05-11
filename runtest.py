from flaskr.z__init__ import create_app
from flaskr.zconfig import TestingConfig

app = create_app(TestingConfig)

if __name__ == '__main__':
    app.run(debug=True)