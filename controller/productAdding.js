

const productAddRoute =require('express').Router()
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { log } = require('console');
const Product=require('../model/productModel');
const { products } = require('./adminController');



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const uploadsDir = path.join(__dirname, "../", "public", "ImgUploads");
// const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}




productAddRoute.post('/productAdded', upload.any(), async (req, res) => {
   
   try{

    const { productName, productCategory, productPrice, Stock, Brand, ProductDescription } = req.body;

    console.log(productName);
    console.log(productCategory);
    console.log(productPrice);
    console.log(Stock);
    console.log(Brand);
    console.log(ProductDescription);

    const croppedImages = req.files.filter(file => file.fieldname === 'croppedImages');
    let productImages = [];

    croppedImages.forEach((file, index) => {
        const fileName = `${Date.now()}_${index}.png`;
        const filePath = path.join(uploadsDir, fileName);

        fs.writeFileSync(filePath, file.buffer);
        console.log(`File ${fileName} saved successfully.`);
       

        productImages.push(`imgUploads/${fileName}`);
        console.log(productImages);
    });

    const productDetails = new Product({
        product_name: productName,
        product_description: ProductDescription,
        category_name:productCategory,
        brands: Brand,
        price: productPrice,
        in_stock: Stock,
        product_img: productImages,
        Hide_product: 0,
        Maximum_Retail_Price:productPrice
    });

    
        const signupDataSuccess = await productDetails.save();
        if (signupDataSuccess) {
            req.flash('info', '✅ New Product Added');
            res.redirect('/Products');
        }

    } catch (error) {
        console.error('Error saving product details:', error);
        res.status(500).send('Internal Server Error');
    }
});







productAddRoute.post('/loadEditProduct', upload.any(), async (req, res) => {
    try {
        const croppedImages = req.files.filter(file => file.fieldname === 'croppedImages');
        let productImages = [];

        croppedImages.forEach((file, index) => {
            const fileName = `${Date.now()}_${index}.png`;
            const filePath = path.join(uploadsDir, fileName);

            fs.writeFileSync(filePath, file.buffer);
            console.log(`File ${fileName} saved successfully.`);

            productImages.push(`imgUploads/${fileName}`);
            console.log(productImages);
        });

        const {
            productId,
            editProductName,
            editProductCategory,
            editProductPrice,
            editStock,
            editBrand,
            editProductDescription,
        } = req.body;

        // const resizedPaths = await resizeImages(croppedImages); // Adjust if needed
          
        const productData = await Product.findById({_id:productId})

        const updateImg =[...productData.product_img,...productImages]

           console.log(updateImg);

        const updateResult = await Product.updateOne(
            { _id: productId },
            {
                $set: {
                    product_name: editProductName,
                    product_description: editProductDescription,
                    category_name: editProductCategory,
                    brands: editBrand,
                    price: editProductPrice,
                    in_stock: editStock,
                    product_img: updateImg, // Ensure this is an array if you store multiple images
                    Hide_product: 0,
                    Maximum_Retail_Price:editProductPrice
                },
            }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(404).send("Product update failed");
        }
        req.flash('info', 'PRODUCT WAS SUCCESSFULLY EDITED ');
        res.redirect('/Products');
    } catch (error) {
        console.error(error.message);
        res.status(500).send("An error occurred");
    }
});




module.exports = {
    productAddRoute
};
