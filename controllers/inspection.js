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

    

        
      const { itemcode,color, datestart, dateend, supplier, buyer, material} = req.body;

      console.log(`getExportReportList called ${JSON.stringify(req.body)}`);
  
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
      if (supplier) {
        query['supplier._id'] = supplier;
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

      
      // Create a map to store inspection row IDs
      const inspectionRowIdMap = new Map();

      // Create sequential row ID for each inspection
      const inspectionsList = inspections.map((inspection, index) => {
          const RowId = index + 1; // Row ID starts from 1 and increments
          inspectionRowIdMap.set(inspection._id.toString(), RowId); // Map _id to Row ID
          
          // Reconstruct the inspection object with Row ID instead of _id
          return {
              RowId, // Row ID instead of _id
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

      // Fetch DefectData that matches inspection IDs
      const defectDatas = await DefectData.find({
          inspectionId: { $in: inspections.map(i => i._id) }
      }).sort({ inspectionId: -1, passType: -1 });

     // Map DefectData using the Row ID from inspections
      const defectDataList = defectDatas.flatMap(defect => {
        const RowId = inspectionRowIdMap.get(defect.inspectionId.toString()); // Get the Row ID from the map
        
        return defect.defectDetails.map(detail => ({
            RowId, // Use the Row ID instead of inspectionId
            PassType: defect.passType,
            DefectName: detail.defect.name, // Map each defect name
            Area: detail.area.name, // Map each area name
            MajorQty: detail.majorQty, // Map each majorQty
            NumericData: detail.numericData, // Map each numericData
        }));
      });

      console.log(`
         inspectionsList ${inspectionsList}

         defectDataList ${defectDataList}
        `)

      if(inspectionsList.length === 0 || defectDataList.length === 0)
        return res.status(200).json({ message:"export no",inspectionsList:[],defectDataList:[]});


      return res.status(200).json({
          message: "export list",
          inspectionsList,
          defectDataList
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

