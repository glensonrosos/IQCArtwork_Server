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

export const createItem = async (req,res)=>{
    const item = req.body;
    try{
        const newItem = await new Item(item);
        await newItem.save();
        res.status(201).json(item);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

export const createMultipleItem = async (req, res) => {
    const items = req.body; // Expecting an array of items
    try {
        const newItems = await Item.insertMany(items);
        res.status(201).json({message: "insertion successful"});
    } catch (error) {
        res.status(404).json({ message: error });
    }
}

export const findItems = async (req, res) => {

    const { itemCode } = req.body;
    try {
        const items = await Item.find({ itemCode: { $regex: `^${itemCode}`, $options: 'i' } }); 

        console.log(`findItem called with itemCode: ${itemCode}, results: ${JSON.stringify(items)}`);
        if (items.length > 0)
            return res.status(200).json({ items: items, message: "item found" });
        else
            return res.status(200).json({ items: [], message: "no found" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An error occurred", error: error.message });
    }
}


export const getItemById = async (req,res)=>{

    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id))
        return res.status(404).send('invalid item code ');
    try{
        const item = await Item.findOne({_id:id});

        console.log(`findItem called ${JSON.stringify(item)}`);
        if(item !== null)
            return res.status(200).json({item:item,message:"item found"});
        else
            return res.status(200).json({item:null,message:"no found"});
        
    }catch(error){
        console.log(error);
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
