from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, Session
import pandas as pd
from io import BytesIO
import mycred as mc
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Database setup
DATABASE_URL = f"postgresql://{mc.user}:{mc.password}@{mc.host}:{mc.port}/{mc.dbname}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()

# Allow CORS for specified origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify ['http://localhost:3000'] for better security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# User login schema
class UserLogin(BaseModel):
    employee_id: str
    password: str

# Dependency to get the current session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper function to get user type
async def get_user_from_db(employee_id: str, db: Session) -> Optional[dict]:
    query = text("SELECT password, role FROM ia_users WHERE employee_id = :employee_id")
    result = db.execute(query, {"employee_id": employee_id}).fetchone()
    if result:
        # Convert result tuple to dictionary
        return {"password": result[0], "role": result[1]}
    return None

# Login endpoint
@app.post("/login/")
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = await get_user_from_db(user_login.employee_id, db)
    if user and user_login.password == user["password"]:
        return {"message": "Login successful", "user_type": user["role"]}
    raise HTTPException(status_code=400, detail="Invalid credentials")

# Endpoint to fetch table columns
@app.get("/columns/")
async def get_columns():
    try:
        inspector = inspect(engine)
        columns = [column['name'] for column in inspector.get_columns('tbl_zoominfo_contact_paid')]
        return {"columns": columns}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


# File Upload Endpoint for User A
@app.post("/upload/user_a/")
async def upload_file_user_a(
    file: UploadFile = File(...),
    selected_columns: str = Form(''),
    match_domain: bool = Form(False),
    match_linkedin_url: bool = Form(False),
    match_zi_contact_id: bool = Form(False),
    db: Session = Depends(get_db)
):
    return await process_upload(file, selected_columns, match_domain, match_linkedin_url, match_zi_contact_id, db)

# File Upload Endpoint for User B
@app.post("/upload/user_b/")
async def upload_file_user_b(
    file: UploadFile = File(...),
    selected_columns: str = Form(''),
    match_domain: bool = Form(False),
    match_linkedin_url: bool = Form(False),
    match_zi_contact_id: bool = Form(False),
    db: Session = Depends(get_db)
):
    return await process_upload(file, selected_columns, match_domain, match_linkedin_url, match_zi_contact_id, db)

# Common processing logic for file uploads
async def process_upload(
    file: UploadFile,
    selected_columns: str,
    match_domain: bool,
    match_linkedin_url: bool,
    match_zi_contact_id: bool,
    db: Session
):
    df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')
    # df = df.astype(str)
 
    df = df.where(pd.notnull(df), None)

    if not all(col in df.columns for col in ['domain', 'first_name', 'last_name','linkedin_url','zi_contact_id']):
        return JSONResponse(content={"error": "Missing required columns in the uploaded file."}, status_code=400)

    selected_columns = [col.strip() for col in selected_columns.split(',') if col.strip()]
    if not selected_columns:
        return JSONResponse(content={"error": "No valid columns selected."}, status_code=400)

    results = []

    for _, row in df.iterrows():
        conditions = []
        params = {}

        if match_domain:
            conditions.append("\"Website\" = :domain")
            params["domain"] = row['domain']
            conditions.append("\"First Name\" = :first_name")
            params["first_name"] = row['first_name']
            conditions.append("\"Last Name\" = :last_name")
            params["last_name"] = row['last_name']
        if match_linkedin_url:
            conditions.append("\"LinkedIn Contact Profile URL\" = :linkedin_url")
            params["linkedin_url"] = row['linkedin_url']
        if match_zi_contact_id:
            try:
                row['zi_contact_id'] = str(int(row['zi_contact_id']))
            except :
                row['zi_contact_id'] = str(row['zi_contact_id'])
            conditions.append("\"ZoomInfo Contact ID\" = :zi_contact_id")
            params["zi_contact_id"] = row['zi_contact_id']
            
            
        if not conditions:
            conditions.append("1=1")

        where_clause = " AND ".join(conditions)
        select_columns = ', '.join(f"\"{col}\"" for col in selected_columns) or '*'

        query = f"""
        SELECT {select_columns} FROM tbl_zoominfo_contact_paid
        WHERE {where_clause}
        """
        
        try:
            result = db.execute(text(query).params(params)).fetchall()
            columns = [desc[0] for desc in db.execute(text(query).params(params)).cursor.description]
            results.extend([dict(zip(columns, row)) for row in result])
        except Exception as e:
            print(f"An error occurred: {e}")
            return JSONResponse(content={"error": str(e)}, status_code=500)
    return {"matches": results}
