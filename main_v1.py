from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import pandas as pd
from io import BytesIO
import mycred as mc

# Database setup
DATABASE_URL = f"postgresql://{mc.user}:{mc.password}@{mc.host}:{mc.port}/{mc.dbname}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()

@app.post("/upload/")
async def upload_file(
    file: UploadFile = File(...),
    match_domain: bool = Form(False),
    match_first_name: bool = Form(False),
    match_last_name: bool = Form(False)
):
    # Read the uploaded Excel file
    df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')

    # Replace NaN values with None
    df = df.where(pd.notnull(df), None)
    print(df)
    
    if not all(col in df.columns for col in ['domain', 'first_name', 'last_name']):
        return JSONResponse(content={"error": "Missing required columns in the uploaded file."}, status_code=400)

    results = []

    with SessionLocal() as session:
        for _, row in df.iterrows():
            domain_condition = f"\"Website\" = :domain" if match_domain else "1=1"
            first_name_condition = f"\"First Name\" = :first_name" if match_first_name else "1=1"
            last_name_condition = f"\"Last Name\" = :last_name" if match_last_name else "1=1"
            
            query = f"""
            SELECT * FROM tbl_zoominfo_contact_paid
            WHERE {domain_condition} AND {first_name_condition} AND {last_name_condition}
            """
            
            params = {
                "domain": row['domain'],
                "first_name": row['first_name'],
                "last_name": row['last_name']
            }
            
            try:
                result = session.execute(text(query), params).fetchall()

                if result:
                    # Get column names from the result
                    columns = result[0].keys() if hasattr(result[0], 'keys') else range(len(result[0]))

                    # Convert result tuples to dictionaries
                    results.extend([dict(zip(columns, row)) for row in result])
                else:
                    # No results, still return an empty list
                    results.extend([])
                
            except Exception as e:
                print(f"An error occurred: {e}")
                return JSONResponse(content={"error": str(e)}, status_code=500)

    return {"matches": results}
