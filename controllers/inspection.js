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

        // Handle itemcode as an array
        if (itemcode && itemcode.length > 0) {
            query['item.itemCode'] = { $in: itemcode.map(code => new RegExp('.*' + code + '.*', 'i')) };
        }

        // Handle color as an array
        if (color && color.length > 0) {
            query['item.color'] = { $in: color.map(c => new RegExp('.*' + c + '.*', 'i')) };
        }

        // Handle date range
        if (datestart && dateend) {
            query.date = { $gte: startOfDay, $lt: endOfDay };
        } else if (datestart) {
            query.date = { $gte: startOfDay };
        } else if (dateend) {
            query.date = { $lt: endOfDay };
        }

        // Handle supplier filtering
        if (supplier && supplier.length > 0) {
            const supplierIds = supplier.map(s => s._id);
            query['supplier._id'] = { $in: supplierIds };
        }

        // Handle buyer
        if (buyer) {
            query['buyer._id'] = buyer;
        }

        // Handle material
        if (material) {
            query['material._id'] = material;
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
                TotalMinWork: `${moment(inspection.totalMinWork.start, "HH:mm").format("hh:mm A")}-${moment(inspection.totalMinWork.end, "HH:mm").format("hh:mm A")}`,
                TotalGoodQty: inspection.totalGoodQty,
                TotalPullOutQty: inspection.totalPullOutQty,
                FirstPass_Defect: inspection.firstPass.defectQty,
                FirstPass_Good: inspection.firstPass.totalGoodQty,
                FirstPass_PullOut: inspection.firstPass.totalPullOutQty,
                SecondPass_Good: inspection.secondPass.totalGoodQty,
                SecondPass_PullOut: inspection.secondPass.totalPullOutQty,
                Unfinished: inspection.unfinished,
                DateClosure: moment(inspection.dateClosure).isValid() ? moment(inspection.dateClosure).format('MM-DD-YYYY') : 'NA'
            };
        });

        // Fetch defect data with appropriate mapping
        const defectDatas = await DefectData.find({
            'inspectionId.id': { $in: inspections.map(i => i._id) }
        }).sort({ 'inspectionId.id': -1, passType: -1 });

        const defectDataList = defectDatas.flatMap(defect => {
            const RowId = inspectionRowIdMap.get(defect.inspectionId.id.toString());

            return defect.defectDetails.map(detail => {
                let newPassType = '';
                if (defect.passType === 'firstPassDefect') {
                    newPassType = '1stP Defect';
                } else if (defect.passType === 'firstPassPullOut') {
                    newPassType = '1stP PullOut';
                } else if (defect.passType === 'secondPassPullOut') {
                    newPassType = '(2nd-P) PullOut';
                }

                return {
                    RowId,
                    PassType: newPassType,
                    DefectName: detail.defect.name,
                    Area: detail.area.name,
                    MajorQty: detail.majorQty,
                    NumericData: detail.numericData,
                };
            });
        });

        console.log(`
            inspectionsList ${JSON.stringify(inspectionsList, null, 2)}
            defectDataList ${JSON.stringify(defectDataList, null, 2)}
        `);

        if (inspectionsList.length === 0 && defectDataList.length === 0) {
            return res.status(200).json({ message: "export no", inspectionsList: [], defectDataList: [] });
        }

        return res.status(200).json({
            message: "export list",
            inspectionsList,
            defectDataList,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

export const getExportSumReport = async (req, res) => {
    try {
        const { itemcode, color, datestart, dateend, supplier, buyer, material } = req.body;

        const startOfDay = datestart ? moment(datestart).startOf('day').toDate() : null;
        const endOfDay = dateend ? moment(dateend).endOf('day').toDate() : null;

        let query = {};

        // Handle itemcode as an array
        if (itemcode && itemcode.length > 0) {
            query['item.itemCode'] = { $in: itemcode.map(code => new RegExp('.*' + code + '.*', 'i')) };
        }

        // Handle color as an array
        if (color && color.length > 0) {
            query['item.color'] = { $in: color.map(c => new RegExp('.*' + c + '.*', 'i')) };
        }

        // Handle date range
        if (datestart && dateend) {
            query.date = { $gte: startOfDay, $lt: endOfDay };
        } else if (datestart) {
            query.date = { $gte: startOfDay };
        } else if (dateend) {
            query.date = { $lt: endOfDay };
        }

        // Handle supplier filtering
        if (supplier && supplier.length > 0) {
            const supplierIds = supplier.map(s => s._id);
            query['supplier._id'] = { $in: supplierIds };
        }

        // Handle buyer
        if (buyer) {
            query['buyer._id'] = buyer;
        }

        // Handle material
        if (material) {
            query['material._id'] = material;
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
                    ColorFinish: inspection.item.color,
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
            inspectionMap[key].Unfinished += inspection.unfinished || 0;
        });

        // Convert the map to an array and sort by supplier name
        const exportSumReport = Object.values(inspectionMap).sort((a, b) => a.Supplier.localeCompare(b.Supplier));

        return res.status(200).json({
            message: "export sum",
            exportSumReport,
        });

    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
};

export const getExportSuppliersSumReport = async (req, res) => {
    try {

        const { itemcode, color, datestart, dateend, supplier, buyer, material } = req.body;

        const startOfDay = datestart ? moment(datestart).startOf('day').toDate() : null;
        const endOfDay = dateend ? moment(dateend).endOf('day').toDate() : null;

        let query = {};

        // Handle itemcode as an array
        if (itemcode && itemcode.length > 0) {
            query['item.itemCode'] = { $in: itemcode.map(code => new RegExp('.*' + code + '.*', 'i')) };
        }

        // Handle color as an array
        if (color && color.length > 0) {
            query['item.color'] = { $in: color.map(c => new RegExp('.*' + c + '.*', 'i')) };
        }

        // Handle date range
        if (datestart && dateend) {
            query.date = { $gte: startOfDay, $lt: endOfDay };
        } else if (datestart) {
            query.date = { $gte: startOfDay };
        } else if (dateend) {
            query.date = { $lt: endOfDay };
        }

        // Handle supplier filtering
        if (supplier && supplier.length > 0) {
            const supplierIds = supplier.map(s => s._id);
            query['supplier._id'] = { $in: supplierIds };
        }

        // Handle buyer
        if (buyer) {
            query['buyer._id'] = buyer;
        }

        // Handle material
        if (material) {
            query['material._id'] = material;
        }


        const inspections = await Inspection.find(query).sort({ _id: -1 });

        if (inspections.length === 0) {
            return res.status(200).json({ message: "export no", exportSuppliersSumReport: [] });
        }

        // Group and sum data
        const inspectionMap = {};
        
        inspections.forEach((inspection, index) => {
            const RowId = index + 1;
            const supplierName = inspection.supplier.name;
            const key = `${supplierName}`; // Unique key based on itemCode, supplier, buyer, and material

            if (!inspectionMap[key]) {
                inspectionMap[key] = {
                    RowId,
                    Supplier: supplierName,
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
            inspectionMap[key].Unfinished += inspection.unfinished || 0;
        });

        // Convert the map to an array and sort by supplier name
        const exportSuppliersSumReport = Object.values(inspectionMap).sort((a, b) => a.Supplier.localeCompare(b.Supplier));

         // Extract unique rows from inspections
         const uniqueAffectedRows = inspections.map(ins => ({
          itemCode: ins.item?.itemCode || "",
          color: ins.item?.color || "",
          supplier: ins.supplier?.name || "",
          buyer: ins.buyer?.name || "",
          material: ins.material?.name || ""
      })).filter((row, index, self) => 
          index === self.findIndex(r => 
              r.itemCode === row.itemCode &&
              r.color === row.color &&
              r.supplier === row.supplier &&
              r.buyer === row.buyer &&
              r.material === row.material
          )
      );

        return res.status(200).json({
            message: "export suppliers sum",
            exportSuppliersSumReport,
            affectedRowsInspection: uniqueAffectedRows
        });

    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
};

export const getExportItemsSumReport = async (req, res) => {
    try {
        const { itemcode, color, datestart, dateend, supplier, buyer, material } = req.body;

        const startOfDay = datestart ? moment(datestart).startOf('day').toDate() : null;
        const endOfDay = dateend ? moment(dateend).endOf('day').toDate() : null;

        let query = {};

        // Handle itemcode as an array
        if (itemcode && itemcode.length > 0) {
            query['item.itemCode'] = { $in: itemcode.map(code => new RegExp('.*' + code + '.*', 'i')) };
        }

        // Handle color as an array
        if (color && color.length > 0) {
            query['item.color'] = { $in: color.map(c => new RegExp('.*' + c + '.*', 'i')) };
        }

        // Handle date range
        if (datestart && dateend) {
            query.date = { $gte: startOfDay, $lt: endOfDay };
        } else if (datestart) {
            query.date = { $gte: startOfDay };
        } else if (dateend) {
            query.date = { $lt: endOfDay };
        }

        // Handle supplier filtering
        if (supplier && supplier.length > 0) {
            const supplierIds = supplier.map(s => s._id);
            query['supplier._id'] = { $in: supplierIds };
        }

        // Handle buyer
        if (buyer) {
            query['buyer._id'] = buyer;
        }

        // Handle material
        if (material) {
            query['material._id'] = material;
        }


        const inspections = await Inspection.find(query).sort({ _id: -1 });

        if (inspections.length === 0) {
            return res.status(200).json({ message: "export no", exportItemsSumReport: [] });
        }

        // Group and sum data
        const inspectionMap = {};
        
        inspections.forEach((inspection, index) => {
            const RowId = index + 1;
            const itemCode = inspection.item.itemCode;
            const key = `${itemCode}`; // Unique key based on itemCode, supplier, buyer, and material

            if (!inspectionMap[key]) {
                inspectionMap[key] = {
                    RowId,
                    ItemCode: itemCode,
                    ItemDescription: inspection.item.itemDescription,
                    ColorFinish: inspection.item.color,
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
            inspectionMap[key].Unfinished += inspection.unfinished || 0;
        });

        // Convert the map to an array and sort by supplier name
        const exportItemsSumReport = Object.values(inspectionMap).sort((a, b) => a.ItemCode.localeCompare(b.ItemCode));


           // Extract unique rows from inspections
           const uniqueAffectedRows = inspections.map(ins => ({
            itemCode: ins.item?.itemCode || "",
            color: ins.item?.color || "",
            supplier: ins.supplier?.name || "",
            buyer: ins.buyer?.name || "",
            material: ins.material?.name || ""
        })).filter((row, index, self) => 
            index === self.findIndex(r => 
                r.itemCode === row.itemCode &&
                r.color === row.color &&
                r.supplier === row.supplier &&
                r.buyer === row.buyer &&
                r.material === row.material
            )
        );

        return res.status(200).json({
            message: "export items sum",
            exportItemsSumReport,
            affectedRowsInspection: uniqueAffectedRows
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

        // Handle itemcode as an array
        if (itemcode && itemcode.length > 0) {
            query['item.itemCode'] = { $in: itemcode.map(code => new RegExp('.*' + code + '.*', 'i')) };
        }

        // Handle color as an array
        if (color && color.length > 0) {
            query['item.color'] = { $in: color.map(c => new RegExp('.*' + c + '.*', 'i')) };
        }

        // Handle date range
        if (datestart && dateend) {
            query.date = { $gte: startOfDay, $lt: endOfDay };
        } else if (datestart) {
            query.date = { $gte: startOfDay };
        } else if (dateend) {
            query.date = { $lt: endOfDay };
        }

        // Handle supplier filtering
        if (supplier && supplier.length > 0) {
            const supplierIds = supplier.map(s => s._id);
            query['supplier._id'] = { $in: supplierIds };
        }

        // Handle buyer
        if (buyer) {
            query['buyer._id'] = buyer;
        }

        // Handle material
        if (material) {
            query['material._id'] = material;
        }


        const inspections = await Inspection.find(query).sort({ _id: -1 });

        if (inspections.length === 0) {
            return res.status(200).json({ message: "export no", inspectionsSum: [],affectedRows:[] });
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
                        areaName: "$defectDetails.area.name",
                        passType: "$passType"
                    },
                    totalMajorQty: { $sum: "$defectDetails.majorQty" }
                }
            },
            {
                $group: {
                    _id: {
                        defectName: "$_id.defectName",
                        areaName: "$_id.areaName"
                    },
                    passTypeData: {
                        $push: {
                            passType: "$_id.passType",
                            totalMajorQty: "$totalMajorQty"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    defectName: "$_id.defectName",
                    areaName: "$_id.areaName",
                    firstPassDefect: {
                        $let: {
                            vars: {
                                match: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$passTypeData",
                                                as: "data",
                                                cond: { $eq: ["$$data.passType", "firstPassDefect"] }
                                            }
                                        },
                                        0
                                    ]
                                }
                            },
                            in: { $ifNull: ["$$match.totalMajorQty", 0] }
                        }
                    },
                    firstPassPullOut: {
                        $let: {
                            vars: {
                                match: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$passTypeData",
                                                as: "data",
                                                cond: { $eq: ["$$data.passType", "firstPassPullOut"] }
                                            }
                                        },
                                        0
                                    ]
                                }
                            },
                            in: { $ifNull: ["$$match.totalMajorQty", 0] }
                        }
                    },
                    secondPassPullOut: {
                        $let: {
                            vars: {
                                match: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$passTypeData",
                                                as: "data",
                                                cond: { $eq: ["$$data.passType", "secondPassPullOut"] }
                                            }
                                        },
                                        0
                                    ]
                                }
                            },
                            in: { $ifNull: ["$$match.totalMajorQty", 0] }
                        }
                    }
                }
            },
            {
                $sort: { defectName: 1, areaName: 1 }
            }
        ]);


         // Extract unique rows from inspections
         const uniqueAffectedRows = inspections.map(ins => ({
            itemCode: ins.item?.itemCode || "",
            color: ins.item?.color || "",
            supplier: ins.supplier?.name || "",
            buyer: ins.buyer?.name || "",
            material: ins.material?.name || ""
        })).filter((row, index, self) => 
            index === self.findIndex(r => 
                r.itemCode === row.itemCode &&
                r.color === row.color &&
                r.supplier === row.supplier &&
                r.buyer === row.buyer &&
                r.material === row.material
            )
        );

        return res.status(200).json({
            message: "export defects",
            exportDefectsReport: defectDataAggregation,
            affectedRowsInspection: uniqueAffectedRows
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

        const isDuplicateItemCode =  await Inspection.findOne({
            date: {
                $gte: startOfDay,
                $lt: endOfDay
            },
            'item._id': inspection.item._id,
            'supplier._id': inspection.supplier._id,
            'totalMinWork.start':inspection.totalMinWork.start,
            'totalMinWork.end':inspection.totalMinWork.end
        }).countDocuments();

        if (isDuplicateItemCode) {
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

        newInspection.passIssues.firstDefect = 0;
        newInspection.passIssues.firstPullOut = 0;
        newInspection.passIssues.secondPullOut = 0;
           
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
  
        const isDuplicateInspection = await Inspection.findOne({
            date: {
                $gte: startOfDay,
                $lt: endOfDay
            },
            'item._id': item._id,
            'supplier._id': supplier._id,
            'totalMinWork.start':totalMinWork.start,
            'totalMinWork.end':totalMinWork.end,
            _id: { $ne: _id } // Exclude the current document
        });

       
        if (isDuplicateInspection) {
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

