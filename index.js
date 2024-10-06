const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 7000;
const app = express();

// Define CORS options
const corsOptions = {
    origin: [
        'http://localhost:5173',
        "https://solosphere-e1e38.web.app",
        "https://solosphere-e1e38.firebaseapp.com"
    ],
    credentials: true,
    optionsSuccessStatus: 200,
};

// Use CORS middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Your routes would go here





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qrif73o.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const jobsCollection = client.db('solosphere').collection('jobs')
        const bidsCollection = client.db('solosphere').collection('bids')


        // jwt generate
        app.post('/jwt', async (req, res) => {
            const email = req.body
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '365d',
            })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: true })
        })

        //  Clear token on logout form  cookie
        app.get('/logout', (req, res) => {
            res
                .clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                    maxAge: 0,
                })
                .send({ success: true })
        })

        // Get all jobs data form db 
        app.get('/jobs', async (req, res) => {
            const result = await jobsCollection.find().toArray();
            res.send(result);
        })
        // Get Signle data form db 
        app.get('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query)
            res.send(result)
        })

        // save a bid data in db
        app.post('/bid', async (req, res) => {
            const bidData = req.body;
            const result = await bidsCollection.insertOne(bidData);
            res.send(result)
        })

        // save a job data in db
        app.post('/job', async (req, res) => {
            const jobData = req.body;
            const result = await jobsCollection.insertOne(jobData);
            res.send(result)
        })
        // Get all jobs posted by specific user
        app.get('/jobs/:email', async (req, res) => {
            const email = req.params.email;
            const query = { 'buyer.email': email }
            const result = await jobsCollection.find(query).toArray()
            res.send(result)
        })
        // Delete a job  data from db 
        app.delete('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.deleteOne(query)
            res.send(result)
        })
        // update a job in db
        app.put('/job/:id', async (req, res) => {
            const id = req.params.id
            const jobData = req.body
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    ...jobData,
                },
            }
            const result = await jobsCollection.updateOne(query, updateDoc, options)
            res.send(result)
        })


        // Get all bids for a user by email from db
        app.get('/my-bids/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const result = await bidsCollection.find(query).toArray()
            res.send(result)
        })
        // Get all bid-request  from db for owner
        app.get('/bids-requests/:email', async (req, res) => {
            const email = req.params.email;
            const query = { "buyer.email": email }
            const result = await bidsCollection.find(query).toArray()
            res.send(result)
        })

        // Update bid status
        app.patch('/bid/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body;
            console.log(status);
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true }
            const updateDoc = {
                $set: status,
            }
            const result = await bidsCollection.updateOne(query, updateDoc);
            console.log(updateDoc);
            console.log(result);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello from soloSphere server...')
})

app.listen(port, () => console.log(`server running on port${port}`))
