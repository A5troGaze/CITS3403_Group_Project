from flask import Flask, render_template

app = Flask(__name__, template_folder='../client/src/pages')

@app.route('/')
def landing():
    return render_template('landing.html')



if __name__ == '__main__':
    app.run(debug=True)