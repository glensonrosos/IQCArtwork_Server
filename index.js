import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';

import itemRoutes from './routes/item.js';
import buyerRoutes from './routes/buyer.js';
import materialRoutes from './routes/material.js';
import supplierRoutes from './routes/supplier.js';
import authRoutes from './routes/auth.js';
import departmentRoutes from './routes/department.js';
import areaRoutes from './routes/area.js';
import defectRoutes from './routes/defect.js';
import defectDataRoutes from './routes/defectData.js';
import inspectionRoutes from './routes/inspection.js';

const app = express();

// http://localhost:5000/purchaseOrder/

app.use(bodyParser.json({limit:"30mb",extended: true}));
app.use(bodyParser.urlencoded({limit:"30mb",extended:true}));
app.use(cors());

// Configure CORS
app.use(cors({
    origin: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'], // Specify the allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify the allowed headers
    credentials: true, // Enable credentials (e.g., cookies, authorization headers)
  }));



const PORT = process.env.PORT || 5000;
const CONNECTION_URL = "mongodb://127.0.0.1:27017/iqcartwork";

//works bellow
//const CONNECTION_URL = "mongodb://host.docker.internal:27017/ordercommitment";


mongoose.connect(CONNECTION_URL,{useNewUrlParser:true, useUnifiedTopology:true})
    .then(()=> app.listen(PORT,() => console.log(`Server running on port: ${PORT} !!`)))
    .catch((error) => console.log(error.message));


app.use('/ia/buyers',buyerRoutes);
app.use('/ia/materials',materialRoutes);
app.use('/ia/suppliers',supplierRoutes);
app.use('/ia/items',itemRoutes);
app.use('/ia/auth',authRoutes);
app.use('/ia/departments',departmentRoutes);
app.use('/ia/areas',areaRoutes);
app.use('/ia/defects',defectRoutes);
app.use('/ia/defectDatas',defectDataRoutes);
app.use('/ia/inspections',inspectionRoutes);


// DOCKER
//https://www.youtube.com/watch?v=rOTqprHv1YE