const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

// Validation middleware
function validateDish(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  if (!name || name === "") {
    return next({
      status: 400,
      message: "Dish must include a name",
    });
  }

  if (!description || description === "") {
    return next({
      status: 400,
      message: "Dish must include a description",
    });
  }

  if (price === undefined || price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }

  if (!image_url || image_url === "") {
    return next({
      status: 400,
      message: "Dish must include a image_url",
    });
  }

  next();
}

// Check if dish exists middleware
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }

  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

// List dishes
function list(req, res) {
  res.json({ data: dishes });
}

// Create dish
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// Read dish
function read(req, res) {
  res.json({ data: res.locals.dish });
}

// Update dish
function update(req, res, next) {
  const { dishId } = req.params;
  const existingDish = res.locals.dish;
  const { data: { name, description, price, image_url, id } = {} } = req.body;

  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }

  existingDish.name = name;
  existingDish.description = description;
  existingDish.price = price;
  existingDish.image_url = image_url;

  res.json({ data: existingDish });
}

module.exports = {
  list,
  create: [validateDish, create],
  read: [dishExists, read],
  update: [dishExists, validateDish, update],
};
