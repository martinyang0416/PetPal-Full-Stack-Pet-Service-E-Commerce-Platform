const { MongoClient, ObjectId } = require('mongodb');

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'pawfectly';

async function main() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB server');
    
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    // Create a test vet user
    const newVet = {
      _id: new ObjectId(),
      name: "Dr. Sarah Johnson",
      user_name: "drjohnson",
      contact: {
        email: "sarah.johnson@vetclinic.com",
        phone_number: "(555) 123-4567"
      },
      location: {
        street: "123 Animal Care Lane",
        city: "San Francisco",
        state: "CA",
        zipCode: "94107",
        coordinates: {
          lat: 37.7749,
          lng: -122.4194
        }
      },
      identity: ["vet"],
      bio: "Specialized in small animal care with 10 years of experience.",
      specialty: "Small Animals",
      is_public: true,
      profile_picture: "",
      availability: {
        Monday_Morning: true,
        Monday_Afternoon: true,
        Tuesday_Afternoon: true,
        Wednesday_Morning: true,
        Wednesday_Evening: true,
        Friday_Morning: true,
        Friday_Afternoon: true
      }
    };
    
    // Check if vet already exists
    const existingVet = await usersCollection.findOne({ user_name: newVet.user_name });
    
    if (existingVet) {
      console.log('Vet already exists, updating data');
      await usersCollection.updateOne(
        { user_name: newVet.user_name },
        { $set: newVet }
      );
    } else {
      console.log('Creating new vet user');
      await usersCollection.insertOne(newVet);
    }
    
    console.log('Test vet created/updated successfully');
    
    // Create another vet
    const newVet2 = {
      _id: new ObjectId(),
      name: "Dr. Michael Chen",
      user_name: "drchen",
      contact: {
        email: "michael.chen@vetclinic.com",
        phone_number: "(555) 234-5678"
      },
      location: {
        street: "456 Cat Clinic Drive",
        city: "San Jose",
        state: "CA",
        zipCode: "95113",
        coordinates: {
          lat: 37.3382,
          lng: -121.8863
        }
      },
      identity: ["vet"],
      bio: "Expert in feline medicine and surgery with 8 years of specialized experience.",
      specialty: "Feline Medicine",
      is_public: true,
      profile_picture: "",
      availability: {
        Thursday_Morning: true,
        Thursday_Afternoon: true,
        Thursday_Evening: true,
        Friday_Afternoon: true,
        Saturday_Morning: true
      }
    };
    
    // Check if vet already exists
    const existingVet2 = await usersCollection.findOne({ user_name: newVet2.user_name });
    
    if (existingVet2) {
      console.log('Vet 2 already exists, updating data');
      await usersCollection.updateOne(
        { user_name: newVet2.user_name },
        { $set: newVet2 }
      );
    } else {
      console.log('Creating new vet user 2');
      await usersCollection.insertOne(newVet2);
    }
    
    console.log('Test vet 2 created/updated successfully');
    
    return 'Done';
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main()
  .then(console.log)
  .catch(console.error); 