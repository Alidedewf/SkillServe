const orgService = require('./org.service');

const getDepartments = async (req, res) => {
  try {
    const depts = await orgService.getDepartments(req.restaurantId);
    res.json(depts);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[org.getDepartments]', err);
    res.status(500).json({ error: 'Ошибка получения отделов' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const dept = await orgService.createDepartment(req.restaurantId, req.body);
    res.status(201).json(dept);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[org.createDepartment]', err);
    res.status(500).json({ error: 'Ошибка создания отдела' });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const dept = await orgService.updateDepartment(req.restaurantId, parseInt(req.params.id), req.body);
    res.json(dept);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[org.updateDepartment]', err);
    res.status(500).json({ error: 'Ошибка обновления отдела' });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const result = await orgService.deleteDepartment(req.restaurantId, parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[org.deleteDepartment]', err);
    res.status(500).json({ error: 'Ошибка удаления отдела' });
  }
};

const getPositions = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const positions = await orgService.getPositions(req.restaurantId, departmentId);
    res.json(positions);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[org.getPositions]', err);
    res.status(500).json({ error: 'Ошибка получения должностей' });
  }
};

const createPosition = async (req, res) => {
  try {
    const position = await orgService.createPosition(req.restaurantId, req.body);
    res.status(201).json(position);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[org.createPosition]', err);
    res.status(500).json({ error: 'Ошибка создания должности' });
  }
};

const updatePosition = async (req, res) => {
  try {
    const position = await orgService.updatePosition(req.restaurantId, parseInt(req.params.id), req.body);
    res.json(position);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[org.updatePosition]', err);
    res.status(500).json({ error: 'Ошибка обновления должности' });
  }
};

const deletePosition = async (req, res) => {
  try {
    const result = await orgService.deletePosition(req.restaurantId, parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[org.deletePosition]', err);
    res.status(500).json({ error: 'Ошибка удаления должности' });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
};
