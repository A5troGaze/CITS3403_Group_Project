# MOVING YOUR .venv FOLDER TO ROOT FOLDER (CITS3403_Group_Project)


## Step 1:
Deactivate your virtual environment if it is running:
```
deactivate
```

## Step 2:
Ensure you are in the root folder of the project (`CITS3403_Group_Project/`):

## Step 3:
DELETE the current `.venv/` directory withint the `flaskr/` directory:
```
rm -rf flaskr/.venv
```
Or just delete it manually if thats easier.

## Step 4:
REMAKE the virtual environment: (this time inside the root folder)
```
python3 -m venv .venv
```

## Step 5:
ACTIVATE the virtual environment: (this time inside the root folder)
```
source .venv/bin/activate
```

## Step 6:
REINSTALL all needed requirements:
```
pip install -r requirements.txt
```

## Step 7:
CHECK the installed dependencies:
```
pip list
```

## Step 8:
CHECK the dependencies where installed under `.venv/bin/pip`:
```
which pip
```

## Step 9:
RUN the application again to test functionality:
```
python run.py
```