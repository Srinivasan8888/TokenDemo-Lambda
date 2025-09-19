import {connectDB} from '../Helpers/initMongodb.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkUsers = async () => {
    try {
        await connectDB();

        // Get the users collection
        const db = mongoose.connection.db;
        const usersCollection = db.collection('userinfos'); // Based on your collections list

        const userCount = await usersCollection.countDocuments();
        console.log(`Total users in database: ${userCount}`);

        if (userCount > 0) {
            const users = await usersCollection.find({}, {
                projection: {
                    Email: 1,
                    Name: 1,
                    Role: 1,
                    _id: 1
                }
            }).toArray();

            console.log('Users:');
            users.forEach(user => {
                console.log(`- Email: ${
                    user.Email
                }, Name: ${
                    user.Name
                }, Role: ${
                    user.Role
                }`);
            });
        } else {
            console.log('No users found. You may need to create a user first.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

checkUsers();
