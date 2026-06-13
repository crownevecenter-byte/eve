const prisma = require('../../config/db');
const Product = require('./product.model');
const { STAFF_ROLES } = require('../../constants/roles');
const { sanitizeProductList, sanitizeProduct } = require('../../utils/sanitizeProduct');
const { assertBranchAccess } = require('../../middleware/scopeBranch');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');

const slugify = (text) => text.toString().toLowerCase()
  .replace(/\s+/g, '-')           // Replace spaces with -
  .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
  .replace(/\-\-+/g, '-')         // Replace multiple - with single -
  .replace(/^-+/, '')             // Trim - from start of text
  .replace(/-+$/, '');            // Trim - from end of text

/** Products page — products list + categories + brands in one request. */
exports.getPageInit = async (req, res) => {
  try {
    const isStaff = req.user && STAFF_ROLES.includes(req.user.role);
    const query = { ...req.query };
    if (!isStaff) {
      query.lite = query.lite || '1';
      query.publicOnly = true;
    }

    const [products, categories, brands] = await sequentialOnHttp([
      () => Product.getProducts(query),
      () =>
        prisma.category.findMany({
          include: { parent: { select: { name: true } } },
          orderBy: { name: 'asc' },
        }),
      () => prisma.brand.findMany({ orderBy: { name: 'asc' } }),
    ]);

    res.json({
      products: isStaff ? products : sanitizeProductList(products),
      categories,
      brands,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const isStaff = req.user && STAFF_ROLES.includes(req.user.role);
    const query = { ...req.query };
    if (!isStaff) {
      query.lite = query.lite || '1';
      query.publicOnly = true;
    }
    const result = await Product.getProducts(query);
    res.json(isStaff ? result : sanitizeProductList(result));
  } catch (e) {
    const isDbTimeout =
      e.message?.includes('timeout') ||
      e.message?.includes('connect') ||
      e.code === 'P1001' ||
      e.code === 'P1008';
    res.status(isDbTimeout ? 503 : 500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await Product.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const isStaff = req.user && STAFF_ROLES.includes(req.user.role);
    if (!isStaff && !product.is_active) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(isStaff ? product : sanitizeProduct(product));
  } catch (e) {
    const isDbTimeout =
      e.message?.includes('timeout') ||
      e.message?.includes('connect') ||
      e.code === 'P1001' ||
      e.code === 'P1008';
    res.status(isDbTimeout ? 503 : 500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { 
      name, product_type, description, price, sale_price, stock_qty, 
      categoryId, brandId, branchId, is_active, images,
      bikeDetail, partDetail
    } = req.body;

    const data = {
      name,
      slug: slugify(name) + '-' + Date.now().toString().slice(-4),
      product_type,
      description,
      price: parseFloat(price),
      sale_price: sale_price ? parseFloat(sale_price) : null,
      stock_qty: parseInt(stock_qty) || 0,
      categoryId: categoryId || null,
      brandId: brandId || null,
      branchId: Number(branchId),
      is_active: is_active !== undefined ? is_active : true,
      images: {
        create: (images || []).map(img => ({
          url: img.url,
          is_primary: img.is_primary || false,
          sort_order: img.sort_order || 0
        }))
      }
    };

    if (product_type === 'bike' && bikeDetail) {
      // Ensure numeric fields are correctly parsed
      const formattedBikeDetail = {
        ...bikeDetail,
        motor_watt_min: bikeDetail.motor_watt_min ? parseInt(bikeDetail.motor_watt_min) : null,
        motor_watt_max: bikeDetail.motor_watt_max ? parseInt(bikeDetail.motor_watt_max) : null,
        battery_voltage: bikeDetail.battery_voltage ? parseFloat(bikeDetail.battery_voltage) : null,
        battery_capacity_ah: bikeDetail.battery_capacity_ah ? parseFloat(bikeDetail.battery_capacity_ah) : null,
        speed_min_kmh: bikeDetail.speed_min_kmh ? parseFloat(bikeDetail.speed_min_kmh) : null,
        speed_max_kmh: bikeDetail.speed_max_kmh ? parseFloat(bikeDetail.speed_max_kmh) : null,
        range_eco_min_km: bikeDetail.range_eco_min_km ? parseInt(bikeDetail.range_eco_min_km) : null,
        range_eco_max_km: bikeDetail.range_eco_max_km ? parseInt(bikeDetail.range_eco_max_km) : null,
        speed_modes: bikeDetail.speed_modes ? parseInt(bikeDetail.speed_modes) : null,
        charging_time_min_hrs: bikeDetail.charging_time_min_hrs ? parseFloat(bikeDetail.charging_time_min_hrs) : null,
        charging_time_max_hrs: bikeDetail.charging_time_max_hrs ? parseFloat(bikeDetail.charging_time_max_hrs) : null,
        net_weight_kg: bikeDetail.net_weight_kg ? parseInt(bikeDetail.net_weight_kg) : null,
        loading_capacity_kg: bikeDetail.loading_capacity_kg ? parseInt(bikeDetail.loading_capacity_kg) : null,
      };
      data.bikeDetail = { create: formattedBikeDetail };
    } else if (product_type === 'part' && partDetail) {
      const formattedPartDetail = {
        ...partDetail,
        serial_no: partDetail.serial_no ? parseInt(partDetail.serial_no) : null,
        cp_price: partDetail.cp_price ? parseFloat(partDetail.cp_price) : null,
        compatible_models: partDetail.compatible_models || [],
        compatible_bike_ids: partDetail.compatible_bike_ids || [],
      };
      data.partDetail = { create: formattedPartDetail };
    }

    const product = await Product.createProduct(data);
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const existing = await Product.getProductById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });
    if (!assertBranchAccess(req, existing.branchId)) {
      return res.status(403).json({ message: 'Access denied for this branch.' });
    }

    const {
      name, description, price, sale_price, stock_qty, 
      categoryId, brandId, is_active, images,
      bikeDetail, partDetail
    } = req.body;

    const data = {
      ...(name && { name, slug: slugify(name) + '-' + Date.now().toString().slice(-4) }),
      description,
      price: price ? parseFloat(price) : undefined,
      sale_price: sale_price ? parseFloat(sale_price) : null,
      stock_qty: stock_qty !== undefined ? parseInt(stock_qty) : undefined,
      categoryId: categoryId || null,
      brandId: brandId || null,
      is_active: is_active !== undefined ? is_active : true,
    };

    if (images) {
      data.images = {
        deleteMany: {},
        create: images.map(img => ({
          url: img.url,
          is_primary: img.is_primary || false,
          sort_order: img.sort_order || 0
        }))
      };
    }

    if (bikeDetail) {
      const { id, productId, ...rest } = bikeDetail;
      const formattedBikeDetail = {
        ...rest,
        motor_watt_min: rest.motor_watt_min ? parseInt(rest.motor_watt_min) : undefined,
        motor_watt_max: rest.motor_watt_max ? parseInt(rest.motor_watt_max) : undefined,
        battery_voltage: rest.battery_voltage ? parseFloat(rest.battery_voltage) : undefined,
        battery_capacity_ah: rest.battery_capacity_ah ? parseFloat(rest.battery_capacity_ah) : undefined,
        speed_min_kmh: rest.speed_min_kmh ? parseFloat(rest.speed_min_kmh) : undefined,
        speed_max_kmh: rest.speed_max_kmh ? parseFloat(rest.speed_max_kmh) : undefined,
        range_eco_min_km: rest.range_eco_min_km ? parseInt(rest.range_eco_min_km) : undefined,
        range_eco_max_km: rest.range_eco_max_km ? parseInt(rest.range_eco_max_km) : undefined,
        speed_modes: rest.speed_modes ? parseInt(rest.speed_modes) : undefined,
        charging_time_min_hrs: rest.charging_time_min_hrs ? parseFloat(rest.charging_time_min_hrs) : undefined,
        charging_time_max_hrs: rest.charging_time_max_hrs ? parseFloat(rest.charging_time_max_hrs) : undefined,
        net_weight_kg: rest.net_weight_kg ? parseInt(rest.net_weight_kg) : undefined,
        loading_capacity_kg: rest.loading_capacity_kg ? parseInt(rest.loading_capacity_kg) : undefined,
      };
      data.bikeDetail = {
        upsert: {
          create: formattedBikeDetail,
          update: formattedBikeDetail
        }
      };
    }

    if (partDetail) {
      const { id, productId, ...rest } = partDetail;
      const formattedPartDetail = {
        ...rest,
        serial_no: rest.serial_no ? parseInt(rest.serial_no) : undefined,
        cp_price: rest.cp_price ? parseFloat(rest.cp_price) : undefined,
        compatible_models: rest.compatible_models,
        compatible_bike_ids: rest.compatible_bike_ids,
      };
      data.partDetail = {
        upsert: {
          create: formattedPartDetail,
          update: formattedPartDetail
        }
      };
    }

    const product = await Product.updateProduct(req.params.id, data);
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const existing = await Product.getProductById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });
    if (!assertBranchAccess(req, existing.branchId)) {
      return res.status(403).json({ message: 'Access denied for this branch.' });
    }

    await Product.deleteProduct(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
