# Pawfectly/PetPal: Full-Stack Pet Service & E-Commerce Platform

## Project Overview
Pawfectly is a comprehensive platform designed to connect pet owners with veterinary services, pet care providers, and pet-related products. Our platform aims to streamline pet care management by providing a one-stop solution for all pet-related needs, from veterinary services to pet sitting and product purchases.

## React + Flask + MongoDB Project

This project is a web application built with React for the frontend, Flask for the backend API, and MongoDB for the database.

## Technologies Used

### Frontend
- React.js
- Material-UI
- Axios
- React Router
- Socket.io-client
- JWT Authentication

### Backend
- Python Flask
- MongoDB
- Flask-JWT-Extended
- Flask-SocketIO
- PyMongo
- GridFS

### Development Tools
- Git
- npm/yarn
- pip
- MongoDB Compass
- Postman

## Features

### 1. Profile Management (Joey Guan)
- User authentication and authorization
- User profile creation and management
- Pet profile creation and management
- User profile search
- User profile rating and review
- User profile visibility control

### 2. Service Board (Ran Fan)
- Service request and offer posting
- Service categorization (Pet Spa, Walking, Daycare, House Sitting)
- Service sorting and filtering (time-order, complex attribute filtering)
- Reply to service and commit matching
- Image upload and management for services

### 3. Marketplace (Mona Fan)
- Second-hand pet item listing and browsing
- Advanced filtering system with Specification Pattern
- Location-based search with distance calculation
- Interactive map integration for item location
- Image upload and management for pet items

### 4. Event Hub (Pascal Yang)
- Event creation and management
- Event registration system
- Event filtering
- Calendar view

### 5. Vet Service (Yuhao(Martin) Yang)
- Veterinary service booking
- Historical record management
- Prescription services
- Progress tracking
- Service feedback system
- Image upload for medical records
- Pet health history tracking
- **==PLEASE LOOK AT THIS FILE==** - [Vet Service Use Guide](./Vet%20Service%20Use%20Guide.pdf)

## Prerequisites

Before running the project, make sure you have the following installed:

-   Node.js (v14 or newer)
-   npm or yarn
-   Python (v3.8 or newer)
-   pip
-   MongoDB


## How to Start the Application
**1. Build a virtual environment (recommended)** 

Below demonstrates python venv, while other virtual environment alternatives also work.
```
# In the root folder of this repository
python3 -m venv venv
source venv/bin/activate
```
**2. Upgrade pip (optional)**
```
# [Optional] Upgrade your pip
pip install --upgrade pip
```
**3. Install backend requirements and run the backend service**
```
cd backend
pip install -r requirements.txt
flask run
```
The backend server will start running on `http://localhost:5000`.

**Troubleshoot:** if the `flask run` method is not successful, try `python app.py` instead.

**4. Install frontend packages and run the frontend service**

Please open another terminal at the root directory and activate the virtual environment using `source venv/bin/activate`
```
cd frontend
npm install
npm start
```
**5. Go to `localhost:3000` to access the service**

## 🔑 Sample Accounts
For testing and demonstration purposes, you can use the following accounts:

### Vet Service Features
#### Pet Owner Account
- **Username:** demouser1
- **Password:** 1111
#### Veterinarian Account
- **Username:** demouser2
- **Password:** 1111

## External Sources and References
### APIs
1. The Dog API to list all dog breeds: `https://dog.ceo/api/breeds/list/all`
2. The Cat API to list all cat breeds: `https://api.thecatapi.com/v1/breeds`
3. MapBox Geocoding API: `http://mapbox.com/geocoding`

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
For any questions or support, please contact:
- Team Members:
  - Joey Guan - Profile Management
  - Ran Fan - Service Board
  - Mona Fan - Marketplace
  - Pascal Yang - Event Hub
  - Yuhao(Martin) Yang - Vet Service
