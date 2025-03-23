'''fastAPI app to connect the C++ backend to a React frontend'''
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import subprocess
import uuid
import os
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
EXTRACTIFY_PATH = "./extractify"

# ensure upload folder exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/process-csv/")
async def process_csv(
    files: List[UploadFile] = File(...),
    columns: list[str] = Form(...),
    combine: bool = Form(False),
    combineKey: str = Form(""),
    combineValues: List[str] = Form([])
):
    results = []
    for file in files:
        try:
            # save uploaded file to disk
            file_id = str(uuid.uuid4())
            filename = f'{UPLOAD_DIR}/{file_id}_{file.filename}'
            with open(filename, "wb") as f:
                shutil.copyfileobj(file.file, f)
            
            # build argument list for cpp program
            args = [EXTRACTIFY_PATH, filename]
            args.extend(columns)

            if combine:
                args.append(f'*{combineKey}')
                for val in combineValues:
                    args.append(f'*{val}')

            # run cpp program and capture output
            result = subprocess.run(args, capture_output=True, text=True)

            if result.returncode != 0:
                return results.append({
                    "filename": file.filename,
                    "error": result.stderr
                })
                continue
            
            # split cpp output
            normal_section, combined_section = result.stdout.split("Combined Table") if "Combined Table" in result.stdout else (result.stdout, "")

            def parse_table(section):
                '''takes output from cpp backend and strips it down into headers and rows for JSON'''
                lines = section.strip().splitlines()
                if len(lines) < 3:
                    return {"headers": [], "rows": []}
                headers = [h.strip() for h in lines[0].split()]
                rows = []
                for line in lines[2:]:
                    if line.startswith("Row count"):
                        break
                    row = line.strip().split()
                    rows.append(row)
                return {"headers": headers, "rows": rows}

            results.append ({
                "filename": file.filename,
                "normal": parse_table(normal_section),
                "combined": parse_table(combined_section) if combined_section else {"headers": [], "rows": []}
            })

        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e)
            })
    
    return results