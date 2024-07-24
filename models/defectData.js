import mongoose, { Schema } from 'mongoose';

const defectDataSchema = mongoose.Schema({
    defectId:Schema.Types.ObjectId,
    areaId:Schema.Types.ObjectId,
    qty:Number,
    numericData:String,
    passId:Schema.Types.ObjectId,
    createdAt:Date,
    updatedAt:Date,
    deletedAt:Date,
    lastEditdBy:String,
});

const DefectData = mongoose.model('DefectData',defectDataSchema);

export default DefectData;