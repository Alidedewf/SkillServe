const restaurantService = require('./restaurant.service');

const create = async (req, res) => {
  try {
    const result = await restaurantService.createRestaurant(req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[restaurant.create]', err);
    res.status(500).json({ error: 'Ошибка создания ресторана' });
  }
};

const getAll = async (req, res) => {
  try {
    const restaurants = await restaurantService.getAllRestaurants();
    res.json(restaurants);
  } catch (err) {
    console.error('[restaurant.getAll]', err);
    res.status(500).json({ error: 'Ошибка получения списка ресторанов' });
  }
};

const getById = async (req, res) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(parseInt(req.params.id));
    res.json(restaurant);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[restaurant.getById]', err);
    res.status(500).json({ error: 'Ошибка получения ресторана' });
  }
};

const update = async (req, res) => {
  try {
    const restaurant = await restaurantService.updateRestaurant(parseInt(req.params.id), req.body);
    res.json(restaurant);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[restaurant.update]', err);
    res.status(500).json({ error: 'Ошибка обновления ресторана' });
  }
};

const remove = async (req, res) => {
  try {
    const result = await restaurantService.deleteRestaurant(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[restaurant.delete]', err);
    res.status(500).json({ error: 'Ошибка удаления ресторана' });
  }
};

module.exports = { create, getAll, getById, update, remove };
