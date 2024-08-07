import io
import os
from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
import psycopg2
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, Session
import pandas as pd
from io import BytesIO
import mycred as mc
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware
from typing import List, Optional
from enum import Enum
from datetime import date
from pydantic import EmailStr
from datetime import datetime

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

app.add_middleware(SessionMiddleware, secret_key="your_secret_key")
# User login schema
class UserLogin(BaseModel):
    employee_id: str
    password: str

class UserRegister(BaseModel):
    employee_id: str
    employee_name: str
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    date_of_birth: date
    date_of_join: date
    designation: str
    department: str
    blood_group: str
    mobile_no: str
    role: str
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


employee_id_store = {}

# Login endpoint
@app.post("/login/")
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = await get_user_from_db(user_login.employee_id, db)
    if user and user_login.password == user["password"]:
        employee_id_store['employee_id'] = user_login.employee_id
        return {"message": "Login successful", "user_type": user["role"]    }
    raise HTTPException(status_code=400, detail="Invalid credentials")

employee_id = employee_id_store.get('employee_id')
@app.post("/register/")
async def register(user_register: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = await get_user_from_db(user_register.employee_id, db)
    if existing_user:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    # Insert new user into the database with role 'user_a'
    query = text("""
        INSERT INTO ia_users (employee_id, password, employee_name, first_name, last_name, email, date_of_birth, date_of_join, designation, department, blood_group, mobile_no,role)
        VALUES (:employee_id, :password, :employee_name, :first_name, :last_name, :email, :date_of_birth, :date_of_join, :designation, :department, :blood_group, :mobile_no,:role)
    """)
    db.execute(query, {
        "employee_id": user_register.employee_id,
        "password": user_register.password,
        "employee_name": user_register.employee_name,
        "first_name": user_register.first_name,
        "last_name": user_register.last_name,
        "email": user_register.email,
        "date_of_birth": user_register.date_of_birth,
        "date_of_join": user_register.date_of_join,
        "designation": user_register.designation,
        "department": user_register.department,
        "blood_group": user_register.blood_group,
        "mobile_no": user_register.mobile_no,
        "role": user_register.role,
    })
    db.commit()

    return {"message": "Registration successful"}

# Endpoint to fetch table columns
@app.get("/contact-columns/")
async def get_columns():
    try:
        inspector = inspect(engine)
        columns = [column['name'] for column in inspector.get_columns('tbl_zoominfo_contact_paid')]
        return {"columns": columns}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    
@app.get("/company-columns/")
async def get_columns():
    try:
        inspector = inspect(engine)
        columns = [column['name'] for column in inspector.get_columns('tbl_zoominfo_company_paid')]
        return {"columns": columns}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


class TableType(str, Enum):
    company = "Company"
    contact = "Contact"
# File Upload Endpoint for User A
@app.post("/upload/user_a/")
async def upload_file_user_a(
    file: UploadFile = File(...),
    table_type: TableType = Form(...),
    selected_columns: str = Form(''),
    match_contact_domain: bool = Form(False),
    match_company_domain: bool = Form(False),
    match_linkedin_url: bool = Form(False),
    match_zi_contact_id: bool = Form(False),
    match_company_name: bool = Form(False),
    db: Session = Depends(get_db)
):  
    if table_type == TableType.contact:
        return await process_upload(
            file, selected_columns, match_contact_domain, match_linkedin_url, match_zi_contact_id, db
        )
    elif table_type == TableType.company:
        return await process_company_upload(
            file, selected_columns, match_company_domain, match_company_name, db
        )

# File Upload Endpoint for User B
@app.post("/upload/user_b/")
async def upload_file_user_b(
    file: UploadFile = File(...),
    table_type: TableType = Form(...),
    selected_columns: str = Form(''),
    match_contact_domain: bool = Form(False),
    match_company_domain: bool = Form(False),
    match_linkedin_url: bool = Form(False),
    match_zi_contact_id: bool = Form(False),
    match_company_name: bool = Form(False),
    db: Session = Depends(get_db)
):
    if table_type == TableType.contact:
        return await process_upload(
            file, selected_columns, match_contact_domain, match_linkedin_url, match_zi_contact_id, db
        )
    elif table_type == TableType.company:
        return await process_company_upload(
            file, selected_columns, match_company_domain, match_company_name, db
        )

# Common processing logic for file uploads  
# async def process_upload(
#     file: UploadFile,
#     selected_columns: str,
#     match_domain: bool,
#     match_linkedin_url: bool,
#     match_zi_contact_id: bool,
#     db: Session
# ):  
#     filename = file.filename
#     employee_id = employee_id_store.get('employee_id')  # Access the global variable
#     if not employee_id:
#         return JSONResponse(content={"error": "Employee ID not found."}, status_code=400)
    
#     df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')
#     # df = df.astype(str)
 
#     df = df.where(pd.notnull(df), None)

#     if not all(col in df.columns for col in ['domain', 'first_name', 'last_name','linkedin_url','zi_contact_id']):
#         return JSONResponse(content={"error": "Missing required columns in the uploaded file."}, status_code=400)

#     selected_columns = [col.strip() for col in selected_columns.split(',') if col.strip()]
#     if not selected_columns:
#         return JSONResponse(content={"error": "No valid columns selected."}, status_code=400)


#     all_columns = set(df.columns) | set(selected_columns)
#     missing_columns = all_columns - set(df.columns)
#     if missing_columns:
#         for col in missing_columns:
#             df[col] = None
            
#     results = []
#     import_time = datetime.now()
#     for _, row in df.iterrows():
#         conditions = []
#         params = {}

#         if match_domain:
#             conditions.append("\"Website\" = :domain")
#             params["domain"] = row['domain']
#             conditions.append("\"First Name\" = :first_name")
#             params["first_name"] = row['first_name']
#             conditions.append("\"Last Name\" = :last_name")
#             params["last_name"] = row['last_name']
#         if match_linkedin_url:
#             conditions.append("\"LinkedIn Contact Profile URL\" = :linkedin_url")
#             params["linkedin_url"] = row['linkedin_url']
#         if match_zi_contact_id:
#             try:
#                 # Check if the value can be converted to an integer
#                 if isinstance(row['zi_contact_id'], (float, int)):
#                     row['zi_contact_id'] = str(int(row['zi_contact_id']))
#                 else:
#                     row['zi_contact_id'] = str(row['zi_contact_id'])
#             except (ValueError, TypeError):
#                 row['zi_contact_id'] = str(row['zi_contact_id'])
            
#             conditions.append("\"ZoomInfo Contact ID\" = :zi_contact_id")
#             params["zi_contact_id"] = row['zi_contact_id']
    
#             conditions.append("\"ZoomInfo Contact ID\" = :zi_contact_id")
#             params["zi_contact_id"] = row['zi_contact_id']
            
            
#         if not conditions:
#             conditions.append("0=1")

#         where_clause = " AND ".join(conditions)
#         select_columns = ', '.join(f"\"{col}\"" for col in selected_columns) or '*'

#         query = f"""
#         SELECT {select_columns} FROM tbl_zoominfo_contact_paid
#         WHERE {where_clause}
#         """
        
#         try:
#             result = db.execute(text(query).params(params)).fetchall()
#             columns = [desc[0] for desc in db.execute(text(query).params(params)).cursor.description]
#             results.extend([dict(zip(columns, row)) for row in result])
#         except Exception as e:
#             print(f"An error occurred: {e}")
#             return JSONResponse(content={"error": str(e)}, status_code=500)
        
#     if results:
#         df_export = pd.DataFrame()
        

#         # Assign values to selected columns, set other columns to None
#         for column in selected_columns:
#             df_export[column] = [result.get(column, None) for result in results]
        
#         # Ensure all other columns are set to None
#         all_possible_columns = set([desc[0] for desc in db.execute(text(query).params(params)).cursor.description])
#         print(all_possible_columns)
#         print(set(selected_columns))
#         other_columns = all_possible_columns - set(selected_columns)
#         for column in other_columns:
#             df_export[column] = None

#         try:
#             print(df_export.columns)
#             print(df_export.head())
#             df_export['import_time'] = import_time
#             df_export['employee_id'] = employee_id
#             df_export['file_name'] = filename
#             df_export.to_sql('tbl_export_records_zoominfo_contact_paid', db.get_bind(), if_exists='append', index=False)
#         except Exception as e:
#             print(f"An error occurred while inserting export records: {e}")
#             return JSONResponse(content={"error": str(e)}, status_code=500)
#     return {"matches": results}

async def process_upload(
    file: UploadFile,
    selected_columns: str,
    match_domain: bool,
    match_linkedin_url: bool,
    match_zi_contact_id: bool,
    db: Session
):  
    filename = file.filename
    # employee_id = employee_id_store.get('employee_id')
    if not employee_id:
        return JSONResponse(content={"error": "Employee ID not found."}, status_code=400)

    df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')
    df = df.where(pd.notnull(df), None)
    if not all(col in df.columns for col in ['domain', 'first_name', 'last_name', 'linkedin_url', 'zi_contact_id']):
        return JSONResponse(content={"error": "Missing required columns in the uploaded file."}, status_code=400)

    selected_columns = [col.strip() for col in selected_columns.split(',') if col.strip()]
    if not selected_columns:
        return JSONResponse(content={"error": "No valid columns selected."}, status_code=400)

    results = []
    import_time = datetime.now()
    
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
                if isinstance(row['zi_contact_id'], (float, int)):
                    row['zi_contact_id'] = str(int(row['zi_contact_id']))
                else:
                    row['zi_contact_id'] = str(row['zi_contact_id'])
            except (ValueError, TypeError):
                row['zi_contact_id'] = str(row['zi_contact_id'])
            
            conditions.append("\"ZoomInfo Contact ID\" = :zi_contact_id")
            params["zi_contact_id"] = row['zi_contact_id']
            
        if not conditions:
            conditions.append("0=1")

        where_clause = " AND ".join(conditions)
        select_columns = ', '.join(f"\"{col}\"" for col in selected_columns) or '*'

        query = f"""
        SELECT {select_columns} FROM tbl_zoominfo_contact_paid
        WHERE {where_clause}
        """

        try:
            result = db.execute(text(query).params(params)).fetchall()
            columns = [desc[0] for desc in db.execute(text(query).params(params)).cursor.description]
            for match in result:
                match_dict = dict(zip(columns, match))
                # Include the original uploaded data in the result
                results.append({**dict(row), **match_dict})
        except Exception as e:
            print(f"An error occurred: {e}")
            return JSONResponse(content={"error": str(e)}, status_code=500)
    
    all_columns = set(df.columns) | set(selected_columns)
    missing_columns = all_columns - set(df.columns)
    if missing_columns:
        for col in missing_columns:
            df[col] = None 
            
            
    if results:
        df_export = pd.DataFrame()
        

        # Assign values to selected columns, set other columns to None
        for column in selected_columns:
            df_export[column] = [result.get(column, None) for result in results]
        
        # Ensure all other columns are set to None
        all_possible_columns = set([desc[0] for desc in db.execute(text(query).params(params)).cursor.description])
        
        other_columns = all_possible_columns - set(selected_columns)
        for column in other_columns:
            df_export[column] = None

        try:
            df_export['import_time'] = import_time
            df_export['employee_id'] = employee_id
            df_export['file_name'] = filename
            df_export['process_tag'] = 'export'
            df_export.to_sql('tbl_export_records_zoominfo_contact_paid', db.get_bind(), if_exists='append', index=False)
        except Exception as e:
            print(f"An error occurred while inserting export records: {e}")
            return JSONResponse(content={"error": str(e)}, status_code=500)
    return {"matches": results}



async def process_company_upload(
    file: UploadFile,
    selected_columns: str,
    match_domain: bool,
    match_company_name: bool,
    db: Session
):
    filename = file.filename
    employee_id = employee_id_store.get('employee_id')
    if not employee_id:
        return JSONResponse(content={"error": "Employee ID not found."}, status_code=400)
    
    df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')
 
    df = df.where(pd.notnull(df), None)

    if not all(col in df.columns for col in ['domain', 'company_name']):
        return JSONResponse(content={"error": "Missing required columns in the uploaded file."}, status_code=400)

    selected_columns = [col.strip() for col in selected_columns.split(',') if col.strip()]
    if not selected_columns:
        return JSONResponse(content={"error": "No valid columns selected."}, status_code=400)
            
    results = []
    import_time = datetime.now()
    
    for _, row in df.iterrows():
        conditions = []
        params = {}

        if match_domain:
            conditions.append("\"Website\" = :domain")
            params["domain"] = row['domain']
        if match_company_name:
            conditions.append("\"Company Name\" = :company_name")
            params["company_name"] = row['company_name']
            
            
        if not conditions:
            conditions.append("0=1")

        where_clause = " AND ".join(conditions)
        select_columns = ', '.join(f"\"{col}\"" for col in selected_columns) or '*'

        query = f"""
        SELECT {select_columns} FROM tbl_zoominfo_company_paid
        WHERE {where_clause}
        """
        
        try:
            result = db.execute(text(query).params(params)).fetchall()
            columns = [desc[0] for desc in db.execute(text(query).params(params)).cursor.description]
            for match in result:
                match_dict = dict(zip(columns, match))
                # Include the original uploaded data in the result
                results.append({**dict(row), **match_dict})
        except Exception as e:
            print(f"An error occurred: {e}")
            return JSONResponse(content={"error": str(e)}, status_code=500)
        
    all_columns = set(df.columns) | set(selected_columns)
    missing_columns = all_columns - set(df.columns)
    if missing_columns:
        for col in missing_columns:
            df[col] = None
    
    if results:
        df_export = pd.DataFrame()
        

        # Assign values to selected columns, set other columns to None
        for column in selected_columns:
            df_export[column] = [result.get(column, None) for result in results]
        
        # Ensure all other columns are set to None
        all_possible_columns = set([desc[0] for desc in db.execute(text(query).params(params)).cursor.description])
        
        other_columns = all_possible_columns - set(selected_columns)
        for column in other_columns:
            df_export[column] = None

        try:
            df_export['import_time'] = import_time
            df_export['employee_id'] = employee_id
            df_export['file_name'] = filename
            df_export['process_tag'] = 'export'
            df_export.to_sql('tbl_export_records_zoominfo_company_paid', db.get_bind(), if_exists='append', index=False)
        except Exception as e:
            print(f"An error occurred while inserting export records: {e}")
            return JSONResponse(content={"error": str(e)}, status_code=500)
           
    return {"matches": results}


UPLOAD_FOLDER = 'uploads/'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db_config = {
    "dbname": mc.dbname,
    "user": mc.user,
    "password": mc.password,
    "host": mc.host,
    "port": mc.port,
}

def connect_db():
    return psycopg2.connect(**db_config)



# Define an enum for valid table types
    
@app.post("/import/")
async def import_data(
    table_type: TableType = Form(...),  # Use TableType enum to restrict input
    files: List[UploadFile] = File(...)
):
    table_name = 'tbl_zoominfo_company_paid' if table_type == TableType.company else 'tbl_zoominfo_contact_paid'
    conn = connect_db()
    cursor = conn.cursor()

   # Retrieve column names from the selected table
    cursor.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = %s
    """, (table_name,))
    table_columns = set(row[0] for row in cursor.fetchall())

    total_records_inserted = 0
    file_messages = []

    for file in files:
        if file.filename == '':
            continue
        
        file_content = await file.read()
        file_stream = io.BytesIO(file_content)

        if file.filename.endswith('.xlsx'):
            data = pd.read_excel(file_stream, engine='openpyxl')
        elif file.filename.endswith('.csv'):
            data = pd.read_csv(file_stream, encoding='utf-8', dtype=str)
        else:
            continue

        # Clean data and filter columns
        data.columns = [col.strip() for col in data.columns]
        file_columns = set(data.columns)
        
        # Check for new columns
        new_columns = file_columns - table_columns
        if new_columns:
            file_messages.append(f"File '{file.filename}': New columns detected {new_columns}. Data not inserted.")
            continue

        # Add db_file_name column if it exists in the table schema
        if 'db_file_name' in table_columns:
            data['db_file_name'] = file.filename

        # Filter columns that are present in the table
        data = data[[col for col in data.columns if col in table_columns]]
        
        # Insert data into the database
        data = data.where(pd.notna(data), None)  # Replace NaNs with None

        temp_csv_path = os.path.join(UPLOAD_FOLDER, f'temp_{file.filename}')
        data.to_csv(temp_csv_path, index=False, header=False, encoding='utf-8')

        columns = ', '.join(f'"{col}"' for col in data.columns)
        copy_query = f"COPY {table_name} ({columns}) FROM STDIN WITH (FORMAT CSV, HEADER FALSE)"

        with open(temp_csv_path, 'r', encoding='utf-8') as f:
            cursor.copy_expert(copy_query, f)
        
        conn.commit()
        os.remove(temp_csv_path)

        records_inserted = len(data)
        total_records_inserted += records_inserted
        file_messages.append(f"File '{file.filename}': {records_inserted} records inserted.")

        # Log the upload event
        log_query = """
            INSERT INTO tbl_audit_lookup_log (data_point, file_name, count)
            VALUES (%s, %s, %s)
        """
        cursor.execute(log_query, (table_type, file.filename, records_inserted))
        conn.commit()

    cursor.close()
    conn.close()

    return JSONResponse(content={"message": f"Total records inserted: {total_records_inserted}", "file_messages": file_messages})
