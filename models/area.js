import mongoose, { Schema } from 'mongoose';

const areaSchema = mongoose.Schema({
    number:Number,
    name:{ type: String, required: false, unique: true },
});

const Area = mongoose.model('Area',areaSchema);

export default Area;