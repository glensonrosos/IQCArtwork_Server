import Inspection from "../models/inspection.js";
import mongoose from "mongoose";
import moment from 'moment';

export const getInspections = async (req,res)=>{
    const {page} = req.query;
    try{
        const LIMIT = 2 ;

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
      const { itemcode, datestart, dateend, supplier, buyer, material, unfinished, page } = req.query;
  
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
  
      // Pagination logic
      const LIMIT = 2;
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
        firstPass,secondPass,remarks,unfinished,editedBy} = req.body;
    
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
                firstPass,secondPass,remarks,unfinished,editedBy,
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

