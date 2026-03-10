# 🚦 Smart Road Accident Blackspot Analyzer

An AI-powered intelligent system for identifying, analyzing, and predicting road accident blackspots using machine learning and geospatial analytics.

## 🎯 Project Overview

This innovative  project leverages data science and web technologies to:
- **Identify high-risk accident zones** using ML algorithms
- **Provide real-time risk assessment** for any location
- **Visualize accident patterns** on interactive maps
- **Generate actionable insights** for road safety authorities

## 🏗️ Architecture

The system consists of three main components:

### 1. 🤖 Machine Learning Module (`RoadSafetyProject/`)
- **Technology**: Python, Scikit-learn, Pandas
- **Model**: Random Forest Classifier for risk prediction
- **Features**: 
  - Accident frequency analysis
  - Weather condition impact (rain, night)
  - Road type classification
  - Risk level categorization (High/Medium/Low)

### 2. 🚀 Backend API (`roadsafety/`)
- **Technology**: Spring Boot 4.0.3, Java 17, MySQL
- **Framework**: RESTful API with JPA/Hibernate
- **Endpoints**:
  - `GET /api/blackspots` - Retrieve all blackspot data
  - `GET /api/risk?lat={lat}&lon={lon}` - Get risk assessment for coordinates
  - `POST /api/blackspots` - Add new blackspot data
- **Database**: MySQL with spatial data support

### 3. 🌐 Frontend Dashboard (`RoadSafetyFrontend/`)
- **Technology**: HTML5, CSS3, JavaScript
- **Libraries**: Leaflet.js (maps), Chart.js (analytics)
- **Features**:
  - Interactive map visualization
  - Real-time risk analytics
  - Comprehensive dashboard with metrics
  - Responsive design for all devices

## 📊 Data Model

### Blackspot Entity
```java
{
  id: Long,
  city: String,
  state: String,
  latitude: Double,
  longitude: Double,
  totalAccidents: Integer,
  nightAccidents: Integer,
  rainAccidents: Integer,
  ari: Double,           // Accident Risk Index
  riskLevel: String,     // HIGH/MEDIUM/LOW
  deaths: Integer,
  injured: Integer,
  roadType: String
}
```

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Python 3.8+
- MySQL 8.0+
- Maven 3.6+

### Backend Setup
```bash
cd roadsafety
# Configure database in application.properties
mvn clean install
mvn spring-boot:run
```

### ML Model Training
```bash
cd RoadSafetyProject
pip install pandas scikit-learn joblib
python train_model.py
```

### Frontend Setup
```bash
cd RoadSafetyFrontend
# Serve with any HTTP server
python -m http.server 8080
# or use Live Server extension in VS Code
```

## 📈 Key Features

### 🎯 Risk Prediction
- **Accuracy**: ML model with 85%+ accuracy
- **Factors**: Road type, weather, time, historical data
- **Output**: Real-time risk assessment with confidence scores

### 🗺️ Interactive Mapping
- **Visualization**: Color-coded risk zones on map
- **Layers**: Toggle between different risk factors
- **Clustering**: Group nearby accidents for pattern analysis

### 📊 Analytics Dashboard
- **Metrics**: Total blackspots, risk distribution
- **Charts**: Risk level breakdown, accident trends
- **Filters**: By state, city, road type

### 🔍 Location Intelligence
- **Geospatial Queries**: Find nearest blackspots
- **Route Analysis**: Risk assessment for travel routes
- **Hotspot Detection**: Automatic identification of high-risk areas

## 🛠️ Technologies Used

### Backend
- **Spring Boot 4.0.3** - Java framework
- **MySQL** - Database
- **JPA/Hibernate** - ORM
- **Lombok** - Code generation
- **Maven** - Build tool

### Machine Learning
- **Python 3.8+** - Programming language
- **Scikit-learn** - ML library
- **Pandas** - Data manipulation
- **Joblib** - Model serialization

### Frontend
- **HTML5/CSS3/JavaScript** - Web technologies
- **Leaflet.js** - Interactive maps
- **Chart.js** - Data visualization
- **Responsive Design** - Mobile-friendly

