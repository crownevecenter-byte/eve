// backend/src/modules/services/service.controller.js
const Service = require('./service.model');

exports.getAll = async (req, res) => {
  try {
    const branchId = req.branchId || req.query.branchId;
    const services = await Service.getAllServices(
      branchId ? Number(branchId) : undefined,
      req.query.limit
    );
    res.json(services);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = { 
      ...req.body, 
      branchId: req.branchId || Number(req.body.branchId),
      base_price: Number(req.body.base_price || req.body.price),
      duration_minutes: Number(req.body.duration_minutes || 30)
    };
    // Remove old price field if it exists to avoid Prisma errors
    delete data.price;
    
    const service = await Service.createService(data);
    res.status(201).json(service);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.base_price) data.base_price = Number(data.base_price);
    if (data.duration_minutes) data.duration_minutes = Number(data.duration_minutes);
    if (data.price) { data.base_price = Number(data.price); delete data.price; }

    const service = await Service.updateService(req.params.id, data);
    res.json(service);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Service.deleteService(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
