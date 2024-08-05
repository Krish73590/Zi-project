from fastapi import FastAPI, File, UploadFile, Form, Query
from pydantic import BaseModel
from typing import List, Optional
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/user-type/")
async def get_user_type():
    # Replace with logic to get user type
    return {"user_type": "User A"}  # or "User B"

@app.get("/columns/")
async def get_columns():
    # Replace with logic to fetch column names
    return {"columns": ["Column1", "Column2", "Column3"]}

@app.post("/upload/user-a/")
async def upload_user_a(file: UploadFile = File(...), selected_columns: str = Form(...),
                        match_domain: bool = Form(...), match_first_name: bool = Form(...),
                        match_last_name: bool = Form(...)):
    # Handle file processing and return matched results
    return JSONResponse(content={"matches": []})

@app.post("/upload/user-b/")
async def upload_user_b(file: UploadFile = File(...), selected_columns: str = Form(...),
                        match_domain: bool = Form(...), match_first_name: bool = Form(...),
                        match_last_name: bool = Form(...)):
    # Handle file processing and return matched results
    return JSONResponse(content={"matches": []})
