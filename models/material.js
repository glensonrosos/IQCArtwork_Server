import mongoose, { Schema } from 'mongoose';

const materialSchema = mongoose.Schema({
    number:Number,
    name:String,
});

const Material = mongoose.model('Material',materialSchema);

export default Material;