import Inspection from "../models/inspection.js";
import DefectData from "../models/defectData.js";

import mongoose from "mongoose";
import moment from 'moment';

export const getInspections = async (req,res)=>{
    const {page} = req.query;
    try{
        const LIMIT = 15 ;

        //get the starting index of evert page;
        const startIndex = ( Number(page)-1 ) * LIMIT;
        const total = await Inspection.countDocuments({});

        const data = await Inspection.find().sort({ _id: -1}).limit(LIMIT).skip(startIndex);

        res.status(200).json({inspections: data, 
            currentPage:(Number(page)), numberOfPages:Math.ceil(total/ LIMIT) });

    }catch(error){
        res.status(404).json({message: error.message});
    }
}

export const getInspectionsBySearch = async (req, res) => {
    try {
      const { itemcode, color,datestart, dateend, supplier, buyer, material, unfinished, page } = req.query;
  
      // Format dates using moment, if provided
      const startOfDay = datestart ? moment(datestart).startOf('day').toDate() : null;
      const endOfDay = dateend ? moment(dateend).endOf('day').toDate() : null;
  
      // Initialize query object
      let query = {};
  
      // Construct the query object based on the presence of query parameters
      if (itemcode) {
        query['item.itemCode'] = { $regex: '.*' + itemcode + '.*', $options: 'i' }; // Case-insensitive search for itemCode
      }
      if (datestart && dateend) {
        query.date = { $gte: startOfDay, $lt: endOfDay }; // Date range query (start and end)
      } else if (datestart) {
        query.date = { $gte: startOfDay }; // Only start date provided
      } else if (dateend) {
        query.date = { $lt: endOfDay }; // Only end date provided
      }
      if (supplier) {
        query['supplier._id'] = supplier;
      }
      if (buyer) {
        query['buyer._id'] = buyer;
      }
      if (material) {
        query['material._id'] = material;
      }
      if (unfinished) {
        query.unfinished = { $ne: 0 }; // Filter where unfinished is not equal to 0
      }
      if (color) {
        query['item.color'] = { $regex: '.*' + color + '.*', $options: 'i' }; // Case-insensitive search for itemCode
      }
  
      // Pagination logic
      const LIMIT = 15;
      const startIndex = (Number(page) - 1) * LIMIT;
      
      // Fetch total documents count and filtered inspections
      const total = await Inspection.find(query).countDocuments();
      const inspections = await Inspection.find(query).sort({ _id: -1 }).limit(LIMIT).skip(startIndex);
  
      // Log the constructed query for debugging
      console.log(`query => ${JSON.stringify(query)}`);
  
      res.status(200).json({
        inspections,
        currentPage: Number(page),
        numberOfPages: Math.ceil(total / LIMIT),
      });
  
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  };

  export const getExportReportList = async (req, res) => {
    try {
        const { itemcode, color, datestart, dateend, supplier, buyer, material } = req.body;

        const startOfDay = datestart ? moment(datestart).startOf('day').toDate() : null;
        const endOfDay = dateend ? moment(dateend).endOf('day').toDate() : null;

        let query = {};

        if (itemcode) {
            query['item.itemCode'] = { $regex: '.*' + itemcode + '.*', $options: 'i' };
        }
        if (datestart && dateend) {
            query.date = { $gte: startOfDay, $lt: endOfDay };
        } else if (datestart) {
            query.date = { $gte: startOfDay };
        } else if (dateend) {
            query.date = { $lt: endOfDay };
        }
        if (supplier && supplier.length > 0) {
            // Assuming supplier is an array of supplier objects with _id properties
            const supplierIds = supplier.map(s => s._id);
            query['supplier._id'] = { $in: supplierIds };
        }
        if (buyer) {
            query['buyer._id'] = buyer;
        }
        if (material) {
            query['material._id'] = material;
        }
        if (color) {
            query['item.color'] = { $regex: '.*' + color + '.*', $options: 'i' };
        }

        const inspections = await Inspection.find(query).sort({ _id: -1 });

        const inspectionRowIdMap = new Map();
        const inspectionsList = inspections.map((inspection, index) => {
            const RowId = index + 1;
            inspectionRowIdMap.set(inspection._id.toString(), RowId);

            return {
                RowId,
                Date: moment(inspection.date).format('MM-DD-YYYY'),
                Supplier: inspection.supplier.name,
                ItemCode: inspection.item.itemCode,
                ItemDescription: inspection.item.itemDescription,
                ColorFinish: inspection.item.color,
                Buyer: inspection.buyer.name,
                Material: inspection.material.name,
                Weight: inspection.weight,
                DeliveryQty: inspection.deliveryQty,
                TotalMinWork: `${moment(inspection.totalMinWork.start).format('hh:mm A')}-${moment(inspection.totalMinWork.end).format('hh:mm A')}`,
                TotalGoodQty: inspection.totalGoodQty,
                TotalPullOutQty: inspection.totalPullOutQty,
                FirstPass_Defect: inspection.firstPass.defectQty,
                FirstPass_Good: inspection.firstPass.totalGoodQty,
                FirstPass_PullOut: inspection.firstPass.totalPullOutQty,
                SecondPass_Good: inspection.secondPass.totalGoodQty,
                SecondPass_PullOut: inspection.secondPass.totalPullOutQty,
                Unfinished: inspection.unfinished,
                DateClosure: moment(inspection.dateClosure).format('MM-DD-YYYY'),
            };
        });

        const defectDatas = await DefectData.find({
            'inspectionId.id': { $in: inspections.map(i => i._id) }
        }).sort({ inspectionId: -1, passType: -1 });

        const defectDataList = defectDatas.flatMap(defect => {
            const RowId = inspectionRowIdMap.get(defect.inspectionId.toString());

            return defect.defectDetails.map(detail => {

                let newPassType = '';

                if(defect.passType === 'firstPassDefect')
                    newPassType = '1stP Defect'
                else if(defect.passType === 'firstPassPullOut')
                    newPassType = '1stP PullOut'
                else if(defect.passType === 'secondPassPullOut')
                    newPassType = '(2nd-P) PullOut'

                return {
                    RowId,
                    PassType: newPassType,
                    DefectName: detail.defect.name,
                    Area: detail.area.name,
                    MajorQty: detail.majorQty,
                    NumericData: detail.numericData,
                }
            });
        });

        console.log(`
            inspectionsList ${inspectionsList}
            defectDataList ${defectDataList}
        `);

        if (inspectionsList.length === 0 || defectDataList.length === 0)
            return res.status(200).json({ message: "export no", inspectionsList: [], defectDataList: [] });

        return res.status(200).json({
            message: "export list",
            inspectionsList,
            defectDataList
        });

    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
};

export const getExportSumReport = async (req, res) => {
    try {
        const { itemcode, color, datestart, dateend, supplier, buyer, material } = req.body;

        const startOfDay = datestart ? moment(datestart).startOf('day').toDate() : null;
        const endOfDay = dateend ? moment(dateend).endOf('day').toDate() : null;

        let query = {};

        if (itemcode) {
            query['item.itemCode'] = { $regex: '.*' + itemcode + '.*', $options: 'i' };
        }
        if (datestart && dateend) {
            query.date = { $gte: startOfDay, $lt: endOfDay };
        } else if (datestart) {
            query.date = { $gte: startOfDay };
        } else if (dateend) {
            query.date = { $lt: endOfDay };
        }
        if (supplier && supplier.length > 0) {
            // Assuming supplier is an array of supplier objects with _id properties
            const supplierIds = supplier.map(s => s._id);
            query['supplier._id'] = { $in: supplierIds };
        }
        if (buyer) {
            query['buyer._id'] = buyer;
        }
        if (material) {
            query['material._id'] = material;
        }
        if (color) {
            query['item.color'] = { $regex: '.*' + color + '.*', $options: 'i' };
        }

        const inspections = await Inspection.find(query).sort({ _id: -1 });

        if (inspections.length === 0) {
            return res.status(200).json({ message: "export no", inspectionsSum: [] });
        }

        // Group and sum data
        const inspectionMap = {};
        
        inspections.forEach((inspection, index) => {
            const RowId = index + 1;
            const itemCode = inspection.item.itemCode;
            const supplierName = inspection.supplier.name;
            const buyerName = inspection.buyer.name;
            const materialName = inspection.material.name;
            const key = `${itemCode}_${supplierName}_${buyerName}_${materialName}`; // Unique key based on itemCode, supplier, buyer, and material

            if (!inspectionMap[key]) {
                inspectionMap[key] = {
                    RowId,
                    ItemCode: itemCode,
                    ItemDescription: inspection.item.itemDescription,
                    Supplier: supplierName,
                    Buyer: buyerName,
                    Material: materialName,
                    DeliveryQty: 0,
                    TotalGoodQty: 0,
                    TotalPullOutQty: 0,
                    FirstPass_Defect: 0,
                    FirstPass_Good: 0,
                    FirstPass_PullOut: 0,
                    SecondPass_Good: 0,
                    SecondPass_PullOut: 0,
                    Unfinished: 0
                };
            }

            // Sum values
            inspectionMap[key].DeliveryQty += inspection.deliveryQty || 0;
            inspectionMap[key].TotalGoodQty += inspection.totalGoodQty || 0;
            inspectionMap[key].TotalPullOutQty += inspection.totalPullOutQty || 0;
            inspectionMap[key].FirstPass_Defect += inspection.firstPass?.defectQty || 0;
            inspectionMap[key].FirstPass_Good += inspection.firstPass?.totalGoodQty || 0;
            inspectionMap[key].FirstPass_PullOut += inspection.firstPass?.totalPullOutQty || 0;
            inspectionMap[key].SecondPass_Good += inspection.secondPass?.totalGoodQty || 0;
            inspectionMap[key].SecondPass_PullOut += inspection.secondPass?.totalPullOutQty || 0;
            inspectionMap[key].Unfinished += inspection.unfinished ? 1 : 0;
        });

        // Convert the map to an array and sort by supplier name
        const exportSumReport = Object.values(inspectionMap).sort((a, b) => a.Supplier.localeCompare(b.Supplier));

        //console.log(` exportSumReport => ${JSON.stringify(exportSumReport)}`);

        return res.status(200).json({
            message: "export sum",
            exportSumReport,
        });

    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
};

export const getExportDefectsReport = async (req, res) => {
    try {
        const { itemcode, color, datestart, dateend, supplier, buyer, material } = req.body;

        const startOfDay = datestart ? moment(datestart).startOf('day').toDate() : null;
        const endOfDay = dateend ? moment(dateend).endOf('day').toDate() : null;

        let query = {};

        if (itemcode) {
            query['item.itemCode'] = { $regex: '.*' + itemcode + '.*', $options: 'i' };
        }
        if (datestart && dateend) {
            query.date = { $gte: startOfDay, $lt: endOfDay };
        } else if (datestart) {
            query.date = { $gte: startOfDay };
        } else if (dateend) {
            query.date = { $lt: endOfDay };
        }
        if (supplier && supplier.length > 0) {
            const supplierIds = supplier.map(s => s._id);
            query['supplier._id'] = { $in: supplierIds };
        }
        if (buyer) {
            query['buyer._id'] = buyer;
        }
        if (material) {
            query['material._id'] = material;
        }
        if (color) {
            query['item.color'] = { $regex: '.*' + color + '.*', $options: 'i' };
        }

        const inspections = await Inspection.find(query).sort({ _id: -1 });

        if (inspections.length === 0) {
            return res.status(200).json({ message: "export no", inspectionsSum: [] });
        }

        // Get the inspection IDs
        const inspectionIds = inspections.map(ins => ins._id);

        // Aggregate `DefectData` based on `inspectionId.id` in `inspectionIds`
        const defectDataAggregation = await DefectData.aggregate([
            {
                $match: {
                    'inspectionId.id': { $in: inspectionIds }
                }
            },
            {
                $unwind: "$defectDetails"
            },
            {
                $group: {
                    _id: {
                        defectName: "$defectDetails.defect.name",
                        passType: "$passType"
                    },
                    totalMajorQty: { $sum: "$defectDetails.majorQty" }
                }
            },
            {
                $group: {
                    _id: "$_id.defectName",
                    defectData: {
                        $push: {
                            passType: "$_id.passType",
                            totalMajorQty: "$totalMajorQty"
                        }
                    }
                }
            },
            {
                $addFields: {
                    defectData: {
                        $map: {
                            input: ["firstPassDefect", "firstPassPullOut", "secondPassPullOut"],
                            as: "passType",
                            in: {
                                passType: "$$passType",
                                totalMajorQty: {
                                    $let: {
                                        vars: {
                                            matchingDefect: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$defectData",
                                                            as: "item",
                                                            cond: { $eq: ["$$item.passType", "$$passType"] }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        },
                                        in: {
                                            $ifNull: ["$$matchingDefect.totalMajorQty", 0]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    defectName: "$_id",
                    defectData: 1
                }
            }
        ]);

        return res.status(200).json({
            message: "export defects",
            exportDefectsReport: defectDataAggregation,
        });

    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
};



export const createInspection = async (req,res)=>{
    const inspection = req.body;

    try{

        const startOfDay = moment(inspection.date).startOf('day').toDate();
        const endOfDay = moment(inspection.date).endOf('day').toDate();

        const isDuplicateItemCode = await Inspection.findOne({
            'item._id': inspection.item._id,
            date: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        }).countDocuments();

        if (isDuplicateItemCode > 0) {
            return res.status(200).json({message:'duplicate'});
        }

        const newInspection = await new Inspection(inspection);
       
        newInspection.date = inspection.date;
        newInspection.dateClosure = inspection.dateClosure;
        newInspection.supplier = inspection.supplier;
        newInspection.item = inspection.item;
        newInspection.deliveryQty = inspection.deliveryQty;
        newInspection.totalMinWork = inspection.totalMinWork;
        newInspection.buyer = inspection.buyer;
        newInspection.material = inspection.material;
        newInspection.weight = inspection.weight;
        newInspection.totalGoodQty = inspection.totalGoodQty;
        newInspection.totalPullOutQty = inspection.totalPullOutQty;

        newInspection.firstPass.defectQty = inspection.firstPass.defectQty;
        newInspection.firstPass.totalGoodQty = inspection.firstPass.totalGoodQty;
        newInspection.firstPass.totalPullOutQty= inspection.firstPass.totalPullOutQty;
           
        newInspection.secondPass.totalGoodQty= inspection.secondPass.totalGoodQty;
        newInspection.secondPass.totalPullOutQty= inspection.secondPass.totalPullOutQty;

        newInspection.remarks = newInspection.remarks;
        newInspection.unfinished = newInspection.unfinished;
        newInspection.createdAt = new Date().toISOString();
        newInspection.updatedAt = new Date().toISOString();
        newInspection.deletedAt = null;
        newInspection.editedBy = newInspection.editedBy;


        await newInspection.save();
        res.status(201).json({inspection:newInspection,message:'good'});
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

export const editInspection = async (req,res) =>{

    const { id:_id } = req.params;
    const {date,supplier,item,deliveryQty,totalMinWork,buyer,material,weight,totalGoodQty,totalPullOutQty,
        firstPass,secondPass,remarks,unfinished,editedBy,dateClosure} = req.body;
    
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();

    if(!mongoose.Types.ObjectId.isValid(_id))
        return res.status(404).send('no item exist with that id');
    try{
        //
        let isDuplicateInspection = await Inspection.find({
            date:{
                $gte: startOfDay,
                $lt: endOfDay
            },'item._id':item._id,
            _id:{$ne:_id}}).countDocuments();

       
        if (isDuplicateInspection > 0) {
            return res.status(200).json({message:'edit duplicate'});
        }
        //

        const editedInspection = await Inspection.
            findByIdAndUpdate(_id,{date,supplier,item,deliveryQty,totalMinWork,buyer,material,weight,totalGoodQty,totalPullOutQty,
                firstPass,secondPass,remarks,unfinished,dateClosure,editedBy,
                updatedAt:new Date().toISOString(),
            },{new:true});

        await DefectData.updateMany({'inspectionId.id':_id},{
            inspectionId:{
                id:_id,
                date:date
            }
        },{new:true});

        res.json(editedInspection);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}



export const getInspectionById = async (req,res)=>{

    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id))
        return res.status(404).send('invalid item code ');
    try{

        const inspection = await Inspection.findOne({'_id':id});
      
        if(inspection !== null)
            return res.status(200).json({inspection,message:"found"});
        else
            return res.status(200).json({inspection:null,message:"no found"});
    }catch(error){
        return res.status(404).json({message: error});
    }
}

