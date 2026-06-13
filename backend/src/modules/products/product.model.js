// backend/src/modules/products/product.model.js
const prisma = require('../../config/db');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');
const { runInTransaction } = require('../../config/transaction');
const {
  upsertOneToOne,
  replaceChildRecords,
} = require('../../config/prismaHttp');

const PRODUCT_RELATION_INCLUDE = {
  bikeDetail: true,
  partDetail: true,
  images: true,
  category: true,
};

const splitProductWriteData = (data) => {
  const { images, bikeDetail, partDetail, ...base } = data;
  return { base, images, bikeDetail, partDetail };
};

const applyProductRelationsOnCreate = async (tx, productId, { images, bikeDetail, partDetail }) => {
  if (images?.create?.length) {
    for (const img of images.create) {
      await tx.productImage.create({ data: { ...img, productId } });
    }
  }
  if (bikeDetail?.create) {
    await tx.bike.create({ data: { ...bikeDetail.create, productId } });
  }
  if (partDetail?.create) {
    await tx.partDetail.create({ data: { ...partDetail.create, productId } });
  }
};

const applyProductRelationsOnUpdate = async (tx, productId, { images, bikeDetail, partDetail }) => {
  if (images) {
    await replaceChildRecords(
      tx,
      tx.productImage,
      'productId',
      productId,
      images.create || [],
      (img, pid) => ({ ...img, productId: pid })
    );
  }
  if (bikeDetail?.upsert) {
    const payload = bikeDetail.upsert.update || bikeDetail.upsert.create;
    await upsertOneToOne(tx, tx.bike, productId, payload);
  }
  if (partDetail?.upsert) {
    const payload = partDetail.upsert.update || partDetail.upsert.create;
    await upsertOneToOne(tx, tx.partDetail, productId, payload);
  }
};

const MAX_PAGE_LIMIT = 50;

const getProducts = async ({
  page = 1,
  limit = 20,
  branchId,
  categoryId,
  product_type,
  search,
  sortBy,
  order,
  lite,
  publicOnly,
}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;
  const isLite = lite === 'true' || lite === '1';
  const activeOnly = publicOnly === true || publicOnly === 'true' || publicOnly === '1';

  const where = {
    ...(activeOnly && { is_active: true }),
    ...(branchId && { branchId: Number(branchId) }),
    ...(categoryId && { categoryId }),
    ...(product_type && { product_type }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { partDetail: { item_code: { contains: search, mode: 'insensitive' } } },
        { partDetail: { model: { contains: search, mode: 'insensitive' } } },
        { partDetail: { description: { contains: search, mode: 'insensitive' } } }
      ]
    })
  };

  // Dynamic sorting
  let orderBy = { createdAt: 'desc' }; // Default
  if (sortBy === 'price') {
    orderBy = { price: order === 'desc' ? 'desc' : 'asc' };
  } else if (sortBy === 'stock') {
    orderBy = { stock_qty: order === 'asc' ? 'asc' : 'desc' };
  } else if (sortBy === 'name') {
    orderBy = { name: order === 'desc' ? 'desc' : 'asc' };
  }

  const include = isLite
    ? {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        images: { take: 1, orderBy: { sort_order: 'asc' } },
        bikeDetail: { select: { motor_type: true, battery_type: true } },
        partDetail: { select: { model: true, item_code: true, description: true, cp_price: true } },
      }
    : {
        branch: { select: { name: true } },
        category: true,
        brand: true,
        images: { orderBy: { sort_order: 'asc' } },
        bikeDetail: true,
        partDetail: true,
        productParts: {
          include: {
            part: {
              include: {
                inventory: {
                  where: { branchId: branchId ? Number(branchId) : 0 },
                },
              },
            },
          },
        },
      };

  const [data, total] = await sequentialOnHttp([
    () =>
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        include,
        orderBy,
      }),
    () => prisma.product.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    }
  };
};

const getProductById = async (id) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        branch: { select: { name: true, location: true } },
        category: true,
        brand: true,
        images: { orderBy: { sort_order: 'asc' } },
        bikeDetail: true,
        partDetail: true
      }
    });

    if (!product) return null;

    // Find the same product in other branches
    let otherBranches = [];
    try {
      otherBranches = await prisma.product.findMany({
        where: {
          id: { not: id },
          name: product.name,
          is_active: true,
          OR: [
            ...(product.partDetail?.item_code ? [{ partDetail: { is: { item_code: product.partDetail.item_code } } }] : []),
            ...(product.bikeDetail?.motor_type ? [{ bikeDetail: { is: { motor_type: product.bikeDetail.motor_type } } }] : [])
          ]
        },
        select: {
          id: true,
          stock_qty: true,
          price: true,
          sale_price: true,
          branch: { select: { id: true, name: true, location: true } }
        },
        take: 5
      });
    } catch (err) {
      console.error("Error fetching other branches:", err);
    }

    return { ...product, otherBranches };
  } catch (err) {
    console.error("Error in getProductById:", err);
    throw err;
  }
};

const createProduct = async (data) => {
  return runInTransaction(async (tx) => {
    const { base, images, bikeDetail, partDetail } = splitProductWriteData(data);

    const created = await tx.product.create({ data: base });
    await applyProductRelationsOnCreate(tx, created.id, { images, bikeDetail, partDetail });

    const product = await tx.product.findUnique({
      where: { id: created.id },
      include: PRODUCT_RELATION_INCLUDE,
    });

    if (product.product_type === 'part') {
      const part = await tx.part.create({
        data: {
          name: product.name,
          category: product.category ? product.category.name : 'Uncategorized',
          price: product.price,
          stock: product.stock_qty || 0,
        },
      });

      await tx.productPart.create({
        data: { productId: product.id, partId: part.id, quantity: 1 },
      });

      await tx.inventory.create({
        data: {
          branchId: product.branchId,
          partId: part.id,
          stock: product.stock_qty || 0,
          alertAt: 5,
        },
      });
    }

    return product;
  });
};

const updateProduct = async (id, data) => {
  return runInTransaction(async (tx) => {
    const { base, images, bikeDetail, partDetail } = splitProductWriteData(data);

    const oldProduct = await tx.product.findUnique({
      where: { id },
      include: { productParts: true, category: true },
    });

    if (Object.keys(base).length > 0) {
      await tx.product.update({ where: { id }, data: base });
    }
    await applyProductRelationsOnUpdate(tx, id, { images, bikeDetail, partDetail });

    const product = await tx.product.findUnique({
      where: { id },
      include: PRODUCT_RELATION_INCLUDE,
    });

    if (product.product_type === 'part' && oldProduct?.productParts?.length > 0) {
      const partId = oldProduct.productParts[0].partId;

      await tx.part.update({
        where: { id: partId },
        data: {
          name: product.name,
          category: product.category
            ? product.category.name
            : (oldProduct.category ? oldProduct.category.name : 'Uncategorized'),
          price: product.price,
          ...(base.stock_qty !== undefined && { stock: product.stock_qty }),
        },
      });

      if (base.stock_qty !== undefined) {
        const inv = await tx.inventory.findFirst({
          where: { branchId: product.branchId, partId },
        });
        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { stock: product.stock_qty },
          });
        }
      }
    }

    return product;
  });
};

const deleteProduct = (id) => prisma.product.delete({
  where: { id }
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
