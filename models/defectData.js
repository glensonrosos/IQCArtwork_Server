import mongoose, { Schema } from 'mongoose';

const defectDataSchema = mongoose.Schema({
    inspectionId:{
      type: Schema.Types.ObjectId,
      required: true
    },
    passType: {
        type: String,
        enum: ['firstPassDefect', 'firstPassPullOut', 'secondPassPullOut'],
        required: true
    },
    defectDetails: [
        {
          id:{ type: Number, required: true },
          defect: {
            _id: { type: Schema.Types.ObjectId, required: true },
            name: { type: String, required: true },
          },
          area: {
            _id: { type: Schema.Types.ObjectId, required: true },
            name: { type: String, required: true },
          },
          majorQty: { type: Number, required: true },
          numericData: { type: String, required: false },
        },
    ],
    createdAt:Date,
    updatedAt:Date,
    deletedAt:Date,
    editedBy:String,
});

const DefectData = mongoose.model('DefectData',defectDataSchema);

export default DefectData;