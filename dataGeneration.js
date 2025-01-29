const { MongoClient } = require('mongodb');

// Configuration
const MONGO_URI = "mongodb://localhost:27017";
const DATABASE_NAME = "Moneyy";
const COLLECTION_NAME = "companies";

// Company data with sectors
const COMPANY_DATA = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", minPrice: 150, maxPrice: 200 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", minPrice: 120, maxPrice: 150 },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", minPrice: 300, maxPrice: 400 },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals", sector: "Healthcare", minPrice: 4000, maxPrice: 5000 },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", sector: "Healthcare", minPrice: 3000, maxPrice: 4000 },
  { symbol: "RVNL", name: "Rail Vikas Nigam Limited", sector: "Infrastructure", minPrice: 100, maxPrice: 150 },
  { symbol: "L&T", name: "Larsen & Toubro", sector: "Infrastructure", minPrice: 2500, maxPrice: 3000 },
  { symbol: "JSWSTEEL", name: "JSW Steel", sector: "Metals", minPrice: 700, maxPrice: 800 },
  { symbol: "TATASTEEL", name: "Tata Steel", sector: "Metals", minPrice: 100, maxPrice: 150 },
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", minPrice: 2000, maxPrice: 2500 },
  { symbol: "ONGC", name: "Oil & Natural Gas Corporation", sector: "Energy", minPrice: 150, maxPrice: 200 }
];

const START_DATE = new Date("2025-01-01");
const END_DATE = new Date("2025-12-31");

// Helper functions
function getRandomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Updated data generation function
function generateDataForCompany(company) {
  const data = [];
  let currentDate = new Date(START_DATE);
  let prevPrice = getRandomFloat(company.minPrice, company.maxPrice);

  while (currentDate <= END_DATE) {
    // Generate price with some correlation to previous day
    const priceChange = getRandomFloat(-2, 2);
    const newPrice = prevPrice * (1 + priceChange/100);
    prevPrice = Math.max(company.minPrice, Math.min(company.maxPrice, newPrice));

    data.push({
      symbol: company.symbol,
      company_name: company.name,
      sector: company.sector,
      date: new Date(currentDate),
      closing_price: prevPrice,
      daily_pnl: priceChange,
      volume_traded: getRandomInt(10000, 500000),
      market_cap: prevPrice * getRandomInt(1000000, 10000000),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return data;
}

const generateUserData = async (db) => {
  const userCollection = db.collection('users');
  
  // Default user data
  const defaultUser = {
    username: 'testuser',
    accountNumber: '1234567890',
    balance: 1000000,
    email: 'test@example.com',
    createdAt: new Date(),
    lastUpdated: new Date()
  };

  // Insert user
  await userCollection.insertOne(defaultUser);
  console.log('Default user created successfully');
};

// Main function to generate and store data
async function generateAndStoreData() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    
    // Generate user data first
    await generateUserData(db);
    
    // Clear existing data
    await db.collection(COLLECTION_NAME).deleteMany({});

    // Generate and insert data for each company
    for (const company of COMPANY_DATA) {
      const companyData = generateDataForCompany(company);
      await db.collection(COLLECTION_NAME).insertMany(companyData);
      console.log(`Generated data for ${company.symbol}`);
    }

    console.log('Data generation completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the data generation
generateAndStoreData();
