import mongoose, { Schema } from 'mongoose';

const inspectionSchema = mongoose.Schema({
    date:Date,
    supplier:{
        _id : Schema.Types.ObjectId,
        supplierCode: String,
        name:String,
    },
    item:{
        _id : Schema.Types.ObjectId,
        itemCode:String,
        itemDescription:String,
        color:String,
    },
    deliveryQty: Number,
    totalMinWork:{
        start:String,
        end:String
    },
    buyer:{
        _id : Schema.Types.ObjectId,
        supplierCode: String,
        name:String,
    },
    material:{
        _id : Schema.Types.ObjectId,
        name:String,
    },
    weight: String,
    totalGoodQty: Number,
    totalPullOutQty: Number,
    firstPass:{
        defectQty: Number,
        totalGoodQty: Number,
        totalPullOutQty: Number
    },
    secondPass:{
        totalGoodQty: Number,
        totalPullOutQty: Number,
    },
    emptyDefect:Boolean,
    passIssues:{
        firstDefect: Number,
        firstPullOut: Number,
        secondPullOut: Number,
    },
    remarks:String,
    unfinished:Number,
    dateClosure:Date,
    createdAt:Date,
    updatedAt:Date,
    deletedAt:Date,
    editedBy:String,
});

const Inspection = mongoose.model('Inspection',inspectionSchema);

export default Inspection;