import Defect from "../models/defect.js";

export const getDefects = async (req,res)=>{
    try{
        const defects = await Defect.find();
        res.status(200).json(defects);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}
export const createDefect = async (req,res)=>{
    const defect = req.body;
    try{
        const newDefect = await new Defect(defect);
        await newDefect.save();
        res.status(201).json(defect);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

