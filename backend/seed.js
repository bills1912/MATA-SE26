require('dotenv').config();
const mongoose = require('mongoose');
const { Wilayah } = require('./models');
const data = require('./wilayah_data.json');

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    console.log('Dropping existing wilayah collection...');
    await Wilayah.deleteMany({});

    console.log(`Inserting ${data.length} records...`);
    await Wilayah.insertMany(data, { ordered: false });
    console.log('Seed completed successfully!');
    
    const count = await Wilayah.countDocuments();
    console.log(`Total documents in DB: ${count}`);
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

seed();
