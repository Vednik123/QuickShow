import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import {serve} from 'inngest/express'
import { functions, inngest } from './inngest/index.js';

const app = express();
const port = 3000;

await connectDB()

// Middleware
app.use(express.json());
app.use(cors())
app.use(clerkMiddleware())


// Api routes
app.get('/',(req,res)=>{
    res.send("App is working !");
})

app.use('/api/ingest',serve({client:inngest,functions}))

app.listen(port,()=>{
    console.log(`App is working on http://localhost:${port}`);
})