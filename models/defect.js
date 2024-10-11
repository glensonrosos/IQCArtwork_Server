import mongoose, { Schema } from 'mongoose';

const defectSchema = mongoose.Schema({
    number:Number,
    name:{ type: String, required: false, unique: true },
});

const Defect = mongoose.model('Defect',defectSchema);

export default Defect;