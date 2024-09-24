import mongoose, { Schema } from 'mongoose';

const areaSchema = mongoose.Schema({
    number:Number,
    name:String,
});

const Area = mongoose.model('Area',areaSchema);

export default Area;