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
    match_domain: bool,
    match_linkedin_url: bool,
    match_zi_contact_id: bool,
    db: Session
):  
    filename = file.filename
    employee_id = employee_id_store.get('employee_id')
    # employee_id = 'E00860'
    employee_role_py = employee_role_store.get('employee_role')
    if not employee_id:
        return JSONResponse(content={"error": "Employee ID not found."}, status_code=400)

    df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')
    df = df.where(pd.notnull(df), None)

    # print(df)
    if not all(col in df.columns for col in ['domain', 'first_name', 'last_name', 'linkedin_url', 'zi_contact_id']):
        return JSONResponse(content={"error": "Missing required columns in the uploaded file."}, status_code=400)

    selected_columns = [col.strip() for col in selected_columns.split(',') if col.strip()]
    selected_columns = list(set(selected_columns))
    # print(selected_columns)
    if not selected_columns:
        return JSONResponse(content={"error": "No valid columns selected."}, status_code=400)

    results = []
    import_time = datetime.now()
    
    
    if 'domain' in df.columns:
        df['domain'] = df['domain'].apply(clean_url)
        
    clean_website_expr = "REPLACE (REPLACE (REPLACE (REPLACE (REPLACE (LOWER (\"Website\"),'https://',''),'https:/',''),'http://',''),'www.',''),'www','')"

    
    for _, row in df.iterrows():
        conditions = []
        params = {}
        if match_domain:
            # conditions.append("\"Website\" = :domain")
            conditions.append(f"{clean_website_expr} = :domain")
            params["domain"] = row['domain']
            conditions.append("LOWER(\"First Name\") = :first_name")
            params["first_name"] = row['first_name'].lower() if row['first_name'] is not None else None
            conditions.append("LOWER(\"Last Name\") = :last_name")
            params["last_name"] = row['last_name'].lower() if row['last_name'] is not None else None
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
        SELECT DISTINCT {select_columns} FROM tbl_zoominfo_contact_paid
        WHERE {where_clause}
        """
        # print({select_columns})
        try:
            result = db.execute(text(query).params(params)).fetchall()
            columns = [desc[0] for desc in db.execute(text(query).params(params)).cursor.description]
            for match in result:
                match_dict = dict(zip(columns, match))
                # Include the original uploaded data in the result
                combined_result = {**dict(row), **match_dict}

                # Replace NaN with None for JSON compatibility
                combined_result = {k: (None if pd.isna(v) else v) for k, v in combined_result.items()}

                results.append(combined_result)
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
            db_columns_query = f"""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'tbl_zoominfo_company_paid'
            ORDER BY ordinal_position
            """
            ordered_columns = [row[0] for row in db.execute(text(db_columns_query)).fetchall()]

            # Sort selected_columns based on the database order
            selected_columns_sorted = [col for col in ordered_columns if col in selected_columns]
            
            df_export['import_time'] = import_time
            df_export['employee_id'] = employee_id
            df_export['file_name'] = filename
            if set(selected_columns) == {'Email Address', 'LinkedIn Contact Profile URL', 'Website', 'ZoomInfo Contact ID', 'First Name', 'Last Name'} and employee_role_py == 'user_a':
                df_export['process_tag'] = 'Export - Email'
            elif set(selected_columns) == {'ZoomInfo Contact ID', 'First Name', 'Last Name', 'Website', 'LinkedIn Contact Profile URL', 'Mobile phone', 'Direct Phone Number', 'Company HQ Phone'} and employee_role_py == 'user_a':
                df_export['process_tag'] = 'Export - Phone'
            elif employee_role_py == 'user_b':
                df_export['process_tag'] = 'Export - All'
            df_export['selected_cols'] = ', '.join(f"\"{col}\"" for col in selected_columns_sorted)
            df_export['domain'] = [result.get('domain', None) for result in results]
            df_export['first_name'] = [result.get('first_name', None) for result in results]
            df_export['last_name'] = [result.get('last_name', None) for result in results]
            df_export['linkedin_url'] = [result.get('linkedin_url', None) for result in results]
            df_export['zi_contact_id'] = [result.get('zi_contact_id', None) for result in results]
            df_export.to_sql('tbl_zoominfo_contact_paid_log_records', db.get_bind(), if_exists='append', index=False)
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
    # employee_id = 'E00860'
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
    
    if 'domain' in df.columns:
        df['domain'] = df['domain'].apply(clean_url)
        
    clean_website_expr = "REPLACE (REPLACE (REPLACE (REPLACE (REPLACE (LOWER (\"Website\"),'https://',''),'https:/',''),'http://',''),'www.',''),'www','')"


    for _, row in df.iterrows():
        conditions = []
        params = {}
        if match_domain:
            conditions.append(f"{clean_website_expr} = :domain")
            params["domain"] = row['domain']
        if match_company_name:
            conditions.append("LOWER(\"Company Name\") = :company_name")
            params["company_name"] = row['company_name'].lower() if row['company_name'] is not None else None
            
        if not conditions:
            conditions.append("0=1")

        where_clause = " AND ".join(conditions)
        select_columns = ', '.join(f"\"{col}\"" for col in selected_columns) or '*'

        query = f"""
        SELECT DISTINCT {select_columns} FROM tbl_zoominfo_company_paid
        WHERE {where_clause}
        """
        
        try:
            result = db.execute(text(query).params(params)).fetchall()
            columns = [desc[0] for desc in db.execute(text(query).params(params)).cursor.description]
            for match in result:
                match_dict = dict(zip(columns, match))
                combined_result = {**dict(row), **match_dict}

                # Replace NaN with None for JSON compatibility
                combined_result = {k: (None if pd.isna(v) else v) for k, v in combined_result.items()}

                results.append(combined_result)
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
            db_columns_query = f"""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'tbl_zoominfo_company_paid'
            ORDER BY ordinal_position
            """
            ordered_columns = [row[0] for row in db.execute(text(db_columns_query)).fetchall()]

            # Sort selected_columns based on the database order
            selected_columns_sorted = [col for col in ordered_columns if col in selected_columns]

            df_export['import_time'] = import_time
            df_export['employee_id'] = employee_id
            df_export['file_name'] = filename
            df_export['process_tag'] = 'Export - All'
            df_export['selected_cols'] = ', '.join(f"\"{col}\"" for col in selected_columns_sorted)
            df_export['domain'] = [result.get('domain', None) for result in results]
            df_export['company_name'] = [result.get('company_name', None) for result in results]
            df_export.to_sql('tbl_zoominfo_company_paid_log_records', db.get_bind(), if_exists='append', index=False)
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
    files: List[UploadFile] = File(...),
):  
    employee_id = employee_id_store.get('employee_id')
    if not employee_id:
        return JSONResponse(content={"error": "Employee ID not found."}, status_code=400)
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

        # print(data)
        # Filter columns that are present in the table
        data = data[[col for col in data.columns if col in table_columns]]
        
        # Insert data into the database
        data = data.where(pd.notna(data), None)  # Replace NaNs with None

        temp_csv_path = os.path.join(UPLOAD_FOLDER, f'temp_{file.filename}')
        data.to_csv(temp_csv_path, index=False, header=False, encoding='utf-8')
        import_time = datetime.now()
        columns = ', '.join(f'"{col}"' for col in data.columns)
        copy_query = f"COPY {table_name} ({columns}) FROM STDIN WITH (FORMAT CSV, HEADER FALSE)"
        # print(columns)
        with open(temp_csv_path, 'r', encoding='utf-8') as f:
            cursor.copy_expert(copy_query, f)
        
        conn.commit()
        os.remove(temp_csv_path)

        records_inserted = len(data)
        total_records_inserted += records_inserted
        file_messages.append(f"File '{file.filename}': {records_inserted} records inserted.")

        if table_type == TableType.contact:
            table_name = 'tbl_zoominfo_contact_paid_log_records'
        elif table_type == TableType.company:
            table_name = 'tbl_zoominfo_company_paid_log_records'
        # print(columns)
        try:
            data['import_time'] = import_time
            data['employee_id'] = employee_id
            data['file_name'] = file.filename
            data['process_tag'] = 'Import'
            data['selected_cols'] = columns
            if table_type == TableType.company:
                data['domain'] = None
                data['company_name'] = None
            elif table_type == TableType.contact:
                data['domain'] = None
                data['first_name'] = None
                data['last_name'] = None
                data['linkedin_url'] = None
                data['zi_contact_id'] = None
            
            data.to_sql(table_name, engine, if_exists='append', index=False)
        except Exception as e:
            print(f"An error occurred while inserting export records: {e}")
            return JSONResponse(content={"error": str(e)}, status_code=500)
        # Log the upload event
        log_query = """
            INSERT INTO tbl_audit_lookup_log (data_point, file_name, count)
            VALUES (%s, %s, %s)
        """
        cursor.execute(log_query, (table_type, file.filename, records_inserted))
        conn.commit()

    cursor.close()
    conn.close()

    return JSONResponse(content={"message": f"{total_records_inserted} records imported successfully.", "file_messages": file_messages})



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