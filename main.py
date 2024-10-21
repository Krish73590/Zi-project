import csv
import io
import os
from fastapi import FastAPI, File, Query, UploadFile, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
import openpyxl
import psycopg2
from sqlalchemy import JSON, DateTime, Integer, create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, Session
import pandas as pd
from io import BytesIO

import uvicorn
# import mycred as mc
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware
from typing import List, Optional
from enum import Enum
from datetime import date
from pydantic import EmailStr
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session as OrmSession
from sqlalchemy import Table, MetaData, insert
from sqlalchemy import create_engine, insert, Table, MetaData
import json
import pytz
import os
from dotenv import load_dotenv
import urllib.parse

import uuid
from sqlalchemy import Table, Column, String, MetaData, text
from sqlalchemy.exc import SQLAlchemyError
from collections import defaultdict

# Custom JSON encoder to handle datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()  # Convert datetime to ISO format string
        return super().default(obj)
load_dotenv()

dbname=os.getenv('DB_NAME')
user=os.getenv('DB_USER')
password=os.getenv('DB_PASSWORD')
password = urllib.parse.quote_plus(password)
host=os.getenv('DB_HOST')
port=os.getenv('DB_PORT')

# Database setup
DATABASE_URL = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
UPLOAD_FOLDER = 'uploads/'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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
    query = text("SELECT password, role FROM ia_users_zi WHERE employee_id = :employee_id")
    result = db.execute(query, {"employee_id": employee_id}).fetchone()
    if result:
        # Convert result tuple to dictionary
        return {"password": result[0], "role": result[1]}
    return None


employee_id_store = {}
employee_role_store = {}

# Login endpoint
@app.post("/login/")
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = await get_user_from_db(user_login.employee_id, db)
    if user and user_login.password == user["password"]:
        employee_id_store['employee_id'] = user_login.employee_id
        employee_role_store['employee_role'] = user["role"]
        return {"message": "Login successful", "user_type": user["role"] , "employee_id":  user_login.employee_id  }
    raise HTTPException(status_code=400, detail="Invalid credentials")