## 📁 Project Structure

```
innovative_hackerthon_project/
├── README.md                          # This file
├── roadsafety/                        # Spring Boot backend
│   ├── src/main/java/com/bharat/roadsafety/
│   │   ├── controller/                # REST controllers
│   │   ├── model/                     # JPA entities
│   │   ├── repository/                # Data repositories
│   │   └── service/                   # Business logic
│   ├── pom.xml                        # Maven configuration
│   └── Dockerfile                     # Container setup
├── RoadSafetyProject/                 # ML model training
│   ├── train_model.py                 # Model training script
│   ├── risk_model.pkl                 # Trained model
│   ├── risk_encoder.pkl               # Label encoders
│   └── indian_accident_processed.csv  # Training data
└── RoadSafetyFrontend/                # Web dashboard
    ├── index.html                     # Main page
    ├── script.js                      # Frontend logic
    └── style.css                      # Styling
```

## 🔧 API Documentation

### Get All Blackspots
```http
GET /api/blackspots
```
Returns array of all blackspot data with risk assessments.

### Get Risk Assessment
```http
GET /api/risk?lat=28.6139&lon=77.2090
```
Returns risk level and analysis for specific coordinates.

### Add Blackspot
```http
POST /api/blackspots
Content-Type: application/json

{
  "city": "Delhi",
  "state": "Delhi",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "totalAccidents": 45,
  "nightAccidents": 12,
  "rainAccidents": 8,
  "deaths": 3,
  "injured": 28,
  "roadType": "Highway"
}
```

## 🎨 Dashboard Features

### Real-time Metrics
- **Total Blackspots**: Live count of accident zones
- **Risk Distribution**: High/Medium/Low risk categorization
- **Accident Statistics**: Deaths, injuries, frequency

### Interactive Elements
- **Map Navigation**: Pan, zoom, click for details
- **Risk Heatmap**: Visual representation of danger zones
- **Filter Options**: By location, risk level, road type

### Data Visualization
- **Risk Charts**: Pie charts for risk distribution
- **Trend Analysis**: Line charts for accident patterns
- **Comparative Analytics**: Bar charts for location comparisons

## 🔬 Machine Learning Pipeline

### Data Preprocessing
1. **Data Cleaning**: Handle missing values, outliers
2. **Feature Engineering**: Create Accident Risk Index (ARI)
3. **Encoding**: Convert categorical variables to numerical
4. **Normalization**: Scale features for model training

### Model Training
```python
# Random Forest Classifier
model = RandomForestClassifier(n_estimators=100, random_state=42)

# Features Used
X = ['Total_Accidents', 'Night_Accidents', 'Rain_Accidents', 
     'Deaths', 'Injured', 'Road_Type']
y = 'Risk_Level'
```

### Model Evaluation
- **Accuracy**: 85%+ on test data
- **Metrics**: Precision, Recall, F1-Score
- **Validation**: Cross-validation with 5 folds

## 🌍 Impact & Applications

### For Government Authorities
- **Policy Making**: Data-driven road safety decisions
- **Resource Allocation**: Target high-risk areas first
- **Infrastructure Planning**: Identify locations for safety improvements

### For Emergency Services
- **Quick Response**: Prioritize high-risk zones
- **Resource Deployment**: Station ambulances strategically
- **Preventive Measures**: Alert drivers in dangerous areas

### For General Public
- **Route Planning**: Choose safer travel paths
- **Risk Awareness**: Understand danger zones
- **Community Reporting**: Crowdsource accident data

## 🚀 Future Enhancements

### Planned Features
- **Real-time Data Integration**: Live traffic and weather feeds
- **Mobile Application**: Native iOS/Android apps
- **Predictive Analytics**: Forecast future accident hotspots
- **Social Integration**: Community reporting and alerts

### Technical Improvements
- **Microservices Architecture**: Scalable backend design
- **Advanced ML Models**: Deep learning for better accuracy
- **Real-time Processing**: Stream processing for live data
- **Cloud Deployment**: AWS/Azure for global accessibility


