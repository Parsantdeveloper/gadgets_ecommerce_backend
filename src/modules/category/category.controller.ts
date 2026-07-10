
import { Request,Response,NextFunction } from "express";
import { CategoryService } from "./category.service.js";
import { CreateCategorySchema,GetCategoriesSchema,UpdateCategorySchema , CreateBulkCategoriesSchema} from "./category.schema.js";
import { ApiResponse } from "@/utils/ApiResponce.js";
const categoryService=new CategoryService();

export const createCategory=async(req:Request,res:Response,next:NextFunction)=>{
  try {
    let category = await categoryService.createCategory(CreateCategorySchema.parse(req.body));
    res.status(201).json( ApiResponse.success( category,{},"Category created successfully"));
  } catch (error) {
    next(error)
  }
}

export const getCategories=async(req:Request,res:Response,next:NextFunction)=>{
  try {
    let categories = await categoryService.getCategories(GetCategoriesSchema.parse(req.query));
res.status(200).json(
  new ApiResponse({
    success: true,
    message: "Categories fetched successfully",
    data: categories.data,
    meta: categories.meta,
  })
);  } catch (error) {
    next(error)
  }
}

export const getCategoryParentChild = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.getCategoryParentChild();
    res
      .status(200)
      .json(ApiResponse.success(categories, {}, "Parent-child categories fetched successfully"));
  } catch (error) {
    next(error);
  }
}


export const updateCategory= async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const data = UpdateCategorySchema.parse(req.body)
    const id:string =req.params.id as string ;
  const category = await categoryService.updateCategory({
  id,
  data,
})
res.status(200).json( ApiResponse.success(category,{},"Category updated successfully"))
  } catch (error) {
    next(error)
  }
}

export const deleteCategory=async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const id = req.params.id as string;
    const category = await categoryService.deleteCategory(id);
    res.status(200).json(ApiResponse.success(category,{},"Category deleted successfully"))
  } catch (error) {
    next(error)
  }
}

export const getCategoryForLandingPage=async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const categories = await categoryService.getCategoryForLanding();
    res.status(200).json(ApiResponse.success(categories,{},"Categories fetched successfully"))
  } catch (error) {
    next(error)
  }
}

export const createBulkCategories=async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const input = CreateBulkCategoriesSchema.parse(req.body);
    const categories = await categoryService.createBulkCategories(input);
    res.status(201).json(ApiResponse.success(categories,{},"Categories created successfully"))
  } catch (error) {
    next(error)
  }
}