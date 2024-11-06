import DefectData from "../models/defectData.js";
import Inspection from "../models/inspection.js";

import mongoose from "mongoose";

export const getDefectDatas = async (req, res) => {
    const { inspectionId, passType } = req.params;
    
    console.log(`inspectionId => ${JSON.stringify(req.params)}`)

    try {

        // Find defect data based on inspectionId and passType
        const defectDatas = await DefectData.findOne({'inspectionId.id':inspectionId,passType});
        
        if (!defectDatas) {
            return res.status(200).json({defectDetails:[] });
        }

        return res.status(200).json(defectDatas);   

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while retrieving defect data." });
    }
};



export const createDefectData = async (req,res)=>{
    const defectData = req.body;

    try{

        const checkInspectionExist = await Inspection.findOne({_id:defectData.inspectionId});
        if(!checkInspectionExist){
            return res.status(404).json({message: "not exist"});
        }

        const checkExist = await DefectData.findOne({'inspectionId.id':defectData.inspectionId,passType:defectData.passType});
        if(checkExist){
            const updatedDefectData = await DefectData.findByIdAndUpdate(checkExist._id,{defectDetails:defectData.defectDetails,
                createdAt:new Date().toISOString(),
                updatedAt:new Date().toISOString(),
                deletedAt:null,
                editedBy:defectData.editedBy,
                'inspectionId.date': checkInspectionExist.date
            },{new:true});
            return res.status(201).json(updatedDefectData);
        }else{
            const newDefectData = await new DefectData({...defectData,
                createdAt:new Date().toISOString(),
                updatedAt:new Date().toISOString(),
                deletedAt:null,
                editedBy:defectData.editedBy,
                inspectionId:{
                    id: checkInspectionExist._id,
                    date: checkInspectionExist.date
                }
            });
            await newDefectData.save();
            return res.status(201).json(defectData);
        }
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

export const updateDefectData = async (req,res)=>{
    const defectData = req.body;
    const {_id} = req.params;

    try{
        const checkExist = await DefectData.findOne({'inspectionId.id':_id});
        if(checkExist){
            const updatedDefectData = await DefectData.findByIdAndUpdate(checkExist._id,{defectDetails:defectData.defectDetails},{new:true});
            return res.status(201).json(updatedDefectData);
        }
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

export const checkEmptyDefect = async (req,res)=>{

    const {inspectionId} = req.body;

    let flag = false;

    try{
        const checkExist = await Inspection.findOne({_id:inspectionId});

        // console.log(` checkEmptyDefect called with ${JSON.stringify(checkExist)}`);

        if(checkExist){

            const defectFirstDefect = await DefectData.findOne({'inspectionId.id':inspectionId,passType:'firstPassDefect'});
            const defectFirstPullOut = await DefectData.findOne({'inspectionId.id':inspectionId,passType:'firstPassPullOut'});
            const defectSecondPullOut = await DefectData.findOne({'inspectionId.id':inspectionId,passType:'secondPassPullOut'});
           
          
            let firstDefectFlag = parseInt(checkExist.firstPass.defectQty);
            let firstPullOutFlag = parseInt(checkExist.firstPass.totalPullOutQty);
            let secondPullOutFlag = parseInt(checkExist.secondPass.totalPullOutQty);


            switch (true) {
                case true:
                    if(firstDefectFlag > 0){
                        if(defectFirstDefect == null){
                            flag = true;
                            break;
                        }else if(defectFirstDefect.defectDetails[0])
                            flag = false;
                        else{
                            flag = true;
                            break;
                        }
                    }
                   
                case true:
                    if(firstPullOutFlag > 0){
                        if(defectFirstPullOut == null){
                            flag = true;
                            break;
                        }else if(defectFirstPullOut.defectDetails[0])
                            flag = false;
                        else{
                            flag = true;
                            break;
                        }
                    }
                   
                case true:
                    if(secondPullOutFlag > 0){
                        if(defectSecondPullOut == null){
                            flag = true;
                            break;
                        }else if(defectSecondPullOut.defectDetails[0])
                            flag = false;
                        else{
                            flag = true;
                            break;
                        }
                    }
                    
                default:
                    // Default case if no action matches
                    break;
            }

            console.log(` flag => ${flag}
                \n ${firstDefectFlag ? 1 : 0} firstDefectFlag ${defectFirstDefect?.defectDetails[0]?.id ? 1 : 0}
                \n ${firstPullOutFlag ? 1 : 0}  firstPullOutFlag ${defectFirstPullOut?.defectDetails[0]?.id ? 1 : 0}
                 \n ${secondPullOutFlag ? 1 : 0} secondPullOutFlag ${defectSecondPullOut?.defectDetails[0]?.id ? 1 : 0}
                `);

            await Inspection.findByIdAndUpdate({_id:inspectionId},{emptyDefect:flag},{new:true});


            return res.status(201).json({message: 'found',counting:{
                firstDefect: firstDefectFlag ? 1 : 0,
                firstDefectRows: defectFirstDefect?.defectDetails[0]?.id ? 1 : 0,
                firstPullOut: firstPullOutFlag ? 1 : 0,
                firstPullOutRows: defectFirstPullOut?.defectDetails[0]?.id ? 1 : 0,
                secondPullOut: secondPullOutFlag ? 1 : 0,
                secondPullOutRows: defectSecondPullOut?.defectDetails[0]?.id ? 1 : 0
            }});
        }
        return res.status(201).json({message: 'no found',flag,counting:{
            firstDefect: firstDefectFlag ? 1 : 0,
            firstDefectRows: defectFirstDefect?.defectDetails[0]?.id ? 1 : 0,
            firstPullOut: firstPullOutFlag ? 1 : 0,
            firstPullOutRows: defectFirstPullOut?.defectDetails[0]?.id ? 1 : 0,
            secondPullOut: secondPullOutFlag ? 1 : 0,
            secondPullOutRows: defectSecondPullOut?.defectDetails[0]?.id ? 1 : 0
        }});
    }catch(error){
        res.status(404).json({message: error.message});
    }
}
