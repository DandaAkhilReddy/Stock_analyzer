# PAIS Sea Turtle Nesting: Mobile LiDAR Thesis Research Framework

**Master's Thesis Research | TAMU-CC | 2024-2026**

Comprehensive HTML documentation suite for Mobile LiDAR-based conservation research at **Padre Island National Seashore (PAIS)**. This framework supports the transition from laboratory egg incubation to **in-situ (natural) nesting** by identifying safe zones using twice-yearly MLS surveys.

## 🎯 Project Overview

**Title:** "Investigating Impacts of Sea Level Rise on Sea Turtle Nesting Management at Padre Island National Seashore"

**Collaboration:**
- Dr. Donna Shaver (PAIS Sea Turtle Biologist)
- Dr. Michael Starek (TAMU-CC Remote Sensing)

**Timeline:** 2024-2026 | Twice-yearly MLS surveys (May-June nesting, August-September hatching)

## 📚 Main Documentation

### **Primary Framework** (Updated with RA Project Context)

1. **[Main Index](MLS-PAIS-Thesis-Index.html)** - Navigation hub with project overview
2. **[Literature Review](MLS-PAIS-Literature-Review.html)** - 2018-2025 research synthesis
   - Seasonal beach morphology and nesting success
   - In-situ vs ex-situ incubation outcomes
   - Vehicle impact on coastal morphology
   - Nest elevation preferences
   - Multi-temporal stability methods
3. **[5 Thesis Ideas](MLS-PAIS-Thesis-Ideas.html)** - Concrete, actionable research directions
   - ⭐ Thesis Idea 1: Seasonal Stability Mapping (RECOMMENDED)
   - Thesis Idea 2: Vehicle Access Impact Analysis
   - Thesis Idea 3: Nest Elevation Preference Study
   - Thesis Idea 4: Multi-Year Habitat Persistence Index
   - Thesis Idea 5: SLR Threshold Exceedance Mapping
4. **[Implementation Guide](MLS-PAIS-Implementation-Guide.html)** - Step-by-step ArcGIS Pro workflows
   - 90-minute quick start guide
   - Ready-to-run Raster Calculator scripts
   - Extract to Points, Zonal Statistics procedures
   - Troubleshooting common issues
5. **[Expected Outputs](MLS-PAIS-Expected-Outputs.html)** - Management-ready deliverables
   - 8-12 maps (stability classifications, vehicle corridors, SLR scenarios)
   - 6-10 data tables
   - 5-8 charts/graphs
   - 4-semester timeline

### **Original Exploration Files** (Initial Framework)

6. **[Original Index](MLS-Thesis-Index.html)** - Initial navigation hub
7. **[Original Literature Review](MLS-Literature-Review.html)** - Broader MLS coastal applications
8. **[Knowledge Gaps](MLS-Knowledge-Gaps.html)** - 8 identified research opportunities
9. **[Thesis Directions (1-3)](MLS-Thesis-Directions.html)** - First 3 directions detailed
10. **[Comparison & Recommendations](MLS-Comparison-Recommendations.html)** - Directions 4-5 + comparison matrix
11. **[Survey Optimization](MLS-Survey-Optimization.html)** - 2026 field campaign guide
12. **[Updated Directions](MLS-NEW-Thesis-Directions-Updated.html)** - Revised with RA context

## 🚀 Quick Start

### View Locally
1. Clone this repository
2. Open `MLS-PAIS-Thesis-Index.html` in your browser
3. Navigate through the linked documents

### View Online
🌐 **Live Website:** [https://pais-thesis-deployment-5spipy5wy.vercel.app](https://pais-thesis-deployment-5spipy5wy.vercel.app)

## 🎯 Key Features

✅ **5 ready-to-start thesis ideas** with complete workflows  
✅ **No coding required** - All ArcGIS Pro GUI-based tools  
✅ **Management-focused outputs** - Safe zone identification maps  
✅ **Literature-grounded** - Backed by 2018-2025 research  
✅ **Twice-yearly survey advantage** - May→August seasonal stability  

## 🔬 Analytical Framework

- **Temporal Differencing:** DEM_Aug - DEM_May = Seasonal Erosion Rate
- **Nest-Scale Analysis:** 50m buffer around GPS locations → Zonal Statistics
- **Multi-Year Persistence:** Stack 2024, 2025, 2026 DEMs → Coefficient of Variation
- **Vehicle Comparison:** T-test comparing erosion rates (vehicle vs. no-vehicle zones)
- **Elevation Thresholding:** Kemp's ridley optimal range (1.5-4.0m above MHW)
- **SLR Scenario Testing:** +0.4m, +0.8m, +1.34m applied to current DEMs

## 📊 Expected Deliverables

- **Safe zone identification maps** for in-situ nesting
- **Seasonal erosion risk layers** (May→August)
- **Vehicle impact assessments** (statistical comparison)
- **SLR vulnerability matrices** (2045, 2050, 2060)
- **Multi-year habitat persistence classifications**

## 🛠️ Tools Used

- **LAStools** - Point cloud processing
- **CloudCompare** - Surface analysis
- **ArcGIS Pro** - Spatial modeling and statistics

## 📖 Citation

If you use this framework, please cite:

```
PAIS Sea Turtle Nesting: Mobile LiDAR Thesis Research Framework
TAMU-CC Conrad Blucher Institute & PAIS Sea Turtle Science and Recovery Program
2024-2026
```

## 📧 Contact

**Student Researcher:** [Your Name]  
**Institution:** Texas A&M University - Corpus Christi  
**Department:** Conrad Blucher Institute for Surveying and Science

## 🤖 Generated With

Created with [Claude Code](https://claude.com/claude-code) - Anthropic's official CLI for Claude

---

**Conservation Impact:** This research provides PAIS with a spatial decision framework to transition from costly laboratory incubation to natural in-situ nesting, reducing operational costs while improving hatchling fitness and population resilience under sea level rise scenarios.
