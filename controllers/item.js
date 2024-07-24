import Item from "../models/item.js";
import mongoose from "mongoose";

export const getItems = async (req,res)=>{
    const {page} = req.query;
    try{
        const LIMIT = 5 ;

        //get the starting index of evert page;
        const startIndex = ( Number(page)-1 ) * LIMIT;
        const total = await Item.countDocuments({});

        const data = await Item.find().sort({ _id: -1}).limit(LIMIT).skip(startIndex);

        res.status(200).json({items: data, 
            currentPage:(Number(page)), numberOfPages:Math.ceil(total/ LIMIT) });

    }catch(error){
        res.status(404).json({message: error.message});
    }
}

export const getItemsBySearch = async (req,res)=>{
    try{

        const {itemcode,itemdesc,supplier,buyer,material,moldMaterial,page} = req.query;

        let query = {};
      
        // Construct the query object based on the presence of query parameters
        
        if (itemcode) {
        query.itemCode = {$regex: '.*' + itemcode + '.*', $options: 'i'};
        }
        if (itemdesc) {
        query.itemDescription = {$regex: '.*' + itemdesc + '.*', $options: 'i'};
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
        if (moldMaterial) {
        query['moldMaterial._id'] = moldMaterial;
        }
        

        let items = [];
        const LIMIT = 5 ;
        //get the starting index of evert page;
        const startIndex = ( Number(page)-1 ) * LIMIT;
        let total = null;
     
        // If no query parameters are provided, find all documents
        if (Object.keys(query).length === 0) {
            total = await Item.find().countDocuments();
            items = await Item.find();
        } else {
            total = await Item.find(query).countDocuments();
            items = await Item.find(query).sort({ _id: -1 }).limit(LIMIT).skip(startIndex);
        }


        res.status(200).json({items, 
            currentPage:(Number(page)), numberOfPages:Math.ceil(total/ LIMIT) });

    }catch(error){
        res.status(404).json({message: error.message});
    }
}

export const createItem = async (req,res)=>{
    const item = req.body;

    try{

        const isDuplicateItemCode = await Item.findOne({itemCode:item.itemCode, 'supplier._id': item.supplier._id});

        if (isDuplicateItemCode) {
            return res.status(200).json({message:'duplicate'});
        }

        const newItem = await new Item(item);
        newItem.createdAt = new Date().toISOString();
        newItem.updatedAt = new Date().toISOString();
        newItem.deletedAt = null;

        await newItem.save();
        res.status(201).json(newItem);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

export const editItem = async (req,res) =>{

    const { id:_id } = req.params;
    const {itemCode,prevSupplier,itemDescription,supplier,buyer,material,moldMaterial,lastEditdBy} = req.body;

    if(!mongoose.Types.ObjectId.isValid(_id))
        return res.status(404).send('no item exist with that id');

    try{

        
        //
        let isDuplicateItem = await Item.find({itemCode:itemCode,'supplier._id': supplier._id}).countDocuments();

        if(prevSupplier._id === supplier._id)
            isDuplicateItem = isDuplicateItem - 1;

        if (isDuplicateItem > 0) {
            return res.status(200).json({message:'edit duplicate'});
        }
        //
        const editedItem = await Item.
            findByIdAndUpdate(_id,{itemCode,itemDescription,supplier,buyer,material,moldMaterial,_id,
                updatedAt:new Date().toISOString(),
                lastEditdBy 
            },{new:true});

        res.json(editedItem);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}
