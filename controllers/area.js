import Area from "../models/area.js";

export const getAreas = async (req,res)=>{
    try{
        const areas = await Area.find();
        res.status(200).json(areas);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}
export const createArea = async (req,res)=>{
    const area = req.body;
    try{
        const newArea = await new Area(area);
        await newArea.save();
        res.status(201).json(area);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

