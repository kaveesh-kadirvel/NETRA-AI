const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://vishwakarmaakashav17:AkashPython123@pythoncluster0.t9pop.mongodb.net/hackx?retryWrites=true&w=majority&appName=pythoncluster0';

const DISTRICT_COORDS = [
    { name: 'Patna', state: 'Bihar', lat: 25.59, lon: 85.13 },
    { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.84, lon: 80.94 },
    { name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.08, lon: 74.79 },
    { name: 'Kamrup', state: 'Assam', lat: 26.14, lon: 91.74 },
    { name: 'Dhubri', state: 'Assam', lat: 26.02, lon: 89.98 },
    { name: 'Dibrugarh', state: 'Assam', lat: 27.47, lon: 94.91 },
    { name: 'Imphal', state: 'Manipur', lat: 24.81, lon: 93.93 },
    { name: 'Kolkata', state: 'West Bengal', lat: 22.57, lon: 88.36 },
    { name: 'Bhubaneswar', state: 'Odisha', lat: 20.29, lon: 85.82 },
    { name: 'Mumbai', state: 'Maharashtra', lat: 19.07, lon: 72.87 },
    { name: 'Surat', state: 'Gujarat', lat: 21.17, lon: 72.83 },
    { name: 'Chennai', state: 'Tamil Nadu', lat: 13.08, lon: 80.27 },
    { name: 'Kochi', state: 'Kerala', lat: 9.93, lon: 76.26 },
    { name: 'Wayanad', state: 'Kerala', lat: 11.68, lon: 76.13 },
    { name: 'Barpeta', state: 'Assam', lat: 26.32, lon: 91.00 },
    { name: 'Morigaon', state: 'Assam', lat: 26.25, lon: 92.33 },
    { name: 'Majuli', state: 'Assam', lat: 27.00, lon: 94.18 },
    { name: 'Darbhanga', state: 'Bihar', lat: 26.15, lon: 85.90 },
    { name: 'Muzaffarpur', state: 'Bihar', lat: 26.12, lon: 85.38 },
    { name: 'Sitamarhi', state: 'Bihar', lat: 26.60, lon: 85.48 },
    { name: 'Supaul', state: 'Bihar', lat: 26.11, lon: 86.60 },
    { name: 'Kishanganj', state: 'Bihar', lat: 26.10, lon: 87.94 },
    { name: 'Murshidabad', state: 'West Bengal', lat: 24.18, lon: 88.27 },
    { name: 'Malda', state: 'West Bengal', lat: 25.00, lon: 88.14 },
    { name: 'Cooch Behar', state: 'West Bengal', lat: 26.32, lon: 89.44 },
    { name: 'Jalpaiguri', state: 'West Bengal', lat: 26.51, lon: 88.73 },
    { name: 'Kendrapara', state: 'Odisha', lat: 20.50, lon: 86.42 },
    { name: 'Balasore', state: 'Odisha', lat: 21.49, lon: 86.93 },
    { name: 'Bhadrak', state: 'Odisha', lat: 21.06, lon: 86.51 },
    { name: 'Cuttack', state: 'Odisha', lat: 20.46, lon: 85.88 },
    { name: 'Lakhimpur Kheri', state: 'Uttar Pradesh', lat: 27.94, lon: 80.79 },
    { name: 'Bahraich', state: 'Uttar Pradesh', lat: 27.57, lon: 81.59 },
    { name: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.76, lon: 83.37 },
    { name: 'Ballia', state: 'Uttar Pradesh', lat: 25.76, lon: 84.15 },
    { name: 'Alappuzha', state: 'Kerala', lat: 9.49, lon: 76.33 },
    { name: 'Ernakulam', state: 'Kerala', lat: 9.98, lon: 76.28 },
    { name: 'Idukki', state: 'Kerala', lat: 9.92, lon: 77.10 },
    { name: 'Kolhapur', state: 'Maharashtra', lat: 16.70, lon: 74.24 },
    { name: 'Sangli', state: 'Maharashtra', lat: 16.86, lon: 74.56 },
    { name: 'Ratnagiri', state: 'Maharashtra', lat: 17.00, lon: 73.30 },
    { name: 'East Godavari', state: 'Andhra Pradesh', lat: 17.00, lon: 82.00 },
    { name: 'West Godavari', state: 'Andhra Pradesh', lat: 16.92, lon: 81.43 },
    { name: 'Krishna', state: 'Andhra Pradesh', lat: 16.35, lon: 80.46 },
    { name: 'Khammam', state: 'Telangana', lat: 17.25, lon: 80.15 },
    { name: 'Suryapet', state: 'Telangana', lat: 17.14, lon: 79.62 },
    { name: 'Vadodara', state: 'Gujarat', lat: 22.31, lon: 73.19 },
    { name: 'Bharuch', state: 'Gujarat', lat: 21.70, lon: 73.00 },
    { name: 'Kheda', state: 'Gujarat', lat: 22.75, lon: 72.69 },
    { name: 'Barmer', state: 'Rajasthan', lat: 25.75, lon: 71.38 },
    { name: 'Banswara', state: 'Rajasthan', lat: 23.54, lon: 74.44 },
    { name: 'Chamoli', state: 'Uttarakhand', lat: 30.41, lon: 79.32 },
    { name: 'Uttarkashi', state: 'Uttarakhand', lat: 30.73, lon: 78.44 },
    { name: 'Mandi', state: 'Himachal Pradesh', lat: 31.71, lon: 76.92 },
    { name: 'Nagapattinam', state: 'Tamil Nadu', lat: 10.76, lon: 79.84 },
    { name: 'Thanjavur', state: 'Tamil Nadu', lat: 10.79, lon: 79.14 },
    { name: 'Cuddalore', state: 'Tamil Nadu', lat: 11.75, lon: 79.77 },
];

(async () => {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: 'cosmeon' });
        console.log('Connected to MongoDB');

        const District = mongoose.model('District', new mongoose.Schema({
            districtName: String,
            stateName: String,
            geometry: Object
        }));

        let updated = 0;
        let total = 0;
        for (const coord of DISTRICT_COORDS) {
            total++;
            const res = await District.updateOne(
                { districtName: coord.name, stateName: coord.state },
                {
                    $set: {
                        geometry: {
                            type: 'Point',
                            coordinates: [coord.lon, coord.lat]
                        }
                    }
                }
            );
            if (res.modifiedCount > 0 || res.upsertedCount > 0) updated++;
        }

        console.log(`Success: Checked ${total} districts, updated ${updated} with real geo-coordinates.`);
        process.exit(0);
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
})();
