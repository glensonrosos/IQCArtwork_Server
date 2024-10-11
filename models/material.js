import mongoose, { Schema } from 'mongoose';

const materialSchema = mongoose.Schema({
    number:Number,
    name:{ type: String, required: true, unique: true },
});

const Material = mongoose.model('Material',materialSchema);

export default Material;