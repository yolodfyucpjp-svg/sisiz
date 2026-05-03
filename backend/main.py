"""
Eco-Trace AI - AI Calculation Engine Backend
FastAPI backend for ESG audit automation using STB ISO 14064 methodology.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from enum import Enum
from datetime import datetime, timedelta
import time
import logging
import hashlib
import secrets
import os
import pandas as pd
from jose import jwt, JWTError
import stripe

# Google Auth libraries (for real token verification)
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# ENUMS AND CONSTANTS
# =============================================================================

class EmissionScope(str, Enum):
    """GHG Protocol emission scopes."""
    SCOPE_1 = "Scope 1 (Direct)"
    SCOPE_2 = "Scope 2 (Indirect Energy)"
    SCOPE_3 = "Scope 3 (Value Chain)"
    UNCLASSIFIED = "Unclassified"

class GreenRating(str, Enum):
    """Green credit rating grades."""
    A_PLUS = "A+"
    A = "A"
    B_PLUS = "B+"
    B = "B"
    C_PLUS = "C+"
    C = "C"
    D = "D"
    F = "F"

# Emission factors (unchanged)
EMISSION_FACTORS = {
    "diesel_fuel": {"scope": EmissionScope.SCOPE_1, "category": "Energy", "factor": 2.68, "unit": "liter"},
    "gasoline": {"scope": EmissionScope.SCOPE_1, "category": "Transport", "factor": 2.31, "unit": "liter"},
    "natural_gas": {"scope": EmissionScope.SCOPE_1, "category": "Energy", "factor": 2.02, "unit": "m³"},
    "coal": {"scope": EmissionScope.SCOPE_1, "category": "Energy", "factor": 2.86, "unit": "kg"},
    "electricity_kwh": {"scope": EmissionScope.SCOPE_2, "category": "Energy", "factor": 0.40, "unit": "kWh"},
    "electricity_mwh": {"scope": EmissionScope.SCOPE_2, "category": "Energy", "factor": 400.0, "unit": "MWh"},
    "district_heating": {"scope": EmissionScope.SCOPE_2, "category": "Energy", "factor": 0.15, "unit": "kWh"},
    "logistics_road": {"scope": EmissionScope.SCOPE_3, "category": "Transport", "factor": 0.062, "unit": "ton-km"},
    "logistics_sea": {"scope": EmissionScope.SCOPE_3, "category": "Transport", "factor": 0.008, "unit": "ton-km"},
    "logistics_air": {"scope": EmissionScope.SCOPE_3, "category": "Transport", "factor": 0.60, "unit": "ton-km"},
    "business_travel_air": {"scope": EmissionScope.SCOPE_3, "category": "Transport", "factor": 0.255, "unit": "passenger-km"},
    "waste_landfill": {"scope": EmissionScope.SCOPE_3, "category": "Waste", "factor": 0.50, "unit": "kg"},
    "waste_recycling": {"scope": EmissionScope.SCOPE_3, "category": "Waste", "factor": 0.02, "unit": "kg"},
    "raw_materials_steel": {"scope": EmissionScope.SCOPE_3, "category": "Supply", "factor": 1.83, "unit": "kg"},
    "raw_materials_plastic": {"scope": EmissionScope.SCOPE_3, "category": "Supply", "factor": 2.0, "unit": "kg"},
    "raw_materials_paper": {"scope": EmissionScope.SCOPE_3, "category": "Supply", "factor": 0.94, "unit": "kg"},
}

CLASSIFICATION_KEYWORDS = {
    "diesel_fuel": ["diesel", "fuel", "fuel diesel"],
    "gasoline": ["gasoline", "petrol"],
    "natural_gas": ["natural gas", "gas"],
    "coal": ["coal"],
    "electricity_kwh": ["electricity", "kwh", "electricity kwh"],
    "electricity_mwh": ["mwh", "megawatt"],
    "district_heating": ["heating"],
    "logistics_road": ["logistics", "road", "trucking"],
    "logistics_sea": ["sea", "shipping"],
    "logistics_air": ["air freight", "air"],
    "business_travel_air": ["travel", "flight"],
    "waste_landfill": ["waste"],
    "waste_recycling": ["recycling"],
    "raw_materials_steel": ["steel", "raw", "materials"],
    "raw_materials_plastic": ["plastic"],
    "raw_materials_paper": ["paper"],
}

RATING_THRESHOLDS = [
    (0, 50, GreenRating.A_PLUS),
    (50, 100, GreenRating.A),
    (100, 200, GreenRating.B_PLUS),
    (200, 350, GreenRating.B),
    (350, 500, GreenRating.C_PLUS),
    (500, 750, GreenRating.C),
    (750, 1000, GreenRating.D),
    (1000, float("inf"), GreenRating.F),
]

# =============================================================================
# AUTH CONFIGURATION
# =============================================================================

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Mock user storage (in production, use a database)
USERS = {}

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class OneCItem(BaseModel):
    item_name: str
    amount: float = Field(..., gt=0)
    unit: Optional[str] = None
    cost: Optional[float] = None

class AnalysisRequest(BaseModel):
    company_id: str
    company_name: Optional[str] = None
    report_period: str
    currency: str = "USD"
    revenue_millions: Optional[float] = None
    expenses: List[OneCItem]

class EmissionBreakdown(BaseModel):
    name: str
    value: float
    color: str
    tons: float

class ScopeSummary(BaseModel):
    scope_name: str
    total_kg: float
    total_tons: float
    percentage: float
    categories: List[str]

class AnalysisResult(BaseModel):
    analysis_id: str
    status: Literal["completed", "processing", "failed"]
    timestamp: str
    company_id: str
    company_name: Optional[str]
    report_period: str
    total_co2_kg: float
    total_co2_tons: float
    co2_breakdown: List[EmissionBreakdown]
    scope_breakdown: List[ScopeSummary]
    green_rating: str
    rating_score: int
    carbon_intensity: float
    rating_description: str
    ai_insights: List[str]
    processing_time_ms: int
    confidence_score: float

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    id_token: str

class Sync1CRequest(BaseModel):
    company_id: str
    company_name: Optional[str] = None
    report_period: str
    expenses: List[OneCItem]

# =============================================================================
# FASTAPI APP
# =============================================================================

app = FastAPI(
    title="Eco-Trace AI - ESG Calculation Engine",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "https://eco-trace-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# CORE ENGINE (unchanged from original, included for completeness)
# =============================================================================

def classify_item(item_name: str) -> tuple[str, float]:
    item_lower = item_name.lower().strip()
    best_match = None
    best_score = 0.0
    for factor_key, keywords in CLASSIFICATION_KEYWORDS.items():
        for keyword in keywords:
            if keyword in item_lower:
                if item_lower == keyword:
                    return factor_key, 1.0
                score = len(keyword) / len(item_lower)
                if score > best_score:
                    best_score = score
                    best_match = factor_key
    return best_match, min(best_score + 0.3, 0.95) if best_match else (None, 0.0)

def calculate_green_rating(total_tons: float, revenue_millions: Optional[float]) -> dict:
    if revenue_millions and revenue_millions > 0:
        intensity = total_tons / revenue_millions
    else:
        intensity = total_tons / 10
    rating = GreenRating.F
    for min_val, max_val, r in RATING_THRESHOLDS:
        if min_val <= intensity < max_val:
            rating = r
            break
    normalized_score = max(0, min(100, 100 - (intensity / 10)))
    descriptions = {
        GreenRating.A_PLUS: "Excellent - Industry leader in sustainability",
        GreenRating.A: "Very good - Above average environmental performance",
        GreenRating.B_PLUS: "Good - Satisfactory carbon management",
        GreenRating.B: "Fair - Room for improvement",
        GreenRating.C_PLUS: "Below average - Significant improvements needed",
        GreenRating.C: "Poor - Major sustainability concerns",
        GreenRating.D: "Very poor - Substantial environmental impact",
        GreenRating.F: "Critical - Immediate action required",
    }
    return {
        "rating": rating.value,
        "carbon_intensity": round(intensity, 2),
        "normalized_score": int(normalized_score),
        "description": descriptions.get(rating, "Unknown")
    }

def generate_insights(breakdown: dict, scope_data: list) -> list:
    insights = []
    max_category = max(breakdown, key=lambda k: breakdown[k]["tons"])
    if max_category == "Energy":
        insights.append(f"Energy accounts for {breakdown['Energy']['percentage']:.1f}% of emissions. Consider renewable energy sourcing.")
    elif max_category == "Transport":
        insights.append(f"Transport represents {breakdown['Transport']['percentage']:.1f}% of footprint. Evaluate logistics optimization.")
    elif max_category == "Waste":
        insights.append(f"Waste emissions are at {breakdown['Waste']['percentage']:.1f}%. Implement circular economy practices.")
    scope_3 = next((s for s in scope_data if "Scope 3" in s["scope_name"]), None)
    if scope_3 and scope_3["percentage"] > 40:
        insights.append("Supply chain (Scope 3) is your largest impact area. Engage suppliers for joint reduction initiatives.")
    potential_reduction = breakdown["Energy"]["tons"] * 0.25
    insights.append(f"Potential reduction: {potential_reduction:.0f} tons CO2e by switching 25% to renewables.")
    return insights[:3]

def process_analysis(data: AnalysisRequest) -> AnalysisResult:
    start_time = time.time()
    category_emissions = {
        "Energy": {"kg": 0, "tons": 0},
        "Transport": {"kg": 0, "tons": 0},
        "Waste": {"kg": 0, "tons": 0},
        "Supply": {"kg": 0, "tons": 0},
        "Unclassified": {"kg": 0, "tons": 0},
    }
    scope_totals = {
        EmissionScope.SCOPE_1: {"kg": 0, "items": 0, "categories": set()},
        EmissionScope.SCOPE_2: {"kg": 0, "items": 0, "categories": set()},
        EmissionScope.SCOPE_3: {"kg": 0, "items": 0, "categories": set()},
        EmissionScope.UNCLASSIFIED: {"kg": 0, "items": 0, "categories": set()},
    }
    total_confidence = 0.0
    processed_count = 0
    for item in data.expenses:
        factor_key, confidence = classify_item(item.item_name)
        if factor_key and factor_key in EMISSION_FACTORS:
            ef_data = EMISSION_FACTORS[factor_key]
            emission_kg = item.amount * ef_data["factor"]
            category = ef_data["category"]
            if category in category_emissions:
                category_emissions[category]["kg"] += emission_kg
            scope = ef_data["scope"]
            scope_totals[scope]["kg"] += emission_kg
            scope_totals[scope]["items"] += 1
            scope_totals[scope]["categories"].add(category)
            total_confidence += confidence
            processed_count += 1
        else:
            scope_totals[EmissionScope.UNCLASSIFIED]["items"] += 1
    total_kg = sum(s["kg"] for s in scope_totals.values())
    total_tons = total_kg / 1000
    for cat in category_emissions:
        category_emissions[cat]["tons"] = category_emissions[cat]["kg"] / 1000
    co2_breakdown = []
    colors = {"Energy": "#0F5132", "Transport": "#1e8742", "Waste": "#3fb06a", "Supply": "#79c996", "Unclassified": "#9e9e9e"}
    for cat, data in category_emissions.items():
        if data["kg"] > 0:
            percentage = (data["kg"] / total_kg * 100) if total_kg > 0 else 0
            co2_breakdown.append({"name": cat, "value": round(percentage, 1), "color": colors.get(cat, "#999"), "tons": round(data["tons"], 2)})
    co2_breakdown.sort(key=lambda x: x["value"], reverse=True)
    scope_breakdown = []
    for scope, scope_data in scope_totals.items():
        if scope_data["kg"] > 0:
            percentage = (scope_data["kg"] / total_kg * 100) if total_kg > 0 else 0
            scope_breakdown.append({
                "scope_name": scope.value,
                "total_kg": round(scope_data["kg"], 2),
                "total_tons": round(scope_data["kg"] / 1000, 2),
                "percentage": round(percentage, 1),
                "categories": list(scope_data["categories"]),
            })
    rating_data = calculate_green_rating(total_tons, data.revenue_millions)
    insights = generate_insights(category_emissions, scope_breakdown)
    avg_confidence = (total_confidence / processed_count) if processed_count > 0 else 0.8
    processing_time = int((time.time() - start_time) * 1000)
    return AnalysisResult(
        analysis_id=f"ANALYSIS_{int(time.time())}_{data.company_id}",
        status="completed",
        timestamp=datetime.utcnow().isoformat(),
        company_id=data.company_id,
        company_name=data.company_name,
        report_period=data.report_period,
        total_co2_kg=round(total_kg, 2),
        total_co2_tons=round(total_tons, 2),
        co2_breakdown=co2_breakdown,
        scope_breakdown=scope_breakdown,
        green_rating=rating_data["rating"],
        rating_score=rating_data["normalized_score"],
        carbon_intensity=rating_data["carbon_intensity"],
        rating_description=rating_data["description"],
        ai_insights=insights,
        processing_time_ms=processing_time,
        confidence_score=round(avg_confidence, 2),
    )

# =============================================================================
# ANALYTICS STORAGE (in-memory for demo)
# =============================================================================

analysis_storage = {}

# =============================================================================
# AUTH ENDPOINTS
# =============================================================================

@app.post("/api/auth/login")
def login(request: LoginRequest):
    user = USERS.get(request.email)
    if not user or user.get('password') != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": request.email})
    return {"token": token, "user": {"email": request.email, "name": user.get('name')}}

@app.post("/api/auth/register")
def register(request: RegisterRequest):
    if request.email in USERS:
        raise HTTPException(status_code=400, detail="Email already registered")
    USERS[request.email] = {
        'password': request.password,
        'name': request.name or request.email.split('@')[0],
        'created_at': datetime.utcnow().isoformat()
    }
    token = create_access_token({"sub": request.email})
    USERS[request.email]['token'] = token
    return {"token": token, "user": {"email": request.email, "name": USERS[request.email]['name']}}

@app.post("/api/auth/google")
def google_login(request: GoogleLoginRequest):
    try:
        # For production, specify CLIENT_ID
        idinfo = google_id_token.verify_oauth2_token(
            request.id_token, google_requests.Request()
        )
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        if email not in USERS:
            USERS[email] = {
                'password': 'google_oauth',
                'name': name,
                'created_at': datetime.utcnow().isoformat()
            }
        token = create_access_token({"sub": email})
        USERS[email]['token'] = token
        return {"token": token, "user": {"email": email, "name": name}}
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

@app.get("/api/auth/me")
def get_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    email = payload.get("sub")
    user = USERS.get(email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {"email": email, "name": user.get('name')}

# =============================================================================
# CORE ANALYSIS ENDPOINT
# =============================================================================

@app.post("/api/analyze")
def analyze_1c_data(request: AnalysisRequest) -> AnalysisResult:
    logger.info(f"Starting analysis for company: {request.company_id}")
    try:
        result = process_analysis(request)
        # Store for later PDF download
        analysis_storage[result.analysis_id] = result
        logger.info(f"Analysis completed: {result.analysis_id}")
        return result
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/mock-data")
def get_mock_data():
    return {
        "company_id": "COMP_001",
        "company_name": "Eco Manufacturing Co.",
        "report_period": "2024-Q1",
        "revenue_millions": 5.5,
        "expenses": [
            {"item_name": "Electricity", "amount": 15000, "unit": "kWh", "cost": 1200},
            {"item_name": "Diesel Fuel", "amount": 2500, "unit": "liter", "cost": 1800},
            {"item_name": "Logistics Road", "amount": 50000, "unit": "ton-km", "cost": 3500},
            {"item_name": "Steel Raw Materials", "amount": 10000, "unit": "kg", "cost": 8000},
            {"item_name": "Business Flights", "amount": 15000, "unit": "passenger-km", "cost": 2200},
            {"item_name": "Waste Disposal", "amount": 5000, "unit": "kg", "cost": 500},
            {"item_name": "Natural Gas", "amount": 3000, "unit": "m³", "cost": 900},
        ]
    }

# =============================================================================
# FILE UPLOAD ENDPOINT (Excel 1C)
# =============================================================================

@app.post("/api/upload-1c")
async def upload_1c_excel(
    file: UploadFile = File(...),
    company_id: str = Form(...),
    report_period: str = Form(...),
    revenue_millions: Optional[float] = Form(None),
    company_name: Optional[str] = Form(None)
):
    """
    Upload an Excel file exported from 1C.
    Expected columns: item_name, amount, unit, cost (optional).
    """
    try:
        df = pd.read_excel(file.file)
        required_cols = ['item_name', 'amount']
        for col in required_cols:
            if col not in df.columns:
                raise HTTPException(400, f"Missing column: {col}")
        items = []
        for _, row in df.iterrows():
            items.append(OneCItem(
                item_name=str(row['item_name']),
                amount=float(row['amount']),
                unit=str(row.get('unit')) if pd.notna(row.get('unit')) else None,
                cost=float(row['cost']) if 'cost' in row and pd.notna(row['cost']) else None
            ))
        request = AnalysisRequest(
            company_id=company_id,
            company_name=company_name,
            report_period=report_period,
            revenue_millions=revenue_millions,
            expenses=items
        )
        result = process_analysis(request)
        analysis_storage[result.analysis_id] = result
        return result
    except Exception as e:
        logger.error(f"Excel upload failed: {str(e)}")
        raise HTTPException(500, f"Upload processing failed: {str(e)}")

# =============================================================================
# PDF REPORT (Fixed)
# =============================================================================

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

@app.get("/api/reports/{analysis_id}/pdf")
def download_report(analysis_id: str):
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(status_code=503, detail="PDF generation not available. Install reportlab.")
    result = analysis_storage.get(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    filename = f"ESG_Report_{analysis_id}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    story.append(Paragraph("ESG Audit Report", ParagraphStyle('Title', fontSize=24, spaceAfter=30)))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(f"Company: {result.company_name or result.company_id}", styles['Normal']))
    story.append(Paragraph(f"Report Period: {result.report_period}", styles['Normal']))
    story.append(Paragraph(f"Analysis ID: {result.analysis_id}", styles['Normal']))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(f"Green Rating: {result.green_rating}", ParagraphStyle(name='Rating', fontSize=18, textColor=colors.green)))
    story.append(Spacer(1, 1*cm))
    # Scope table
    table_data = [['Scope', 'Emissions (tons CO2e)', 'Percentage']]
    for scope in result.scope_breakdown:
        table_data.append([scope.scope_name, f"{scope.total_tons:.2f}", f"{scope.percentage:.1f}%"])
    table = Table(table_data, colWidths=[6*cm, 4*cm, 3*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
    ]))
    story.append(table)
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph("AI Insights:", styles['Heading2']))
    for insight in result.ai_insights:
        story.append(Paragraph(insight, styles['Normal']))
    doc.build(story)
    return FileResponse(filename, media_type='application/pdf', filename=f"ESG_Report_{result.analysis_id}.pdf")

# =============================================================================
# STRIPE CHECKOUT
# =============================================================================

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_...")
# Price IDs from Stripe Dashboard
PRICE_IDS = {
    "pro": os.getenv("STRIPE_PRICE_PRO", "price_demo_pro"),
    "enterprise": os.getenv("STRIPE_PRICE_ENTERPRISE", "price_demo_enterprise"),
}

@app.post("/api/create-checkout-session")
def create_checkout_session(plan: str = Form("pro")):
    if plan not in PRICE_IDS:
        raise HTTPException(400, "Invalid plan")
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': PRICE_IDS[plan],
                'quantity': 1,
            }],
            mode='subscription',
            success_url=os.getenv("SUCCESS_URL", "http://localhost:5173/success"),
            cancel_url=os.getenv("CANCEL_URL", "http://localhost:5173/pricing"),
        )
        return {"url": session.url}
    except Exception as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(500, "Payment session creation failed")

# =============================================================================
# 1C SYNC (API-Key protected)
# =============================================================================

API_KEYS = {
    os.getenv("API_KEY_DEMO", "demo-key-123"): {"name": "Demo Client", "scopes": ["read","write"]},
    os.getenv("API_KEY_PROD", "prod-key-456"): {"name": "Production Client", "scopes": ["read","write","admin"]},
}

def verify_api_key(api_key: str) -> Optional[dict]:
    return API_KEYS.get(api_key)

@app.post("/api/v1/sync-1c")
def sync_1c_data(request: Sync1CRequest, x_api_key: str = None):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key required")
    client = verify_api_key(x_api_key)
    if not client:
        raise HTTPException(status_code=401, detail="Invalid API key")
    logger.info(f"1C sync for {client['name']}: {request.company_id}")
    try:
        result = process_analysis(AnalysisRequest(
            company_id=request.company_id,
            company_name=request.company_name,
            report_period=request.report_period,
            expenses=request.expenses
        ))
        analysis_storage[result.analysis_id] = result
        return {"status": "success", "analysis": result}
    except Exception as e:
        logger.error(f"1C sync failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

# =============================================================================
# HEALTH ETC
# =============================================================================

@app.get("/")
def root():
    return {"service": "Eco-Trace AI", "status": "ok"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}