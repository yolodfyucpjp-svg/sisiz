"""
Eco-Trace AI - AI Calculation Engine Backend
FastAPI backend for ESG audit automation using STB ISO 14064 methodology.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from enum import Enum
from datetime import datetime
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

# STB ISO 14064 Compliant Emission Factors (kg CO2e per unit)
# Sources: IEA, EPA, Defra, GHG Protocol
EMISSION_FACTORS = {
    # Scope 1 - Direct emissions
    "diesel_fuel": {
        "scope": EmissionScope.SCOPE_1,
        "category": "Energy",
        "factor": 2.68,
        "unit": "liter"
    },
    "gasoline": {
        "scope": EmissionScope.SCOPE_1,
        "category": "Transport",
        "factor": 2.31,
        "unit": "liter"
    },
    "natural_gas": {
        "scope": EmissionScope.SCOPE_1,
        "category": "Energy",
        "factor": 2.02,
        "unit": "m?"
    },
    "coal": {
        "scope": EmissionScope.SCOPE_1,
        "category": "Energy",
        "factor": 2.86,
        "unit": "kg"
    },
    
    # Scope 2 - Indirect emissions
    "electricity_kwh": {
        "scope": EmissionScope.SCOPE_2,
        "category": "Energy",
        "factor": 0.40,
        "unit": "kWh"
    },
    "electricity_mwh": {
        "scope": EmissionScope.SCOPE_2,
        "category": "Energy",
        "factor": 400.0,
        "unit": "MWh"
    },
    "district_heating": {
        "scope": EmissionScope.SCOPE_2,
        "category": "Energy",
        "factor": 0.15,
        "unit": "kWh"
    },
    
    # Scope 3 - Value chain
    "logistics_road": {
        "scope": EmissionScope.SCOPE_3,
        "category": "Transport",
        "factor": 0.062,
        "unit": "ton-km"
    },
    "logistics_sea": {
        "scope": EmissionScope.SCOPE_3,
        "category": "Transport",
        "factor": 0.008,
        "unit": "ton-km"
    },
    "logistics_air": {
        "scope": EmissionScope.SCOPE_3,
        "category": "Transport",
        "factor": 0.60,
        "unit": "ton-km"
    },
    "business_travel_air": {
        "scope": EmissionScope.SCOPE_3,
        "category": "Transport",
        "factor": 0.255,
        "unit": "passenger-km"
    },
    "waste_landfill": {
        "scope": EmissionScope.SCOPE_3,
        "category": "Waste",
        "factor": 0.50,
        "unit": "kg"
    },
    "waste_recycling": {
        "scope": EmissionScope.SCOPE_3,
        "category": "Waste",
        "factor": 0.02,
        "unit": "kg"
    },
    "raw_materials_steel": {
        "scope": EmissionScope.SCOPE_3,
        "category": "Supply",
        "factor": 1.83,
        "unit": "kg"
    },
    "raw_materials_plastic": {
        "scope": EmissionScope.SCOPE_3,
        "category": "Supply",
        "factor": 2.0,
        "unit": "kg"
    },
    "raw_materials_paper": {
        "scope": EmissionScope.SCOPE_3,
        "category": "Supply",
        "factor": 0.94,
        "unit": "kg"
    },
}

# AI Classification keywords (heuristic matching)
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

# Green Rating thresholds (tons CO2e per $1M revenue)
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
# PYDANTIC MODELS
# =============================================================================

class OneCItem(BaseModel):
    """1C Enterprise accounting export item."""
    item_name: str = Field(..., description="Item name from 1C")
    amount: float = Field(..., gt=0, description="Quantity/value")
    unit: Optional[str] = Field(None, description="Unit of measurement")
    cost: Optional[float] = Field(None, description="Cost in local currency")


class AnalysisRequest(BaseModel):
    """Request for ESG analysis."""
    company_id: str = Field(..., description="Company identifier")
    company_name: Optional[str] = Field(None, description="Company name")
    report_period: str = Field(..., description="Period e.g., '2024-Q1'")
    currency: str = Field("USD")
    revenue_millions: Optional[float] = Field(None, description="Revenue for rating")
    expenses: List[OneCItem] = Field(..., min_items=1, description="1C expense data")


class EmissionBreakdown(BaseModel):
    """Emissions by category for Recharts."""
    name: str
    value: float  # percentage
    color: str
    tons: float   # absolute value


class ScopeSummary(BaseModel):
    """Summary per scope."""
    scope_name: str
    total_kg: float
    total_tons: float
    percentage: float
    categories: List[str]


class AnalysisResult(BaseModel):
    """Complete analysis response matching frontend expectations."""
    analysis_id: str
    status: Literal["completed", "processing", "failed"]
    timestamp: str
    company_id: str
    company_name: Optional[str]
    report_period: str
    
    # Totals
    total_co2_kg: float
    total_co2_tons: float
    
    # CO2 Emissions Breakdown by category (matches co2Data)
    co2_breakdown: List[EmissionBreakdown]
    
    # GHG Protocol Scopes
    scope_breakdown: List[ScopeSummary]
    
    # Green Rating
    green_rating: str
    rating_score: int  # 0-100
    carbon_intensity: float
    rating_description: str
    
    # Insights
    ai_insights: List[str]
    
    # Processing metadata
    processing_time_ms: int
    confidence_score: float


# =============================================================================
# FASTAPI APP SETUP
# =============================================================================

app = FastAPI(
    title="Eco-Trace AI - ESG Calculation Engine",
    description="AI-powered ESG audit and carbon footprint calculation API",
    version="1.0.0",
    docs_url="/docs",
)

# CORS for React frontend (localhost:5173, 5174, etc.)
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
# AI CALCULATION ENGINE
# =============================================================================

def classify_item(item_name: str) -> tuple[str, float]:
    """
    AI-style classification using keyword heuristics.
    Returns (factor_key, confidence_score).
    """
    item_lower = item_name.lower().strip()
    best_match = None
    best_score = 0.0
    
    for factor_key, keywords in CLASSIFICATION_KEYWORDS.items():
        for keyword in keywords:
            if keyword in item_lower:
                # Exact match gets higher score
                if item_lower == keyword:
                    return factor_key, 1.0
                # Partial match scoring
                score = len(keyword) / len(item_lower)
                if score > best_score:
                    best_score = score
                    best_match = factor_key
    
    return best_match, min(best_score + 0.3, 0.95) if best_match else (None, 0.0)


def calculate_green_rating(total_tons: float, revenue_millions: Optional[float]) -> dict:
    """Calculate green credit rating based on carbon intensity."""
    if revenue_millions and revenue_millions > 0:
        intensity = total_tons / revenue_millions
    else:
        # Default intensity for companies without revenue data
        intensity = total_tons / 10  # Assume $10M default revenue
    
    rating = GreenRating.F
    for min_val, max_val, r in RATING_THRESHOLDS:
        if min_val <= intensity < max_val:
            rating = r
            break
    
    # Calculate normalized score (0-100)
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
    """Generate AI insights based on emissions data."""
    insights = []
    
    # Get primary category
    max_category = max(breakdown, key=lambda k: breakdown[k]["tons"])
    
    if max_category == "Energy":
        insights.append(f"Energy accounts for {(breakdown['Energy']['percentage']):.1f}% of emissions. Consider renewable energy sourcing.")
    elif max_category == "Transport":
        insights.append(f"Transport represents {(breakdown['Transport']['percentage']):.1f}% of footprint. Evaluate logistics optimization.")
    elif max_category == "Waste":
        insights.append(f"Waste emissions are at {(breakdown['Waste']['percentage']):.1f}%. Implement circular economy practices.")
    
    # Scope 3 insight
    scope_3 = next((s for s in scope_data if "Scope 3" in s["scope_name"]), None)
    if scope_3 and scope_3["percentage"] > 40:
        insights.append("Supply chain (Scope 3) is your largest impact area. Engage suppliers for joint reduction initiatives.")
    
    # Reduction estimate
    potential_reduction = breakdown["Energy"]["tons"] * 0.25  # 25% potential
    insights.append(f"Potential reduction: {potential_reduction:.0f} tons CO2e by switching 25% to renewables.")
    
    return insights[:3]  # Return top 3


def process_analysis(data: AnalysisRequest) -> AnalysisResult:
    """
    Main AI calculation engine.
    Implements E = sum(A_i * EF_i) per STB ISO 14064.
    """
    start_time = time.time()
    
    # Initialize accumulators
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
    
    # Process each expense item
    for item in data.expenses:
        factor_key, confidence = classify_item(item.item_name)
        
        if factor_key and factor_key in EMISSION_FACTORS:
            ef_data = EMISSION_FACTORS[factor_key]
            emission_kg = item.amount * ef_data["factor"]
            
            # Add to category totals
            category = ef_data["category"]
            if category in category_emissions:
                category_emissions[category]["kg"] += emission_kg
            
            # Add to scope totals
            scope = ef_data["scope"]
            scope_totals[scope]["kg"] += emission_kg
            scope_totals[scope]["items"] += 1
            scope_totals[scope]["categories"].add(category)
            
            total_confidence += confidence
            processed_count += 1
        else:
            # Unclassified - default to Scope 3 assumption
            scope_totals[EmissionScope.UNCLASSIFIED]["items"] += 1
    
    # Calculate totals
    total_kg = sum(s["kg"] for s in scope_totals.values())
    total_tons = total_kg / 1000
    
    # Convert kg to tons for categories
    for cat in category_emissions:
        category_emissions[cat]["tons"] = category_emissions[cat]["kg"] / 1000
    
    # Calculate percentages and create breakdown
    co2_breakdown = []
    colors = {
        "Energy": "#0F5132",
        "Transport": "#1e8742",
        "Waste": "#3fb06a",
        "Supply": "#79c996",
        "Unclassified": "#9e9e9e",
    }
    
    for cat, data in category_emissions.items():
        if data["kg"] > 0:
            percentage = (data["kg"] / total_kg * 100) if total_kg > 0 else 0
            co2_breakdown.append({
                "name": cat,
                "value": round(percentage, 1),
                "color": colors.get(cat, "#999"),
                "tons": round(data["tons"], 2),
            })
    
    # Sort by value descending
    co2_breakdown.sort(key=lambda x: x["value"], reverse=True)
    
    # Create scope breakdown
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
    
    # Calculate green rating
    rating_data = calculate_green_rating(total_tons, data.revenue_millions)
    
    # Generate insights
    insights = generate_insights(category_emissions, scope_breakdown)
    
    # Calculate confidence
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
# API ENDPOINTS
# =============================================================================

@app.get("/")
def root():
    return {
        "service": "Eco-Trace AI - ESG Calculation Engine",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@app.post("/api/analyze")
def analyze_1c_data(request: AnalysisRequest) -> AnalysisResult:
    """
    Analyze 1C Enterprise accounting data and calculate carbon footprint.
    
    The endpoint:
    1. Classifies each expense item into GHG Protocol scopes
    2. Applies STB ISO 14064 emission factors
    3. Calculates total CO2 emissions
    4. Generates green credit rating
    5. Provides AI insights
    
    Request body should contain 1C export data with expense items.
    """
    logger.info(f"Starting analysis for company: {request.company_id}")
    
    try:
        result = process_analysis(request)
        logger.info(f"Analysis completed: {result.analysis_id}")
        return result
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# =============================================================================
# MOCK DATA ENDPOINT (for testing)
# =============================================================================

@app.get("/api/mock-data")
def get_mock_data():
    """Generate sample 1C data for testing."""
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
            {"item_name": "Natural Gas", "amount": 3000, "unit": "m?", "cost": 900},
        ]
    }


# =============================================================================
# AUTHENTICATION (Mock JWT)
# =============================================================================

# Mock user storage (in production, use a database)
USERS = {}

def create_jwt_token(email: str) -> str:
    """Create a simple JWT-like token."""
    payload = f"{email}:{int(time.time())}"
    return hashlib.sha256(payload.encode()).hexdigest()[:32]

def verify_token(token: str) -> Optional[str]:
    """Verify token and return email if valid."""
    for email, user in USERS.items():
        if user.get('token') == token:
            return email
    return None

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    id_token: str

@app.post("/api/auth/login")
def login(request: LoginRequest):
    """Mock login endpoint."""
    if request.email in USERS and USERS[request.email].get('password') == request.password:
        token = create_jwt_token(request.email)
        USERS[request.email]['token'] = token
        return {"token": token, "user": {"email": request.email, "name": USERS[request.email].get('name', request.email.split('@')[0])}}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/auth/register")
def register(request: RegisterRequest):
    """Mock registration endpoint."""
    if request.email in USERS:
        raise HTTPException(status_code=400, detail="Email already registered")
    USERS[request.email] = {
        'password': request.password,
        'name': request.name or request.email.split('@')[0],
        'created_at': datetime.utcnow().isoformat()
    }
    token = create_jwt_token(request.email)
    USERS[request.email]['token'] = token
    return {"token": token, "user": {"email": request.email, "name": USERS[request.email].get('name')}}

@app.post("/api/auth/google")
def google_login(request: GoogleLoginRequest):
    """Mock Google OAuth endpoint."""
    # In production, verify the ID token with Google
    email = f"user+{secrets.token_hex(4)}@google.com"
    if email not in USERS:
        USERS[email] = {
            'password': 'google_oauth',
            'name': 'Google User',
            'created_at': datetime.utcnow().isoformat()
        }
    token = create_jwt_token(email)
    USERS[email]['token'] = token
    return {"token": token, "user": {"email": email, "name": "Google User"}}

@app.get("/api/auth/me")
def get_user(request: Request):
    """Get current user from token."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        email = verify_token(token)
        if email and email in USERS:
            return {"email": email, "name": USERS[email].get('name')}
    raise HTTPException(status_code=401, detail="Invalid token")

