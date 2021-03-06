const db = require('../config/mysql2');
const fs = require('fs');
const uploadDir = `./public/img/uploads/`;

// Client Site ---------------------------------------------------------------------------------------------------

exports.getAllFrontendProducts = async function (req, res, next) {
    let itemsPrPage = 15;

    let currentPage = 1;

    if ( req.query.page != undefined ) {
        if ( parseInt(req.query.page) < 1 ) {
            res.redirect('/products');
            return;
        }
        if ( parseInt(req.query.page) >= 1 ) {
            currentPage = parseInt(req.query.page);
        }
    }

    let [result] = await db.query(`SELECT COUNT(*) AS total_items FROM products`);
    let totalItems = result[0].total_items;

    offset = (currentPage - 1) * itemsPrPage;

    totalPages = Math.ceil(totalItems / itemsPrPage);

    if (offset > totalItems) {
        res.redirect('/products?page=' + totalPages);
        return;
    }

    const productsSQL = `SELECT products.id, products.name, products.description, products.price, products.weight, products.amount, products.img, categories.name AS category
    FROM products
    INNER JOIN categories ON products.fk_category = categories.id
    LIMIT :offset, :items_pr_page`;

    const categoriesSQL = `SELECT id, name
    FROM categories`;

    const [rows] = await db.query(productsSQL, {
        offset: offset,
        items_pr_page: itemsPrPage
    });

    const [rows2] = await db.query(categoriesSQL);

        
    res.render('products', {
        results: rows,
        categoryResults: rows2,
        total_pages: totalPages,
        current_page: currentPage
    });
}

exports.getAllFrontendProductsFromCategory = async function (req, res, next) {
    let itemsPrPage = 15;

    let currentPage = 1;

    if ( req.query.page != undefined ) {
        if ( parseInt(req.query.page) < 1 ) {
            res.redirect('/products/' + req.params.id);
            return;
        }
        if ( parseInt(req.query.page) >= 1 ) {
            currentPage = parseInt(req.query.page);
        }
    }

    let [result] = await db.query(`SELECT COUNT(*) AS total_items FROM products`);
    let totalItems = result[0].total_items;

    offset = (currentPage - 1) * itemsPrPage;

    totalPages = Math.ceil(totalItems / itemsPrPage);

    if (offset > totalItems) {
        res.redirect('/products/' + req.params.id + '?page=' + totalPages);
        return;
    }
    
    const productsSQL = `SELECT products.id, products.name, products.description, products.price, products.weight, products.amount, products.img, categories.name AS category
    FROM products
    INNER JOIN categories ON products.fk_category = categories.id
    WHERE categories.id = :id
    LIMIT :offset, :items_pr_page`;

    const categoriesSQL = `SELECT id, name
    FROM categories`;

    const [rows] = await db.query(productsSQL, { 
        id: req.params.id,
        offset: offset,
        items_pr_page: itemsPrPage
    });

    const [rows2] = await db.query(categoriesSQL);

        
    res.render('products', {
        results: rows,
        categoryResults: rows2,
        total_pages: totalPages,
        current_page: currentPage
    });
}

exports.getSingleProduct = async function (req, res, next) {
    try {
        const productSQL = `SELECT products.id, products.name, products.description, products.price, products.weight, products.amount, products.img, categories.name AS category
        FROM products
        INNER JOIN categories ON products.fk_category = categories.id
        WHERE products.id = :id`;

        const [rows] = await db.query(productSQL, { 
            id: req.params.id 
        });

        res.render('single-product', {
            result: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.send('Fejl!');
    }
}


// ADMIN PANEL --------------------------------------------------------------------------------------------------

exports.createProduct = async function (req, res, next) {
    try {
        const data = fs.readFileSync(req.files.img.path);
        const newFileName = Date.now() + '_' + req.files.img.name;
        fs.writeFileSync(uploadDir + newFileName, data);

        const productSQL = `INSERT INTO products SET name = :name, description = :description, price = :price, weight = :weight, amount = :amount, img = :img, fk_category = :fk_category`;
        await db.query(productSQL, {
            name: req.fields.name,
            description: req.fields.description,
            price: req.fields.price,
            weight: req.fields.weight,
            amount: req.fields.amount,
            img: newFileName,
            fk_category: req.fields.fk_category
        });
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        res.send('Fejl!');
    } 
}

exports.getProducts = async function (req, res, next) {
    
    try {
        const productsSQL = `SELECT products.id, products.name, products.description, products.price, products.weight, products.amount, products.img, categories.name AS category
        FROM products
        INNER JOIN categories ON products.fk_category = categories.id`;

        const categoriesSQL = `SELECT id, name
        FROM categories`;

        const [rows] = await db.query(productsSQL);

        const [rows2] = await db.query(categoriesSQL);

        
        res.render('admin_products', {
            results: rows,
            categoryResults: rows2
        });
    } catch (error) {
        console.error(error);
        res.send('FEJL!');
    }

};

exports.getEditProductForm = async function (req, res, next) {
    try {
        const productsSQL = `SELECT id, name, description, price, weight, amount, img, fk_category
        FROM products
        WHERE img = :img_params`;

        const categoriesSQL = `SELECT id, name
        FROM categories`;

        const [rows] = await db.query(productsSQL, { img_params: req.params.img_params });
        const [rows2] = await db.query(categoriesSQL);

        res.render('admin_products_edit', {
            result: rows[0],
            categoryResults: rows2
        });
    } catch (error) {
        console.error(error);
        res.send('FEJL!');
    }
};

exports.editProduct = async function (req, res, next) {
    try {
        const productSQL = `UPDATE products SET name = :name, description = :description, price = :price, weight = :weight, amount = :amount, fk_category = :fk_category
        WHERE img = :img_params;`;
        await db.query(productSQL, {
            img_params: req.params.img_params,
            name: req.fields.name, 
            description: req.fields.description, 
            price: req.fields.price, 
            weight: req.fields.weight,
            amount: req.fields.amount,
            fk_category: req.fields.fk_category
        });
        res.redirect('/admin/editProduct/' + req.params.img_params);
    } catch (error) {
        console.error(error);
        res.send('FEJL!!!');
    }
};

exports.editProductImg = async function (req, res, nexT) {
    try {
        const data = fs.readFileSync(req.files.img.path);
        const newFileName = Date.now() + '_' + req.files.img.name;
        fs.unlinkSync(uploadDir + req.params.img_params);
        fs.writeFileSync(uploadDir + newFileName, data);

        const productImgSQL = `UPDATE products SET img = :img 
        WHERE img = :img_params`;

        await db.query(productImgSQL, {
            img: newFileName,
            img_params: req.params.img_params
        });

        res.redirect('/admin/editProduct/' + newFileName);  
    } catch (error) {
        console.error(error);
        res.send('FEJL!');
    }
}

exports.deleteProduct = async function (req, res, next) {
    try {
        fs.unlinkSync(uploadDir + req.params.img_params);

        const productSQL = `DELETE FROM products
        WHERE img = :img_params`;

        await db.query(productSQL, {
            img_params: req.params.img_params
        });

        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        res.send('FEJL!');
    }
};

