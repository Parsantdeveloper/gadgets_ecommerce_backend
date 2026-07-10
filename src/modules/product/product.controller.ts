
import { Request, Response } from "express";
import { createProductPayloadSchema, updateProductPayloadSchema,updateProductVariantPayloadSchema ,productVariantSchema, getProductsQuerySchema} from "./product.schema.js";
import productService from "./product.service.js";
import { ApiResponse } from "@/utils/ApiResponce.js";
 export const createProductHandler=async (req:Request, res:Response, next:Function)=>{
  try {
    const payload = createProductPayloadSchema.parse(req.body);
    const product = await productService.createProduct(payload);
    res.status(201).json( ApiResponse.success(product,{},"Product created successfully"));
  } catch (error) {
    next(error);
  }
 }

  export const getProductById = async (req:Request, res:Response, next:Function)=>{
    try {
        const  slug :string = req.params.slug as string;
        const product = await productService.getProductBySlug(slug);
        res.status(200).json( ApiResponse.success(product,{},"Product retrieved successfully"));
    } catch (error) {
        next(error)
    }
  }

 export const searchProducts = async (req: Request, res: Response, next: Function) => {
  try {
    const searchTerm = req.query.searchTerm as string;


    const results = await productService.searchProducts(searchTerm);

    res.status(200).json(
      ApiResponse.success(results, {}, "Products searched successfully")
    );
  } catch (error) {
    next(error);
  }
};

export const updateProduct= async (req:Request, res:Response, next:Function)=>{
  try {
    const id = req.params.id as string ;
    const payload = updateProductPayloadSchema.parse(req.body);
    const updatedProduct = await productService.updateProduct(id,payload);
    res.status(200).json(ApiResponse.success(updatedProduct,{},"Product updated successfully"));
  } catch (error) {
    next(error);
  }
}

export const updateProductVariant = async (req:Request, res:Response, next:Function)=>{
  try {
     const id = req.params.slug as string ;
      const variantId = req.params.variantId as string ;
      const payload = updateProductVariantPayloadSchema.parse(req.body);
      const updatedProductVariant = await productService.updateProductVariant(id,variantId,payload);
      res.status(200).json(ApiResponse.success(updatedProductVariant,{},"Product variant updated successfully"));
  } catch (error) {
    next(error);
  }
}

export const createProductVariant = async (req:Request, res:Response, next:Function)=>{
  try {
    const id = req.params.id as string ;
    const payload = productVariantSchema.parse(req.body);
    const productVariant = await productService.createProductVariant(id, payload);
    res.status(201).json(ApiResponse.success(productVariant,{},"Product variant created successfully"));
  } catch (error) {
    next(error);
  }
}

export const getProducts = async (req:Request, res:Response, next:Function)=>{
  try {
    const query = getProductsQuerySchema.parse(req.query);
    const products = await productService.getProducts(query);
    res.status(200).json(ApiResponse.success(products.data, products.meta, "Products retrieved successfully"));
  } catch (error) {
    next(error);
  }
}

export const getMetaForFilters = async (req:Request, res:Response, next:Function)=>{
  try {
    const meta = await productService.getMetaForFilters();
    res.status(200).json(ApiResponse.success(meta, {}, "Filter metadata retrieved successfully"));
  } catch (error) {
    next(error);
  }
}

export const getProductsForLandingPage = async (req:Request, res:Response, next:Function)=>{
  try {
    const products = await productService.getProductsForLandingPage();
    res.status(200).json(ApiResponse.success(products, {}, "Landing page products retrieved successfully"));
  } catch (error) {
    next(error);
  }
}

export const softDeleteProduct = async(req:Request, res:Response, next:Function)=>{
  try {
    const id = req.params.id as string;
    const deletedProduct = await productService.softDeleteProduct(id);
    res.status(200).json(ApiResponse.success(deletedProduct, {}, "Product deleted successfully"));
  } catch (error) {
    next(error);
  }
}

export const softDeleteProductVariant = async(req:Request, res:Response, next:Function)=>{
  try {
    const variantId = req.params.variantId as string;
    const deletedVariant = await productService.softDeleteProductVariant(variantId);
    res.status(200).json(ApiResponse.success(deletedVariant, {}, "Product variant deleted successfully"));
  } catch (error) {
    next(error);
   }
}