# =============================================================================
# 1C SYNC ENDPOINT (API-key protected)
# =============================================================================

API_KEYS = {
    "demo-key-123": {"name": "Demo Client", "scopes": ["read", "write"]},
    "prod-key-456": {"name": "Production Client", "scopes": ["read", "write", "admin"]},
}

def verify_api_key(api_key: str) -> Optional[dict]:
    """Verify API key and return client info."""
    return API_KEYS.get(api_key)

class Sync1CRequest(BaseModel):
    company_id: str
    company_name: Optional[str] = None
    report_period: str
    expenses: List[OneCItem]

@app.post("/api/v1/sync-1c")
def sync_1c_data(request: Sync1CRequest, x_api_key: str = None):
    """1C Enterprise sync endpoint with API-key authentication."""
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
        return {"status": "success", "analysis": result}
    except Exception as e:
        logger.error(f"1C sync failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

# =============================================================================
# PDF REPORT GENERATION
# =============================================================================

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logger.warning("reportlab not installed. PDF generation disabled.")

@app.get("/api/reports/{analysis_id}/pdf")
def download_report(analysis_id: str):
    """Generate and download ESG audit PDF report."""
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(status_code=503, detail="PDF generation not available. Install reportlab: pip install reportlab")
    
    # In production, fetch analysis data from database
    # For now, use mock data
    mock_report = {
        "company_name": "Eco Manufacturing Co.",
        "report_period": "2024-Q1",
        "total_co2_tons": 2847,
        "green_rating": "A+",
        "scope_breakdown": [
            {"scope_name": "Scope 1 (Direct)", "total_tons": 854.25, "percentage": 30},
            {"scope_name": "Scope 2 (Indirect)", "total_tons": 1139, "percentage": 40},
            {"scope_name": "Scope 3 (Value Chain)", "total_tons": 854.25, "percentage": 30},
        ],
        "ai_insights": [
            "Energy accounts for 42% of emissions. Consider renewable energy sourcing.",
            "Supply chain (Scope 3) is your largest impact area.",
            "Potential reduction: 299 tons CO2e by switching 25% to renewables.",
        ]
    }
    
    filename = f"ESG_Report_{analysis_id}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4)
    styles = getSampleStyleSheet()
    
    story = []
    story.append(Paragraph("ESG Audit Report", ParagraphStyle(name='Title', fontSize=24, spaceAfter=30)))
    story.append(Spacer(1, 1*cm))
    
    # Company info
    story.append(Paragraph(f"Company: {mock_report['company_name']}", styles['Normal']))
    story.append(Paragraph(f"Report Period: {mock_report['report_period']}", styles['Normal']))
    story.append(Paragraph(f"Analysis ID: {analysis_id}", styles['Normal']))
    story.append(Spacer(1, 1*cm))
    
    # Rating
    story.append(Paragraph(f"Green Rating: {mock_report['green_rating']}", ParagraphStyle(name='Rating', fontSize=18, textColor=colors.green)))
    story.append(Spacer(1, 1*cm))
    
    # Scope breakdown table
    data = [['Scope', 'Emissions (tons CO2e)', 'Percentage']]
    for scope in mock_report['scope_breakdown']:
        data.append([scope['scope_name'], f"{scope['total_tons']:.2f}", f"{scope['percentage']:.1f}%"])
    
    table = Table(data, colWidths=[6*cm, 4*cm, 3*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
        ('TEXTCOLOR', (0, 0), (-
TOOL_NAME: run_terminal_command
BEGIN_ARG: command
"cd eco-trace-ai"
END_ARG