const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hhelgf3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT = (req, res, next) =>{
  // console.log('hit JWT');
  // console.log(req.headers.authorization);
  const authorization = req.headers.authorization ;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorize access'});
  }
  const token = authorization.split(' ')[1];
  // console.log(token);
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (error, decoded)=>{
    if(error){
      return  res.status(403).send({error: true, message: 'unauthoorize access'})
    }
    req.decoded = decoded;
    next();
  })

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const serviceCollection = client.db('carDoctor').collection('services');
    const bookingCollection = client.db('carDoctor').collection('bookings');

    app.post('/jwt', (req, res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {expiresIn: '1h'});
      res.send({token});
    })

    app.get('/services', async(req, res) =>{
      const filter = req.query
      console.log(filter)
      const query = {
        
      }
      const options = {
        sort: {
          price: filter.sort ===  "asc"? 1:-1
        }
      }
      const cursor = serviceCollection.find(query, options);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/services/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const options = {
        projection: {title: 1, price: 1, service_id: 1, img: 1},
      };

      const result = await serviceCollection.findOne(query, options);
      res.send(result)
    })

    app.get('/bookings', verifyJWT, async(req, res) =>{
      // console.log(req.headers.authorization);
      const decoded = req.decoded;
      if(decoded.email !== req.query.email){
        return res.status(403).send({error: 1, message: 'forbidden access'})
      }
      
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/bookings', async(req, res) =>{
      const booking = req.body;
      console.log(booking)
      const result =await bookingCollection.insertOne(booking);
      res.send(result)
    })

    app.patch('/bookings/:id', async(req, res) =>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updateBooking = req.body;
      console.log(updateBooking)

      const updateDoc = {
        $set:{
          status: updateBooking.status
        }
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    app.delete('/bookings/:id',async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result =await bookingCollection.deleteOne(query);
      res.send(result);
    } )

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('car doctor is running')
})

app.listen(port, ()=>{
    console.log(`car doctor is running ${port}`)
})