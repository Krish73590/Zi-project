import io
import os
from fastapi import FastAPI, File, Query, UploadFile, Form, Depends, HTTPException
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
from sqlalchemy.orm import Session as OrmSession
from sqlalchemy import Table, MetaData, insert
from sqlalchemy import create_engine, insert, Table, MetaData


import uuid
from sqlalchemy import Table, Column, String, MetaData, text
from sqlalchemy.exc import SQLAlchemyError


# Database setup
DATABASE_URL = f"postgresql://{mc.user}:{mc.password}@{mc.host}:{mc.port}/{mc.dbname}"
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
    match_company_name: bool = Form(False),
    db: Session = Depends(get_db)
):  
    if table_type == TableType.contact:
        return await process_upload(
            file, selected_columns, match_contact_only_domain, match_contact_domain, match_linkedin_url, match_zi_contact_id, db
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
    match_contact_only_domain: bool = Form(False),
    match_contact_domain: bool = Form(False),
    match_company_domain: bool = Form(False),
    match_linkedin_url: bool = Form(False),
    match_zi_contact_id: bool = Form(False),
    match_company_name: bool = Form(False),
    db: Session = Depends(get_db)
):
    if table_type == TableType.contact:
        return await process_upload(
            file, selected_columns,match_contact_only_domain, match_contact_domain, match_linkedin_url, match_zi_contact_id, db
        )
    elif table_type == TableType.company:
        return await process_company_upload(
            file, selected_columns, match_company_domain, match_company_name, db
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


    
async def process_upload(
    file: UploadFile,
    selected_columns: str,
    match_only_domain: bool,
    match_domain: bool,
    match_linkedin_url: bool,
    match_zi_contact_id: bool,
    db: Session  # Assuming this is a SQLAlchemy session
):  
    filename = file.filename
    employee_id = employee_id_store.get('employee_id')
    # employee_id = 'E00860'
    employee_role_py = employee_role_store.get('employee_role')
    if not employee_id:
        return JSONResponse(content={"error": "Employee ID not found."}, status_code=400)

    # Read Excel file into DataFrame
    df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')
    df = df.where(pd.notnull(df), None)
    df['zi_contact_id'] = df['zi_contact_id'].astype(str)
    
    # Define mandatory columns
    required_columns = ['domain', 'first_name', 'last_name', 'linkedin_url', 'zi_contact_id']
    uploaded_columns = df.columns.tolist()

    
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
    staging_table_name = f'staging_uploaded_data_{uuid.uuid4().hex}'

    # Ensure we use the same connection throughout
    # Get the raw connection from the session
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
        if match_only_domain:
            conditions.append(f"REPLACE (REPLACE (REPLACE (REPLACE (REPLACE (LOWER(main.\"Website\"),'https://',''),'https:/',''),'http://',''),'www.',''),'www','') = staging.domain")
        if match_domain:
            conditions.append(f"REPLACE (REPLACE (REPLACE (REPLACE (REPLACE (LOWER(main.\"Website\"),'https://',''),'https:/',''),'http://',''),'www.',''),'www','') = staging.domain")
            conditions.append("LOWER(main.\"First Name\") = LOWER(staging.first_name)")
            conditions.append("LOWER(main.\"Last Name\") = LOWER(staging.last_name)")
        if match_linkedin_url:
            conditions.append("main.\"LinkedIn Contact Profile URL\" = staging.linkedin_url")
        if match_zi_contact_id:
            conditions.append("main.\"ZoomInfo Contact ID\" = staging.zi_contact_id")
        if not conditions:
            conditions.append("0=1")
        
        where_clause = " AND ".join(conditions)
        
        # Get the ordered columns from the database table
        db_columns_query = """
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'tbl_zoominfo_contact_paid'
        ORDER BY ordinal_position
        """
        ordered_columns = [row[0] for row in connection.execute(text(db_columns_query))]
        
        selected_columns_clean = [col.strip('"') for col in selected_columns]

        # Filter selected_columns to match the order in the table
        selected_columns_ordered = [col for col in ordered_columns if col in selected_columns_clean]

        # Qualify selected columns with 'main' alias
        select_columns = ', '.join(f"main.\"{col}\"" for col in selected_columns_ordered) or '*'

        # Select all columns from the staging table for the frontend
        staging_columns = ', '.join(f"staging.{col} AS {col}" for col in df.columns)
        
        query = f"""
        SELECT DISTINCT {staging_columns}, {select_columns}
        FROM tbl_zoominfo_contact_paid AS main
        INNER JOIN {staging_table_name} staging ON {where_clause}
        """
        

        result_frontend = connection.execute(text(query))

        # Process the results
        results = [dict(row._mapping) for row in result_frontend]
        
        for result in results:
            if result.get('zi_contact_id') == 'nan':
                result['zi_contact_id'] = None

        if results:
            import_time = datetime.now()
            # Process results
            df_export = pd.DataFrame()
            
            new_cols = required_columns + selected_columns_ordered

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
                # Query to fetch the column names from the target table
                db_columns_query = """
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'tbl_zoominfo_contact_paid_log_records'
                ORDER BY ordinal_position
                """
                ordered_columns = [row[0] for row in db.execute(text(db_columns_query)).fetchall()]

                # Sort selected_columns based on the database order
                final_columns =  ', '.join(f"\"{col}\"" for col in selected_columns_ordered) or '*'
                excel_cols = '"domain", "first_name", "last_name", "linkedin_url", "zi_contact_id"'

                selected_columns_sorted = excel_cols + ', ' + final_columns
                
                num_rows = df_export.shape[0]
                # Create a new DataFrame with all necessary columns at once to avoid fragmentation
                new_columns = {
                    'import_time': [import_time] * num_rows,  # Repeat the scalar value for all rows
                    'employee_id': [employee_id] * num_rows,  # Repeat the scalar value for all rows
                    'file_name': [filename] * num_rows,       # Repeat the scalar value for all rows
                    'selected_cols': [selected_columns_sorted] * num_rows  # Repeat the scalar value for all rows
                }

                # Add process_tag based on conditions
                if set(selected_columns) == {'Email Address', 'LinkedIn Contact Profile URL', 'Website', 'ZoomInfo Contact ID', 'First Name', 'Last Name'} and employee_role_py == 'user_a':
                    new_columns['process_tag'] = ['Export - Email'] * num_rows
                elif set(selected_columns) == {'ZoomInfo Contact ID', 'First Name', 'Last Name', 'Website', 'LinkedIn Contact Profile URL', 'Mobile phone', 'Direct Phone Number', 'Company HQ Phone'} and employee_role_py == 'user_a':
                    new_columns['process_tag'] = ['Export - Phone'] * num_rows
                elif employee_role_py == 'user_b':
                    new_columns['process_tag'] = ['Export - All'] * num_rows
                else:
                    new_columns['process_tag'] = ['Export - Selective'] * num_rows

                # Concatenate the new columns to the original DataFrame
                df_export = pd.concat([df_export, pd.DataFrame(new_columns)], axis=1)
                
                insert_cols = new_cols + ['import_time','employee_id','file_name','selected_cols','process_tag']
                
                filtered_insert_cols = [col for col in insert_cols if col in df_export.columns]

                df_filtered = df_export[filtered_insert_cols]
                
            
                df_filtered.to_sql(
                    'tbl_zoominfo_contact_paid_log_records',
                    db.get_bind(),
                    if_exists='append',
                    index=False,
                    method='multi',
                    chunksize=300 # Adjust as needed
                )
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



async def process_company_upload(
    file: UploadFile,
    selected_columns: str,
    match_domain: bool,
    match_company_name: bool,
    db: Session
):
    filename = file.filename
    employee_id = employee_id_store.get('employee_id')
    employee_role_py = employee_role_store.get('employee_role')
    if not employee_id:
        return JSONResponse(content={"error": "Employee ID not found."}, status_code=400)
    
    # Read Excel file into DataFrame
    df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')
    df = df.where(pd.notnull(df), None)
    
    # Define mandatory columns
    required_columns = ['domain', 'company_name']
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
            conditions.append("LOWER(main.\"Company Name\") = LOWER(staging.company_name)")
        if not conditions:
            conditions.append("0=1")

        where_clause = " AND ".join(conditions)
        
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
        staging_columns = ', '.join(f"staging.{col} AS input_{col}" for col in df.columns)

        query = f"""
        SELECT DISTINCT {select_columns}, {staging_columns}
        FROM tbl_zoominfo_company_paid AS main
        INNER JOIN {staging_table_name} staging ON {where_clause}
        """
        # Execute the query and get the Result object
        result_frontend = connection.execute(text(query))

        # Process the results
        results = [dict(row._mapping) for row in result_frontend]

        # Process results for backend logging
        if results:
            import_time = datetime.now()
            new_cols = required_columns + selected_columns_ordered
            
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
                # Query to fetch the column names from the target table
                db_columns_query = """
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'tbl_zoominfo_contact_paid_log_records'
                ORDER BY ordinal_position
                """
                ordered_columns = [row[0] for row in db.execute(text(db_columns_query)).fetchall()]

                # Sort selected_columns based on the database order
                final_columns =  ', '.join(f"\"{col}\"" for col in selected_columns_ordered) or '*'
                excel_cols = '"domain", "company_name"'
                
                selected_columns_sorted = excel_cols + ', ' + final_columns
                num_rows = df_export.shape[0]
                # Create a new DataFrame with all necessary columns at once to avoid fragmentation
                new_columns = {
                    'import_time': [import_time] * num_rows,  # Repeat the scalar value for all rows
                    'employee_id': [employee_id] * num_rows,  # Repeat the scalar value for all rows
                    'file_name': [filename] * num_rows,       # Repeat the scalar value for all rows
                    'selected_cols': selected_columns_sorted * num_rows,
                }
                
                if employee_role_py == 'user_a':
                    new_columns['process_tag'] = ['Export - Selective'] * num_rows
                else:
                    new_columns['process_tag'] = ['Export - All'] * num_rows

                df_export = pd.concat([df_export, pd.DataFrame(new_columns)], axis=1)

                insert_cols = new_cols + ['import_time','employee_id','file_name','selected_cols','process_tag']
                
                filtered_insert_cols = [col for col in insert_cols if col in df_export.columns]

                df_filtered = df_export[filtered_insert_cols]
                
                df_filtered.to_sql(
                    'tbl_zoominfo_company_paid_log_records',
                    db.get_bind(),
                    if_exists='append',
                    index=False,
                    method='multi',
                    chunksize=300 # Adjust as needed
                )
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


@app.post("/import/")
async def import_data(
    table_type: TableType = Form(...),  # Use TableType enum to restrict input
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):  
    # employee_id = employee_id_store.get('employee_id')
    employee_id = 'T01294'
    if not employee_id:
        return JSONResponse(content={"error": "Employee ID not found."}, status_code=400)

    table_name = 'tbl_zoominfo_company_paid' if table_type == TableType.company else 'tbl_zoominfo_contact_paid'

    session = SessionLocal()

    try:
        # Retrieve column names from the selected table
        table_columns_query = text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = :table_name
        """)
        table_columns = set(row[0] for row in session.execute(table_columns_query, {'table_name': table_name}))

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
            

            # Add db_file_name column if it exists in the table schema
            if 'db_file_name' in table_columns:
                data['db_file_name'] = file.filename

            # Filter columns that are present in the table
            data = data[[col for col in data.columns if col in table_columns]]
            
            # Insert data into the database
            data = data.where(pd.notna(data), None)  # Replace NaNs with None
            # Insert data into the database
            columns = ', '.join(f'"{col}"' for col in data.columns if col != 'tbl_zoominfo_company_paid_id')
            # print(columns)
            placeholders = ', '.join(['%s'] * (len(data.columns)))
            # print(placeholders)
            insert_query = f"""
                INSERT INTO {table_name} ({columns})
                VALUES ({placeholders})
            """
            # print(insert_query)

            with db.connection().connection.cursor() as cursor:
                for _, row in data.iterrows():
                    try:
                        cursor.execute(insert_query, tuple(row[col] for col in data.columns if col != 'tbl_zoominfo_company_paid_id'))
                    except Exception as e:
                        print(f"Error occurred: {e}")
                        db.rollback()
                        file_messages.append(f"File '{file.filename}': Error inserting data - {str(e)}")
                        break
                db.commit()

            records_inserted = len(data)
            total_records_inserted += records_inserted
            file_messages.append(f"File '{file.filename}': {records_inserted} records inserted.")

            # Log the upload event
            import_time = datetime.now()
            
            if table_type == TableType.contact:
                log_table_name = 'tbl_zoominfo_contact_paid_log_records'
            elif table_type == TableType.company:
                log_table_name = 'tbl_zoominfo_company_paid_log_records'
                
            try:
                log_data = data.copy()
                log_data['import_time'] = import_time
                log_data['employee_id'] = employee_id
                log_data['file_name'] = file.filename
                log_data['process_tag'] = 'Import'
                log_data['selected_cols'] = columns
                if table_type == TableType.company:
                    log_data['domain'] = None
                    log_data['company_name'] = None
                elif table_type == TableType.contact:
                    log_data['domain'] = None
                    log_data['first_name'] = None
                    log_data['last_name'] = None
                    log_data['linkedin_url'] = None
                    log_data['zi_contact_id'] = None
                
                log_data.to_sql(log_table_name, engine, if_exists='append', index=False)
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

    return JSONResponse(content={"message": f"Total records inserted: {total_records_inserted}", "file_messages": file_messages})

@app.get("/user/download-activity/")
async def download_activity(
    employee_id: str,
    import_time: str,
    table_type: TableType = Query(...),
    db: Session = Depends(get_db)
):
    results = []
    try:
        # Determine the table name based on table_type
        if table_type == TableType.contact:
            table_name = 'tbl_zoominfo_contact_paid_log_records'
        elif table_type == TableType.company:
            table_name = 'tbl_zoominfo_company_paid_log_records'

        if table_type == TableType.contact:
            cols = """ "tbl_zoominfo_paid_id","ZoomInfo Contact ID","Last Name","First Name","Middle Name","Salutation","Suffix","Job Title","Job Title Hierarchy Level","Management Level","Job Start Date","Buying Committee","Job Function","Department","Company Division Name","Direct Phone Number","Email Address","Email Domain","Mobile phone","Last Job Change Type","Last Job Change Date","Previous Job Title","Previous Company Name","Previous Company ZoomInfo Company ID","Previous Company LinkedIn Profile","Highest Level of Education","Contact Accuracy Score","Contact Accuracy Grade","ZoomInfo Contact Profile URL","LinkedIn Contact Profile URL","Notice Provided Date","Person Street","Person City","Person State","Person Zip Code","Country","ZoomInfo Company ID","Company Name","Company Description","Website","Founded Year","Company HQ Phone","Fax","Ticker","Revenue (in 000s USD)","Revenue Range (in USD)","Est. Marketing Department Budget (in 000s USD)","Est. Finance Department Budget (in 000s USD)","Est. IT Department Budget (in 000s USD)","Est. HR Department Budget (in 000s USD)","Employees","Employee Range","Past 1 Year Employee Growth Rate","Past 2 Year Employee Growth Rate","SIC Code 1","SIC Code 2","SIC Codes","NAICS Code 1","NAICS Code 2","NAICS Codes","Primary Industry","Primary Sub-Industry","All Industries","All Sub-Industries","Industry Hierarchical Category","Secondary Industry Hierarchical Category","Alexa Rank","ZoomInfo Company Profile URL","LinkedIn Company Profile URL","Facebook Company Profile URL","Twitter Company Profile URL","Ownership Type","Business Model","Certified Active Company","Certification Date","Total Funding Amount (in 000s USD)","Recent Funding Amount (in 000s USD)","Recent Funding Round","Recent Funding Date","Recent Investors","All Investors","Company Street Address","Company City","Company State","Company Zip Code","Company Country","Full Address","Number of Locations","Query Name","created_date","Direct Phone Number_Country","Mobile phone_Country","db_file_name","Company HQ Phone_Country","File Name","Contact/Phone","Final Remarks","member_id","Project TAG","Full Name","Buying Group" """
        elif table_type == TableType.company:
            cols = """ "tbl_zoominfo_company_paid_id","ZoomInfo Company ID","Company Name","Website","Founded Year","Company HQ Phone","Fax","Ticker","Revenue (in 000s USD)","Revenue Range (in USD)","Employees","Employee Range","SIC Code 1","SIC Code 2","SIC Codes","NAICS Code 1","NAICS Code 2","NAICS Codes","Primary Industry","Primary Sub-Industry","All Industries","All Sub-Industries","Industry Hierarchical Category","Secondary Industry Hierarchical Category","Alexa Rank","ZoomInfo Company Profile URL","LinkedIn Company Profile URL","Facebook Company Profile URL","Twitter Company Profile URL","Ownership Type","Business Model","Certified Active Company","Certification Date","Defunct Company","Total Funding Amount (in 000s USD)","Recent Funding Amount (in 000s USD)","Recent Funding Round","Recent Funding Date","Recent Investors","All Investors","Company Street Address","Company City","Company State","Company Zip Code","Company Country","Full Address","Number of Locations","Company Is Acquired","Company ID (Ultimate Parent)","Entity Name (Ultimate Parent)","Company ID (Immediate Parent)","Entity Name (Immediate Parent)","Relationship (Immediate Parent)","Query Name","Company Description","db_file_name","created_date","Est. Marketing Department Budget (in 000s USD)","Est. Finance Department Budget (in 000s USD)","Est. IT Department Budget (in 000s USD)","Est. HR Department Budget (in 000s USD)","Past 1 Year Employee Growth Rate","Past 2 Year Employee Growth Rate","Company HQ Phone_Country","AFS Score Name","AFS Score","AFS Bucket" """
        
        
        query1 = text(f"""
                SELECT DISTINCT selected_cols
                FROM {table_name}
                WHERE employee_id = '{employee_id}' AND import_time = '{import_time}'
                """)
        columns = db.execute(query1, {"employee_id": employee_id, "import_time": import_time}).fetchall()
        column_names = [col[0] for col in columns]
        column_names_str = ', '.join(column_names)
        
        if table_type == TableType.contact:
            cols = ["domain", "first_name", "last_name", "linkedin_url", "zi_contact_id"]
        elif table_type == TableType.company:
            cols = ["domain", "company_name"]

# Convert list of columns to a comma-separated string
        cols_str = ", ".join(cols)
        
        query = text(f"""
        SELECT {cols_str}, {column_names_str}
        FROM {table_name}
        WHERE employee_id = '{employee_id}' AND import_time = '{import_time}'
        """)

        
        # Execute the query
        result = db.execute(query, {"employee_id": employee_id, "import_time": import_time}).fetchall()
        columns = [desc[0] for desc in db.execute(query, {"employee_id": employee_id, "import_time": import_time}).cursor.description]
        results.extend([dict(zip(columns, row)) for row in result])


    except Exception as e:
        print(f"An error occurred: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

    return JSONResponse(content={"results": results})
    
    

@app.get("/user/last-activities/")
async def get_last_activities(db: Session = Depends(get_db),table_type: TableType = Query(...)):
    employee_id = employee_id_store.get('employee_id')
    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee ID not found.")
    results = []
    try:
        # Determine the table name based on table_type
        if table_type == TableType.contact:
            table_name = 'tbl_zoominfo_contact_paid_log_records'
        elif table_type == TableType.company:
            table_name = 'tbl_zoominfo_company_paid_log_records'
        
        
        query = text(f"""
        SELECT employee_id, import_time, file_name, process_tag,count(1) cnt FROM {table_name}
        WHERE employee_id = :employee_id group by employee_id, import_time, file_name, process_tag ORDER BY import_time DESC
        """) 
        
        result = db.execute(query, {"employee_id": employee_id}).fetchall()
        # result = db.execute(query, {"employee_id": employee_id}).fetchall()
        columns = [desc[0] for desc in db.execute(query, {"employee_id": employee_id}).cursor.description]
        results.extend([dict(zip(columns, row)) for row in result])
        
        for record in results:
            record['download_link'] = f"/user/download-activity/?employee_id={employee_id}&import_time={record['import_time']}&table_type={table_type.value}"
        
        return results

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
