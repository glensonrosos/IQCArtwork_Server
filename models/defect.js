import mongoose, { Schema } from 'mongoose';

const defectSchema = mongoose.Schema({
    number:Number,
    name:String,
});

const Defect = mongoose.model('Defect',defectSchema);

export default Defect;