@app.post("/register/")
async def register(user_register: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = await get_user_from_db(user_register.employee_id, db)
    if existing_user:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    # Insert new user into the database with role 'user_a'
    query = text("""
        INSERT INTO ia_users_zi (employee_id, password, employee_name, first_name, last_name, email, date_of_birth, date_of_join, designation, department, blood_group, mobile_no,role)
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
    match_contact_only_domain: bool = Form(False),
    match_contact_domain: bool = Form(False),
    match_company_domain: bool = Form(False),
    match_linkedin_url: bool = Form(False),
    match_zi_contact_id: bool = Form(False),
    match_zi_company_id: bool = Form(False),
    match_company_name: bool = Form(False),
    column_mapping: str = Form(...),
    db: Session = Depends(get_db)
):  
    if table_type == TableType.contact:
        return await process_upload(
            file, selected_columns, match_contact_only_domain, match_contact_domain, match_linkedin_url, match_zi_contact_id, match_zi_company_id, match_company_name, column_mapping, db
        )
    elif table_type == TableType.company:
        return await process_company_upload(
            file, selected_columns, match_company_domain, match_company_name, match_zi_company_id, column_mapping, db
        )

# File Upload Endpoint for User B
@app.post("/upload/user_b/")
async def upload_file_user_b(
    file: UploadFile = File(...),
    table_type: TableType = Form(...),
    selected_columns: str = Form(''),
    match_contact_only_domain: bool = Form(False),
    match_contact_domain: bool = Form(False),
    match_company_domain: bool = Form(False),
    match_linkedin_url: bool = Form(False),
    match_zi_contact_id: bool = Form(False),
    match_zi_company_id: bool = Form(False),
    match_company_name: bool = Form(False),
    column_mapping: str = Form(...),
    db: Session = Depends(get_db)
):
    if table_type == TableType.contact:
        return await process_upload(
            file, selected_columns,match_contact_only_domain, match_contact_domain, match_linkedin_url, match_zi_contact_id, match_zi_company_id, match_company_name, column_mapping, db
        )
    elif table_type == TableType.company:
        return await process_company_upload(
            file, selected_columns, match_company_domain, match_company_name, match_zi_company_id, column_mapping, db
        )
import math

def clean_data(data):
    if isinstance(data, dict):
        return {k: clean_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_data(item) for item in data]
    elif data is None or (isinstance(data, float) and math.isnan(data)) or (isinstance(data, str) and data.lower() == 'nan'):
        return ''
    else:
        return data
    
def clean_url(url):
    if pd.isna(url):
        return url
    url = url.lower()
    url = url.replace('https://', '')
    url = url.replace('http://', '')
    url = url.replace('www.', '')
    url = url.replace('www', '')
    return url.strip()

import logging
# Configure logging
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

# Step 1: Define the restore_original_name function
def restore_original_name(alias):
    """Remove 'main_' or 'staging_' prefix from column names."""
    if alias.startswith("main_"):
        return alias[5:]
    elif alias.startswith("staging_"):
        return alias[8:]
    return alias

def handle_duplicates(row):
    """Handle duplicates within a single row."""
    seen = defaultdict(int)  # Track counts for each original column
    new_row = {}  # Store the final row with adjusted column names

    for col, value in row.items():
        original_col = restore_original_name(col)  # Restore original column name

        if seen[original_col] > 0:
            # Add a suffix for subsequent occurrences (starting from 1)
            new_col_name = f"{original_col}_{seen[original_col]}_db"
        else:
            new_col_name = original_col  # First occurrence, no suffix

        new_row[new_col_name] = value  # Add column to the new row
        seen[original_col] += 1  # Increment counter for next occurrence

    return new_row

def reverse_mapping_with_duplicates(rows, column_mapping):
    """Reverse map columns and handle duplicates."""
    reversed_column_mapping = {v: k for k, v in column_mapping.items()}  # Reverse mapping

    results = []
    for row in rows:
        new_row = {}
        for col, value in row.items():
            # Get the original column name or use the existing one
            original_name = reversed_column_mapping.get(col, col)

            # Use the handle_duplicates logic to manage duplicates correctly
            handle_duplicate_column_name(new_row, original_name, value)

        results.append(new_row)

    return results

def handle_duplicate_column_name(new_row, original_name, value):
    """Add suffix if column name already exists within the same row."""
    if original_name in new_row:
        counter = 1
        new_name = f"{original_name}_{counter}"
        # Keep incrementing until a unique name is found
        while new_name in new_row:
            counter += 1
            new_name = f"{original_name}_{counter}"
        new_row[new_name] = value  # Assign value to the new column name
    else:
        new_row[original_name] = value  # No conflict, assign value directly

async def process_upload(
    file: UploadFile,
    selected_columns: str,
    match_only_domain: bool,
    match_domain: bool,
    match_linkedin_url: bool,
    match_zi_contact_id: bool,
    match_zi_company_id: bool,
    match_company_name: bool,
    column_mapping: dict[str, str],
    db: Session  # Assuming this is a SQLAlchemy session
):  
    filename = file.filename
    employee_id = employee_id_store.get('employee_id')
    # employee_id = 'T01294'
    employee_role_py = employee_role_store.get('employee_role')
    
    if not employee_id:
        return JSONResponse(content={"error": "Employee ID not found. Please log in again."}, status_code=400)
    # Step 1: Parse column_mapping JSON string into a dictionary
    try:
        column_mapping_dict = json.loads(column_mapping)  # Convert JSON string to dict
        print(column_mapping_dict)
    except json.JSONDecodeError:
        return JSONResponse(
            content={"error": "Invalid column mapping format. Please provide a valid JSON object."},
            status_code=400
        )
        
    # Step 1: Read and Validate Excel File
    try:
        file_extension = filename.split('.')[-1].lower()

        # Process XLSX files
        if file_extension == 'xlsx':
            df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')

        # Process CSV files
        elif file_extension == 'csv':
            df = pd.read_csv(BytesIO(await file.read()))
        # df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')
        df = df.where(pd.notnull(df), None)
        df.rename(columns=column_mapping_dict, inplace=True)
        df = df.map(lambda x: str(int(x)) if isinstance(x, (int, float)) and not pd.isnull(x) else str(x))
        
        if 'zi_contact_id' in df.columns:
            df['zi_contact_id'] = df['zi_contact_id'].astype(str)
        if 'zi_company_id' in df.columns:
            df['zi_company_id'] = df['zi_company_id'].astype(str)
    except Exception as e:
        logger.error(f"Error reading the uploaded file '{filename}': {e}")
        return JSONResponse(content={"error": "Failed to read the uploaded file. Ensure it is a valid Excel file."}, status_code=400)

    # Step 2: Determine Required Columns Based on Matching Criteria
    required_columns = set()

    # Add required columns based on the matching criteria selected
    if match_only_domain:
        required_columns.add('domain')
    if match_domain:
        required_columns.update(['domain', 'first_name', 'last_name'])
    if match_linkedin_url:
        required_columns.add('linkedin_url')
    if match_zi_contact_id:
        required_columns.add('zi_contact_id')
    if match_zi_company_id:
        required_columns.add('zi_company_id')
    if match_company_name:
        required_columns.add('company_name')

    # Check if at least one matching criterion is selected
    if not required_columns:
        return JSONResponse(
            content={"error": "No matching criteria selected. Please select at least one matching criterion."},
            status_code=400
        )
    # Validate that the required columns are present in the uploaded file
    missing_columns = [col for col in required_columns if col not in df.columns]

    if missing_columns:
        return JSONResponse(
            content={"error": f"The uploaded file is missing the following required columns: {', '.join(missing_columns)}."},
            status_code=400
        )

    # Step 3: Validate Selected Columns
    selected_columns = [col.strip() for col in selected_columns.split(',') if col.strip()]
    selected_columns = list(set(selected_columns))
    
    if not selected_columns:
        return JSONResponse(content={"error": "No valid columns selected for export."}, status_code=400)
    
    # Step 4: Clean 'domain' Column
    try:
        if 'domain' in df.columns:
            df['domain'] = df['domain'].apply(clean_url)
    except Exception as e:
        logger.error(f"Error cleaning 'domain' column in file '{filename}': {e}")
        return JSONResponse(content={"error": "Failed to clean the 'domain' column. Please check the data format."}, status_code=400)
    
    # Step 5: Create Temporary Table and Insert Data
    staging_table_name = f'staging_uploaded_data_{uuid.uuid4().hex}'
    connection = db.connection()
    metadata = MetaData()
    staging_table_columns = [Column(col, String) for col in df.columns]
    staging_table = Table(
        staging_table_name, metadata,
        *staging_table_columns,
        prefixes=['TEMPORARY']
    )
    
    try:
        staging_table.create(bind=connection)
    except SQLAlchemyError as e:
        logger.error(f"Error creating temporary table '{staging_table_name}': {e}")
        return JSONResponse(content={"error": "Internal server error while processing the file. Please try again later."}, status_code=500)
    
    try:
        df.to_sql(staging_table_name, connection, if_exists='append', index=False)
    except SQLAlchemyError as e:
        logger.error(f"Error inserting data into temporary table '{staging_table_name}': {e}")
        return JSONResponse(content={"error": "Failed to insert data into the temporary table. Please verify the data and try again."}, status_code=400)
    
    # Step 6: Build and Execute Join Query
    if not any([match_only_domain, match_domain, match_linkedin_url, match_zi_contact_id, match_zi_company_id, match_company_name]):
        return JSONResponse(
            content={"error": "No matching criteria selected. Please select at least one matching criterion."},
            status_code=400
        )
        
    try:
        conditions = []
        if match_only_domain:
            conditions.append(f"REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(main.\"Website\"),'https://',''),'https:/',''),'http://',''),'www.',''),'www','') = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(staging.domain),'https://',''),'https:/',''),'http://',''),'www.',''),'www','')")
        if match_domain:
            conditions.extend([
                f"REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(main.\"Website\"),'https://',''),'https:/',''),'http://',''),'www.',''),'www','') = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(staging.domain),'https://',''),'https:/',''),'http://',''),'www.',''),'www','')",
                "TRIM(LOWER(REPLACE(main.\"First Name\",'''',' '))) = TRIM(LOWER(REPLACE(staging.first_name,'''',' ')))",
                "TRIM(LOWER(REPLACE(main.\"Last Name\",'''',' '))) = TRIM(LOWER(REPLACE(staging.last_name,'''',' ')))"
            ])
        if match_linkedin_url:
            conditions.append("TRIM(main.\"LinkedIn Contact Profile URL\") = TRIM(staging.linkedin_url)")
        if match_zi_contact_id:
            conditions.append("TRIM(main.\"ZoomInfo Contact ID\") = TRIM(staging.zi_contact_id)")
        if match_zi_company_id:
            conditions.append("TRIM(main.\"ZoomInfo Company ID\") = TRIM(staging.zi_company_id)")
        if match_company_name:
            conditions.append("TRIM(main.\"Company Name\") = TRIM(staging.company_name)")
        if not conditions:
            conditions.append("0=1")  # No conditions provided
        
        where_clause = " AND ".join(conditions)
        
        # Fetch ordered columns from the target table
        db_columns_query = """
            SELECT column_name 
            FROM information_schema.columns
            WHERE table_name = 'tbl_zoominfo_contact_paid'
            ORDER BY ordinal_position
        """
        ordered_columns = [row[0] for row in connection.execute(text(db_columns_query))]
        selected_columns_clean = [col.strip('"') for col in selected_columns]
        selected_columns_ordered = [col for col in ordered_columns if col in selected_columns_clean]
        select_columns = ', '.join(f"main.\"{col}\"  AS \"main_{col}\"" for col in selected_columns_ordered) or '*'
        staging_columns = ', '.join(f"staging.\"{col}\" AS \"staging_{col}\" " for col in df.columns)
        
        query = f"""
            SELECT DISTINCT {staging_columns}, {select_columns}
            FROM tbl_zoominfo_contact_paid AS main
            INNER JOIN {staging_table_name} staging ON {where_clause}
        """
        # print(query)
        result_frontend = connection.execute(text(query))
        results_with_aliases = [dict(row._mapping) for row in result_frontend]

        
        results_with_old_headers = [handle_duplicates(row) for row in results_with_aliases]
        results = reverse_mapping_with_duplicates(results_with_old_headers, column_mapping_dict)

            
        # Clean 'zi_contact_id' if necessary
        for result in results:
            if result.get('zi_contact_id') == 'nan':
                result['zi_contact_id'] = None
            if result.get('zi_company_id') == 'nan':
                result['zi_company_id'] = None
    except SQLAlchemyError as e:
        logger.error(f"Error executing join query on temporary table '{staging_table_name}': {e}")
        return JSONResponse(content={"error": "Failed to process data matching. Please check your selection criteria and try again."}, status_code=400)
    except Exception as e:
        logger.error(f"Unexpected error during query execution: {e}")
        return JSONResponse(content={"error": "An unexpected error occurred during data processing."}, status_code=500)
    
    # Step 7: Log the Export Operation
    if results:
        try:
            gmt_plus_5_30 = pytz.timezone('Asia/Kolkata')
            process_time = datetime.now(pytz.utc).astimezone(gmt_plus_5_30)
            formatted_process_time = process_time.strftime("%Y-%m-%d %H:%M:%S")
            
            # Determine process tag based on selected columns and user role
            selected_set = set(selected_columns)
            if selected_set == {'Email Address', 'LinkedIn Contact Profile URL', 'Website', 'ZoomInfo Contact ID', 'Company Name', 'ZoomInfo Company ID', 'First Name', 'Last Name'} and employee_role_py == 'user_a':
                process_tag_new = 'Export - Email'
            elif selected_set == {'ZoomInfo Contact ID', 'First Name', 'Last Name', 'Website', 'LinkedIn Contact Profile URL', 'Company Name', 'ZoomInfo Company ID', 'Mobile phone', 'Direct Phone Number', 'Company HQ Phone'} and employee_role_py == 'user_a':
                process_tag_new = 'Export - Phone'
            elif selected_set == {'ZoomInfo Contact ID', 'First Name', 'Last Name', 'Website', 'LinkedIn Contact Profile URL', 'Company Name', 'ZoomInfo Company ID', 'Email Address', 'Mobile phone', 'Direct Phone Number', 'Company HQ Phone'} and employee_role_py == 'user_a':
                process_tag_new = 'Export - Email & Phone'
            elif employee_role_py == 'user_b':
                process_tag_new = 'Export - All'
            else:
                process_tag_new = 'Export - Selective'
            
            temp_results = clean_data(results)
            
            metadata = {
                'employee_id': employee_id,
                'process_time': formatted_process_time,
                'file_name': filename,
                'process_tag': process_tag_new,
            }
            
            df_records = pd.DataFrame(temp_results)
            if process_tag_new == 'Export - Email':
            # Keep only records where 'Email Address' is non-blank
                df_records = df_records[df_records['Email Address'].notna() & (df_records['Email Address'] != '')]
            elif process_tag_new == 'Export - Phone':
                # Keep records where at least one of the phone columns is non-blank
                df_records = df_records[
                    (df_records['Mobile phone'].notna() & (df_records['Mobile phone'] != '')) |
                    (df_records['Direct Phone Number'].notna() & (df_records['Direct Phone Number'] != '')) |
                    (df_records['Company HQ Phone'].notna() & (df_records['Company HQ Phone'] != ''))
                ]
            elif process_tag_new == 'Export - Email & Phone':
                # Keep records where at least one of the phone columns is non-blank
                df_records = df_records[
                    (df_records['Mobile phone'].notna() & (df_records['Mobile phone'] != '')) |
                    (df_records['Direct Phone Number'].notna() & (df_records['Direct Phone Number'] != '')) |
                    (df_records['Company HQ Phone'].notna() & (df_records['Company HQ Phone'] != '')) |
                    (df_records['Email Address'].notna() & (df_records['Email Address'] != ''))
                ]
            df_records['data_json'] = df_records.apply(lambda row: json.dumps(row.to_dict(), cls=DateTimeEncoder), axis=1)
            df_log = pd.DataFrame({
                'employee_id': [metadata['employee_id']] * len(df_records),
                'process_time': [metadata['process_time']] * len(df_records),
                'file_name': [metadata['file_name']] * len(df_records),
                'process_tag': [metadata['process_tag']] * len(df_records),
                'counts': len(df_records),
                'data_json': df_records['data_json']
            })
            
            log_table = 'tbl_zoominfo_contact_paid_log_records'
            df_log.to_sql(
                log_table,
                db.get_bind(),
                if_exists='append',
                index=False,
                method='multi',
                dtype={
                    'employee_id': String,
                    'process_time': DateTime,
                    'file_name': String,
                    'process_tag': String,
                    'counts': Integer,
                    'data_json': JSON
                }
            )
            db.commit()
            logger.info(f"{len(df_log)} records logged successfully.")
        except SQLAlchemyError as e:
            logger.error(f"Error logging export operation: {e}")
            return JSONResponse(content={"error": "Failed to log the export operation. Please contact support."}, status_code=500)
        except Exception as e:
            logger.error(f"Unexpected error during logging: {e}")
            return JSONResponse(content={"error": "An unexpected error occurred while logging the export operation."}, status_code=500)
    
    # Step 8: Clean and Return Results
    try:
        cleaned_results = clean_data(results)
    except Exception as e:
        logger.error(f"Error cleaning results for frontend: {e}")
        return JSONResponse(content={"error": "Failed to prepare data for display. Please try again."}, status_code=500)
    
    return {"matches": cleaned_results}


async def process_company_upload(
    file: UploadFile,
    selected_columns: str,
    match_domain: bool,
    match_company_name: bool,
    match_zi_company_id: bool,
    column_mapping: dict[str, str],
    db: Session
):
    filename = file.filename
    employee_id = employee_id_store.get('employee_id')
    # employee_id = 'E00860'
    employee_role_py = employee_role_store.get('employee_role')
    if not employee_id:
        return JSONResponse(content={"error": "Employee ID not found."}, status_code=400)
    
    # Step 1: Parse column_mapping JSON string into a dictionary
    try:
        column_mapping_dict = json.loads(column_mapping)  # Convert JSON string to dict
        # print(column_mapping_dict)
    except json.JSONDecodeError:
        return JSONResponse(
            content={"error": "Invalid column mapping format. Please provide a valid JSON object."},
            status_code=400
        )
        
    # Step 1: Read and Validate Excel File
    try:
        file_extension = filename.split('.')[-1].lower()

        # Process XLSX files
        if file_extension == 'xlsx':
            df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')

        # Process CSV files
        elif file_extension == 'csv':
            df = pd.read_csv(BytesIO(await file.read()))
            # Read Excel file into DataFrame
        # df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')
        df = df.where(pd.notnull(df), None)
        df.rename(columns=column_mapping_dict, inplace=True)
        df = df.map(lambda x: str(int(x)) if isinstance(x, (int, float)) and not pd.isnull(x) else str(x))

        if 'zi_company_id' in df.columns:
            df['zi_company_id'] = df['zi_company_id'].astype(str)
        
        # print(df.head())
    except Exception as e:
        logger.error(f"Error reading the uploaded file '{filename}': {e}")
        return JSONResponse(content={"error": "Failed to read the uploaded file. Ensure it is a valid Excel file."}, status_code=400)
        

    
    # Step 2: Determine Required Columns Based on Matching Criteria
    required_columns = set()

    # Add required columns based on the matching criteria selected
    if match_domain:
        required_columns.add('domain')
    if match_company_name:
        required_columns.add('company_name')
    if match_zi_company_id:
        required_columns.add('zi_company_id')
        
    # Define mandatory columns
    # required_columns = ['domain', 'company_name']
    if not all(col in df.columns for col in required_columns):
        return JSONResponse(content={"error": "Missing required columns in the uploaded file."}, status_code=400)

    selected_columns = [col.strip() for col in selected_columns.split(',') if col.strip()]
    selected_columns = list(set(selected_columns))
    if not selected_columns:
        return JSONResponse(content={"error": "No valid columns selected."}, status_code=400)
    
    # Clean 'domain' column
    if 'domain' in df.columns:
        df['domain'] = df['domain'].apply(clean_url)
    
    # Create unique temporary table name
    staging_table_name = f'staging_uploaded_company_data_{uuid.uuid4().hex}'

    # Ensure we use the same connection throughout
    connection = db.connection()

    # Include all columns from the uploaded Excel file in the staging table
    metadata = MetaData()
    staging_table_columns = [Column(col, String) for col in df.columns]
    staging_table = Table(
        staging_table_name, metadata,
        *staging_table_columns,
        prefixes=['TEMPORARY']  # Specify that this is a temporary table
    )
    try:
        # Create the temporary table
        staging_table.create(bind=connection)

        # Insert data into the temporary table using the same connection
        df.to_sql(staging_table_name, connection, if_exists='append', index=False)

        # Build query to join temporary table with target table
        conditions = []
        if match_domain:
            conditions.append(f"REPLACE (REPLACE (REPLACE (REPLACE (REPLACE (LOWER(main.\"Website\"),'https://',''),'https:/',''),'http://',''),'www.',''),'www','') = staging.domain")
        if match_company_name:
            conditions.append("TRIM(LOWER(REPLACE(main.\"Company Name\",'''',' '))) = TRIM(LOWER(REPLACE(staging.company_name,'''',' ')))")
        if match_zi_company_id:
            conditions.append("TRIM(main.\"ZoomInfo Company ID\") = TRIM(staging.zi_company_id)::text")
        if not conditions:
            conditions.append("0=1")

        where_clause = " AND ".join(conditions)
        # print(where_clause)
         # Get the ordered columns from the database table
        db_columns_query = """
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'tbl_zoominfo_company_paid'
        ORDER BY ordinal_position
        """
        ordered_columns = [row[0] for row in connection.execute(text(db_columns_query))]
        
        selected_columns_clean = [col.strip('"') for col in selected_columns]

        # Filter selected_columns to match the order in the table
        selected_columns_ordered = [col for col in ordered_columns if col in selected_columns_clean]
        # Qualify selected columns with 'main' alias
        select_columns = ', '.join(f"main.\"{col}\"" for col in selected_columns_ordered) or '*'

        # Select all columns from the staging table for the frontend
        staging_columns = ', '.join(f""" staging.\"{col}\" AS \"{col}\" """ for col in df.columns)

        query = f"""
        SELECT DISTINCT {staging_columns},{select_columns}
        FROM tbl_zoominfo_company_paid AS main
        INNER JOIN {staging_table_name} staging ON {where_clause}
        """
        
        # print(query)
        # Execute the query and get the Result object
        # result_frontend = connection.execute(text(query))
        result_frontend = connection.execute(text(query))
        results_with_aliases = [dict(row._mapping) for row in result_frontend]

        
        results_with_old_headers = [handle_duplicates(row) for row in results_with_aliases]
        results = reverse_mapping_with_duplicates(results_with_old_headers, column_mapping_dict)
            
        # Process results for backend logging
        if results:
                        # Get the current time in GMT
            gmt_plus_5_30 = pytz.timezone('Asia/Kolkata')

            # Get the current time in GMT+5:30
            process_time = datetime.now(pytz.utc).astimezone(gmt_plus_5_30)

            # Format the time as a string (e.g., 'YYYY-MM-DD HH:MM:SS')
            formatted_process_time = process_time.strftime("%Y-%m-%d %H:%M:%S")
            
            df_export = pd.DataFrame()
            
            new_cols = list(required_columns) + selected_columns_ordered
            
            # Create a dictionary for all selected columns with their respective values from results
            column_data = {column: [result.get(column, None) for result in results] for column in new_cols}
            
            # Use pd.concat() to add the column data to df_export all at once
            df_export = pd.concat([df_export, pd.DataFrame(column_data)], axis=1)
            # print(df_export.head())
            # Ensure all other columns are set to None
            all_possible_columns = set(result_frontend.keys())
            
            other_columns = all_possible_columns - set(new_cols)
            for column in other_columns:
                df_export[column] = None
            
            try:
                if employee_role_py == 'user_a':
                    process_tag_new = 'Export - Selective'
                else:
                    process_tag_new = 'Export - All'
                    
                cleaned_results = clean_data(results)
                
                # Metadata for all records (same for each record)
                metadata = {
                    'employee_id': employee_id,
                    'process_time': formatted_process_time,  # Ensure this is a valid datetime object
                    'file_name': filename,
                    'process_tag': process_tag_new,
                }
                
                # Create a DataFrame from cleaned_results (this holds individual records)
                df_records = pd.DataFrame(cleaned_results)

                # Create a 'data_json' column by serializing each row into a JSON string
                df_records['data_json'] = df_records.apply(lambda row: json.dumps(row.to_dict(), cls=DateTimeEncoder), axis=1)

                # Create a new DataFrame that only holds the metadata and the 'data_json' column
                df_log = pd.DataFrame({
                    'employee_id': [metadata['employee_id']] * len(df_records),
                    'process_time': [metadata['process_time']] * len(df_records),
                    'file_name': [metadata['file_name']] * len(df_records),
                    'process_tag': [metadata['process_tag']] * len(df_records),
                    'counts': len(df_records),  # Same count for each record
                    'data_json': df_records['data_json']  # Store the JSON records
                })
                
                # Log table name
                log_table = 'tbl_zoominfo_company_paid_log_records'
                
                 # Insert the data using pandas.to_sql
                try:
                    df_log.to_sql(
                        log_table,
                        db.get_bind(),  # SQLAlchemy connection
                        if_exists='append',  # Append to existing table
                        index=False,  # Do not write the index to the table
                        method='multi',  # Use batch insert
                        dtype={
                            'employee_id': String,
                            'process_time': DateTime,
                            'file_name': String,
                            'process_tag': String,
                            'counts': Integer,
                            'data_json': JSON  # Ensure this is JSON or JSONB in the database
                        }
                    )
                    db.commit()  # Ensure the transaction is committed
                    # print(f"{len(df_log)} records inserted successfully.")
                except Exception as e:
                    print(f"An error occurred while inserting the log record: {e}")
                    
            except Exception as e:
                print(f"An error occurred while inserting export records: {e}")
                return JSONResponse(content={"error": str(e)}, status_code=500)
    
    except SQLAlchemyError as e:
        # print(f"An error occurred: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        # No need to drop the temporary table; it will be dropped automatically
        pass

    # Clean results for frontend
    cleaned_results = clean_data(results)
    return {"matches": cleaned_results}

CONTACT_TEMPLATE  = [
    "ZoomInfo Contact ID","Last Name","First Name","Middle Name","Salutation","Suffix","Job Title","Job Title Hierarchy Level","Management Level","Job Start Date","Job Function","Department","Company Division Name","Direct Phone Number","Email Address","Email Domain","Mobile phone","Last Job Change Type","Last Job Change Date","Previous Job Title","Previous Company Name","Previous Company ZoomInfo Company ID","Previous Company LinkedIn Profile","Highest Level of Education","Contact Accuracy Score","Contact Accuracy Grade","ZoomInfo Contact Profile URL","LinkedIn Contact Profile URL","Notice Provided Date","Person Street","Person City","Person State","Person Zip Code","Country","ZoomInfo Company ID","Company Name","Company Description","Website","Founded Year","Company HQ Phone","Fax","Ticker","Revenue (in 000s USD)","Revenue Range (in USD)","Est. Marketing Department Budget (in 000s USD)","Est. Finance Department Budget (in 000s USD)","Est. IT Department Budget (in 000s USD)","Est. HR Department Budget (in 000s USD)","Employees","Employee Range","Past 1 Year Employee Growth Rate","Past 2 Year Employee Growth Rate","SIC Code 1","SIC Code 2","SIC Codes","NAICS Code 1","NAICS Code 2","NAICS Codes","Primary Industry","Primary Sub-Industry","All Industries","All Sub-Industries","Industry Hierarchical Category","Secondary Industry Hierarchical Category","Alexa Rank","ZoomInfo Company Profile URL","LinkedIn Company Profile URL","Facebook Company Profile URL","Twitter Company Profile URL","Ownership Type","Business Model","Certified Active Company","Certification Date","Total Funding Amount (in 000s USD)","Recent Funding Amount (in 000s USD)","Recent Funding Round","Recent Funding Date","Recent Investors","All Investors","Company Street Address","Company City","Company State","Company Zip Code","Company Country","Full Address","Number of Locations"
   ]; 
   
COMPANY_TEMPLATE = [
     "ZoomInfo Company ID","Company Name","Website","Founded Year","Company HQ Phone","Fax","Ticker","Revenue (in 000s USD)","Revenue Range (in USD)","Employees","Employee Range","SIC Code 1","SIC Code 2","SIC Codes","NAICS Code 1","NAICS Code 2","NAICS Codes","Primary Industry","Primary Sub-Industry","All Industries","All Sub-Industries","Industry Hierarchical Category","Secondary Industry Hierarchical Category","Alexa Rank","ZoomInfo Company Profile URL","LinkedIn Company Profile URL","Facebook Company Profile URL","Twitter Company Profile URL","Ownership Type","Business Model","Certified Active Company","Certification Date","Defunct Company","Total Funding Amount (in 000s USD)","Recent Funding Amount (in 000s USD)","Recent Funding Round","Recent Funding Date","Recent Investors","All Investors","Company Street Address","Company City","Company State","Company Zip Code","Company Country","Full Address","Number of Locations","Company Is Acquired","Company ID (Ultimate Parent)","Entity Name (Ultimate Parent)","Company ID (Immediate Parent)","Entity Name (Immediate Parent)","Relationship (Immediate Parent)"
   ];

from sqlalchemy.exc import IntegrityError
from urllib.parse import quote, unquote

# Helper function to extract headers from Excel files
def extract_excel_headers(file_stream):
    workbook = openpyxl.load_workbook(file_stream, read_only=True)
    sheet = workbook.active  # Get the first sheet
    headers = [cell.value for cell in next(sheet.iter_rows(max_row=1))]
    return headers

# Helper function to extract headers from CSV files
def extract_csv_headers(file_stream):
    file_stream.seek(0)  # Reset stream position
    reader = csv.reader(io.TextIOWrapper(file_stream, encoding='utf-8'))
    headers = next(reader)  # Read the first row as headers
    return headers

@app.post("/import/")
async def import_data(
    table_type: TableType = Form(...),  # Use TableType enum to restrict input
    column_mapping: str = Form(...),
    # files: List[UploadFile] = File(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):  
    # employee_id = employee_id_store.get('employee_id')
    employee_id = 'E00860'
    if not employee_id:
        return JSONResponse(content={"error": "Employee ID not found."}, status_code=400)

    try:
        column_mapping_dict = json.loads(column_mapping)  # Convert JSON string to dict
        # print(column_mapping_dict)
    except json.JSONDecodeError:
        return JSONResponse(
            content={"error": "Invalid column mapping format. Please provide a valid JSON object."},
            status_code=400
        )
        
    # Set the table and template based on the type
    if table_type == TableType.company:
        table_name = 'tbl_zoominfo_company_paid'
        log_table_name = 'tbl_zoominfo_company_paid_log_records'
        expected_columns = COMPANY_TEMPLATE
    else:
        table_name = 'tbl_zoominfo_contact_paid'
        log_table_name = 'tbl_zoominfo_contact_paid_log_records'
        expected_columns = CONTACT_TEMPLATE

    total_records_inserted = 0
    file_messages = []

    try:
        # for file in files:
        if file.filename == '':
            file_messages.append(f"File '{file.filename}': Invalid file name.")
        file_content = await file.read()
        file_stream = io.BytesIO(file_content)
        # **Extract headers based on the file type**
        if file.filename.endswith('.xlsx'):
            headers = extract_excel_headers(file_stream)
        elif file.filename.endswith('.csv'):
            headers = extract_csv_headers(file_stream)
        else:
            return JSONResponse(
                content={"error": "Upload either .xlsx or .csv file."}, status_code=400
            )

        # **Check for duplicate headers**
        duplicate_headers = [header for header in headers if headers.count(header) > 1]
        if duplicate_headers:
            unique_duplicates = list(set(duplicate_headers))
            return JSONResponse(
                content={
                    "error": f"Duplicate columns found: {', '.join(unique_duplicates)}"
                },
                status_code=400
            )
        
        

        if file.filename.endswith('.xlsx'): 
            data = pd.read_excel(file_stream, engine='openpyxl')
            data = data.where(pd.notnull(data), None)
        elif file.filename.endswith('.csv'):    
            data = pd.read_csv(file_stream, encoding='utf-8', dtype=str)
            data = data.where(pd.notnull(data), None)
            # print(data.head())
        else:
            return JSONResponse(
                content={
                    "error": f"File '{file.filename}': Upload either xlsx or csv file."
                },
                status_code=400
            )
        
        
        # Clean and strip whitespace from column names
        data.columns = [col.strip() for col in data.columns]

        # Clean data and filter columns to match expected columns
        data.columns = [col.strip() for col in data.columns]
        # print(column_mapping_dict)
        mapped_columns = set(column_mapping_dict.keys())  # Mapped column names
        data = data[[col for col in mapped_columns if col in data.columns]]  # Filter columns
        data.rename(columns=column_mapping_dict, inplace=True) 
        data['db_file_name'] = file.filename
        data = data.where(pd.notna(data), None)  # Replace NaNs with None
        
        try:
            # Insert data using pandas' to_sql for batch processing
            data.to_sql(
                table_name,
                db.get_bind(),
                if_exists='append',  # Append to the existing table
                index=False,  # We don't need to add the dataframe index as a column
                method='multi',  # Batch insert
                )
            db.commit()

            records_inserted = len(data)
            total_records_inserted += records_inserted
            file_messages.append(f"File '{file.filename}': {records_inserted} records inserted.")
        
        except IntegrityError as e:
            # Handle primary key or unique constraint violation
            print(f"Error occurred: {e}")
            db.rollback()
            file_messages.append(f"File '{file.filename}': Error inserting data - {str(e)}")

                                # Get the current time in GMT
        gmt_plus_5_30 = pytz.timezone('Asia/Kolkata')

        # Get the current time in GMT+5:30
        process_time = datetime.now(pytz.utc).astimezone(gmt_plus_5_30)

        # Format the time as a string (e.g., 'YYYY-MM-DD HH:MM:SS')
        formatted_process_time = process_time.strftime("%Y-%m-%d %H:%M:%S")
        try:
            # Convert each record to a log entry
            for idx, record in data.iterrows():
                metadata = {
                    'employee_id': employee_id,
                    'process_time': formatted_process_time,
                    'file_name': file.filename,
                    'process_tag': 'Import',
                    'counts': len(data),  # Each log entry is for a single record
                    'data_json': json.dumps(record.to_dict())  # Store each record as JSON
                }

                df_log = pd.DataFrame([metadata])

                # Insert each log entry for the corresponding record
                df_log.to_sql(
                    log_table_name, 
                    db.get_bind(), 
                    if_exists='append', 
                    index=False, 
                    dtype={
                        'employee_id': String,
                        'process_time': DateTime,
                        'file_name': String,
                        'process_tag': String,
                        'counts': Integer,
                        'data_json': JSON  # Use JSON or JSONB depending on your database
                    }
                )
            db.commit()
        except Exception as e:
            print(f"An error occurred while inserting log records: {e}")
            db.rollback()
            return JSONResponse(content={"error": str(e)}, status_code=500)

    except Exception as e:
        db.rollback()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        db.close()

    return JSONResponse(content={
        "message": f"Total records inserted: {total_records_inserted}", 
        "file_messages": file_messages
    })

import json

@app.get("/user/download-activity/")
async def download_activity(
    employee_id: str,
    process_time: str,
    table_type: TableType = Query(...),
    db: Session = Depends(get_db)
):
    results = []
    try:
        # Determine the new table name based on table_type
        if table_type == TableType.contact:
            table_name = 'tbl_zoominfo_contact_paid_log_records'
        elif table_type == TableType.company:
            table_name = 'tbl_zoominfo_company_paid_log_records'
        else:
            raise HTTPException(status_code=400, detail="Invalid table type.")

        # Decode process_time to handle any URL-encoded characters properly
        process_time = unquote(process_time)

        # Query to get the relevant records from the log table
        query = text(f"""
            SELECT data_json 
            FROM {table_name}
            WHERE employee_id = :employee_id AND process_time = :process_time
        """)

        result = db.execute(query, {"employee_id": employee_id, "process_time": process_time}).fetchall()

        # Extract the JSON data from each row and append directly to the results list
        results = [json.loads(x[0]) for x in result]

    except Exception as e:
        print(f"An error occurred: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

    return results

@app.get("/user/last-activities/")
async def get_last_activities(db: Session = Depends(get_db), table_type: TableType = Query(...)):
    employee_id = employee_id_store.get('employee_id')

    # employee_id = 'T01294'  # Replace with actual retrieval logic

    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee ID not found.")

    results = []
    try:
        # Determine the new table name based on table_type
        if table_type == TableType.contact:
            table_name = 'tbl_zoominfo_contact_paid_log_records'
        elif table_type == TableType.company:
            table_name = 'tbl_zoominfo_company_paid_log_records'
        else:
            raise HTTPException(status_code=400, detail="Invalid table type.")

        # Query to fetch the last activities grouped by employee_id, process_time, file_name, process_tag
        query = text(f"""
            SELECT DISTINCT employee_id, process_time, file_name, process_tag, counts cnt, process_time process_time_download
            FROM {table_name}
            WHERE employee_id = :employee_id
            ORDER BY process_time DESC
        """)

        # Execute the query and fetch the results
        result = db.execute(query, {"employee_id": employee_id}).fetchall()

        # Convert result to a list of dictionaries
        columns = ['employee_id', 'process_time', 'file_name', 'process_tag', 'cnt']
        results = [dict(zip(columns, row)) for row in result]

        # Generate download link for each activity
        for record in results:
            process_time_str = str(record['process_time']).replace(' ','%20').replace(':','%3A') if record['process_time'] else ""

            # URL-encode process_time to replace spaces with %20
            # process_time_encoded = quote(process_time_str)

            record['download_link'] = (
                f"/user/download-activity/?employee_id={record['employee_id']}"
                f"&process_time={process_time_str}&table_type={table_type.value}"
            )
            # print(record['download_link'])
            record['process_time'] = str(record['process_time'])

        return results

    except Exception as e:
        print(f"An error occurred: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__=="__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)