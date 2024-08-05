from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
import pandas as pd
from io import BytesIO
import mycred as mc
from fastapi.middleware.cors import CORSMiddleware


# Database setup
DATABASE_URL = f"postgresql://{mc.user}:{mc.password}@{mc.host}:{mc.port}/{mc.dbname}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()

# Allow CORS for all origins (you might want to restrict this to your React app domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify ['http://localhost:3000'] for better security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


   
@app.get("/columns/")
async def get_columns():
    try:
        inspector = inspect(engine)
        columns = [column['name'] for column in inspector.get_columns('tbl_zoominfo_contact_paid')]
        return {"columns": columns}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    
@app.post("/upload/")
async def upload_file(
    file: UploadFile = File(...),
    selected_columns: str = Form(''),
    match_domain: bool = Form(False),
    match_first_name: bool = Form(False),
    match_last_name: bool = Form(False),
):
    df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')
    df = df.where(pd.notnull(df), None)
    
    if not all(col in df.columns for col in ['domain', 'first_name', 'last_name']):
        return JSONResponse(content={"error": "Missing required columns in the uploaded file."}, status_code=400)

    selected_columns = [col.strip() for col in selected_columns.split(',') if col.strip()]
    if not selected_columns:
        return JSONResponse(content={"error": "No valid columns selected."}, status_code=400)

    results = []

    with SessionLocal() as session:
        for _, row in df.iterrows():
            conditions = []
            params = {}

            if match_domain:
                conditions.append("\"Website\" = :domain")
                params["domain"] = row['domain']
            if match_first_name:
                conditions.append("\"First Name\" = :first_name")
                params["first_name"] = row['first_name']
            if match_last_name:
                conditions.append("\"Last Name\" = :last_name")
                params["last_name"] = row['last_name']

            if not conditions:
                conditions.append("1=1")

            where_clause = " AND ".join(conditions)
            select_columns = ', '.join(f"\"{col}\"" for col in selected_columns) or '*'
            
            query = f"""
            SELECT {select_columns} FROM tbl_zoominfo_contact_paid
            WHERE {where_clause}
            """
            try:
                result = session.execute(text(query).params(params)).fetchall()
                columns = [desc[0] for desc in session.execute(text(query).params(params)).cursor.description]
                results.extend([dict(zip(columns, row)) for row in result])
            except Exception as e:
                print(f"An error occurred: {e}")
                return JSONResponse(content={"error": str(e)}, status_code=500)
    
    return {"matches": results}