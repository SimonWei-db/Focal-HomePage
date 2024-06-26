# Focal - Personal Website for Steve Hranilovic

Project Link: [https://focal.simonoren.com/](https://focal.simonoren.com/)

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Usage](#usage)
- [Directory Structure](#directory-structure)
- [NPM Scripts](#npm-scripts)
- [Deployment](#deployment)
- [License](#license)
- [Contact](#contact)

## Introduction

Focal is a personal website developed for Professor Steve Hranilovic at McMaster University. It showcases his professional profile, publications, research activities, and more.

## Features

- Professional profile display
- Publications list
- Research activities
- Team member profiles
- News and resources section

## Technologies

### Frontend

- React
- HTML
- CSS
- JavaScript

### Backend

- Node.js
- Express
- SQLite3

## Installation

### Frontend

1. Clone the repository:
    ```bash
    git clone https://github.com/SimonWei-db/Focal-HomePage.git
    ```
2. Navigate to the project directory:
    ```bash
    cd Focal-HomePage/client
    ```
3. Install dependencies:
    ```bash
    npm install
    ```
4. Start the frontend server:
    ```bash
    npm start
    ```

### Backend

1. Navigate to the backend directory:
    ```bash
    cd Focal-HomePage
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Start the backend server:
    ```bash
    npm start
    ```

## Usage

### Frontend

- Access the frontend at `http://localhost:1218`

### Backend

- Access the backend at `http://localhost:8081`

## Directory Structure

- `Focal-HomePage/client`: Frontend code
- `Focal-HomePage/server`: Backend code
- `Focal-HomePage/zip_server.bat`: Script for packaging and uploading to AWS Elastic Beanstalk
- `Focal-HomePage/.ebextensions`: Configuration scripts for deploying to Elastic Beanstalk

## NPM Scripts

```json
"scripts": {
    "start": "nodemon server/index.js",
    "start:electron": "electron .",
    "start:build_and_run_electron": "npm run build:client:SA && electron .",
    "build:client:SA": "cd client && npm run build:ECESA",
    "clean": "rimraf dist",
    "build:server": "cd server && pkg index.js --targets node16-win-x64 --output server.exe",
    "dist": "npm install && npm run clean && npm run build:server && npm run build:client:SA && npm install sqlite3@5.0.2 && electron-builder",
    "server": "nodemon server/index.js",
    "client": "npm start --prefix client",
    "client:ECESA": "npm run start:ECESA --prefix client",
    "client:ECEWEB": "npm run start:ECEWEB --prefix client",
    "dev": "concurrently \"npm run client\" \"npm run server\"",
    "dev:ECESA": "concurrently \"npm run client:ECESA\" \"npm run server\"",
    "dev:ECEWEB": "concurrently \"npm run client:ECEWEB\" \"npm run server\""
}
```

## Deployment

### AWS Elastic Beanstalk

1. Use `zip_server.bat` to package the project for AWS Elastic Beanstalk.
2. Upload the generated ZIP file to AWS Elastic Beanstalk.
3. Configure the deployment using `.ebextensions` scripts.

### Electron Standalone Application

1. Use `npm run dist` to package the project as an Electron application.
2. This will create a standalone application for Windows.


## Contact

Simon Wei - [weixingchensimon@gmail.com](mailto:weixingchensimon@gmail.com)

