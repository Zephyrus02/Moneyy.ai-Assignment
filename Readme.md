MoneyyAI - Stock Portfolio Management

A web application for managing stock portfolios with real-time analytics and performance tracking.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MoneyyAI
```

2. Run dataGeneraation.js
```bash
node dataGeneraation.js
```

3. Install Packages:

```bash
cd backend
npm install
```
- on new terminal tab

```bash
cd frontend
npm install
```

4. Copy the following in .env file

```bash
MONGODB_URI=mongodb://localhost:27017/Moneyy
PORT=4000
USER_ID=replace_with_your_user_id
```

5. Run the frontend and backend server
```bash
cd backend
npm start
```
- on new terminal tab

```bash
cd frontend
npm start
```