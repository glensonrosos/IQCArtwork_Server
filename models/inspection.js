import mongoose, { Schema } from 'mongoose';

const inspectionSchema = mongoose.Schema({
    date:Date,
    supplierId:Schema.Types.ObjectId,
    itemId: Schema.Types.ObjectId,
    deliveryQty: Number,
    totalMinWork: Number,
    buyerId: Schema.Types.ObjectId,
    materialId:Schema.Types.ObjectId,
    weight: Number,
    totalGoodQty: Number,
    totalPullOutQty: Number,
    firstPass:{
        _id: Schema.Types.ObjectId,
        defectQty: Number,
        totalGoodQty: Number,
        totalPullOutQty: Number
    },
    secondPass:{
        _id: Schema.Types.ObjectId,
        totalGoodQty: Number,
        pullOutQty:Number,
    },
    remarks:String,
    unfinished:Number,
});

const Inspection = mongoose.model('Inspection',inspectionSchema);

export default Inspection;